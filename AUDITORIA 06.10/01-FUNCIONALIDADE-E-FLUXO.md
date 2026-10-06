# Auditoria 06.10 — Funcionalidade e Fluxo do Jogo

**Data:** 06/10/2026 (revisão com execução real no navegador)
**Escopo:** Funcionalidade e fluxo do jogo, do menu inicial até a conclusão do Mundo 5. Fora de escopo: responsividade, acessibilidade, código morto, arquitetura, documentação, assets, áudio, BNCC, estética/UI — exceto quando algum desses temas causa diretamente um problema de funcionamento.

**Regra respeitada:** nenhum arquivo do jogo foi alterado, corrigido ou refatorado. Nenhum commit ou push foi realizado. Único arquivo criado/alterado nesta etapa: este próprio documento. Todo o ambiente de teste (Playwright, servidor HTTP local) ficou fora do repositório, em uma pasta temporária, e foi encerrado ao final.

---

## 0. Metodologia (duas rodadas)

**Rodada 1 (versão anterior deste documento):** feita só por leitura e rastreamento manual do código-fonte, porque o ambiente não tinha ferramenta de automação de navegador disponível.

**Rodada 2 (esta revisão):** com um ambiente temporário de Playwright + Google Chrome real já preparado (ver seção 1), os achados da Rodada 1 foram **re-testados por execução real** sempre que possível, e novos testes foram adicionados para cobrir progressão, persistência e os testes negativos pedidos. Nenhum achado da Rodada 1 foi mantido "porque o código parece indicar isso" sem checagem — cada um foi reclassificado conforme o resultado real da execução.

---

## 1. Validação por execução no navegador

