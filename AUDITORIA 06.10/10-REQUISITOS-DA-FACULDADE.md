# 10 — Auditoria dos Requisitos da Faculdade

Comparação entre o estado atual do código/documentação do projeto "Arruma a Bagunça" e os requisitos da disciplina **Análise e Projeto de Sistemas II**. Nenhum arquivo do jogo, da documentação ou dos relatórios anteriores foi alterado. Nenhum commit ou push foi realizado.

## 1. Objetivo e metodologia

O objetivo desta tarefa é verificar aderência aos requisitos oficiais da faculdade. Antes de qualquer verificação, é preciso registrar uma limitação estrutural que afeta TODO o restante deste relatório:

> **O material oficial da faculdade não está neste repositório.** O próprio `AGENTS.md` do projeto já declara isso explicitamente, na seção "Fonte de contexto e fonte de verdade":
> *"1. Requisito da faculdade — vem do material oficial fornecido pela disciplina. Esse material não está neste repositório; não presuma seu conteúdo."*

Isso significa que esta auditoria **não tem acesso ao enunciado original da disciplina**. O que existe no projeto são dois documentos escritos pela própria equipe (`README.md` e `AGENTS.md`), que **relatam**, com graus de certeza diferentes, o que a equipe entende que a faculdade exige. Em apenas dois pontos específicos o `README.md` marca explicitamente um requisito como `[Requisito oficial]`; todo o restante da lista de "requisitos previstos" não traz essa marcação individual, e por isso é tratado neste relatório com a cautela que o próprio `AGENTS.md` pede: diferenciando requisito da faculdade, decisão da equipe e recomendação técnica, sem presumir a origem de algo que não está explicitamente rotulado.

**Metodologia**:
1. Busca exaustiva, em todo o repositório, por qualquer material oficial da faculdade (PDF, documento de requisitos, enunciado) — nenhum foi encontrado além de `README.md` e `AGENTS.md`.
2. Extração de TODAS as marcações `[Requisito oficial]` e `[Decisão da equipe]` presentes no `README.md` (são apenas 4 no total, listadas na seção 2).
3. Cruzamento de cada ponto candidato a requisito com evidência real do projeto: código-fonte, execução registrada nas Tarefas 01–09 desta auditoria (quando relevante), e inspeção direta nesta tarefa quando necessário.
4. Classificação de cada item como **Atendido**, **Parcialmente atendido**, **Não atendido** ou **Não foi possível verificar** — esta última categoria usada sempre que a ausência do material oficial impede uma conclusão segura, em vez de presumir uma resposta.

---

## 2. Materiais oficiais consultados

| Documento | Natureza | O que diz sobre si mesmo |
|---|---|---|
| `README.md` | Documentação de produto, escrita pela equipe | Nenhuma declaração própria sobre sua autoridade; contém 2 trechos marcados como `[Requisito oficial]` (linhas 43 e 73) e 2 marcados como `[Decisão da equipe]` (linhas 75 e 81) |
| `AGENTS.md` | Instruções de processo para agentes/IA que trabalham no repositório | Declara explicitamente, na própria abertura: *"não é documentação de produto (isso vive no README.md)"*, e que o material oficial da faculdade *"não está neste repositório; não presuma seu conteúdo"* |

**Nenhum outro material** (PDF, enunciado, rubrica de avaliação, documento de backlog/Scrum) foi encontrado em nenhuma pasta do repositório, incluindo fora do controle de versão do Git (busca por extensão de arquivo em todo o diretório do projeto).

Os 4 trechos explicitamente marcados no `README.md`:

1. **[Requisito oficial]**, linha 43: *"A definição das habilidades da BNCC deve seguir os materiais oficiais fornecidos pela faculdade. Não devem ser criadas ou alteradas habilidades sem validação da equipe."*
2. **[Requisito oficial]**, linha 73: *"A existência de um mundo/fase bônus é obrigatória, conforme os requisitos da faculdade."*
3. **[Decisão da equipe]**, linha 75: a estrutura de 4 mundos principais + 1 bônus, com o conteúdo específico de cada um, e a observação de que o cenário/arte do Mundo 5 ainda são provisórios.
4. **[Decisão da equipe]**, linha 81: reafirma a estrutura de 4+1 mundos como decisão da equipe, apontando que a obrigatoriedade do mundo bônus em si é que vem da faculdade (reforça o item 2).

