cll# Progresso no Supabase: configuração, migração e testes

Este guia explica como o **Arruma a Bagunça** salva as fases concluídas de cada jogador e o passo a passo para a equipe ligar isso no banco e testar no Preview da Vercel.

> ⚠️ **Nada aqui é feito automaticamente.** A migração SQL só existe como arquivo no repositório; uma pessoa da equipe a aplica no painel do Supabase. Agentes de IA não executam SQL nem fazem deploy.

---

## Como funciona, em poucas frases

- Cada fase concluída vira uma linha na tabela `phase_completions`: "o jogador X concluiu a fase F do mundo M". São 13 fases possíveis (Mundos 1 a 4 com 3 fases; Mundo 5, a fase bônus, com 1).
- O navegador guarda o progresso **separado por jogador** e envia ao servidor. Sem internet, a conclusão fica guardada e é enviada depois.
- Ao entrar com o apelido, o progresso do banco é **somado** ao do navegador. Nada é apagado nem substituído, nos dois lados.
- **JOGAR não apaga progresso.** Para recomeçar um teste, use o progresso de teste do painel DEV ou um apelido novo (seção 5).
- Quem prova "eu sou o jogador X" é um **token assinado pelo servidor** (variável `PLAYER_SESSION_SECRET`), recebido ao confirmar o apelido. Cada token corresponde a uma sessão registrada no banco, que pode ser **encerrada** pela equipe (ver [`seguranca.md`](seguranca.md)). O servidor nunca usa um id de jogador enviado pelo navegador.
- Os endpoints têm **limite de requisições** (HTTP 429 quando passa); ver [`seguranca.md`](seguranca.md).
- O servidor confere a **ordem**: não dá para registrar a fase 2-1 sem ter concluído as fases do Mundo 1, nem a fase bônus sem o Mundo 4.
- O **modo DEV** usa um progresso de teste separado, que nunca é enviado ao banco.

| Peça | Onde |
|---|---|
| Regras das 13 fases e da ordem (navegador e servidor usam o mesmo arquivo) | `js/regras-progresso.js` |
| Progresso no navegador e envio ao servidor | `js/progresso.js` |
| Sessão do jogador (token + registro no banco) | `api/_lib/sessao-jogador.js` |
| Limite de requisições | `api/_lib/limite.js` |
| Endpoints | `GET /api/progresso` e `POST /api/progresso/registrar` |
| Migrações (nesta ordem) | `supabase/migrations/20261021120000_phase_completions.sql` (fases concluídas) e `supabase/migrations/20261021190000_sessoes_e_limites.sql` (sessões e limite; passo a passo em [`seguranca.md`](seguranca.md)) |

---

## 1. Configurar a variável `PLAYER_SESSION_SECRET`

É um texto aleatório, com pelo menos 32 caracteres, **diferente** do `ADMIN_SESSION_SECRET`. Sem ela o jogo funciona, mas o progresso fica só no navegador.

**Gerar o valor** (no terminal, na raiz do projeto):

```text
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Copie o resultado direto para o lugar certo. **Não** cole em mensagens, commits, `.env.example` ou documentos.

**No seu computador:** acrescente ao `.env.local` (que o git ignora):

```text
PLAYER_SESSION_SECRET=<valor gerado>
```

Ao iniciar o servidor local, a linha "Sessão do jogador: configurada" confirma (sem mostrar o valor).

**Na Vercel (Preview):** Project → Settings → Environment Variables → adicione `PLAYER_SESSION_SECRET` marcando o ambiente **Preview** (e **Production** só quando a equipe decidir publicar). Gere um valor diferente para cada ambiente. Variáveis novas só valem em um **deploy novo**: depois de salvar, faça um redeploy do Preview.

Trocar o valor depois obriga as crianças a digitar o apelido de novo; o progresso não se perde.

---

## 2. Aplicar a migração no Supabase

Pré-requisito: a tabela `public.players` já existe (é a do cadastro de jogadores).

1. Abra o projeto **do jogo** no painel do Supabase (confira o nome antes: a migração cria uma tabela).
2. Vá em **SQL Editor → New query**.
3. Abra o arquivo `supabase/migrations/20261021120000_phase_completions.sql`, copie **todo** o conteúdo e cole no editor.
4. Clique em **Run**. O esperado é "Success. No rows returned".
5. Se aparecer erro, nada foi criado (o arquivo roda dentro de `begin … commit`). Anote a mensagem e não tente "consertar" pedaços à mão.

A migração cria a tabela com chave primária `(player_id, world, phase)`, chave estrangeira para `players` (apagar um jogador apaga as conclusões dele), a restrição das 13 fases, liga o RLS, tira todas as permissões de `anon` e `authenticated` e deixa o `service_role` (usado pelo servidor com a chave secreta) só com `SELECT` e `INSERT`.

**Depois desta, aplique a segunda migração**, `supabase/migrations/20261021190000_sessoes_e_limites.sql`, do mesmo jeito (passo a passo e consultas de conferência em [`seguranca.md`](seguranca.md), seção 4). Sem ela, as sessões de jogador não são criadas (o progresso fica só no navegador) e o login administrativo fica indisponível.

### Conferir se ficou certo (consultas só de leitura)

```sql
-- 1. Colunas
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'phase_completions'
order by ordinal_position;
-- Esperado: player_id uuid, world smallint, phase smallint (NOT NULL);
--           completed_at timestamptz com default now().