- **Navegador utilizado:** Google Chrome (instalado no sistema, `channel: "chrome"` do Playwright — não foi baixado nenhum Chromium à parte), modo headless.
- **URL utilizada:** `http://localhost:8000`, servido pela raiz do projeto via `python -m http.server 8000` (servidor HTTP temporário, somente leitura, encerrado ao final de cada rodada de testes).
- **Ambiente de teste:** Playwright instalado isoladamente em `%TEMP%\...\scratchpad\pw-audit\` (fora do repositório, sem `package.json` nem dependências adicionadas ao projeto).
- **Mundos/fases efetivamente testados:** Mundo 1 (Fases 1, 2, 3), Mundo 2 (Fases 1, 2, 3), Mundo 3 (Fases 1, 2, 3), Mundo 4 (Fases 1, 2, 3) e Mundo 5 (Fase única, com os 5 desafios) — **13 fases + 5 desafios compostos, numa única sessão contínua ("caminho dourado")**, mais 5 cenários isolados adicionais para os testes negativos/edge cases.
- **Testes realizados (interação real — clique, arraste por eventos de ponteiro, preenchimento de resposta):**
  1. Carregamento do menu e entrada no jogo.
  2. Para cada uma das 13 fases: entrada, renderização dos objetos/cestas, **arrastar um objeto para a cesta errada de propósito** (testa "objeto incorreto"), arrastar todos os objetos para as cestas certas, contador de cada cesta, conclusão da organização, desafio matemático, **clicar numa resposta errada de propósito** (testa "resposta incorreta"), clicar na resposta certa (lida via `window.obterDesafioMatematicoAtivo()`, a mesma função que o próprio painel DEV do jogo já usa — não foi preciso adivinhar o resultado), feedback, conclusão da fase, avanço para a próxima fase ou volta ao menu.
  3. Mundo 5 completo: entrada por URL direta (via `abrirFase()`, já exposta pelo `menu.js`), os 5 desafios em sequência (com teste de resposta errada no primeiro), leitura dos corações a cada acerto, transição para a organização final, organização dos 6 objetos, painel de vitória.
  4. Desbloqueio de mundo (verificado lendo as classes CSS dos cards do carrossel após cada mundo concluído) e desbloqueio de fase (verificado lendo o atributo `disabled` dos botões do modal antes de cada mundo ser jogado).
  5. Acesso direto por URL a uma fase **nunca desbloqueada** (`fase1.html?mundo=3&fase=2`, contexto novo sem nenhum progresso salvo).
  6. Tentativa de abrir o modal de um mundo bloqueado pela UI (clique no card do Mundo 2 sem ter concluído o Mundo 1).
  7. Refresh (reload) no meio de uma fase incompleta.
  8. Refresh/nova navegação depois de concluir uma fase, e reentrada numa fase já concluída (replay).
  9. Clique no botão "JOGAR" da tela inicial depois de já existir progresso salvo (reprodução do AF-01).
  10. Cliques repetidos: 3 respostas erradas seguidas, duplo clique na resposta certa (já desabilitada após o primeiro clique) e duplo clique no botão "Próxima Fase".
- **Erros de console encontrados:** apenas `Failed to load resource: the server responded with a status of 404 (File not found)`, em **todos** os cenários testados, sempre para o mesmo recurso (ver "Recursos 404" abaixo). Também aparece, em todo carregamento de fase, um `console.log` benigno de depuração (`"Tentando renderizar cestas: [...]"`, de `js/game.js`) — não é erro, é um `console.log` deixado no código; sem impacto funcional, mas é ruído desnecessário no console de produção.
- **Page errors (exceções JavaScript não tratadas):** **nenhuma, em nenhum dos cenários**, ao longo das 13 fases + Mundo 5 + 5 cenários extras de teste.
- **Recursos 404 encontrados:** `assets/audio/everything-in-place.mp3` — confirmado também no disco (a pasta `assets/audio/` só contém as subpastas `Efeitos`, `Mundos` e `Objetos`; esse arquivo de trilha sonora, referenciado em `js/audio.js`, não existe). Isso é relevante para a auditoria de áudio que vocês planejam fazer à parte; aqui registro só o fato de que o jogo **não trava nem lança exceção** por causa disso — `audio.js` já tem tratamento de erro (`.catch()` na Promise de `play()`), então o impacto funcional observado é zero (o jogo continua jogável normalmente, só sem música de fundo).
- **Limitações que continuam existindo mesmo com Playwright:**
  - Multi-toque físico simultâneo (AF-03) não foi simulado — está fora do alcance razoável da API do Playwright para esta sessão (ver nota no próprio achado).
  - Os testes rodaram headless; nenhuma validação humana de "como fica visualmente bonito/alinhado" foi feita (fora de escopo desta auditoria de qualquer forma).
  - Um F5/reload genuíno (sem o parâmetro `?view=mundos`) sempre volta para a tela inicial, já que a navegação do jogo é só por JavaScript (o endereço no navegador nunca muda). Isso foi confirmado por execução (ver AF-anterior sobre refresh) — para inspecionar o estado pós-refresh sem acionar o AF-01 (clique em JOGAR apaga o progresso), usei `index.html?view=mundos`, que é o mesmo parâmetro que o próprio `menu.js` já reconhece para pular direto à tela de mundos.

---

## 2. Achados

Cada achado agora traz **dois selos**: a classificação de prioridade (🔴/🟠/🟡/🔵/💡) e o selo de verificação (✅ Confirmado por execução / ⚠️ Confirmado parcialmente / ❓ Não verificável / ❌ Não reproduzido).

### AF-01 — 🔴 Crítico — ✅ Confirmado por execução (e por código)

**Progresso do jogador é apagado sempre que o botão "JOGAR" da tela inicial é clicado (fora do Modo Dev).**

- **Mundo/Fase afetado:** Todos (quebra a progressão do jogo inteiro).
- **Arquivo(s):** `js/menu.js` (linha 278), confirmado indiretamente por `js/dev.js` (linhas 556-569).
- **Confirmação por execução:** joguei a sequência completa (Mundos 1 a 5, 13 fases + 5 desafios) numa única sessão de navegador real. Logo depois de concluir o Mundo 5, o `localStorage` continha:
  ```json
  {
    "mundosDesbloqueados": [1,2,3,4,5,6],
    "faseMaximaPorMundo": {"1":3,"2":3,"3":3,"4":3,"5":1,"6":1},
    "fasesConcluidas": ["1-1","1-2","1-3","2-1","2-2","2-3","3-1","3-2","3-3","4-1","4-2","4-3","5-1"]
  }
  ```
  Cliquei em **Voltar** (menu de mundos → tela inicial) e depois em **JOGAR** de novo. O `localStorage` passou a retornar **`null`** — todo o progresso de 5 mundos e 13 fases concluídas foi apagado com dois cliques.
- **Como reproduzir:** jogar qualquer fase até o fim → **Voltar** → **JOGAR** novamente.
- **Comportamento esperado:** conforme o próprio `README.md` ("Persistência e desbloqueio de progresso"), o progresso deveria persistir entre idas e voltas ao menu.
- **Impacto:** confirmado na prática — não é uma leitura pessimista do código, é o que o jogo realmente faz.
- **Possível causa:** ver evidência na Rodada 1 (comentário em `js/dev.js:558` já reconhece e contorna esse apagamento, mas só no Modo Dev).

---

### AF-02 — 🟡 Médio — ✅ Confirmado por execução (e por código)

**O motor do jogo não valida bloqueio de mundo/fase — acesso direto por URL ignora a progressão.**

- **Mundo/Fase afetado:** Todos (Mundos 1 a 5).
- **Arquivo(s):** `js/main.js` (não consulta `progresso.js`).
- **Confirmação por execução:** em uma sessão de navegador **totalmente nova, sem nenhum progresso salvo**, abri diretamente `fase1.html?mundo=3&fase=2`. A fase carregou normalmente, com os objetos e cestas da Fase 2 do Mundo 3 (Praia) prontos para jogar — nenhum aviso, nenhum redirecionamento, nenhuma trava.
- **Comportamento esperado:** conteúdo bloqueado não deveria ser jogável por acesso direto via URL, ou o motor deveria ao menos avisar/redirecionar para o menu.
- **Impacto:** confirmado — qualquer link direto pula completamente a progressão pedagógica, mesmo sem nunca ter aberto o menu.
- **Contraste confirmado:** no mesmo teste, a tentativa de abrir o **modal** de um mundo bloqueado *pela interface normal* (clicar no card do Mundo 2 sem ter concluído o Mundo 1) funcionou corretamente — o modal **não abriu** (`modalAbriuParaMundoBloqueado: false`). Ou seja, a trava existe e funciona na camada de UI; só não existe no motor que efetivamente carrega a fase.

---

### AF-03 — 🟡 Médio — ❓ Não verificável neste ambiente — necessita teste físico

**Múltiplos toques simultâneos podem deixar um objeto "preso" em arraste.**

- Mantido exatamente como identificado por análise de código na Rodada 1 (`js/game.js`, variável global `activeDrag`). **Não tentei simular artificialmente** com múltiplos ponteiros via protocolo do navegador porque isso não reproduziria com fidelidade um multi-toque físico real (dois dedos de uma criança em um tablet) — forçar isso por código seria inventar um resultado, não confirmá-lo. Continua precisando de um teste manual num tablet/celular real antes de decidir a prioridade definitiva.

---

### AF-04 — 🔵 Baixo — ✅ Confirmado por execução (e por código)

**Concluir o Mundo 5 desbloqueia um "Mundo 6" que não existe.**

- **Confirmação por execução:** logo após o painel de vitória do Mundo 5, o `localStorage` (citado integralmente no AF-01 acima) já mostra `"mundosDesbloqueados": [1,2,3,4,5,6]` e `"faseMaximaPorMundo": {...,"6":1}` — confirmado byte a byte, sem precisar inferir nada do código.
- Resto do achado (impacto, causa) mantido igual à Rodada 1: sem efeito visível hoje, pois não há card nem arquivo de Mundo 6.

---

### AF-05 — 🟠 Alto — ✅ Confirmado por execução (achado NOVO desta rodada)

**Ao voltar ao menu depois de concluir uma fase, o modal "Escolha uma fase" do mundo recém-jogado reaparece aberto por cima do carrossel, bloqueando o clique nos cards vizinhos.**

- **Prioridade:** 🟠 Alto
- **Mundo/Fase afetado:** confirmado após concluir a última fase de qualquer um dos Mundos 1, 2, 3 e 4 (testei os quatro; não ocorre no Mundo 5 porque ele não tem card/modal próprio no carrossel — ver explicação abaixo).
- **Arquivo(s):** `js/menu.js` — função `mostrarMenuMundos()` (por volta da linha 39).
- **Como reproduzir:**
  1. Abrir o jogo, clicar em **JOGAR**, entrar em qualquer Mundo (ex.: Mundo 1) pelo carrossel (isso abre o modal "Escolha uma fase").
  2. Jogar a última fase daquele mundo até o fim.
  3. Clicar em **"Voltar para o Menu"**.
- **Comportamento atual (confirmado com screenshot real, headless Chrome):** a tela volta para o carrossel de mundos, mas o modal "Escolha uma fase" do mundo que acabou de ser jogado **reaparece aberto**, centralizado por cima do carrossel — exatamente como ficou ao ser aberto antes de a fase começar. Ele nunca foi fechado tecnicamente (`#modal-fases` nunca recebe a classe `escondido` nesse fluxo); como o `<iframe>` da fase cobre a tela inteira enquanto se joga, o modal fica "escondido atrás" dele sem que ninguém perceba, e reaparece assim que o iframe é escondido de novo. No teste automatizado, isso literalmente **bloqueou o clique** no card do próximo mundo (o Playwright reportou "`#modal-fases` subtree intercepts pointer events" ao tentar clicar no card do Mundo 2, logo após voltar do Mundo 1).
- **Comportamento esperado:** ao voltar ao menu de mundos, nenhum modal deveria estar aberto — o jogador deveria ver só o carrossel limpo, exatamente como ao entrar no menu pela primeira vez.
- **Impacto:** depois de terminar **qualquer** mundo (testado nos 4 mundos acessíveis pela UI), a criança volta ao menu e se depara com uma janela que ela não abriu, cobrindo parte da tela. Ela ainda consegue fechar essa janela clicando no X (`#btn-fechar-modal`) e seguir em frente — não é um travamento definitivo — mas é um comportamento inesperado e não intencional bem no momento em que o jogo deveria estar comemorando a conclusão de um mundo e convidando para o próximo.
- **Evidência:** reproduzido de forma determinística em **4 de 4 tentativas** (uma por mundo). Screenshot capturado confirma o modal "Mundo 1 — A Casa" sobreposto ao carrossel, com o card do Mundo 2 parcialmente coberto, logo após clicar em "Voltar para o Menu" ao final da Fase 3 do Mundo 1.
- **Possível causa:** comparando as duas funções de `js/menu.js` que levam de volta à tela de mundos:
  - `botaoVoltar` (menu de mundos → tela inicial) **fecha** o modal explicitamente: `if (modalFases) { modalFases.classList.add("escondido"); }`.
  - `mostrarMenuMundos()` (chamada quando uma fase termina e manda `postMessage` com `destino: "menu"`) **não tem** a linha equivalente.

  Ou seja, o próprio código já resolve esse fechamento em um caminho (o botão Voltar manual), só não no outro (retorno automático de dentro de uma fase) — parece um esquecimento de paridade entre os dois caminhos, não uma escolha intencional.

