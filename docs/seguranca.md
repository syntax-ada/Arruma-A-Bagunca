# Segurança: auditoria, limite de requisições e sessões de jogador

Este documento registra a revisão de segurança feita em 21/10/2026 e explica o que foi implementado: o **limite de requisições** (rate limiting) compartilhado entre instâncias e a **revogação de sessões de jogador**. Também traz o passo a passo para aplicar a migração e validar no Preview.

> **Estado da validação (21/10/2026):** a equipe aplicou as duas migrações no Supabase real e rodou as consultas e o teste com `rollback` da seção 4. Os resultados informados conferem com o esperado: RLS ligado nas três tabelas, permissões exatas, `service_role` com `BYPASSRLS` e as duas funções executadas como `service_role` sem erro. ⚠️ **Ainda não foi validado pelo servidor nem pela API** (Vercel/Preview): limite com 429, sessões e revogação. O roteiro está na seção 6. Antes disso, as verificações eram testes automáticos com banco simulado, as migrações num Postgres local (PGlite) e o jogo no Chrome com servidor local.

---

## 1. Resumo da auditoria

| # | Problema | Gravidade | Situação |
|---|---|---|---|
| 1 | Login administrativo **sem limite de tentativas de PIN** (força bruta; o sistema aceita PIN de 6 dígitos) | Alta | **Corrigido:** 5 tentativas por rede a cada 15 min e 30 por hora no total; conferido antes do cálculo do PIN; sem o limite, o login é recusado |
| 2 | Cada tentativa de PIN calcula um hash caro (scrypt, ~16 MB de memória): pedidos em massa consomem servidor | Média | **Corrigido** pelo item 1 (tentativa bloqueada não calcula nada) |
| 3 | Sessão de jogador **sem revogação**: só expirava em 12 h ou trocando o segredo (derrubando todas) | Média | **Corrigido:** cada sessão tem registro no banco, conferido em todo pedido de progresso; dá para encerrar uma sessão ou todas de um jogador |
| 4 | **Sem limite de requisições** na identificação de jogadores (enumeração de apelidos, cadastros em massa) e no progresso | Média | **Corrigido:** limites por rede e por jogador (seção 2) |
| 5 | `POST /api/jogadores/verificar` devolvia o `id` do jogador sem necessidade | Baixa | **Corrigido:** devolve só apelido e avatar |
| 6 | Na Vercel, o corpo já interpretado não respeitava o limite de 10 KB | Baixa | **Corrigido** |
| 7 | Respostas da API sem `X-Content-Type-Options: nosniff` | Baixa | **Corrigido** |
| 8 | **Login só pelo apelido:** quem souber o apelido de outra criança entra no perfil dela, vê e soma progresso (não apaga) | Média | **Risco aceito pela equipe** (decisão anterior). Revogar encerra sessões, mas não impede um novo login com o apelido. ⚠️ Reavaliar |
| 9 | Sessão **administrativa** não é revogável no servidor (vale até 60 min depois do "Sair", se o cookie foi copiado) | Baixa | **Pendente** (documentado). Trocar `ADMIN_SESSION_SECRET` derruba todas |
| 10 | Sem `.vercelignore`: `docs/`, `testes/`, `scripts/` e `supabase/` são publicados como arquivos estáticos | Baixa | **Pendente:** não contêm segredos, mas expõem detalhes internos. Exige mudança na configuração do deploy (decisão da equipe) |
| 11 | `admin.html` pode ser aberta dentro de um iframe de outro site (*clickjacking*) | Baixa | **Pendente:** exige cabeçalho `Content-Security-Policy: frame-ancestors` na configuração da Vercel, só para `admin.html` (o jogo precisa continuar abrindo no iframe do HUB) |
| 12 | Pedidos em massa ainda **executam** a função na Vercel (o limite protege banco e PIN, não o custo de execução) | Baixa | **Pendente, opcional:** regra no firewall da Vercel (seção 2.6) |

### Verificado sem problema encontrado

