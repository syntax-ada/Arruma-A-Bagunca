# 11 — Auditoria de Escopo e Documentação

Comparação entre o que `README.md`/`AGENTS.md` afirmam sobre o jogo "Arruma a Bagunça" e o estado real confirmado nas Tarefas 01–10 desta auditoria. Nenhum documento ou arquivo do jogo foi alterado. Nenhum commit ou push foi realizado.

## 1. Resumo executivo

A documentação do projeto está, em geral, **bem cuidada e majoritariamente precisa** — é explícita sobre o que é decisão da equipe, o que é requisito da faculdade, e sobre boa parte do que ainda não foi implementado. O histórico do Git confirma que `README.md` e `AGENTS.md` foram revisados no mesmo dia da última leva de funcionalidades (commit `d964da9`, "refactor: atualizando readme e agents", 2026-10-06), o que explica por que a maior parte do conteúdo reflete o código atual com fidelidade.

Ainda assim, esta auditoria encontrou **duas afirmações que descrevem como "já implementadas" funcionalidades que, na prática, não funcionam** — a trilha sonora de fundo e a persistência de progresso incondicional — ambas confirmadas quebradas por execução real em tarefas anteriores (05 e 07), não apenas inferidas da leitura do código. Essas duas divergências são o achado central deste relatório. Fora elas, as lacunas encontradas são, em sua maioria, de **ausência de informação** (como executar o projeto localmente, artefatos de planejamento) e não de **informação incorreta**.

Ponto positivo a destacar: nem `README.md` nem `AGENTS.md` tratam o "Mundo 6" como funcionalidade real em nenhum momento — ambos descrevem o Mundo 5 corretamente como fase bônus, sem sugerir a existência de um sexto mundo. Isso está correto e não precisa de correção.

---

## 2. Documentos e arquivos analisados

- `README.md` (416 linhas) — documentação de produto.
- `AGENTS.md` (205 linhas) — instruções de processo para agentes/IA.
- Estrutura real de arquivos do repositório (`index.html`, `fase1.html`, `global.css`, `style-menu.css`, `style-fase1.css`, `js/*.js`, `js/mundos/*.js`, `assets/`), comparada diretamente com o que os dois documentos descrevem.
- Histórico do Git (`git log`, somente leitura) para situar a data das últimas revisões documentais em relação às mudanças de código.
- As 10 tarefas anteriores desta auditoria (`AUDITORIA 06.10/01` a `10`), usadas como evidência de execução real sempre que uma afirmação do README/AGENTS precisava ser confirmada ou contestada.

Não foi encontrado nenhum outro documento de planejamento no repositório (sem PDF, sem arquivo de backlog, sem rubrica de avaliação) — mesma conclusão já registrada na Tarefa 10.

---

## 3. Comparação entre documentação e estado real do jogo