---

### Observação (não é bug) — Mundo 5: corações do adversário não representam "vidas"

Mantida da Rodada 1, e **confirmada por execução**: nos 5 desafios do Mundo 5, testei uma resposta errada de propósito no primeiro desafio — o botão errado não travou nada, o feedback de erro apareceu, e o botão certo continuou clicável normalmente (`botaoContinuaHabilitadoAposErro: true`). O contador de corações só muda em acertos (`5 de 5` → `4 de 5` → `3 de 5` → `2 de 5` → `1 de 5` → `0 de 5`, confirmado nos 5 desafios reais). Continua sendo decisão de design documentada no próprio código, não um bug.

### Observação (não é bug) — `console.log` de depuração deixado em produção

Em toda fase carregada, aparece no console `"Tentando renderizar cestas: [Object, Object]"` (ou com mais objetos, dependendo da fase) — é um `console.log` literal dentro de `renderizarCestas()` em `js/game.js`. Não tem nenhum impacto funcional (não é erro, não aparece para o jogador), só seria ruído para quem for debugar o jogo pelo console depois. Registro por transparência, sem contar como problema.

---

## 3. Mundos/fases testados e resultados por execução real

Todos os valores abaixo foram lidos diretamente do estado do jogo durante a execução real (via `window.obterDesafioMatematicoAtivo()` e inspeção do DOM), não calculados manualmente.

