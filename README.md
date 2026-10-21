# Arruma a Bagunça

Jogo educativo digital desenvolvido para a disciplina **Análise e Projeto de Sistemas II**. Ensina Matemática de forma lúdica, visual e interativa a crianças de **7 a 10 anos** (aproximadamente do 2º ao 5º ano da rede pública municipal de São Paulo).

> **Como ler este documento:** ele descreve o produto, as decisões da equipe e o estado verificável do projeto. As regras para agentes de IA ficam em [`AGENTS.md`](AGENTS.md). O que o código já mostra por si só (objetos de cada fase, textos, estilos) não é repetido aqui.

---

## 1. Visão geral

A criança encontra objetos misturados em um cenário bagunçado e os organiza em cestas, por categoria. As quantidades organizadas alimentam um desafio matemático ligado à atividade, em vez de uma lista solta de exercícios. Cada mundo trabalha uma operação; a fase bônus é um desafio final contra o "Monstro da Bagunça".

O jogo roda no navegador (HTML, CSS e JavaScript puros, sem frameworks). Um pequeno backend em Node (`api/`) registra o apelido do jogador no Supabase.

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
| Progresso e fases concluídas | Implementado, **só local** (navegador) |
| Progresso por jogador no banco | Planejado: sem decisão de onde e como |
| Instruções com suporte a áudio | Não implementado |
| Configurações de acessibilidade | Não implementado. O botão "Configurações" do menu é um espaço reservado, sem função |
| Suporte a teclado | Parcial (ver seção 3) |
| Dispositivos móveis | Parcial: layouts responsivos, sem teste registrado em aparelhos reais |
| Pontuação e conquistas | Não implementado |
| Login administrativo e restrição do painel DEV | Planejado: as funções de PIN e sessão existem em `api/_lib/`, mas nenhum endpoint as usa |
| Integração com o Cruzeiro HUB via iframe | Planejado: sem código |

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