| Afirmação da documentação | Fonte | Estado real confirmado | Correspondência |
|---|---|---|---|
| "Mundos 1 a 4 já possuem três fases jogáveis cada" | README:19 | Confirmado por execução (Tarefa 08: 12/12 fases corretas) | ✅ Correta |
| "Mundo bônus implementado no engine" | README:57 | Confirmado (Tarefa 01, 07, 08) | ✅ Correta |
| "persistência básica de progresso; (implementado, multi-mundo)" | README:59 | O mecanismo funciona, mas é apagado incondicionalmente ao clicar em JOGAR fora do Modo DEV (Tarefa 07, DP-01) | ❌ **Incompleta/otimista** — ver seção 4 |
| "registro de fases concluídas; (implementado, multi-mundo)" | README:61 | Funciona corretamente em uso normal; frágil sob dados corrompidos (Tarefa 07, DP-03/04, não reproduzido em uso normal) | ✅ Correta para uso normal, com ressalva de robustez já registrada na Tarefa 07 |
| "pontuação/conquistas; (não implementado)" | README:63 | Confirmado — zero implementação (Tarefa 07) | ✅ Correta |
| "suporte a teclado; (parcial — ver seção 6)" | README:67 | Mais funcional do que a frase sugere: uma fase inteira é completável só por teclado (Tarefa 09) | ⚠️ Correta, mas subestima o que já funciona |
| "O Mundo 5... hoje só é alcançado por URL direta... ou pelo painel dev" | README:91 | Confirmado (Tarefas 01, 07, 08, 09) | ✅ Correta |
| "Regras de layout responsivo já implementadas... Ajustes finos... em andamento" | README:239 | Confirmado parcialmente correto: layout funciona na maioria dos casos, mas a Tarefa 02 encontrou 5 achados reais (RF-01 a RF-05) que vão além de "ajuste fino" (ex.: sobreposição de HUD, corte de conteúdo) | ⚠️ Hedge adequado, mas não cita os achados específicos |
| **"A trilha sonora contínua entre menu e fases, com botão de ligar/desligar, já está implementada (`js/audio.js`)."** | README:243 | **Nunca funciona**: o arquivo de áudio referenciado não existe; confirmado por HTTP 404 em toda carga de página e por hash MD5 que o arquivo foi renomeado em 2 commits sem a referência ser atualizada (Tarefa 05, AA-01) | ❌ **Incorreta** — ver seção 4 |
| "Card do Mundo 5 no carrossel... (ainda não implementado)" | README:247 | Confirmado (Tarefas 01, 03, 09) | ✅ Correta |
| "Configurações de acessibilidade... (não implementado)" | README:53,379 | Confirmado: botão existe, zero função (Tarefas 03, 09) | ✅ Correta |
| Tabela "Estado atual dos mundos e fases" (AGENTS.md:120-124) | AGENTS.md | Em geral precisa; a linha do Mundo 4 ("3 fases (Comidas, Mochila)") pode sugerir temas por fase, quando na verdade as 3 fases do Mundo 4 compartilham as mesmas 2 categorias — já identificado na Tarefa 01, não é uma descoberta nova | ⚠️ Correta no conteúdo, ambígua na apresentação (já registrado) |
| Árvore de arquivos (README:259-305) | README | Todos os arquivos listados existem com as responsabilidades descritas (confirmado arquivo por arquivo na Tarefa 06) | ✅ Correta, com uma omissão — ver seção 5 |
| "Mundo 5... reaproveita o cenário do Mundo 3" | README:91, AGENTS.md:132-133 | Confirmado: não existe pasta `assets/images/mundo_5/`; todos os assets do Mundo 5 vêm de `mundo_3/` (Tarefa 04, 06) | ✅ Correta |
| Tecnologias (HTML5/CSS3/JS ES6+/Git/GitHub) | README:319-333 | Confirmado: zero `package.json`, zero build tooling, histórico Git real | ✅ Correta |

---

## 4. Problemas organizados por prioridade

### 🟠 ED-01 — Alto — Trilha sonora documentada como "já implementada", mas nunca funciona
- **Arquivo/seção afetada**: `README.md:243`
- **Evidência concreta**: Tarefa 05 (`05-AUDIO.md`, achado AA-01) — HTTP 404 confirmado em toda carga de página para `assets/audio/everything-in-place.mp3`; hash MD5 prova que o arquivo foi renomeado para `assets/audio/Mundos/Menu Principal.mp3` em dois commits (`d5ae48d`, `9b1ffd8`), sem que `js/audio.js` fosse atualizado.
- **Divergência/risco**: a frase afirma categoricamente que a trilha "já está implementada", sem nenhuma ressalva. Quem ler o README e não testar com áudio ligado (ou sem prestar atenção ao som) pode avaliar essa funcionalidade como concluída.
- **Recomendação objetiva**: ajustar a frase para refletir o estado real (ex.: "controle de som implementado; trilha de fundo com referência de arquivo pendente de correção") — sem implementar a correção em si, apenas atualizar o texto para não contradizer o comportamento real.