| Mundo | Fase | Itens organizados | Objeto errado testado | Resultado matemático correto | Resposta errada testada | Conclusão |
|---|---|---|---|---|---|---|
| 1 (Soma) | 1 | 5/5 ✅ | ✅ rejeitado corretamente | 5 | ✅ não travou | ✅ |
| 1 (Soma) | 2 | 9/9 ✅ | — | 9 | — | ✅ |
| 1 (Soma) | 3 | 14/14 ✅ | — | 14 | — | ✅ |
| 2 (Subtração) | 1 | 6/6 ✅ | ✅ rejeitado corretamente | 2 | ✅ não travou | ✅ |
| 2 (Subtração) | 2 | 12/12 ✅ | — | 2 | — | ✅ |
| 2 (Subtração) | 3 | 16/16 ✅ | — | 0 | — | ✅ |
| 3 (Multiplicação) | 1 | 6/6 ✅ | ✅ rejeitado corretamente | 8 | ✅ não travou | ✅ |
| 3 (Multiplicação) | 2 | 10/10 ✅ | — | 25 | — | ✅ |
| 3 (Multiplicação) | 3 | 11/11 ✅ | — | 40 | — | ✅ |
| 4 (Divisão) | 1 | 8/8 ✅ | ✅ rejeitado corretamente | 1 | ✅ não travou | ✅ |
| 4 (Divisão) | 2 | 12/12 ✅ | — | 3 | — | ✅ |
| 4 (Divisão) | 3 | 15/15 ✅ | — | 2 | — | ✅ |
| 5 (Composta) | Desafio 1/5 | — | — | 15 (9+8−2) | ✅ não travou | ✅ |
| 5 (Composta) | Desafio 2/5 | — | — | 15 (4×3+3) | — | ✅ |
| 5 (Composta) | Desafio 3/5 | — | — | 1 (8÷4−1) | — | ✅ |
| 5 (Composta) | Desafio 4/5 | — | — | 11 (2×5+2−1) | — | ✅ |
| 5 (Composta) | Desafio 5/5 | — | — | 9 (20÷4+6−2) | — | ✅ |
| 5 — organização final | única | 6/6 ✅ | — | (sem conta; só organização) | — | ✅ painel de vitória visível |