Todo o restante do conteúdo do `README.md` — incluindo a lista inteira da seção "Requisitos previstos para o produto completo" (linhas 45-71) — **não traz uma marcação individual de origem**. Por isso, cada item dessa lista é tratado abaixo como "requisito previsto pela documentação do projeto", sem presumir se é exigência da faculdade ou elaboração própria da equipe, exceto os dois pontos que já têm a marcação explícita.

---

## 3. Tabela de conformidade dos requisitos

Legenda de origem: 🏫 = trecho com marcação explícita `[Requisito oficial]`; 📄 = item da lista "Requisitos previstos", sem marcação individual de origem (tratar com cautela); 👥 = `[Decisão da equipe]` explícita; ❓= não documentado em nenhum material disponível no projeto.

| # | Requisito | Origem | Status | Fonte | Evidência | Lacuna/risco |
|---|---|---|---|---|---|---|
| 1 | Disciplina/tema educacional: jogo de Matemática | 📄 (README linha 3, 13) | Atendido | `README.md:3,13` | Todo o motor de jogo (`math.js`, `operacoes.js`) e os 5 mundos giram em torno de operações matemáticas — confirmado por execução real na Tarefa 08 (18/18 contas corretas) | Não há como confirmar se "Matemática" foi uma escolha livre da equipe ou um tema fixado pela disciplina — o material que definiria isso não está no repositório |
| 2 | Habilidade BNCC EF02MA06/EF03MA06 | 🏫 (processo de definição) + 📄 (habilidade em si) | Parcialmente atendido | `README.md:39`; Tarefa 08 completa | A habilidade está declarada e as mecânicas exercitam "operações com números naturais" de fato (Tarefa 08). Aderência é **direta** no Mundo 1, **parcial** nos Mundos 2–4, e **pendente de confirmação** no Mundo 5 (conteúdo de precedência de operadores pode exceder o ano escolar da habilidade citada) | Sem o material oficial da BNCC, não é possível confirmar se a equipe de fato seguiu "os materiais oficiais fornecidos pela faculdade" como o próprio requisito pede — só é possível confirmar que uma habilidade foi declarada e é majoritariamente exercitada na prática |
| 3 | Existência de mundo/fase bônus (obrigatório) | 🏫 | Atendido no nível de implementação; Parcialmente atendido no nível de acesso | `README.md:73`; `js/mundos/mundo5.js`; Tarefas 01, 07, 08 (Mundo 5 jogado e validado de ponta a ponta) | O Mundo 5 existe, está registrado em `window.MUNDOS[5]`, é matematicamente correto (Tarefa 08) e completável (Tarefas 01/07) | O Mundo 5 **não tem card no carrossel do menu** — só é alcançável por URL direta ou painel DEV (confirmado em tarefas anteriores e no próprio README). Se o requisito da faculdade exigir que o mundo bônus seja alcançável pelo fluxo normal do jogador final, isso **não está atendido**; se exigir apenas que ele exista e funcione, está atendido. O material oficial não está disponível para resolver essa ambiguidade |
| 4 | 4 mundos principais com 3 fases cada | 👥 (estrutura) | Atendido | `js/mundos/mundo1.js`–`mundo4.js`; Tarefa 08 | 12 fases reais, todas validadas matematicamente (Tarefa 08) e funcionalmente (Tarefa 01) | Nenhuma — é decisão da equipe, já implementada por completo |
| 5 | Progressão de fases e desbloqueio | 👥/📄 | Parcialmente atendido | `js/progresso.js`; Tarefa 07 completa | Lógica de desbloqueio funciona corretamente fase a fase (Tarefa 07) | 🔴 O botão "JOGAR" apaga todo o progresso salvo fora do Modo DEV (Tarefa 07, DP-01) — risco direto à persistência que a progressão depende |
| 6 | Menu inicial | 📄 | Atendido | `index.html`; Tarefa 01, 03 | Tela inicial, créditos e seleção de mundos funcionam | Nenhuma relevante |
| 7 | Instruções com suporte a áudio | 📄 | Não atendido (já documentado pela equipe) | `README.md:51` | Confirmado: não há narração em nenhuma tela (Tarefa 05, Tarefa 09) | Já é uma lacuna conhecida e documentada pela própria equipe, não uma descoberta nova |
| 8 | Trilha sonora de fundo com controle de ligar/desligar | 👥 (README chama de "já implementada") | Parcialmente atendido — a UI existe, a função real não funciona | `js/audio.js`; Tarefa 05, achado AA-01 | Controle de som funciona (alterna estado), mas a música nunca é ouvida: o arquivo referenciado (`everything-in-place.mp3`) foi renomeado para `Menu Principal.mp3` em 2 commits e a referência no código nunca foi atualizada (confirmado por hash MD5, Tarefa 05) | Divergência entre o que o README afirma ("já implementada") e o comportamento real — risco de ser avaliado como "funcionando" sem verificação prática |
| 9 | Acessibilidade geral (contraste, feedback, cores) | 📄 | Atendido na amostra verificada | Tarefa 09 completa | Contraste calculado ≥ AA em todos os pares verificados; feedback com `aria-live`; nenhuma dependência exclusiva de cor | Amostra, não 100% das combinações de cor do projeto |
| 10 | Configurações de acessibilidade (contraste, tamanho de fonte) | 📄 (documentado como "não implementado") | Não atendido (já documentado pela equipe) | `README.md:53,379`; Tarefa 03, 09 | Botão "Configurações" existe visualmente, mas não tem nenhuma função (confirmado em 2 tarefas) | Já é uma lacuna conhecida; adicionalmente, a Tarefa 09 encontrou problemas de acessibilidade NÃO documentados (foco invisível no menu, `aria-valuenow` desatualizado, modais sem armadilha de foco) que vão além da simples ausência de configurações |
| 11 | Seleção de avatar/apelido | 📄 (documentado como "não implementado") | Não atendido (já documentado pela equipe) | `README.md:55,245`; Tarefa 03 | Interface mostra um avatar/nome fixo ("👤 Jogador"), não editável | Já é uma lacuna conhecida pela equipe |
| 12 | Persistência básica de progresso | 📄 | Parcialmente atendido | `js/progresso.js`; Tarefa 07 completa | Persistência funciona corretamente entre reload, nova aba e navegação interna (Tarefa 07) | 🔴 Apagada incondicionalmente ao clicar em "JOGAR" fora do Modo DEV (Tarefa 07, DP-01) — o próprio código do Modo DEV já contorna isso, indício de que não é comportamento desejado |
| 13 | Registro de fases concluídas | 📄 | Atendido, com ressalva de robustez | `js/progresso.js`; Tarefa 07 | Grava corretamente, sem duplicar, sobrevive a reload/nova sessão | Frágil a dados corrompidos/parciais (Tarefa 07, DP-03/DP-04) — não reproduzido em uso normal, mas confirmado sob corrupção de dados |
| 14 | Pontuação/conquistas | 📄 (documentado como "não implementado") | Não atendido (já documentado pela equipe) | `README.md:63,249`; Tarefa 07 | Busca exaustiva confirma zero implementação de pontuação, estrelas, conquistas ou recordes | Já é uma lacuna conhecida; não é possível confirmar se isso é um requisito obrigatório da faculdade ou um item que a equipe se propôs a fazer por conta própria — não está marcado `[Requisito oficial]` |
| 15 | Adequação das mecânicas ao público de 7–10 anos | 📄/AGENTS.md | Atendido substancialmente, com ressalvas pedagógicas | Tarefas 08, 09 | Linguagem simples, feedback imediato, erro sem punição (item retorna sem penalidade), contraste adequado | Tarefa 08 registrou 3 observações pedagógicas (enunciado de subtração, ausência de conceito de agrupamento em ×/÷, Mundo 5 sem exercitar a precedência de fato) — nenhuma delas invalida a adequação geral, mas são pontos de melhoria |
| 16 | Suporte a teclado | 📄 (documentado como "parcial") | Parcialmente atendido — mais avançado na prática do que a documentação sugere | `game.js`; Tarefa 09 completa | Uma fase inteira (organização + matemática) foi completada de ponta a ponta usando só teclado (Tab/Enter), confirmado por execução real na Tarefa 09 | Falta mover itens livremente pelo teclado (já documentado como pendência); adicionalmente, o foco do teclado é **invisível em todo o menu** (Tarefa 09, AC-01) — um problema não documentado pela equipe |
| 17 | Suporte a dispositivos móveis / responsividade | 📄 (documentado como "parcial") | Parcialmente atendido | `style-fase1.css`, `style-menu.css`; Tarefa 02 completa | Layout responsivo implementado e funcional na maior parte dos casos testados (8 viewports + orientação) | Tarefa 02 confirmou 5 achados reais (sobreposição de HUD, corte de conteúdo, botões cortados em paisagem, setas do carrossel desaparecendo) |
| 18 | Integração com o Cruzeiro HUB via iframe | 📄 ("faz parte do projeto e será realizada posteriormente") | Não atendido | `README.md:7,71,251` | Nenhuma referência a "Cruzeiro HUB" ou integração de iframe externo encontrada em nenhum arquivo `.js`/`.html` do projeto | Não é possível confirmar se esta é uma exigência desta entrega específica ou de uma fase posterior do projeto mais amplo — o próprio README a trata como algo "a ser realizado posteriormente", não como pendência da entrega atual |
| 19 | Tecnologias previstas (HTML5, CSS3, JS ES6+, Git, GitHub, Vercel) | 📄 | Atendido | `README.md:319-335`; estrutura real do repositório | Confirmado: projeto é 100% HTML/CSS/JS vanilla, sem build tooling, com histórico Git real e commits de múltiplos autores | Nenhuma — Vercel (deploy) não foi verificável a partir do repositório local, mas não há indício de divergência |
| 20 | Arquitetura documentada corresponde à implementação | 📄 | Atendido | `README.md`, seção de arquitetura; Tarefa 06 completa | A árvore de arquivos e responsabilidades descritas no README correspondem ao código real (confirmado arquivo por arquivo na Tarefa 06) | Pequenas divergências de nomenclatura/comentários desatualizados já listadas na Tarefa 06, sem impacto funcional |
| 21 | Entregas e artefatos exigidos pela disciplina (documentos, apresentações, etc.) | ❓ | Não foi possível verificar | — | Nenhum material no repositório especifica quais artefatos são exigidos para a entrega | Sem o enunciado oficial, não há como confirmar nem negar a existência de uma exigência aqui |
| 22 | Requisitos de Scrum, backlog, histórias de usuário, critérios de aceitação, Definition of Done | ❓ | Não foi possível verificar | — | Busca exaustiva em todo o repositório (`.md`) não encontrou nenhuma menção a Scrum, backlog, user stories, critérios de aceitação ou DoD | Não há evidência de que esses artefatos existam ou sejam exigidos — não é possível concluir se isso representa uma lacuna real ou simplesmente um tipo de artefato fora do escopo desta entrega |