### 🟠 ED-02 — Alto — Persistência de progresso descrita sem a ressalva da perda ao clicar em JOGAR
- **Arquivo/seção afetada**: `README.md:59, 229-235`
- **Evidência concreta**: Tarefa 07 (`07-DADOS-E-PROGRESSO.md`, achado DP-01) — confirmado por execução real que `js/menu.js` apaga `localStorage` incondicionalmente no clique em "JOGAR", fora do Modo DEV.
- **Divergência/risco**: a seção "Persistência e desbloqueio de progresso" descreve o mecanismo de forma neutra, sem mencionar que o fluxo mais natural de retomar o jogo (clicar em JOGAR) destrói o progresso. É o tipo de lacuna que só aparece testando o fluxo completo, não lendo o código isoladamente.
- **Recomendação objetiva**: adicionar uma observação nesta seção (ou na seção 10, "Pendências") citando esse comportamento como um ponto a decidir/corrigir — o próprio `dev.js` já demonstra, em código, que a equipe percebeu o problema (o contorno exclusivo do Modo DEV), mas isso nunca chegou à documentação de produto.

### 🟡 ED-03 — Médio — "Pendências e próximos objetivos" não reflete os achados já confirmados por esta auditoria
- **Arquivo/seção afetada**: `README.md`, seção 10 (linhas 401-413)
- **Evidência concreta**: a lista atual tem 5 itens, todos de natureza "funcionalidade ainda não construída" (teclado para arrastar, testes de responsividade, configurações/avatar, arte do Mundo 5, card do Mundo 5). Nenhum dos itens confirmados nas Tarefas 01-10 como **comportamento quebrado** (ED-01, ED-02, mais os achados DP-03/04, AC-01/02, RF-01 a RF-05, etc.) aparece nesta lista.
- **Divergência/risco**: não é uma inconsistência factual (a lista é verdadeira no que afirma), é uma lacuna de cobertura — a seção existe exatamente para listar "pontos que ainda merecem atenção", mas foi escrita antes desta rodada de auditoria e nunca incorporou os achados dela.
- **Recomendação objetiva**: a equipe pode avaliar incorporar ao menos os achados de maior prioridade desta auditoria (ED-01, ED-02, e os achados 🔴/🟠 dos relatórios 01-10) a essa seção, já que ela é o ponto do README dedicado a isso.

### 🟡 ED-04 — Médio — Ausência de instruções para executar o projeto localmente
- **Arquivo/seção afetada**: `README.md` (nenhuma seção) e `AGENTS.md` (nenhuma seção)
- **Evidência concreta**: busca em todo o texto de ambos os documentos não encontrou nenhuma instrução de "como rodar o projeto" (nem abrir `index.html` diretamente, nem servir por HTTP local, nem qualquer aviso sobre possíveis restrições do navegador ao abrir via `file://`). Esta própria auditoria precisou, em toda tarefa que envolveu testes reais, decidir de forma independente usar `python -m http.server` — informação que não vem de nenhum documento do projeto.
- **Divergência/risco**: não é uma inconsistência (o README não afirma nada de errado aqui), é uma lacuna pura. Risco: uma pessoa nova na equipe (ou outro agente de IA numa tarefa futura) pode perder tempo descobrindo por conta própria a forma correta de testar o projeto, ou pior, testar de uma forma que mascare um problema (ex.: abrir via `file://` pode se comportar diferente de servir por HTTP, especialmente para o iframe de `index.html`).
- **Recomendação objetiva**: adicionar uma seção curta "Como executar localmente" ao README, com o comando mínimo necessário.

### 🔵 ED-05 — Baixo — Cabeçalho "Fases do Mundo 1" seguido de conteúdo sobre todos os mundos
- **Arquivo/seção afetada**: `README.md:179-193`
- **Evidência concreta**: o cabeçalho "### Fases do Mundo 1" é seguido, na frase imediatamente abaixo, por "Todas as fases, de todos os mundos, usam o mesmo motor de jogo..." — o conteúdo da subseção extrapola o que o título promete.
- **Divergência/risco**: nenhum erro factual, apenas uma pequena inconsistência de escopo entre título e conteúdo, que pode causar uma leitura apressada a pular a parte sobre os Mundos 2-4 (mencionada só na frase final do parágrafo, linha 193).
- **Recomendação objetiva**: renomear o cabeçalho para algo como "Fases por mundo (exemplo: Mundo 1)", deixando explícito que o padrão vale para todos.