Todos os resultados matemáticos lidos em execução batem exatamente com os valores declarados/calculados nos arquivos de mundo (`mundo1.js` a `mundo5.js`) — confirma por execução que `operacoes.js` calcula corretamente as 4 operações simples e a operação composta (com precedência de `×`/`÷` sobre `+`/`−`) nas 18 contas reais do jogo.

---

## 4. Progressão, persistência e testes negativos — resultado por execução

| Teste | Resultado confirmado por execução |
|---|---|
| Desbloqueio do Mundo 2 ao concluir o Mundo 1 | ✅ confirmado (card deixou de ter a classe `mundo-bloqueado`) |
| Desbloqueio do Mundo 3 ao concluir o Mundo 2 | ✅ confirmado |
| Desbloqueio do Mundo 4 ao concluir o Mundo 3 | ✅ confirmado |
| Fase 2/3 de cada mundo bloqueadas até a anterior ser concluída | ✅ confirmado (checado nos 4 mundos, botões com `disabled` antes de jogar) |
| Acessar mundo bloqueado pela UI (clique no card) | ✅ confirmado que a UI bloqueia corretamente (modal não abre) |
| Acessar fase bloqueada por URL direta | ✅ confirmado que **não** há bloqueio no motor — ver AF-02 |
| Refresh no meio de uma fase incompleta | ✅ confirmado: volta para a tela inicial, progresso (que ainda não existia) não é afetado |
| Refresh depois de concluir uma fase | ✅ confirmado: progresso permanece intacto, Fase 2 continua habilitada |
| Reentrar numa fase já concluída (replay) | ✅ confirmado: a fase recarrega do zero (nenhum objeto pré-marcado) e pode ser concluída de novo sem erros; o `localStorage` fica **idêntico** antes e depois do replay (confirmado por comparação byte a byte) |
| Clicar em JOGAR com progresso existente | ✅ confirmado — ver AF-01 |
| 3 respostas erradas seguidas no desafio matemático | ✅ confirmado: botão continua habilitado, sem travar, após as 3 tentativas |
| Duplo clique na resposta certa | ✅ confirmado: o segundo clique é bloqueado pelo próprio navegador, porque o botão já está desabilitado após o primeiro — nenhum painel de conclusão duplicado |
| Duplo clique em "Próxima Fase" | ✅ confirmado: segundo clique não teve efeito (elemento já havia sumido pela navegação) — avançou normalmente para a fase seguinte, sem erro |
| Voltar ao menu depois de concluir uma fase | ⚠️ confirmado, mas revela o **AF-05** (modal preso) |