---

## 4. Requisitos não atendidos ou parcialmente atendidos, ordenados por prioridade

1. **🔴 Persistência de progresso quebrada pelo botão JOGAR (item 5/12)** — é o requisito com maior risco direto: a funcionalidade existe e funciona tecnicamente, mas uma ação do fluxo normal do jogador (clicar em JOGAR após já ter progresso) a destrói por completo. Se avaliado sem testar esse caminho específico, pareceria "atendido"; com o teste real feito na Tarefa 07, não é.
2. **🟠 Mundo bônus implementado, mas inacessível pela UI normal (item 3)** — o requisito obrigatório da faculdade (existência do mundo bônus) está tecnicamente satisfeito no nível do motor, mas um avaliador que jogue apenas pela interface normal do menu nunca vai encontrá-lo, por não haver card no carrossel.
3. **🟠 Trilha sonora "já implementada" segundo o README, mas nunca audível na prática (item 8)** — risco de uma funcionalidade ser considerada pronta por estar documentada como tal, sem que a equipe tenha percebido que o arquivo de áudio referenciado não existe mais sob aquele caminho.
4. **🟡 Configurações de acessibilidade e seleção de avatar/apelido ausentes (itens 10, 11)** — já documentadas como pendências pela própria equipe; o risco aqui é apenas de prazo, não de surpresa.
5. **🟡 Pontuação/conquistas ausentes (item 14)** — mesma situação: lacuna já conhecida, risco de prazo.
6. **🟡 Foco de teclado invisível no menu, não documentado pela equipe (item 16)** — um problema real, mas não listado em nenhuma pendência conhecida do README, o que aumenta o risco de passar despercebido até uma avaliação que use navegação por teclado.
7. **🟡 Responsividade com achados reais em casos específicos (item 17)** — já qualificada como "parcial" pela própria equipe; os achados da Tarefa 02 dão contornos concretos ao que falta revisar.
8. **🔵 Integração com Cruzeiro HUB (item 18)** — risco baixo nesta entrega específica, já que o próprio README a trata como etapa futura, mas permanece uma incerteza sem o documento oficial para confirmar o prazo esperado.

