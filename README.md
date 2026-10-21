# Arruma a Bagunça

Jogo educativo digital desenvolvido para a disciplina **Análise e Projeto de Sistemas II**. Ensina Matemática de forma lúdica, visual e interativa a crianças de **7 a 10 anos** (aproximadamente do 2º ao 5º ano da rede pública municipal de São Paulo).

> **Como ler este documento:** ele descreve o produto, as decisões da equipe e o estado verificável do projeto. As regras para agentes de IA ficam em [`AGENTS.md`](AGENTS.md). O que o código já mostra por si só (objetos de cada fase, textos, estilos) não é repetido aqui.

---

## 1. Visão geral

A criança encontra objetos misturados em um cenário bagunçado e os organiza em cestas, por categoria. As quantidades organizadas alimentam um desafio matemático ligado à atividade, em vez de uma lista solta de exercícios. Cada mundo trabalha uma operação; a fase bônus é um desafio final contra o "Monstro da Bagunça".

O jogo roda no navegador (HTML, CSS e JavaScript puros, sem frameworks). Um pequeno backend em Node (`api/`) registra no Supabase o apelido do jogador e as fases que ele concluiu.

---

## 2. Requisitos e estado

Legenda: **[Requisito oficial]** vem do material da disciplina, que não está neste repositório e por isso não é reinterpretado aqui. **[Decisão da equipe]** é uma escolha já feita pelo projeto.

### Público-alvo e BNCC

- Crianças de 7 a 10 anos, alfabetizadas ou em processo de alfabetização.
- Habilidades da BNCC consideradas hoje: **EF02MA06 / EF03MA06** (operações e resolução de problemas com números naturais em situações do cotidiano). A atividade matemática deve estar ligada à ação da criança no jogo.
- ⚠️ **A validar:** o jogo também trabalha multiplicação, divisão e expressões compostas (Mundos 3 a 5). Falta conferir, no material oficial, se outras habilidades devem constar. Não criar nem alterar habilidades sem validação da equipe.

### Requisitos e estado de cada um

- **[Requisito oficial]** A faculdade exige **4 fases principais e 1 fase bônus**.
- **[Decisão da equipe]** O jogo é organizado em **4 mundos principais, cada um com 3 fases**, mais o **Mundo 5 como fase bônus**, com o Boss. Essa organização em mundos é escolha do projeto, não exigência da faculdade.

A origem dos demais itens da tabela não está documentada neste repositório.

| Item | Estado |
|---|---|
| Menu inicial e créditos | Implementado |
| 4 fases principais + 1 fase bônus ([Requisito oficial]) | Implementado na organização da equipe ([Decisão da equipe]): 4 mundos principais com 3 fases cada (Mundos 1 a 4) + Mundo 5 como fase bônus do Boss, todos jogáveis. Arte do Mundo 5: a confirmar |
| Identificação por apelido | Implementado: apelido gravado no Supabase, sem senha ([Decisão da equipe]) |
| Avatar | Parcial: único avatar 👤 nesta versão ([Decisão da equipe]) |
| Progresso e fases concluídas | Implementado: guardado no navegador **separado por jogador** e enviado ao servidor; o JOGAR não apaga progresso |
| Progresso por jogador no banco | Implementado no código (tabela `phase_completions`, sessão do jogador assinada no servidor). Validado em teste simulado e local. Migração aplicada no Supabase real pela equipe em 21/10/2026, com as permissões conferidas; ⚠️ **o fluxo pelo jogo ainda não foi validado no banco real** e não há deploy verificado (passo a passo em [`docs/progresso-supabase.md`](docs/progresso-supabase.md)) |
| Instruções com suporte a áudio | Não implementado |
| Configurações de acessibilidade | Não implementado. O botão "Configurações" do menu é um espaço reservado, sem função |
| Suporte a teclado | Parcial (ver seção 3) |
| Dispositivos móveis | Parcial: layouts responsivos, sem teste registrado em aparelhos reais |
| Pontuação e conquistas | Não implementado |
| Login administrativo e restrição do painel DEV | Implementado no código: login em `admin.html` com sessão conferida no servidor e limite de tentativas de PIN; `?dev=true` só vale em ambiente local. Validado em teste simulado e local; **sem deploy verificado** |
| Limite de requisições e revogação de sessões de jogador | Implementado no código, com contadores e sessões no Supabase (migração `20261021190000_sessoes_e_limites.sql`, aplicada no Supabase real pela equipe em 21/10/2026). Validado em teste simulado, no navegador com banco simulado e, no banco real, nas permissões e na execução das funções como `service_role`; ⚠️ **o fluxo pela API ainda não foi validado** e não há deploy verificado (ver [`docs/seguranca.md`](docs/seguranca.md)) |
| Integração com o Cruzeiro HUB via iframe | Planejado: sem código. A sessão do jogador já usa token no cabeçalho (não cookie), pensando no iframe |