---

## 5. Pontos que precisam de atenção antes da entrega

1. **AF-01 (crítico)** — confirmado por execução real. Precisa ser corrigido antes de qualquer entrega.
2. **AF-05 (alto, novo)** — confirmado por execução real, reproduzido de forma determinística nos 4 mundos testados. Recomendo tratar junto com o AF-01, já que ambos envolvem o retorno ao menu.
3. **AF-02 (médio)** — confirmado por execução. Merece uma decisão da equipe (ver Rodada 1 para a discussão de trade-off).
4. **AF-03 (médio)** — continua não verificável nesta sessão; precisa de teste manual num tablet/celular real.
5. **AF-04 (baixo)** — confirmado por execução; pode ficar para quando um Mundo 6 for de fato planejado.

---

## 6. Divergência encontrada entre fontes (sinalizada, não resolvida)

Mantida da Rodada 1, e agora **também confirmada por execução**: joguei as 3 fases do Mundo 4 (divisão: 4÷4=1, 9÷3=3, 10÷5=2) de ponta a ponta, todas com as mesmas duas categorias (Comidas e Mochila) em todas as 3 fases — o código tem mesmo 3 fases completas e jogáveis, como já indicava a leitura do `mundo4.js`. A tabela do AGENTS.md ("3 fases (Comidas, Mochila)") pode sugerir temas diferentes por fase, o que não corresponde ao jogo real. Deixo registrado para quem for atualizar o AGENTS.md depois; não é um problema de funcionamento.

---

## 7. Resultado final

### ✅ Confirmados (reproduzidos durante a execução real)