### 🔵 ED-06 — Baixo — Divergência de apresentação (já identificada) na tabela de mundos do AGENTS.md
- **Arquivo/seção afetada**: `AGENTS.md:123`
- **Evidência concreta**: já registrado na Tarefa 01 — a célula "3 fases (Comidas, Mochila)" do Mundo 4 pode sugerir, pelo padrão visual das linhas vizinhas (que listam 3 nomes de categoria para "3 fases"), que cada fase tem uma categoria/tema diferente, quando na realidade as 3 fases do Mundo 4 compartilham as mesmas 2 categorias.
- **Divergência/risco**: puramente de apresentação — o conteúdo está correto, só pode ser mal interpretado à primeira leitura.
- **Recomendação objetiva**: já sugerida na Tarefa 01 — sem ação necessária além de uma futura revisão de formatação, se a equipe considerar relevante.

### 🔵 ED-07 — Baixo — Pasta `assets/images/tela_menu/` não aparece na árvore de arquivos do README
- **Arquivo/seção afetada**: `README.md:294-305`
- **Evidência concreta**: a árvore de diretórios lista `nova_tela_menu de_fases/`, mas não a pasta `tela_menu/` (sem "nova_"), que existe de fato no repositório e já foi identificada como pasta legada na Tarefa 04 (`04-ASSETS-E-DESIGN.md`).
- **Divergência/risco**: omissão, não erro — a árvore não afirma que essa pasta não existe, apenas não a menciona. Como a árvore é descrita como refletindo "o estado atual do projeto", uma pasta inteira ausente dela é uma lacuna pequena.
- **Recomendação objetiva**: se a equipe decidir manter a pasta `tela_menu/` por ora, considerar mencioná-la na árvore com uma nota "(legado, não utilizado)", em vez de omiti-la.

### 💡 ED-08 — Melhoria — Nenhuma seção menciona MVP, Scrum, backlog ou Definition of Done
- **Arquivo/seção afetada**: não aplicável (ausência em todo o repositório)
- **Evidência concreta**: busca exaustiva em `README.md`/`AGENTS.md` não encontrou nenhuma menção a MVP, Scrum, backlog, histórias de usuário, critérios de aceitação ou Definition of Done — mesma conclusão da Tarefa 10.
- **Divergência/risco**: não é possível saber, a partir do repositório, se esses artefatos existem em outra ferramenta (ex.: um board externo) ou se o processo da equipe simplesmente não os usa. **Não é classificado como requisito ausente da faculdade** (não há fonte oficial disponível para sustentar essa obrigação, conforme a própria regra desta tarefa).
- **Recomendação objetiva**: se esses artefatos existirem fora do repositório, considerar ao menos uma referência a onde encontrá-los (ex.: um link), para que o README seja a porta de entrada completa do projeto.

---

## 5. Informações obsoletas, provisórias ou ambíguas

- **Mundo 6**: verificado explicitamente, como pedido — **não aparece em nenhum momento** como funcionalidade real em nenhum dos dois documentos. Isso está correto e não precisa de ajuste.
- **Mundo 5 como fase bônus**: descrito de forma consistente e correta em ambos os documentos, incluindo a natureza provisória do seu cenário/arte (herdado do Mundo 3) e a ausência de card no carrossel. Nenhuma inconsistência encontrada aqui.
- **Pasta `assets/images/tela_menu/`**: existe fisicamente, não é mencionada na árvore do README, e já foi identificada em tarefa anterior como legada — ver achado ED-07.
- **Ambiguidade de apresentação na tabela de mundos do AGENTS.md** (Mundo 4) — ver achado ED-06, já registrado antes desta tarefa.
- **Datas de revisão**: o commit mais recente (`d964da9`, "refactor: atualizando readme e agents") e a atualização da trilha sonora (`9b1ffd8`, "Música do menu principal que estava faltando", 2026-10-03) mostram que os documentos foram revisados DEPOIS da mudança que quebrou a referência de áudio — ou seja, a imprecisão do achado ED-01 não é um texto antigo esquecido, é uma afirmação que já estava desatualizada no momento da própria revisão mais recente. Isso é relevante para a equipe entender que a causa não é "documentação velha", é "funcionalidade não testada antes de ser documentada como concluída".