---

## 3. Como o jogo funciona

**Fluxo:** tela inicial → JOGAR → identificação (apelido → confirmação) → menu de mundos → fase (organizar objetos → desafio matemático) → conclusão.

| Mundo | Tema | Operação | Fases |
|---|---|---|---|
| 1 | A Casa | Soma | 3 |
| 2 | Parque | Subtração | 3 |
| 3 | Praia | Multiplicação | 3 |
| 4 | Acampamento | Divisão | 3 |
| 5 (bônus) | Desafio Final | Expressões compostas | 1 |

Os Mundos 1 a 4 são as etapas principais; o Mundo 5 é a fase bônus (organização definida pela equipe, ver seção 2). A fonte de verdade das fases (categorias, quantidades, operação) é a pasta `js/mundos/`.

- **Progressão:** concluir uma fase libera a próxima; concluir a última libera o próximo mundo. O Mundo 5 aparece como um painel lateral do Boss no menu de mundos, depois de concluir o Mundo 4. A ordem é obrigatória: uma fase aberta pela URL sem as anteriores concluídas pode ser jogada, mas não é registrada nem libera nada. Depois da fase bônus não há mais nada a liberar. As regras (13 fases e a ordem) ficam em `js/regras-progresso.js`, usado pelo navegador e pelo servidor.
- **Progresso salvo:** cada conclusão é guardada no navegador, na chave do jogador identificado, e enviada ao servidor. Sem internet, fica pendente e é reenviada depois. Ao entrar com o apelido, o progresso do banco é somado ao do navegador; nada é apagado ou substituído. **JOGAR não apaga progresso.**
- **Organização:** arrastar e soltar com mouse ou toque. Um objeto na cesta errada volta ao lugar, sem penalidade. Cada cesta mostra um contador (número e ícone).
- **Teclado (parcial):** Enter ou Espaço sobre uma cesta posiciona nela o próximo objeto disponível. Não é possível arrastar objetos pelo teclado.
- **Desafio matemático:** usa as quantidades que a criança realmente organizou, com a operação declarada pela fase. As alternativas são geradas e embaralhadas. Resposta errada mostra um feedback gentil e permite tentar de novo.
- **Mundo 5:** cinco contas compostas (× e ÷ antes de + e −), com o Monstro da Bagunça e cinco corações. Ao acertar as cinco, a cena passa para a organização final da sala.

---

## 4. Arquitetura

```text
Navegador (index.html + fase1.html em iframe)
        │  fetch /api/...  (mesma origem, JSON)
        ▼
Backend Node (api/)   ── valida, normaliza, filtra, usa a chave secreta
        │  API REST
        ▼
Supabase / PostgreSQL (tabelas players e phase_completions)
```

| Camada | Responsabilidade | Não faz |
|---|---|---|
| Navegador | Interface, jogo, progresso guardado por jogador e envio ao servidor | Não decide se um apelido é válido; não conhece nenhuma chave; não fala direto com o banco |
| Backend (`api/`) | Validação oficial, normalização e filtro do apelido; sessão do jogador (token assinado); regras da progressão; acesso ao banco | Não guarda estado entre chamadas; nunca usa um id de jogador vindo do navegador |
| Banco | Unicidade do apelido normalizado, uma linha por conclusão (chave composta), só as 13 fases válidas, RLS | Não é acessível pelo navegador |

**Principais peças** (o código é a referência; aqui só as responsabilidades):