---

## 5. Conflitos, ambiguidades e informações que precisam ser confirmadas com o professor

- **Alcance do requisito do mundo bônus**: o `README.md` marca a EXISTÊNCIA do mundo bônus como obrigatória, mas não especifica se ele precisa ser alcançável pela interface normal do jogo. Hoje ele só é alcançável por URL direta ou painel de desenvolvimento. Essa é a ambiguidade de maior risco encontrada nesta auditoria — depende diretamente do texto do material oficial, que não está disponível aqui.
- **Alcance temporal da integração com o Cruzeiro HUB**: o README trata a integração como algo "que será realizada posteriormente" — não há como confirmar se "posteriormente" significa "em uma entrega futura do mesmo semestre" ou "fora do escopo desta disciplina".
- **Origem exata dos itens da lista "Requisitos previstos para o produto completo"**: apenas 2 dos itens dessa lista (BNCC e mundo bônus) têm marcação explícita de origem. Os demais 9 itens da mesma lista (menu, instruções com áudio, acessibilidade, avatar, teclado, mobile, persistência, fases concluídas, pontuação/conquistas, Cruzeiro HUB) estão todos sob o mesmo cabeçalho de seção, o que pode sugerir que são igualmente oficiais — mas, sem a marcação individual nem o documento original, não é possível confirmar isso com segurança. Esta auditoria optou por não presumir a origem de nenhum deles.
- **Habilidade BNCC do Mundo 5**: já registrado em detalhe na Tarefa 08 (achado MB-08) — o conteúdo de precedência de operadores do Mundo 5 pode corresponder a um ano escolar posterior ao citado na habilidade EF02MA06/EF03MA06. Pendente de confirmação com o professor da disciplina.
- **Se "Matemática" foi uma escolha livre ou um tema fixado pela faculdade** (item 1 da tabela) — não verificável com os materiais disponíveis.
- **Existência (ou não) de exigências de processo (Scrum/backlog/DoD) e de artefatos de entrega** (itens 21 e 22) — a ausência total de qualquer menção no repositório pode significar que esses artefatos simplesmente não fazem parte do que este repositório deveria conter (ex.: podem existir em outra ferramenta, como um board do Trello/Jira não versionado aqui), e não necessariamente uma lacuna do projeto.