| Item | Evidência |
|---|---|
| CORS: nenhum endpoint libera outro site | Nenhum cabeçalho `Access-Control-*` no código; teste: pré-voo `OPTIONS` de outra origem recebe 405 sem `Access-Control-Allow-Origin` |
| Acesso ao progresso de outro jogador | Teste: ids no corpo ou na URL são ignorados; só vale o jogador do token com sessão ativa no banco; token com jogador trocado é recusado |
| Token falsificado, adulterado, expirado ou de outro segredo | Testes: 401 sem consultar o banco |
| XSS (roubo do token da aba) | Busca no código: nenhum `innerHTML` com dado do usuário; o apelido é sempre inserido com `textContent` |
| Segredos no navegador, nas respostas e nos logs | Testes: nenhuma chave em `js/`; respostas e logs sem chave, endereço, token ou segredo |
| Painel administrativo: origem, cookie e PIN | Testes: origem fora da lista → 403; cookie `HttpOnly`, `SameSite=Strict`, `Path=/api`; resposta genérica para código ou PIN errados |
| Banco: RLS e permissões | As duas migrações executadas num Postgres local (PGlite): 48 verificações de comportamento e 25 de permissões efetivas, com os pedidos feitos como o PostgREST faz (`authenticator` → `service_role`, SQL no formato da API), com e sem os privilégios padrão do Supabase para objetos novos. O `service_role` executa as duas funções (inclusive a limpeza chamada de dentro da função de limite); `anon`/`authenticated` não alcançam nada. O teste `testes/migracoes.test.js` protege essas regras no texto das migrações. **Não substitui** a conferência no Supabase real (seção 4) |

---

## 2. Limite de requisições (rate limiting)

### 2.1 Como funciona

- Os contadores ficam no **banco que o jogo já usa** (tabela `rate_limit_counters` e função `consumir_limite_requisicoes`). Todas as instâncias da Vercel enxergam os mesmos números; não é contador em memória.
- **Janela fixa:** por exemplo, "5 pedidos a cada 15 minutos". Passou do limite → **HTTP 429** `{ "erro": "MUITAS_TENTATIVAS", "mensagem": "...", "esperaSegundos": N }`, com o cabeçalho `Retry-After`.
- **Privacidade:** o banco não guarda IP nem id de jogador. A chave de cada contador é um resumo (HMAC) calculado no servidor.
- **Rede do aparelho:** na Vercel, vale o primeiro endereço de `X-Forwarded-For`, que a própria Vercel preenche. Fora da Vercel (servidor local), esse cabeçalho é **ignorado** (qualquer um poderia inventá-lo) e vale o endereço da conexão. Endereços IPv6 são agrupados pelo prefixo `/64`.
- **Atalho local:** quando o banco responde "bloqueado", a instância lembra até a janela acabar e recusa sem consultar o banco de novo (alivia o banco numa enxurrada de pedidos).

### 2.2 Limites iniciais

Ficam em `REGRAS`, no arquivo `api/_lib/limite.js`. Para mudar, altere lá e rode `node --test`.

| Regra | Onde | Limite |
|---|---|---|
| `adminLogin` | `POST /api/admin/login` | 5 por rede a cada 15 min **e** 30 no total por hora |
| `adminRevogarSessao` | `POST /api/admin/revogar-sessao-jogador` | 30 por rede a cada 10 min |
| `jogadoresVerificar` | `POST /api/jogadores/verificar` | 120 por rede a cada 10 min |
| `jogadoresEntrar` | `POST /api/jogadores` (criar ou entrar) | 120 por rede a cada 10 min |
| `progressoConsultar` | `GET /api/progresso` | 600 por rede e 60 por jogador a cada 10 min |
| `progressoRegistrar` | `POST /api/progresso/registrar` | 600 por rede e 60 por jogador a cada 10 min |

Por que folgados para as crianças: **uma sala de aula inteira costuma sair pela mesma rede** (mesmo IP). Com 30 crianças, cada uma entrando 2 ou 3 vezes, a identificação fica bem abaixo de 120 em 10 minutos. Uma criança gasta 1 consulta ao entrar e 1 gravação por fase concluída, muito abaixo de 60.

### 2.3 Quando o banco não responde