- `index.html`: tela inicial, identificação, menu de mundos e o iframe onde a fase roda. `fase1.html`: tela de jogo genérica, usada por todos os mundos.
- `js/mundos/`: um arquivo declarativo por mundo, que se registra em `window.MUNDOS`.
- `js/game.js` (organização), `js/math.js` (desafio) e `js/operacoes.js` (regras das operações): o motor compartilhado.
- `js/main.js`: resolve `?mundo=X&fase=Y` e inicia a fase.
- `js/regras-progresso.js`: catálogo das 13 fases e regras da ordem, compartilhado com o servidor. `js/progresso.js`: progresso por jogador e sincronização com o servidor. `js/audio.js`: trilha e volume. `js/jogador.js`: tela de identificação. `js/menu.js`: navegação do menu. `js/dev.js`: ferramentas de desenvolvimento.
- `api/jogadores/`, `api/progresso/` e `api/admin/`: endpoints. `api/_lib/`: funções compartilhadas (não viram rotas), entre elas `limite.js` (limite de requisições) e `sessao-jogador.js` (sessão do jogador).
- `supabase/migrations/`: migrações SQL versionadas, aplicadas **manualmente** pela equipe.
- `admin.html` e `js/admin.js`: login administrativo da equipe (sem link na interface das crianças).
- `scripts/servidor-local.js`: servidor de desenvolvimento. `scripts/gerar-hash-pin.js`: gera o hash do PIN administrativo. `testes/`: testes automatizados.

**Menu ↔ fase:** a fase roda em um iframe da página do menu, para a trilha sonora não cortar. A fase avisa o menu com `postMessage` (`arruma-bagunca:navegacao`).

### Onde cada dado fica

| Dado | Onde | Duração |
|---|---|---|
| Progresso de cada jogador (fases concluídas e as já confirmadas pelo servidor) | `localStorage`, chave `arruma_bagunca_progresso_jogador:<id>` | Até limpar o navegador. O JOGAR não apaga |
| Progresso de teste do modo DEV | `localStorage`, chave `arruma_bagunca_progresso_dev` | Até "Resetar Progresso" no painel DEV. Nunca vai ao servidor |
| Volume | `localStorage`, chave `arruma_bagunca_volume` | Até limpar o navegador |
| Jogador identificado (só para exibição) | `sessionStorage`, chave `arruma_bagunca_jogador` | A aba |
| Sessão do jogador (token assinado pelo servidor) | `sessionStorage`, chave `arruma_bagunca_sessao_jogador`; registro da sessão no Supabase, tabela `player_sessions` | A aba; a sessão vale 12 horas ou até ser encerrada pela equipe |
| Contadores do limite de requisições | Supabase, tabela `rate_limit_counters` (chaves são resumos: sem IP nem id) | Apagados 1 dia depois de vencidos |
| Estado da trilha e modo DEV | `sessionStorage` | A aba |
| Sessão administrativa | Cookie `ab_admin` (HttpOnly, SameSite=Strict, Path=/api; Secure em HTTPS) | 60 minutos ou até o logout |
| Jogadores (apelido e avatar) | Supabase, tabela `players` | Permanente |
| Fases concluídas | Supabase, tabela `phase_completions` | Permanente |

A chave antiga `arruma_bagunca_progresso` (anterior a esta versão, sem dono e apagada a cada JOGAR) não é mais lida nem apagada: não há como saber de qual criança ela era.

### API

Entrar no perfil exige só o apelido ([Decisão da equipe]). Ao confirmar o apelido, o servidor entrega uma **sessão do jogador**: um token assinado com `PLAYER_SESSION_SECRET`, que o navegador envia no cabeçalho `Authorization: Bearer` para ler e gravar o progresso.

| Endpoint | Função | Entrada | Sucesso |
|---|---|---|---|
| `POST /api/jogadores/verificar` | Consulta, sem gravar | `{ "apelido" }` | `200 { existe: true, jogador: { apelido, avatar } }` (sem o `id`) ou `200 { existe: false, apelido }` |
| `POST /api/jogadores` | Cria ou recupera | `{ "apelido" }` (qualquer `avatar` enviado é ignorado) | `201 { criado: true, jogador, sessao }` ou `200 { criado: false, jogador, sessao }` |
| `GET /api/progresso` | Fases concluídas do jogador da sessão | Cabeçalho `Authorization: Bearer <token>` | `200 { fasesConcluidas: ["1-1", ...] }` |
| `POST /api/progresso/registrar` | Registra fases concluídas (uma ou várias, até 13) | Cabeçalho `Authorization` + `{ "fasesConcluidas": ["1-1", "1-2"] }` | `200 { fasesConcluidas, registradas, repetidas, recusadas }` |