---

## 6. Decisões da equipe que não devem ser confundidas com exigências da faculdade

Estas escolhas estão documentadas como `[Decisão da equipe]` ou descritas no README sem qualquer marcação de origem oficial — tratá-las como obrigação da faculdade seria um erro desta auditoria, e por isso ficam destacadas aqui separadamente:

- A estrutura específica de **4 mundos principais com temas e operações fixas** (Casa/Soma, Parque/Subtração, Praia/Multiplicação, Acampamento/Divisão) — a faculdade exige um mundo bônus; a forma como os mundos principais foram organizados é escolha da equipe.
- O **conteúdo específico do Mundo 5** (5 desafios de contas compostas, reaproveitamento provisório do cenário do Mundo 3) — a faculdade exige que o mundo bônus exista; o conteúdo dele é decisão da equipe, inclusive sua natureza provisória.
- A arquitetura técnica do projeto (arquivos declarativos por mundo, motor compartilhado em `game.js`/`math.js`, persistência via `localStorage`) — nenhuma dessas escolhas está, em nenhum documento disponível, atribuída a uma exigência da faculdade; são decisões técnicas da equipe, dentro do princípio "simplicidade > sofisticação" que o próprio README declara.
- O uso de JavaScript Vanilla sem build tooling — descrito como decisão (seção 7 do README: "A implementação atual utiliza JavaScript Vanilla..."), não uma imposição.
- Qualquer prioridade entre os itens da seção "Pendências e próximos objetivos" do README (seção 10) — é um planejamento da própria equipe, não uma lista de prazos ou exigências da faculdade.