| Endpoint | Comportamento | Por quê |
|---|---|---|
| Jogo (`/api/jogadores*`, `/api/progresso*`) | **Libera** o pedido e registra `[limite] Limite indisponível (...): pedido liberado.` no log | A criança não pode ficar sem jogar por causa do contador |
| Painel (`/api/admin/login`, `/api/admin/revogar-sessao-jogador`) | **Recusa** com 503 e registra `... pedido recusado.` | Sem o limite, o PIN ficaria exposto a tentativas sem fim |

⚠️ Por isso, **aplique a migração antes do deploy**: sem a função de limite, o login administrativo fica indisponível.

### 2.4 O que não tem limite, e por quê

- `GET /api/admin/sessao` e `POST /api/admin/logout`: só conferem uma assinatura (sem banco, sem PIN). Colocar o contador ali **aumentaria** a carga no banco.
- Pedidos de progresso com **token inválido**: são recusados (401) antes de qualquer acesso ao banco, pelo mesmo motivo.
- Pedidos malformados (400, 415, 422): recusados antes do banco e sem gastar tentativas.

### 2.5 Custos

- **Nenhum serviço novo.** Usa o Supabase que o jogo já usa.
- Cada pedido limitado faz **uma consulta a mais** no banco; os de progresso fazem duas (limite + conferência da sessão). Isso acrescenta alguns milissegundos a dezenas de milissegundos por pedido.
- **Espaço no banco:** uma linha pequena por contador ativo e por sessão. A função de limite apaga, de vez em quando, contadores e sessões vencidos há mais de 1 dia. Para uma escola com algumas centenas de crianças, isso fica na casa de centenas de kilobytes.
- O plano gratuito do Supabase tem limites de tamanho do banco e de tráfego, e projetos sem uso podem ser pausados. Confira os valores atuais na página de preços do Supabase antes de usar com muitas escolas.

### 2.6 Camada opcional: firewall da Vercel

O limite do código protege o banco e o PIN, mas um pedido recusado com 429 ainda conta como execução da função na Vercel. Para barrar pedidos em massa **antes** de chegarem ao código, dá para criar uma regra de *rate limiting* no firewall da Vercel (por exemplo, para `/api/admin/login`). A disponibilidade e o preço dependem do plano da Vercel. **Não foi configurado** (é configuração do projeto na Vercel, fora do repositório).

---

## 3. Sessões de jogador revogáveis

- Ao confirmar o apelido, o servidor cria uma linha em `player_sessions` (válida por 12 horas) e devolve um token assinado que leva o id dessa sessão.
- Em **todo** pedido de progresso, o servidor confere a assinatura e, no banco, se a sessão existe, é do mesmo jogador, não expirou e **não foi revogada**. A conferência é no banco, então a revogação vale na hora para todas as instâncias.
- Sessão revogada → 401. O jogo descarta o token, **continua guardando o progresso no navegador** e envia o que ficou pendente quando a criança entrar de novo pelo JOGAR. Nada é apagado.

### Como revogar

1. **Pela página administrativa (mais simples):** em `/admin.html`, com a sessão ativa, digite o apelido em **"Encerrar as sessões de um jogador"**. Encerra todas as sessões abertas daquela criança, sem afetar as outras.
2. **Pela API (uma sessão específica):** com a sessão administrativa ativa, no console do navegador (F12) aberto em `/admin.html`:
   ```js
   await fetch("/api/admin/revogar-sessao-jogador", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ sessao: "<id da sessão>" }),
   }).then((r) => r.json());
   ```
   Troque `sessao` por `apelido` para encerrar todas as do jogador. Resposta: `{ "revogadas": N }`.
3. **Pelo SQL Editor (ação manual da equipe):**
   ```sql
   -- Ver as sessões ativas de um jogador (só leitura)
   select s.id, s.created_at, s.expires_at
   from public.player_sessions s
   join public.players p on p.id = s.player_id
   where p.normalized_nickname = 'anaclara' and s.revoked_at is null and s.expires_at > now();

   -- Encerrar uma sessão (confira o id antes)
   update public.player_sessions set revoked_at = now()
   where id = '<id da sessão>' and revoked_at is null;
   ```