- **Progressão:** concluir uma fase libera a próxima; concluir a última libera o próximo mundo. O Mundo 5 aparece como um painel lateral do Boss no menu de mundos, depois de concluir o Mundo 4.
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
Supabase / PostgreSQL (tabela players)
```

| Camada | Responsabilidade | Não faz |
|---|---|---|
| Navegador | Interface, jogo, progresso local | Não decide se um apelido é válido; não conhece nenhuma chave |
| Backend (`api/`) | Validação oficial, normalização e filtro do apelido; acesso ao banco | Não guarda estado entre chamadas |
| Banco | Unicidade do apelido normalizado, formato obrigatório, RLS | Não é acessível pelo navegador |

**Principais peças** (o código é a referência; aqui só as responsabilidades):

- `index.html`: tela inicial, identificação, menu de mundos e o iframe onde a fase roda. `fase1.html`: tela de jogo genérica, usada por todos os mundos.
- `js/mundos/`: um arquivo declarativo por mundo, que se registra em `window.MUNDOS`.
- `js/game.js` (organização), `js/math.js` (desafio) e `js/operacoes.js` (regras das operações): o motor compartilhado.
- `js/main.js`: resolve `?mundo=X&fase=Y` e inicia a fase.
- `js/progresso.js`: progresso local. `js/audio.js`: trilha e volume. `js/jogador.js`: tela de identificação. `js/menu.js`: navegação do menu. `js/dev.js`: ferramentas de desenvolvimento.
- `api/jogadores/`: endpoints. `api/_lib/`: funções compartilhadas (não viram rotas).
- `scripts/servidor-local.js`: servidor de desenvolvimento. `testes/`: testes automatizados.

**Menu ↔ fase:** a fase roda em um iframe da página do menu, para a trilha sonora não cortar. A fase avisa o menu com `postMessage` (`arruma-bagunca:navegacao`).

### Onde cada dado fica

| Dado | Onde | Duração |
|---|---|---|
| Progresso (mundos e fases) | `localStorage`, chave `arruma_bagunca_progresso` | Apagado de propósito a cada JOGAR |
| Volume | `localStorage`, chave `arruma_bagunca_volume` | Até limpar o navegador |
| Jogador identificado (só para exibição) | `sessionStorage`, chave `arruma_bagunca_jogador` | A aba |
| Estado da trilha e modo DEV | `sessionStorage` | A aba |
| Jogadores (apelido e avatar) | Supabase, tabela `players` | Permanente |

### API

Não há autenticação nos endpoints de jogador ([Decisão da equipe]: entrar no perfil exige só o apelido).

| Endpoint | Função | Entrada | Sucesso |
|---|---|---|---|
| `POST /api/jogadores/verificar` | Consulta, sem gravar | `{ "apelido" }` | `200 { existe: true, jogador }` ou `200 { existe: false, apelido }` |
| `POST /api/jogadores` | Cria ou recupera | `{ "apelido" }` (qualquer `avatar` enviado é ignorado) | `201 { criado: true, jogador }` ou `200 { criado: false, jogador }` |

`jogador` = `{ id, apelido, avatar }`. Erros têm o formato `{ erro, mensagem }`, com mensagens pensadas para crianças:

| Código | `erro` | Quando |
|---|---|---|
| 400 | `REQUISICAO_INVALIDA` | JSON malformado ou sem o campo `apelido` |
| 405 | `METODO_NAO_PERMITIDO` | Método diferente de POST |
| 413 | `CORPO_GRANDE_DEMAIS` | Corpo maior que o limite |
| 415 | `TIPO_NAO_SUPORTADO` | Conteúdo que não é JSON |
| 422 | `APELIDO_INVALIDO` (com `motivo`: `VAZIO`, `TAMANHO`, `CARACTERES` ou `NUMEROS`) | Formato fora da regra |
| 422 | `APELIDO_NAO_PERMITIDO` (sem motivo) | Palavra bloqueada ou nome reservado |
| 500 | `ERRO_INTERNO` | Falha inesperada |
| 503 | `SERVICO_INDISPONIVEL` | Banco ou configuração indisponíveis |

O servidor local também responde `404 NAO_ENCONTRADO` para rotas inexistentes.

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

RLS ligado, sem políticas, e permissões de `anon` e `authenticated` removidas: só o backend, com a chave secreta, grava e lê. ⚠️ O esquema foi criado direto no painel e **não está versionado neste repositório**; a fonte de verdade é o banco. Uma migração SQL revisada pela equipe é uma tarefa futura: até lá, ninguém cria nem executa migrações a partir do repositório.

---

## 5. Segurança, acessibilidade e LGPD

### Dados e privacidade

- **Dado de perfil solicitado à criança:** apenas o apelido, na grafia digitada. A tela orienta a não usar o nome completo e o servidor recusa sequências de 5 ou mais números.
- **Gerado pelo sistema a partir do apelido:** o apelido normalizado (sem acentos, em minúsculas e sem espaços), usado só para reconhecer apelidos equivalentes, e o avatar padrão, fixo (a criança não escolhe).
- **Identificação técnica e datas mantidas no banco:** um identificador aleatório (`id`) e as datas de criação e de atualização do registro.
- Não se coleta nome real, e-mail, documentos, fotos nem localização, e a tabela não tem campo para IP. No navegador, o apelido, o avatar e o identificador ficam só no `sessionStorage` da aba, para exibição.
- Os logs do backend registram status e códigos de erro, não apelidos nem chaves.
- A chave secreta do Supabase existe só como variável de ambiente do servidor e da Vercel. O servidor recusa a chave publicável. `.env.local` é ignorado pelo git.

### Limitações conhecidas

- **Entrar só com o apelido** ([Decisão da equipe], risco aceito): quem souber o apelido de outra criança entra no perfil dela. Hoje o perfil só guarda apelido e avatar; isso deve ser reavaliado quando o progresso for para o banco.
- **Modo DEV por URL (vulnerabilidade conhecida, correção pendente):** `?dev=true` ativa o painel de desenvolvimento em **qualquer ambiente, inclusive no site publicado**, e libera todos os mundos e fases. A restrição de acesso no ambiente publicado ainda não foi implementada. O painel só altera dados locais do navegador.
- O filtro de palavras não é moderação perfeita. Não há limite de requisições na API.
- Concluir a última fase do Mundo 5 grava no progresso um "Mundo 6" que não existe (sem efeito visível).

### Acessibilidade

- **Implementado:** feedback imediato de acerto e erro; informação nunca só por cor (ícone e número); tela de identificação com rótulo, foco visível e mensagens anunciadas; layouts responsivos; teclado parcial.
- **Não implementado:** instruções por áudio, configurações de contraste e tamanho de fonte, teclado completo, testes em dispositivos reais e com leitor de tela.

---

## 6. Configuração e execução

**Pré-requisitos:** Node.js 20.6 ou mais novo (testado com Node 24; não há `package.json` nem `npm install`), um navegador atual e um projeto Supabase com a tabela `players`.

**Variáveis de ambiente** (modelo, só com nomes, em `.env.example`):

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | Endereço `https` do projeto. Obrigatória para a identificação |
| `SUPABASE_SECRET_KEY` | Chave **secreta** (`sb_secret_...`). Obrigatória; só no servidor |
| `PORTA`, `HOST` | Opcionais (padrão 3000 e 127.0.0.1) |
| `ADMIN_SESSION_SECRET` | Reservada para o login administrativo; ainda não usada |

**Executar localmente:** copie `.env.example` para `.env.local`, preencha e rode na raiz do projeto:

```text
node --env-file=.env.local scripts/servidor-local.js    → http://localhost:3000
```

- ⚠️ Com o `.env.local` configurado, o servidor local grava no banco **real** do Supabase indicado nele.
- Sem as variáveis, a identificação mostra "Não conseguimos conectar agora". Abrir o `index.html` direto no navegador também não passa dessa tela: é preciso o servidor.
- **JOGAR** apaga o progresso local a cada clique ([Decisão da equipe], intencional nesta versão). `index.html?view=mundos` abre o menu direto e **não** apaga o progresso; se a aba ainda não tem jogador identificado, pede o apelido antes.
- **Modo DEV:** `?dev=true` abre um painel flutuante, com atalhos Shift+C (completar etapa), Shift+N (próxima fase), Shift+R (resetar progresso) e Shift+D (desbloquear tudo). `?dev=false` desliga.

---

## 7. Testes

```text
node --test        → testes automatizados (pasta testes/)
```

Cobrem as regras do apelido, o PIN e a sessão administrativa, o servidor local e os endpoints de jogadores **com um Supabase simulado**: não usam credenciais nem rede. Não há testes de interface versionados no repositório; o comportamento visual e de interação é verificado à parte (manualmente ou com scripts avulsos).

### O que cada nível de verificação garante

Ao relatar uma verificação, diga qual destes níveis foi feito. Um nível não vale pelo outro.

| Nível | O que é | Situação |
|---|---|---|
| **Teste simulado** | `node --test`, com Supabase de mentira | Existe e é executável a qualquer momento |
| **Teste local** | Servidor local + navegador (fluxo de identificação, fases, Mundo 5, painel DEV) | Verificado em execuções avulsas durante o desenvolvimento, com scripts que não estão no repositório. Não há teste de interface versionado |
| **Integração real (Supabase)** | O backend gravando e lendo no banco de verdade | **Parcial:** só a criação de jogador novo foi validada. Detalhes na tabela abaixo |
| **Deploy verificado (Vercel)** | Endpoints funcionando no ambiente publicado | **Nenhum.** Não há deploy verificado até hoje (ver seção 8) |

**Integração real com o Supabase: o que já foi validado**

| Verificação | Situação | Base |
|---|---|---|
| Criação de jogador novo | **Validada** | Relato da equipe: o jogo criou jogadores diferentes no banco real, e a tabela tinha registros com avatar `'padrao'` gravados pelo app |
| Recuperação de jogador existente (mesmo apelido ou equivalente) | **Sem validação registrada** | O episódio de dois registros parecidos investigado pela equipe era de apelidos digitados diferentes por engano; não testou a recuperação |
| Funcionamento depois da retirada das permissões de `anon`/`authenticated` e das novas restrições (`CHECK`, avatar padrão) | **Sem validação registrada** | Os comandos SQL foram executados com sucesso no painel, mas não há registro de criar e recuperar jogador depois deles |
| Requisições simultâneas do mesmo apelido no banco real | **Sem validação registrada** | Coberto só por teste simulado |
| Esquema, restrições, RLS e permissões do banco | **Configuração informada pela equipe** | Resultados de consultas e comandos SQL informados pela equipe; não é verificável a partir do repositório |

Configuração informada pela equipe (esquema do banco, variáveis na Vercel) não substitui a validação da integração nem do deploy.

`scratch/` guarda duas páginas de teste manual. `test_menu_boss.html` funciona. ⚠️ `test_boss_fluxo.html` entra em loop por estar desatualizado: o Mundo 5 funciona pelo fluxo real do jogo.

---

## 8. Deploy

O projeto está pensado para a **Vercel**: a raiz como site estático e `api/` como funções. Não há `vercel.json` nem `package.json`.

- Informado pela equipe: `SUPABASE_URL` e `SUPABASE_SECRET_KEY` estão configuradas na Vercel, com a chave secreta (e não a publicável).
- ⚠️ **A confirmar** (nenhum deploy foi verificado; não é possível verificar a partir do repositório): projeto e URL, branch de produção, se o deploy é automático pelo GitHub, e o funcionamento real dos endpoints na Vercel (inclusive a leitura do corpo da requisição).
- Sem `.vercelignore`, pastas como `testes/` e `scripts/` também seriam publicadas como arquivos estáticos. Não contêm segredos.

---

## 9. Contribuição

- Branches existentes: `main` e `Teste`. ⚠️ O fluxo entre elas (revisão, merge) está a confirmar.
- **Commit e push são feitos por pessoas da equipe**, depois de revisão. Essa é uma regra operacional do projeto, não uma exigência da faculdade. Agentes de IA seguem o [`AGENTS.md`](AGENTS.md).
- Antes de commitar: `node --check` nos JS alterados, `node --test`, `git diff --check` e conferir que nenhum valor secreto entrou, inclusive em `.env.example`.
- Tipos de tarefa: Correção, Melhoria, Feature, UX/UI e Arquitetura.
- **Pontos acoplados ao acrescentar um mundo:** além do arquivo em `js/mundos/` e das tags `<script>` em `index.html` e `fase1.html`, hoje o card do carrossel está escrito à mão no `index.html`, a lista de classes `mundo-N` está em `js/main.js` e a escala da barra de progresso está fixa em `js/menu.js`.

---

## 10. Pendências

Não são obrigações imediatas; cada incremento deve ser avaliado antes de começar.

- Validar as habilidades da BNCC com o material oficial.
- Decidir a licença (não há arquivo `LICENSE`) e os créditos oficiais.
- Definir o fluxo de branches e a configuração da Vercel (itens da seção 8).
- Decidir onde e como persistir o progresso por jogador (o comentário em `js/progresso.js` cita um "backend do Cruzeiro HUB", sem relação com a escolha do Supabase). Isso exigirá alterar `progresso.js` e o comportamento do JOGAR.
- Definir o Cruzeiro HUB: como será a integração via iframe.
- **Restringir o acesso ao painel `?dev=true` no ambiente publicado** (vulnerabilidade conhecida, ainda não corrigida) e implementar o login administrativo.
- Migração SQL do banco, revisada pela equipe (tarefa futura). Criar `.vercelignore` e limitar requisições à API.
- Confirmar se a arte do Mundo 5 é a definitiva (o comentário no topo de `js/mundos/mundo5.js` ainda diz "provisório" e está desatualizado).
- Teclado completo, configurações de acessibilidade, instruções por áudio e testes em dispositivos reais.
- Corrigir ou remover `scratch/test_boss_fluxo.html`; atualizar os comentários desatualizados de `js/progresso.js` (fala em `sessionStorage`).

---

## 11. Créditos e licença

O jogo tem uma tela de créditos própria. A licença do código **ainda não foi definida**.