---

## 7. Conclusão sobre a situação atual e os principais riscos para a entrega

O projeto está, em termos de **implementação técnica**, mais avançado do que a própria documentação dá a entender em alguns pontos (ex.: o suporte a teclado já permite completar uma fase inteira, algo que a Tarefa 09 confirmou e que o README trata apenas como "parcial" sem detalhar o quanto já funciona). Ao mesmo tempo, existem **lacunas que a documentação não via porque dependiam de execução real** para serem descobertas — e é exatamente esse tipo de lacuna que representa o maior risco para a entrega:

1. A persistência de progresso, que o README apresenta como "implementada", quebra no primeiro clique em "JOGAR" fora do Modo DEV — um avaliador que jogue uma fase, volte ao menu e clique em JOGAR de novo (um fluxo natural de uso) vai constatar a perda do progresso imediatamente.
2. O mundo bônus, exigido pela faculdade, existe e funciona corretamente, mas não é alcançável por quem não souber da URL direta — um avaliador que só use o carrossel do menu nunca vai encontrá-lo.
3. A trilha sonora, documentada como "já implementada", nunca é ouvida, por uma referência de arquivo desatualizada.

Nenhum desses três riscos é hipotético: todos foram confirmados por execução real em tarefas anteriores desta auditoria (Tarefas 05 e 07), não apenas inferidos da leitura do código.

Fora esses riscos, o restante das lacunas (acessibilidade configurável, avatar/apelido, pontuação/conquistas, integração com o Cruzeiro HUB) já está corretamente documentado pela própria equipe como trabalho futuro — não representam uma surpresa, apenas trabalho pendente conhecido e priorizável.

A limitação mais importante deste relatório, reiterada desde a seção 1, é que **ele não pode confirmar aderência a critérios que só existem no material oficial da faculdade**, porque esse material não está no repositório. Qualquer decisão sobre o que é "obrigatório" para a entrega, além dos dois pontos explicitamente marcados no README, depende de alguém com acesso ao enunciado original confirmar — esta auditoria registrou essas dúvidas (seção 5) em vez de resolvê-las por conta própria.

---

## Confirmação final

- **Arquivo alterado nesta tarefa**: apenas `AUDITORIA 06.10/10-REQUISITOS-DA-FACULDADE.md` (criado). Nenhum outro arquivo do projeto foi tocado.
- **Estado do Git**: verificado ao final desta tarefa — apenas a pasta `AUDITORIA 06.10/` aparece como não rastreada (`?? "AUDITORIA 06.10/"`); nenhuma alteração em arquivos existentes do jogo; nenhum commit ou push foi realizado.