⚠️ Com o login só pelo apelido, revogar **não impede** que alguém que sabe o apelido entre de novo. Serve para encerrar sessões abertas (ex.: aparelho perdido, sessão usada indevidamente), não como bloqueio permanente.

---

## 4. Aplicar a migração

Ordem das migrações (cada uma uma vez só, nesta ordem):

1. `supabase/migrations/20261021120000_phase_completions.sql` (fases concluídas; ver [`progresso-supabase.md`](progresso-supabase.md));
2. `supabase/migrations/20261021190000_sessoes_e_limites.sql` (esta: sessões e limite).

Passos (no projeto **do jogo**, confira o nome antes):

1. Supabase → **SQL Editor → New query**.
2. Cole **todo** o conteúdo do arquivo e clique em **Run**. Esperado: "Success. No rows returned". Se der erro, nada foi criado (o arquivo roda dentro de `begin … commit`): anote a mensagem e não "conserte" pedaços à mão.
3. Confira (só leitura):

```sql
-- Tabelas com RLS ligado (esperado: true nas três)
select relname, relrowsecurity from pg_class
where oid in ('public.phase_completions'::regclass, 'public.player_sessions'::regclass, 'public.rate_limit_counters'::regclass);

-- Permissões nas tabelas (esperado: nenhuma linha de anon nem authenticated;
-- service_role: phase_completions INSERT/SELECT; player_sessions DELETE/INSERT/SELECT;
-- rate_limit_counters DELETE/INSERT/SELECT/UPDATE)
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('phase_completions', 'player_sessions', 'rate_limit_counters')
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;

-- UPDATE em player_sessions só na coluna revoked_at (esperado: uma linha, service_role)
select grantee, column_name from information_schema.column_privileges
where table_schema = 'public' and table_name = 'player_sessions'
  and privilege_type = 'UPDATE' and grantee in ('anon', 'authenticated', 'service_role');

-- Quem executa as funções (esperado: service_role e o dono; nunca anon, authenticated ou PUBLIC)
select distinct routine_name, grantee from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('consumir_limite_requisicoes', 'limpar_registros_temporarios');

-- O papel do servidor passa pelo RLS (esperado: true). As funções são
-- SECURITY INVOKER e as tabelas não têm políticas: sem isto, nada funcionaria.
select rolname, rolbypassrls from pg_roles where rolname = 'service_role';
```

**Teste opcional das permissões reais (não deixa dados):** roda as duas funções como `service_role`, o mesmo papel que o servidor usa, e desfaz tudo no fim com `rollback`. Cole tudo de uma vez no SQL Editor:

```sql
begin;
set local role service_role;
do $$
declare
  primeira jsonb;
  segunda  jsonb;
begin
  primeira := public.consumir_limite_requisicoes(array['teste-manual-de-permissao'], array[1], array[60]);
  segunda  := public.consumir_limite_requisicoes(array['teste-manual-de-permissao'], array[1], array[60]);
  perform public.limpar_registros_temporarios();
  if (primeira->>'permitido')::boolean is not true or (segunda->>'permitido')::boolean is not false then
    raise exception 'Resultado inesperado: % / %', primeira, segunda;
  end if;
  raise notice 'OK: % / %', primeira, segunda;
end $$;
rollback;
```

Esperado: nenhuma mensagem de erro (o aviso `OK: {"permitido": true, ...} / {"permitido": false, ...}` aparece nas mensagens, se o editor mostrá-las). Um erro `permission denied` indica permissão faltando; nesse caso, rode de novo as consultas acima e compare. Se o editor recusar o `set local role service_role`, use o seletor de papel (*role*) do próprio SQL Editor, escolhendo `service_role`, e rode o bloco sem essa linha.

Se a API ainda responder que a função não existe logo depois da migração, rode `notify pgrst, 'reload schema';` para o Supabase recarregar a lista de funções.

**Desfazer (só se a equipe decidir; apaga sessões e contadores):**

```sql
begin;
drop function public.consumir_limite_requisicoes(text[], integer[], integer[]);
drop function public.limpar_registros_temporarios();
drop table public.rate_limit_counters;
drop table public.player_sessions;
commit;
```

Depois de desfazer, o login administrativo fica indisponível (falha fechada) até a migração voltar.