`jogador` = `{ id, apelido, avatar }`. `sessao` = `{ token, expiraEm }`, ou `null` se o servidor não tiver `PLAYER_SESSION_SECRET` (o jogo segue, com o progresso só no navegador). Nos endpoints de progresso, o jogador é **sempre** o do token: ids enviados no corpo ou na URL são ignorados. Registrar de novo uma fase já gravada não cria outra linha (vem em `repetidas`); fases inexistentes ou fora de ordem vêm em `recusadas`, com `motivo` `FASE_INEXISTENTE` ou `FORA_DE_ORDEM`. Sem token válido (ausente, adulterado ou expirado) → `401 NAO_AUTENTICADO`.

Erros têm o formato `{ erro, mensagem }`, com mensagens pensadas para crianças:

| Código | `erro` | Quando |
|---|---|---|
| 400 | `REQUISICAO_INVALIDA` | JSON malformado, sem o campo `apelido` ou sem a lista `fasesConcluidas` (1 a 13 itens) |
| 401 | `NAO_AUTENTICADO` | Progresso sem sessão do jogador válida |
| 405 | `METODO_NAO_PERMITIDO` | Método diferente do esperado |
| 413 | `CORPO_GRANDE_DEMAIS` | Corpo maior que o limite |
| 415 | `TIPO_NAO_SUPORTADO` | Conteúdo que não é JSON |
| 422 | `APELIDO_INVALIDO` (com `motivo`: `VAZIO`, `TAMANHO`, `CARACTERES` ou `NUMEROS`) | Formato fora da regra |
| 422 | `APELIDO_NAO_PERMITIDO` (sem motivo) | Palavra bloqueada ou nome reservado |
| 429 | `MUITAS_TENTATIVAS` (com `esperaSegundos` e o cabeçalho `Retry-After`) | Limite de requisições atingido (ver [`docs/seguranca.md`](docs/seguranca.md)) |
| 500 | `ERRO_INTERNO` | Falha inesperada |
| 503 | `SERVICO_INDISPONIVEL` | Banco ou configuração indisponíveis |

O servidor local também responde `404 NAO_ENCONTRADO` para rotas inexistentes.

**API administrativa** (só para a equipe; a regra está em `api/_lib/admin.js`):

| Endpoint | Função | Respostas |
|---|---|---|
| `POST /api/admin/login` | Recebe `{ codigo: "ADM01", pin }` e cria a sessão (cookie) | `200 { codigo, expiraEm }` · `401 CREDENCIAIS_INVALIDAS` (genérico) · `403 ORIGEM_NAO_PERMITIDA` · `400`, `405`, `413`, `415` · `503` sem configuração |
| `POST /api/admin/logout` | Apaga o cookie da sessão | `204` · `403` · `503` |
| `POST /api/admin/revogar-sessao-jogador` | Encerra uma sessão de jogador (`{ sessao }`) ou todas as de um jogador (`{ apelido }`) | `200 { revogadas }` · `400` · `401` · `403` · `404 JOGADOR_NAO_ENCONTRADO` · `429` · `503` |
| `GET /api/admin/sessao` | Diz se há sessão válida | `200 { codigo, expiraEm }` · `401 NAO_AUTENTICADO` · `503` |

Login, logout e revogação só são aceitos se o cabeçalho `Origin` for exatamente uma das origens de `ADMIN_ALLOWED_ORIGINS` (e, se o navegador informar `Sec-Fetch-Site`, ele precisa ser `same-origin`). Todo endpoint administrativo novo deve começar com `exigirSessaoAdmin(req)`.

**Limite de requisições** (regras em `api/_lib/limite.js`; detalhes, custos e motivos em [`docs/seguranca.md`](docs/seguranca.md)): login administrativo com 5 tentativas por rede a cada 15 min e 30 por hora no total; identificação de jogadores com 120 por rede a cada 10 min; progresso com 600 por rede e 60 por jogador a cada 10 min. Os contadores ficam no Supabase, compartilhados entre instâncias. Se o banco não responder, o jogo segue funcionando sem o limite, e o login administrativo é recusado.

**Regras do apelido** (em `api/_lib/apelido.js`, única fonte):

- 3 a 20 letras ou números (espaços permitidos), no máximo 4 números seguidos.
- A grafia digitada é preservada em `nickname`. Para comparar, o servidor gera o `normalized_nickname`: **sem acentos, em minúsculas e sem nenhum espaço**. Apelidos que só diferem nisso são o mesmo jogador.
- Palavras ofensivas e nomes reservados são bloqueados (lista em `api/_lib/palavras-bloqueadas.js`). O filtro reduz o problema, mas **não garante moderação perfeita**.

### Banco de dados