-- 2. Restrições
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.phase_completions'::regclass
order by conname;
-- Esperado: phase_completions_pkey (PRIMARY KEY), phase_completions_player_id_fkey
--           (FOREIGN KEY ... ON DELETE CASCADE) e phase_completions_fase_valida_check.

-- 3. RLS ligado
select relrowsecurity from pg_class where oid = 'public.phase_completions'::regclass;
-- Esperado: true

-- 4. Permissões
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'phase_completions'
order by grantee, privilege_type;
-- Esperado: nenhuma linha de anon nem de authenticated;
--           service_role só com INSERT e SELECT (o dono da tabela também aparece).
```

### Desfazer (só se a equipe decidir)

```sql
-- ⚠️ APAGA TODAS AS CONCLUSÕES GRAVADAS. Não há como recuperar.
drop table public.phase_completions;
```

---

## 3. Testar no computador

1. Tenha no `.env.local` as variáveis do Supabase e o `PLAYER_SESSION_SECRET`.
2. Rode `node --test` (testes simulados, sem banco) e depois:
   ```text
   node --env-file=.env.local scripts/servidor-local.js
   ```
3. ⚠️ Com o `.env.local` preenchido, o servidor local grava no banco **real**. Use apelidos de teste (ex.: "Teste Local 1").
4. Siga o roteiro da seção 4 em `http://localhost:3000`.

---

## 4. Testar no Preview (roteiro)

Ordem recomendada: **as duas migrações aplicadas (seção 2) → variável no Preview (seção 1) → commit e push feitos por uma pessoa da equipe → deploy de Preview → roteiro abaixo.** Se o código chegar antes das migrações, o jogo não quebra: o progresso fica guardado no navegador e é enviado quando as tabelas existirem (mas o login administrativo fica indisponível). Os testes de limite de tentativas e de revogação estão em [`seguranca.md`](seguranca.md), seção 6.

Use uma janela anônima e apelidos de teste. Para conferir o banco, rode no SQL Editor:

```sql
select p.nickname, c.world, c.phase, c.completed_at
from public.phase_completions c
join public.players p on p.id = c.player_id
where p.normalized_nickname like 'testepreview%'
order by p.nickname, c.world, c.phase;
```

| # | Faça | Esperado |
|---|---|---|
| 1 | JOGAR → apelido "Teste Preview 1" → confirmar | Menu de mundos com a barra em 10% |
| 2 | Jogue a Fase 1 do Mundo 1 até o fim e volte ao menu | Barra em 25%; a consulta mostra uma linha 1-1 |
| 3 | Volte à tela inicial → JOGAR → mesmo apelido | Barra continua em 25% (JOGAR não apagou); ainda uma linha só |
| 4 | Outro navegador ou aparelho → JOGAR → mesmo apelido | Barra em 25%: o progresso veio do banco |
| 5 | Na mesma aba, JOGAR → "Teste Preview 2" | Barra em 10%: nada do jogador 1 aparece |
| 6 | Com o jogador 2, abra a Fase 1 (com internet). Já dentro da fase: DevTools (F12) → Network → **Offline**. Termine a fase e volte ao menu | Barra em 25% mesmo sem internet; a consulta ainda não mostra a 1-1 do jogador 2 |
| 7 | Volte para **Online** (sem recarregar) | Em alguns segundos a 1-1 do jogador 2 aparece na consulta. Se não aparecer, jogue outra fase ou entre de novo pelo JOGAR: as pendências também são enviadas nesses momentos |
| 8 | Abra `/admin.html`, faça login, abra o jogo com o painel DEV, JOGAR → "Teste Preview 1" → Desbloquear Tudo | Barra em 100% (progresso de teste); a consulta não ganha linhas novas |
| 9 | No painel DEV, "Sair" → JOGAR → "Teste Preview 1" | Barra volta a 25% (progresso real) |
| 10 | Duplicidades | `select player_id, world, phase, count(*) from public.phase_completions group by 1,2,3 having count(*) > 1;` não devolve linhas |

