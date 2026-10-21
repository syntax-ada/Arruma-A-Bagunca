-- =============================================================================
-- Migração: phase_completions (fases concluídas por jogador)
-- Projeto:  Arruma a Bagunça
--
-- ⚠️ Este arquivo NÃO é executado automaticamente. Uma pessoa da equipe aplica
-- no SQL Editor do Supabase, seguindo docs/progresso-supabase.md.
--
-- Pré-requisito: a tabela public.players já existe (cadastro de jogadores).
--
-- Cada linha diz: "o jogador X concluiu a fase F do mundo M".
-- - Chave primária (player_id, world, phase): a mesma conclusão nunca vira
--   duas linhas, mesmo com pedidos simultâneos.
-- - Chave estrangeira para players: não existe progresso de jogador
--   inexistente; apagar um jogador apaga as conclusões dele.
-- - CHECK: só as 13 fases do jogo (Mundos 1 a 4 com 3 fases; Mundo 5, a fase
--   bônus, com 1). Mantenha igual a js/regras-progresso.js.
-- - RLS ligado e sem políticas: o navegador (chaves anon/publishable) não lê
--   nem grava nada. Só o servidor (api/), com a chave secreta, acessa.
-- A ordem da progressão (não pular fases) é conferida pelo servidor em
-- api/progresso/registrar.js.
-- =============================================================================

begin;

create table public.phase_completions (
  player_id    uuid        not null,
  world        smallint    not null,
  phase        smallint    not null,
  completed_at timestamptz not null default now(),

  constraint phase_completions_pkey
    primary key (player_id, world, phase),

  constraint phase_completions_player_id_fkey
    foreign key (player_id) references public.players (id) on delete cascade,

  constraint phase_completions_fase_valida_check
    check (
      (world between 1 and 4 and phase between 1 and 3)
      or (world = 5 and phase = 1)
    )
);

comment on table public.phase_completions is
  'Fases concluídas por jogador (Arruma a Bagunça). Gravado só pelo servidor.';

-- Ninguém além do servidor acessa a tabela.
alter table public.phase_completions enable row level security;

revoke all on table public.phase_completions from anon, authenticated;

-- O servidor usa a chave secreta (papel service_role, que ignora o RLS).
-- Ele só precisa ler e inserir: o jogo nunca altera nem apaga progresso.
revoke all on table public.phase_completions from service_role;
grant select, insert on table public.phase_completions to service_role;

commit;