---

## 6. Lacunas de documentação e riscos para a equipe

- **Instruções de execução local ausentes** (achado ED-04) — risco de retrabalho/confusão para qualquer pessoa nova (humana ou agente de IA) que precise testar o projeto.
- **Artefatos de planejamento (Scrum/backlog/DoD) não documentados nem referenciados** (achado ED-08) — risco baixo, mas gera incerteza sobre se o processo da equipe usa esses artefatos em outro lugar.
- **A seção "Pendências" não é atualizada com achados de auditoria/teste** (achado ED-03) — risco de a equipe perder de vista problemas já confirmados, se não houver um hábito de trazer achados de tarefas de QA/auditoria para a documentação de produto.
- **Nenhuma seção documenta explicitamente um escopo de MVP** — não é uma falha, mas significa que não há, no README, um ponto único que diga "isto é o mínimo necessário para a entrega atual" — o que existe é uma lista de requisitos previstos e um "estado atual", sem uma linha de corte explícita entre o que é indispensável agora e o que é incremento futuro.

---

## 7. Melhorias recomendadas (separadas dos problemas confirmados)

Nenhuma destas foi implementada nesta auditoria; são sugestões, não achados de divergência:

1. Adicionar uma seção curta "Como executar localmente" (relacionado a ED-04).
2. Trazer os achados de maior prioridade das Tarefas 01-10 para a seção "Pendências e próximos objetivos", ou criar uma seção separada de "Problemas conhecidos" que a referencie (relacionado a ED-03).
3. Renomear o cabeçalho "Fases do Mundo 1" para deixar claro que o conteúdo vale para todos os mundos (relacionado a ED-05).
4. Mencionar a pasta `assets/images/tela_menu/` na árvore de arquivos, marcada como legada, em vez de omiti-la (relacionado a ED-07).
5. Se a equipe usar algum artefato de planejamento fora do repositório (board, planilha), considerar referenciá-lo no README para que a documentação local não pareça incompleta (relacionado a ED-08).

---

## 8. Conclusão

A documentação do projeto está, no geral, bem escrita, bem organizada, e com boas práticas explícitas de separar requisito oficial, decisão da equipe e estado real — exatamente o tipo de disciplina documental que facilita este tipo de auditoria. As duas correções documentais mais importantes para uma próxima etapa são:

1. **Ajustar a afirmação sobre a trilha sonora** (`README.md:243`), de "já implementada" para algo que reflita que ela está presente no código, mas não produz som real hoje (achado ED-01).
2. **Adicionar uma ressalva sobre a perda de progresso ao clicar em JOGAR** na seção de persistência (`README.md:229-235`), já que essa é a divergência de maior risco prático para quem avaliar o jogo pelo fluxo normal de uso (achado ED-02).

Depois dessas duas, a lacuna de maior valor para a equipe é documentar como executar o projeto localmente (ED-04) — não por haver um erro hoje, mas porque toda esta série de 11 tarefas de auditoria precisou resolver essa mesma questão de forma independente, repetidamente, por falta de uma instrução única no repositório.

Nenhuma das divergências encontradas é causada por informação "inventada" ou por confusão entre requisito oficial e decisão da equipe — a documentação já é cuidadosa nesse aspecto. As divergências encontradas são, em sua totalidade, do tipo "funcionalidade descrita como concluída que na prática ainda falha quando testada de ponta a ponta" — exatamente o tipo de lacuna que uma auditoria com execução real (como esta) está posicionada para encontrar, e que a leitura isolada do código ou da documentação não revela por si só.

---

## Confirmação final

- **Arquivo alterado nesta tarefa**: apenas `AUDITORIA 06.10/11-ESCOPO-E-DOCUMENTACAO.md` (criado). Nenhum outro arquivo do projeto, incluindo `README.md` e `AGENTS.md`, foi tocado.
- **Estado do Git**: verificado ao final desta tarefa — apenas a pasta `AUDITORIA 06.10/` aparece como não rastreada; nenhuma alteração em arquivos existentes; nenhum commit ou push foi realizado.