---

## 5. Configuração

Nenhuma variável nova. O que já existia passa a ser usado também aqui:

| Variável | Uso nesta parte |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Contadores do limite e sessões de jogador. A chave secreta também é a base do resumo (HMAC) das chaves dos contadores |
| `PLAYER_SESSION_SECRET` | Assina o token da sessão do jogador |
| `ADMIN_*` | Login administrativo e revogação |
| `VERCEL` | Definida automaticamente pela Vercel. É ela que faz o servidor confiar em `X-Forwarded-For`. ⚠️ Se as variáveis de sistema da Vercel estiverem desligadas no projeto, todo mundo pareceria vir da mesma rede (confira no passo 8 da seção 6) |

---

## 6. Validar no Preview

Ordem: **migrações aplicadas (seção 4) → variáveis conferidas no Preview → commit e push feitos por uma pessoa da equipe → deploy de Preview → roteiro abaixo.** Use apelidos de teste e uma janela anônima.

| # | Faça | Esperado |
|---|---|---|
| 1 | JOGAR → "Teste Seguranca 1" → jogue a Fase 1 do Mundo 1 | Barra em 25%; no SQL, uma linha em `phase_completions` e uma sessão em `player_sessions` para esse apelido |
| 2 | Em outra aba, `/admin.html` → entre com um PIN **errado** 5 vezes | *"Código ou PIN inválidos."* nas 5 |
| 3 | Na 6ª tentativa, use o PIN **certo** | *"Muitas tentativas. Espere alguns minutos e tente de novo."* e nada de sessão. F12 → Network: resposta 429 com `Retry-After` |
| 4 | Pelo celular com dados móveis (outra rede), tente o PIN certo | Entra normalmente (o limite é por rede). Se também receber 429, confira o item da variável `VERCEL` (seção 5) |
| 5 | Depois de 15 minutos, no computador, entre com o PIN certo | Entra |
| 6 | Em "Encerrar as sessões de um jogador", digite "Teste Seguranca 1" | *"1 sessão(ões) encerrada(s)."*; no SQL, `revoked_at` preenchido |
| 7 | Volte à aba do jogo (sem recarregar) e jogue a Fase 2 | O jogo segue normal e a barra vai a 45%. F12 → Network: `/api/progresso/registrar` responde 401; no SQL, a 1-2 **não** aparece ainda |
| 8 | Na aba do jogo: voltar → JOGAR → "Teste Seguranca 1" | A 1-2 aparece no SQL (pendência enviada com a sessão nova). Outros apelidos de teste não foram afetados |
| 9 | No SQL: `select count(*) from public.rate_limit_counters;` e `select bucket_key from public.rate_limit_counters limit 5;` | Há contadores, e as chaves são resumos (sem IP nem id) |
| 10 | Logs da Vercel (Deployments → o deploy → Logs) | Sem `[limite] Limite indisponível`, sem `[sessao-jogador] Não foi possível registrar a sessão` |

---

## 7. Riscos que permanecem

- **Login só pelo apelido** (item 8): a medida definitiva seria uma identificação mais forte (por exemplo, vinda do Cruzeiro HUB). Decisão da equipe.
- **Bloqueio do login da equipe:** o teto geral de 30 tentativas por hora permite que alguém, errando o PIN de propósito, deixe o login administrativo indisponível por até 1 hora. É o preço de impedir tentativas espalhadas por muitos endereços. No computador, `?dev=true` continua funcionando.
- **Escola grande na mesma rede:** se muitas turmas usarem o jogo ao mesmo tempo atrás do mesmo IP, os limites por rede (120 identificações em 10 min) podem ser atingidos; o progresso continua guardado no navegador, mas a identificação recebe 429 e a criança vê "Não conseguimos conectar agora". Ajuste `REGRAS` se isso acontecer.
- **Sessão administrativa** sem revogação individual (item 9).
- **Itens 10, 11 e 12** dependem de configuração da Vercel.
- **Validação real pendente:** Supabase real (funções, permissões e PostgREST), Vercel (cabeçalho `X-Forwarded-For`, variável `VERCEL`) e navegadores além do Chrome.