Tabela `public.players`, conforme informado pela equipe a partir de consultas no painel do Supabase:

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | `uuid` | Chave primária, `gen_random_uuid()` |
| `nickname` | `text` | Grafia original; não pode ser vazio |
| `normalized_nickname` | `text` | `UNIQUE`; formato `^[a-z0-9]{3,20}$` |
| `avatar` | `text` | Default `'padrao'` |
| `created_at`, `updated_at` | `timestamptz` | Default `now()` |

RLS ligado, sem políticas, e permissões de `anon` e `authenticated` removidas: só o backend, com a chave secreta, grava e lê. ⚠️ O esquema de `players` foi criado direto no painel e **não está versionado neste repositório**; a fonte de verdade é o banco.

Tabela `public.phase_completions`, definida pela migração versionada `supabase/migrations/20261021120000_phase_completions.sql`. Aplicada no banco real pela equipe em 21/10/2026, manualmente, seguindo [`docs/progresso-supabase.md`](docs/progresso-supabase.md) (resultado informado pela equipe).

| Coluna | Tipo | Observações |
|---|---|---|
| `player_id` | `uuid` | Chave estrangeira para `players(id)`, `on delete cascade` |
| `world`, `phase` | `smallint` | `CHECK`: Mundos 1 a 4 com fases 1 a 3, ou Mundo 5 com fase 1 |
| `completed_at` | `timestamptz` | Default `now()` |

Chave primária `(player_id, world, phase)`: a mesma conclusão nunca vira duas linhas, mesmo com pedidos simultâneos. RLS ligado, sem políticas; `anon` e `authenticated` sem permissão; o servidor (`service_role`) só lê e insere. A ordem das fases é conferida pelo servidor, não pelo banco. Migrações são arquivos para a equipe revisar e aplicar; ninguém as executa automaticamente a partir do repositório.

A migração `supabase/migrations/20261021190000_sessoes_e_limites.sql` (aplicada no banco real pela equipe em 21/10/2026) cria `player_sessions` (sessões de jogador; o servidor só pode alterar `revoked_at`), `rate_limit_counters` e as funções `consumir_limite_requisicoes` e `limpar_registros_temporarios`, todas com RLS e sem acesso de `anon`/`authenticated`. Passo a passo e consultas de conferência em [`docs/seguranca.md`](docs/seguranca.md).

---

## 5. Segurança, acessibilidade e LGPD

### Dados e privacidade

- **Dado de perfil solicitado à criança:** apenas o apelido, na grafia digitada. A tela orienta a não usar o nome completo e o servidor recusa sequências de 5 ou mais números.
- **Gerado pelo sistema a partir do apelido:** o apelido normalizado (sem acentos, em minúsculas e sem espaços), usado só para reconhecer apelidos equivalentes, e o avatar padrão, fixo (a criança não escolhe).
- **Identificação técnica e datas mantidas no banco:** um identificador aleatório (`id`) e as datas de criação e de atualização do registro.
- **Progresso no banco:** quais fases o jogador concluiu e quando (data e hora de cada conclusão).
- Não se coleta nome real, e-mail, documentos, fotos nem localização, e as tabelas não têm campo para IP. No navegador, o apelido, o avatar, o identificador e o token da sessão ficam só no `sessionStorage` da aba. O progresso de cada jogador fica no `localStorage`, identificado só pelo `id` aleatório, até a limpeza dos dados do site.
- Os logs do backend registram status e códigos de erro, não apelidos nem chaves.
- A chave secreta do Supabase existe só como variável de ambiente do servidor e da Vercel. O servidor recusa a chave publicável. `.env.local` é ignorado pelo git.
- O PIN administrativo nunca é guardado: só o hash (`ADMIN_PIN_HASH`), em variável de ambiente do servidor, junto com o segredo que assina a sessão.
- A sessão do jogador é assinada com `PLAYER_SESSION_SECRET`, um segredo próprio, diferente do administrativo (o servidor recusa os dois iguais).

### Limitações conhecidas