Também confira nos logs da Vercel (Deployments → o deploy → Logs) que não aparecem `[sessao-jogador] Configuração ausente` nem `[supabase] Requisição falhou`.

---

## 5. Recomeçar o progresso para testes (sem o JOGAR)

O JOGAR nunca apaga progresso, e o jogo nunca apaga nada no banco. Para testar "do zero":

- **Mais simples:** use um apelido novo (ex.: "Teste Preview 3").
- **Painel DEV:** "Resetar Progresso" (Shift+R) zera só o **progresso de teste** do modo DEV. Não toca no progresso de nenhum jogador nem no banco.
- **Apagar um jogador de teste do banco** (ação manual da equipe, no SQL Editor, conferindo o apelido antes; apagar o jogador apaga as conclusões dele):
  ```sql
  delete from public.players where normalized_nickname = 'testepreview1';
  ```
  Depois, limpe também os dados do site no navegador usado no teste (F12 → Application → Storage → Clear site data). Se não limpar, o navegador ainda guarda o progresso daquele jogador e, se o mesmo apelido for criado de novo, é um jogador novo (outro id) e começa do zero.

---

## 6. Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Progresso não aparece em outro aparelho | `PLAYER_SESSION_SECRET` ausente no ambiente ou sem redeploy | Configure (seção 1) e faça um deploy novo. No log: `[sessao-jogador] Configuração ausente ou inválida` |
| Log `[supabase] Requisição falhou: 404 ... (código PGRST205)` | A tabela não existe nesse projeto | Aplique a migração (seção 2) no projeto certo |
| Log com `(código 42501)` | Permissão faltando para o `service_role` | Rode a consulta 4 da seção 2 e compare com o esperado |
| No navegador, `/api/progresso` responde 401 | Token expirado (12 h), sessão encerrada pela equipe ou segredo trocado | JOGAR e digitar o apelido de novo; o progresso pendente é enviado |
| No navegador, alguma rota da API responde 429 | Limite de requisições atingido (ex.: muitas crianças na mesma rede) | Esperar o tempo de `Retry-After`. Se acontecer com frequência numa escola, ajustar os limites (ver [`seguranca.md`](seguranca.md)) |
| Log `[sessao-jogador] Não foi possível registrar a sessão` | A tabela `player_sessions` não existe (segunda migração não aplicada) | Aplique `20261021190000_sessoes_e_limites.sql` |
| O progresso de antes desta versão sumiu do menu | A chave antiga `arruma_bagunca_progresso` não tinha dono (e era apagada a cada JOGAR) | Esperado: ela não é lida nem apagada, para não misturar jogadores |

---

## 7. Limitações conhecidas

- **Entrar só com o apelido** (decisão da equipe): quem souber o apelido de outra criança entra no perfil dela e vê (ou soma) o progresso. Não consegue apagar nada.
- O token do jogador vale 12 horas. A equipe pode encerrar as sessões de um jogador (ou uma sessão específica) sem afetar os outros; trocar o `PLAYER_SESSION_SECRET` derruba todas de uma vez.
- Os limites de requisições são por rede: uma escola grande atrás do mesmo IP pode atingi-los (ver [`seguranca.md`](seguranca.md)).
- O progresso feito **sem jogador identificado** (ex.: `fase1.html` aberta direto, sem passar pelo JOGAR) vale só enquanto a página estiver aberta.
- O navegador guarda o progresso de cada jogador que entrou nele, até a limpeza dos dados do site. Em computador compartilhado, isso fica no aparelho, mas só aparece para quem entrar com o mesmo apelido.
