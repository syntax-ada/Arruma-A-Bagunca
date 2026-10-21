-- =============================================================================
-- Migração: sessões de jogador revogáveis e limite de requisições
-- Projeto:  Arruma a Bagunça
--
-- ⚠️ Este arquivo NÃO é executado automaticamente. Uma pessoa da equipe aplica
-- no SQL Editor do Supabase, seguindo docs/seguranca.md.
--
-- Pré-requisitos: as tabelas public.players e public.phase_completions
-- (migração 20261021120000_phase_completions.sql) já existem.
--
-- 1. player_sessions: uma linha por sessão de jogador. O token assinado leva o
--    id da sessão, e o servidor confere em cada pedido de progresso se ela não
--    foi revogada. Revogar = preencher revoked_at (uma sessão ou todas as de um
--    jogador), sem afetar ninguém mais.
-- 2. rate_limit_counters + consumir_limite_requisicoes(): contadores do limite
--    de requisições, compartilhados entre todas as instâncias do servidor. A
--    chave de cada contador é um resumo (HMAC) feito pelo servidor: aqui não
--    fica IP nem id de jogador.
-- 3. limpar_registros_temporarios(): apaga contadores e sessões vencidos há
--    mais de 1 dia. É chamada de vez em quando pela própria função de limite.
--
-- Tudo com RLS ligado e sem políticas: o navegador (anon/authenticated) não
-- lê, não grava e não executa nada daqui. Só o servidor (service_role, com a
-- chave secreta) usa, e com o mínimo de permissões.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Sessões de jogador
-- -----------------------------------------------------------------------------
create table public.player_sessions (
  id         uuid        not null default gen_random_uuid(),
  player_id  uuid        not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,

  constraint player_sessions_pkey
    primary key (id),

  constraint player_sessions_player_id_fkey
    foreign key (player_id) references public.players (id) on delete cascade,

  -- O servidor cria sessões de 12 horas; o banco recusa qualquer coisa fora
  -- de um teto de 1 dia.
  constraint player_sessions_validade_check
    check (expires_at > created_at and expires_at <= created_at + interval '1 day')
);

create index player_sessions_player_id_idx on public.player_sessions (player_id);

comment on table public.player_sessions is
  'Sessões de jogador (Arruma a Bagunça). revoked_at preenchido = sessão encerrada. Só o servidor acessa.';

alter table public.player_sessions enable row level security;

revoke all on table public.player_sessions from anon, authenticated, service_role;
-- O servidor cria, consulta e revoga (só a coluna revoked_at pode ser alterada).
grant select, insert, delete on table public.player_sessions to service_role;
grant update (revoked_at) on table public.player_sessions to service_role;

-- -----------------------------------------------------------------------------
-- 2. Contadores do limite de requisições
-- -----------------------------------------------------------------------------
create table public.rate_limit_counters (
  bucket_key   text        not null,
  window_start timestamptz not null,
  hits         integer     not null,

  constraint rate_limit_counters_pkey
    primary key (bucket_key),

  constraint rate_limit_counters_bucket_key_check
    check (char_length(bucket_key) between 1 and 100),

  constraint rate_limit_counters_hits_check
    check (hits >= 1)
);

comment on table public.rate_limit_counters is
  'Contadores do limite de requisições (janela fixa). Chaves são resumos HMAC: sem IP nem id de jogador.';

alter table public.rate_limit_counters enable row level security;

revoke all on table public.rate_limit_counters from anon, authenticated, service_role;
grant select, insert, update, delete on table public.rate_limit_counters to service_role;