- **Entrar só com o apelido** ([Decisão da equipe], risco aceito): quem souber o apelido de outra criança entra no perfil dela e vê ou soma progresso a ele (não consegue apagar). O token da sessão impede ids inventados, mas não substitui uma autenticação forte. A equipe pode encerrar as sessões de um jogador, mas isso não impede um novo login com o apelido. ⚠️ Com o progresso no banco, a equipe deve reavaliar este risco.
- **Modo DEV:** no site publicado, `?dev=true` sozinho não liga mais o painel; ele só abre depois do login em `admin.html` e da conferência da sessão no servidor. Em ambiente local (`localhost`, `127.0.0.1`, `file://`), `?dev=true` continua valendo. Com o painel ligado, o jogo usa um **progresso de teste** separado, que nunca é enviado ao servidor. O painel roda no navegador: quem usa o DevTools ainda consegue mexer nos próprios dados locais, e isso não é protegido; o servidor só aceita conclusões na ordem das fases.
- **Limite de tentativas de PIN:** o teto geral (30 por hora) também permite que alguém bloqueie o login da equipe por até 1 hora errando o PIN de propósito. Use um PIN longo (10 a 12 dígitos).
- **Sessão administrativa não revogável no servidor:** o logout apaga o cookie do navegador, mas um token copiado antes continua válido até expirar (60 minutos).
- **Limites por rede:** uma escola grande atrás do mesmo IP pode atingi-los. O limite no código não impede que a função seja executada na Vercel; barrar antes exige o firewall da Vercel (não configurado).
- O filtro de palavras não é moderação perfeita.
- Outros pontos pendentes da auditoria (publicação de pastas internas, `admin.html` em iframe de outro site) estão em [`docs/seguranca.md`](docs/seguranca.md).
- O progresso feito sem jogador identificado (ex.: `fase1.html` aberta direto, sem passar pelo JOGAR) vale só enquanto a página estiver aberta.

### Acessibilidade

- **Implementado:** feedback imediato de acerto e erro; informação nunca só por cor (ícone e número); tela de identificação com rótulo, foco visível e mensagens anunciadas; layouts responsivos; teclado parcial.
- **Não implementado:** instruções por áudio, configurações de contraste e tamanho de fonte, teclado completo, testes em dispositivos reais e com leitor de tela.

---

## 6. Configuração e execução

**Pré-requisitos:** Node.js 20.6 ou mais novo (testado com Node 24; não há `package.json` nem `npm install`), um navegador atual e um projeto Supabase com a tabela `players` e, para salvar o progresso no banco, a tabela `phase_completions` (migração em `supabase/migrations/`, aplicada pela equipe; ver [`docs/progresso-supabase.md`](docs/progresso-supabase.md)).

**Variáveis de ambiente** (modelo, só com nomes, em `.env.example`):

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | Endereço `https` do projeto. Obrigatória para a identificação |
| `SUPABASE_SECRET_KEY` | Chave **secreta** (`sb_secret_...`). Obrigatória; só no servidor |
| `PLAYER_SESSION_SECRET` | Texto aleatório (32+ caracteres), **diferente** do `ADMIN_SESSION_SECRET`, que assina a sessão do jogador. Sem ela, o progresso fica só no navegador |
| `PORTA`, `HOST` | Opcionais (padrão 3000 e 127.0.0.1) |
| `ADMIN_PIN_HASH` | Hash do PIN administrativo (gerado por `node scripts/gerar-hash-pin.js`). Necessária para o login e para o painel DEV no site publicado |
| `ADMIN_SESSION_SECRET` | Texto aleatório (32+ caracteres) que assina a sessão administrativa. Trocá-lo encerra todas as sessões |
| `ADMIN_ALLOWED_ORIGINS` | Origens de onde o login é aceito, separadas por vírgula (ex.: `https://seu-jogo.vercel.app`; no servidor local, `http://localhost:3000`) |

**Executar localmente:** copie `.env.example` para `.env.local`, preencha e rode na raiz do projeto:

```text
node --env-file=.env.local scripts/servidor-local.js    → http://localhost:3000
```

- ⚠️ Com o `.env.local` configurado, o servidor local grava no banco **real** do Supabase indicado nele (jogadores e, com `PLAYER_SESSION_SECRET`, fases concluídas).
- Sem as variáveis, a identificação mostra "Não conseguimos conectar agora". Abrir o `index.html` direto no navegador também não passa dessa tela: é preciso o servidor.
- **JOGAR** leva à identificação e **não apaga progresso**: depois do apelido, o menu mostra o progresso daquele jogador (navegador + banco). `index.html?view=mundos` abre o menu direto; se a aba ainda não tem jogador identificado, pede o apelido antes.
- **Recomeçar um teste:** use um apelido novo ou o painel DEV (o "Resetar Progresso" zera só o progresso de teste). Nada no jogo apaga dados do banco; ver [`docs/progresso-supabase.md`](docs/progresso-supabase.md), seção 5.
- **Modo DEV:** em ambiente local, `?dev=true` abre um painel flutuante, com atalhos Shift+C (completar etapa), Shift+N (próxima fase), Shift+R (resetar o progresso de teste) e Shift+D (desbloquear tudo no progresso de teste); `?dev=false` desliga. No site publicado, entre por `/admin.html` com o código e o PIN; depois disso o painel aparece no jogo, e "Sair" (ou `dev.desativar()`) encerra a sessão.