| ID | Título | Prioridade |
|---|---|---|
| AF-01 | Botão "JOGAR" apaga todo o progresso fora do Modo Dev | 🔴 Crítico |
| AF-05 | Modal "Escolha uma fase" reaparece aberto e bloqueia o carrossel ao voltar do menu | 🟠 Alto |
| AF-02 | Acesso direto por URL ignora o bloqueio de progressão | 🟡 Médio |
| AF-04 | Concluir o Mundo 5 desbloqueia um "Mundo 6" inexistente | 🔵 Baixo |

### ❌ Não reproduzidos

Nenhum. Todos os achados da Rodada 1 (análise estática) se confirmaram na execução real — nenhum se revelou falso positivo.

### ❓ Não verificáveis (precisam de teste manual/físico)

| ID | Título | Motivo |
|---|---|---|
| AF-03 | Multi-toque simultâneo pode prender um objeto em arraste | Exige hardware touch multi-toque real; simular via protocolo do navegador não teria fidelidade suficiente para confirmar ou descartar com segurança. |

### 🆕 Novos achados (descobertos nesta rodada de execução)

| ID | Título | Prioridade |
|---|---|---|
| AF-05 | Modal "Escolha uma fase" reaparece aberto e bloqueia o carrossel ao voltar do menu | 🟠 Alto |

(Também vale registrar, fora da contagem de bugs: um `console.log` de depuração esquecido em produção em `js/game.js`, e a confirmação de que o 404 do arquivo de áudio não quebra nada funcionalmente — ambos documentados na seção 2.)

### Resumo

- **Total de problemas confirmados por execução: 4** (AF-01, AF-02, AF-04, AF-05)
- **Total não reproduzido: 0**
- **Total não verificável (precisa de teste físico): 1** (AF-03)
- **Total geral de achados: 5**

**Por prioridade:**
- 🔴 Crítico: 1 (AF-01)
- 🟠 Alto: 1 (AF-05)
- 🟡 Médio: 2 (AF-02, AF-03)
- 🔵 Baixo: 1 (AF-04)
- 💡 Melhoria: 0

**Mundos/fases afetados:**
- AF-01: todos os mundos (persistência global).
- AF-02: todos os mundos.
- AF-03: qualquer fase com organização de objetos.
- AF-04: Mundo 5, ao ser concluído.
- AF-05: confirmado nos Mundos 1, 2, 3 e 4 (qualquer mundo acessado pelo carrossel/modal).

**Principais problemas:**
1. **AF-01** — o botão "JOGAR" apaga todo o progresso fora do Modo Dev. Confirmado de ponta a ponta: 5 mundos e 13 fases de progresso reais, apagados com dois cliques.
2. **AF-05** (novo, só visível em execução real) — depois de terminar qualquer mundo, o modal de seleção de fases do mundo anterior reaparece aberto por cima do carrossel, bloqueando o clique no próximo mundo até a criança descobrir que precisa fechá-lo.
3. **AF-02** — qualquer link direto para uma fase pula a progressão, sem aviso.

**Funcionalidades testadas por execução real e que funcionaram corretamente:** carregamento do menu, carrossel, bloqueio visual de mundos/fases, abertura/fechamento de modal, as 13 fases completas dos Mundos 1-4 (drag-and-drop real, objeto correto e incorreto, contador, as 4 operações matemáticas com resposta certa e errada), o fluxo completo do Mundo 5 (5 desafios compostos, corações, organização final, vitória), desbloqueio sequencial de mundos e fases, persistência do progresso através de refresh (quando o botão JOGAR não é clicado), replay de fase concluída sem corrupção de dados, e resiliência a cliques repetidos/duplos (sem travar, sem duplicar painéis). Zero exceções JavaScript (`page errors`) em toda a sessão.

**Pontos que precisam de correção antes da entrega:** AF-01 e AF-05 (ambos confirmados por execução, ambos no fluxo de retorno ao menu — vale corrigir juntos). AF-02 e AF-03 seguem como decisão/teste pendente da equipe, conforme já registrado na Rodada 1.