-- -----------------------------------------------------------------------------
-- 3. Limpeza de registros vencidos
--    Roda dentro do pedido de outra pessoa (ver item 4). "for update skip
--    locked" pula as linhas que outro pedido estiver usando naquele instante:
--    a limpeza nunca espera nem trava (deadlock) com um pedido em andamento;
--    o que ficar para trás sai numa próxima limpeza.
--    Permissões usadas (todas do service_role): SELECT + DELETE nas duas
--    tabelas e UPDATE em pelo menos uma coluna (exigido pelo FOR UPDATE).
-- -----------------------------------------------------------------------------
create function public.limpar_registros_temporarios()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.rate_limit_counters
  where bucket_key in (
    select bucket_key from public.rate_limit_counters
    where window_start < now() - interval '1 day'
    for update skip locked
  );
  delete from public.player_sessions
  where id in (
    select id from public.player_sessions
    where expires_at < now() - interval '1 day'
    for update skip locked
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. Função do limite: soma 1 em cada chave e diz se o pedido cabe.
--    p_chaves[i] tem no máximo p_limites[i] pedidos por janela de p_janelas[i]
--    segundos. Devolve {"permitido": bool, "espera_segundos": int}.
--    Atômica por chave (INSERT ... ON CONFLICT), então funciona com várias
--    instâncias do servidor ao mesmo tempo.
--    SECURITY INVOKER: roda com as permissões de quem chama (service_role,
--    que no Supabase tem BYPASSRLS). Precisa de SELECT, INSERT e UPDATE em
--    rate_limit_counters e de EXECUTE na limpeza. É VOLATILE (o padrão): o
--    PostgREST a chama numa transação de escrita.
-- -----------------------------------------------------------------------------
create function public.consumir_limite_requisicoes(
  p_chaves  text[],
  p_limites integer[],
  p_janelas integer[]
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total     integer := coalesce(array_length(p_chaves, 1), 0);
  v_agora     timestamptz := now();
  v_inicio    timestamptz;
  v_contagem  integer;
  v_permitido boolean := true;
  v_espera    integer := 0;
begin
  if v_total < 1 or v_total > 5
     or coalesce(array_length(p_limites, 1), 0) <> v_total
     or coalesce(array_length(p_janelas, 1), 0) <> v_total then
    raise exception 'parametros invalidos' using errcode = '22023';
  end if;

  for i in 1 .. v_total loop
    if p_chaves[i] is null or p_limites[i] is null or p_limites[i] < 1
       or p_janelas[i] is null or p_janelas[i] < 1 or p_janelas[i] > 86400 then
      raise exception 'parametros invalidos' using errcode = '22023';
    end if;

    -- Início da janela atual (janela fixa, alinhada ao relógio do banco).
    v_inicio := to_timestamp(floor(extract(epoch from v_agora) / p_janelas[i]) * p_janelas[i]);

    insert into public.rate_limit_counters as c (bucket_key, window_start, hits)
    values (p_chaves[i], v_inicio, 1)
    on conflict (bucket_key) do update
      set hits = case when c.window_start >= excluded.window_start then c.hits + 1 else 1 end,
          window_start = greatest(c.window_start, excluded.window_start)
    returning c.hits into v_contagem;

    if v_contagem > p_limites[i] then
      v_permitido := false;
      v_espera := greatest(
        v_espera,
        ceil(extract(epoch from (v_inicio + make_interval(secs => p_janelas[i]) - v_agora)))::integer
      );
    end if;
  end loop;

  -- Limpeza ocasional (cerca de 1 a cada 100 chamadas).
  if random() < 0.01 then
    perform public.limpar_registros_temporarios();
  end if;

  return jsonb_build_object(
    'permitido', v_permitido,
    'espera_segundos', case when v_permitido then 0 else greatest(v_espera, 1) end
  );
end;
$$;

-- Funções novas em "public" podem ser executadas por qualquer papel por
-- padrão (PUBLIC e, no Supabase, anon/authenticated). Só o servidor executa.
revoke all on function public.consumir_limite_requisicoes(text[], integer[], integer[]) from public, anon, authenticated;
grant execute on function public.consumir_limite_requisicoes(text[], integer[], integer[]) to service_role;

revoke all on function public.limpar_registros_temporarios() from public, anon, authenticated;
grant execute on function public.limpar_registros_temporarios() to service_role;

commit;