---

## 7. Testes

```text
node --test        → testes automatizados (pasta testes/)
```

Cobrem as regras do apelido, o PIN e a sessão administrativa, o login administrativo (`api/admin/*`), quem pode ligar o painel DEV (o `js/dev.js` real numa sandbox), o servidor local, os endpoints de jogadores e de progresso **com um Supabase simulado** (sessão do jogador, sessões revogadas ou vencidas, ordem das fases, duplicidade, jogadores separados, limite de requisições, tentativas repetidas de PIN, CORS, falhas do banco), as regras das 13 fases, as regras de segurança no texto das migrações SQL (RLS, permissões, funções) e, numa sandbox com os scripts reais do navegador, a sincronização do progresso (troca de jogador, falta de conexão, dados locais inválidos, modo DEV, iframe) e o botão JOGAR. Não usam credenciais nem rede. Não há testes de interface versionados no repositório; o comportamento visual e de interação é verificado à parte (manualmente ou com scripts avulsos).

### O que cada nível de verificação garante

Ao relatar uma verificação, diga qual destes níveis foi feito. Um nível não vale pelo outro.

| Nível | O que é | Situação |
|---|---|---|
| **Teste simulado** | `node --test`, com Supabase de mentira | Existe e é executável a qualquer momento |
| **Teste local** | Servidor local + navegador (fluxo de identificação, fases, Mundo 5, painel DEV, progresso com Supabase simulado) | Verificado em execuções avulsas durante o desenvolvimento, com scripts que não estão no repositório. Não há teste de interface versionado |
| **Integração real (Supabase)** | O backend gravando e lendo no banco de verdade | **Parcial:** só a criação de jogador novo foi validada. Detalhes na tabela abaixo |
| **Deploy verificado (Vercel)** | Endpoints funcionando no ambiente publicado | **Nenhum.** Não há deploy verificado até hoje (ver seção 8) |

**Integração real com o Supabase: o que já foi validado**

| Verificação | Situação | Base |
|---|---|---|
| Criação de jogador novo | **Validada** | Relato da equipe: o jogo criou jogadores diferentes no banco real, e a tabela tinha registros com avatar `'padrao'` gravados pelo app |
| Recuperação de jogador existente (mesmo apelido ou equivalente) | **Sem validação registrada** | O episódio de dois registros parecidos investigado pela equipe era de apelidos digitados diferentes por engano; não testou a recuperação |
| Funcionamento depois da retirada das permissões de `anon`/`authenticated` e das novas restrições (`CHECK`, avatar padrão) | **Sem validação registrada** | Os comandos SQL foram executados com sucesso no painel, mas não há registro de criar e recuperar jogador depois deles |
| Requisições simultâneas do mesmo apelido no banco real | **Sem validação registrada** | Coberto só por teste simulado |
| Progresso no banco (`phase_completions`, sessão do jogador) | **Parcial** | Migração aplicada e permissões conferidas no banco real (resultado informado pela equipe em 21/10/2026). Gravar e ler progresso pelo jogo ainda não foi validado no banco real. Roteiro em [`docs/progresso-supabase.md`](docs/progresso-supabase.md) |
| Limite de requisições e revogação de sessões | **Parcial** | No banco real (resultado informado pela equipe em 21/10/2026): RLS ligado nas três tabelas, permissões exatamente as esperadas, `service_role` com `BYPASSRLS` e as duas funções executadas como `service_role` sem erro (teste com `rollback`). Ainda falta pelo servidor e pela API: 429, revogação e sessões no Preview. Roteiro em [`docs/seguranca.md`](docs/seguranca.md) |
| Esquema, restrições, RLS e permissões do banco | **Configuração informada pela equipe** | Resultados de consultas e comandos SQL informados pela equipe; não é verificável a partir do repositório |

Configuração informada pela equipe (esquema do banco, variáveis na Vercel) não substitui a validação da integração nem do deploy.

`scratch/` guarda duas páginas de teste manual. `test_menu_boss.html` funciona. ⚠️ `test_boss_fluxo.html` entra em loop por estar desatualizado: o Mundo 5 funciona pelo fluxo real do jogo.

---

## 8. Deploy

O projeto está pensado para a **Vercel**: a raiz como site estático e `api/` como funções. Não há `vercel.json` nem `package.json`.

- Informado pela equipe: `SUPABASE_URL` e `SUPABASE_SECRET_KEY` estão configuradas na Vercel, com a chave secreta (e não a publicável).
- ⚠️ `ADMIN_PIN_HASH`, `ADMIN_SESSION_SECRET` e `ADMIN_ALLOWED_ORIGINS` ainda precisam ser configuradas na Vercel. Sem elas, o login administrativo responde "indisponível" e o painel DEV não abre no site publicado.
- As duas migrações já foram aplicadas no banco real (informado pela equipe em 21/10/2026), condição para o login administrativo funcionar (o limite de tentativas falha fechado).
- ⚠️ `PLAYER_SESSION_SECRET` ainda precisa ser configurada na Vercel, com um valor por ambiente. Sem ela, o progresso fica só no navegador.
- ⚠️ **A confirmar** (nenhum deploy foi verificado; não é possível verificar a partir do repositório): projeto e URL, branch de produção, se o deploy é automático pelo GitHub, e o funcionamento real dos endpoints na Vercel (inclusive a leitura do corpo da requisição).
- Sem `.vercelignore`, pastas como `testes/`, `scripts/` e `supabase/` também seriam publicadas como arquivos estáticos. Não contêm segredos.

---

## 9. Contribuição

- Branches existentes: `main` e `Teste`. ⚠️ O fluxo entre elas (revisão, merge) está a confirmar.
- **Commit e push são feitos por pessoas da equipe**, depois de revisão. Essa é uma regra operacional do projeto, não uma exigência da faculdade. Agentes de IA seguem o [`AGENTS.md`](AGENTS.md).
- Antes de commitar: `node --check` nos JS alterados, `node --test`, `git diff --check` e conferir que nenhum valor secreto entrou, inclusive em `.env.example`.
- Tipos de tarefa: Correção, Melhoria, Feature, UX/UI e Arquitetura.
- **Pontos acoplados ao acrescentar um mundo ou fase:** além do arquivo em `js/mundos/` e das tags `<script>` em `index.html` e `fase1.html`, hoje o card do carrossel está escrito à mão no `index.html`, a lista de classes `mundo-N` está em `js/main.js`, a escala da barra de progresso está fixa em `js/menu.js`, o catálogo de fases está em `js/regras-progresso.js` (um teste confere se bate com `js/mundos/`) e a restrição `CHECK` de `phase_completions` exige uma nova migração.

---

## 10. Pendências

Não são obrigações imediatas; cada incremento deve ser avaliado antes de começar.

- Validar as habilidades da BNCC com o material oficial.
- Decidir a licença (não há arquivo `LICENSE`) e os créditos oficiais.
- Definir o fluxo de branches e a configuração da Vercel (itens da seção 8).
- Configurar `PLAYER_SESSION_SECRET` na Vercel e validar progresso, limite e revogação no Preview (as migrações já foram aplicadas) (roteiros em [`docs/progresso-supabase.md`](docs/progresso-supabase.md) e [`docs/seguranca.md`](docs/seguranca.md)). Reavaliar o risco de entrar só com o apelido agora que o progresso vai para o banco.
- Definir o Cruzeiro HUB: como será a integração via iframe (e se a identidade do jogador virá do HUB).
- Configurar as variáveis administrativas na Vercel e validar o login e o painel DEV no site publicado; decidir se a sessão administrativa precisa de revogação no servidor; avaliar uma regra opcional no firewall da Vercel e o cabeçalho `frame-ancestors` para `admin.html`.
- Versionar o esquema de `players` numa migração revisada pela equipe. Criar `.vercelignore` e limitar requisições à API.
- Confirmar se a arte do Mundo 5 é a definitiva (o comentário no topo de `js/mundos/mundo5.js` ainda diz "provisório" e está desatualizado).
- Teclado completo, configurações de acessibilidade, instruções por áudio e testes em dispositivos reais.
- Corrigir ou remover `scratch/test_boss_fluxo.html`.

---

## 11. Créditos e licença

O jogo tem uma tela de créditos própria. A licença do código **ainda não foi definida**.
