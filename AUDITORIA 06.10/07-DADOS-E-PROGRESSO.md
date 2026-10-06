# 07 — Dados e Progresso

Auditoria do sistema de dados, progresso, desbloqueio e persistência do jogo "Arruma a Bagunça". Foco em como o progresso é gravado, lido, mantido entre sessões e como o sistema reage a dados ausentes, inválidos ou antigos. Nenhum arquivo do jogo foi alterado, nenhum dado real foi apagado para "corrigir" algo, nenhum banco de dados foi implementado, nenhuma refatoração foi feita. Nenhum commit ou push foi realizado.

## Metodologia

1. Leitura integral de `js/progresso.js` e de todos os pontos do código que leem ou gravam a chave de progresso (`menu.js`, `math.js`, `dev.js`).
2. Testes reais em Google Chrome via Playwright, instalado em pasta temporária fora do repositório, servindo o projeto por `python -m http.server 8000` (também temporário, encerrado ao final). Cada cenário usa um `browser.newContext()` isolado — um perfil de navegador novo e vazio, nunca o perfil real de um usuário.
3. Jogo real (arraste + resposta matemática) para gerar progresso genuíno sempre que o teste pedia "conclusão de fase", em vez de simular diretamente a gravação no `localStorage` — exceto no bloco 7 (Mundo 6), em que o estado de Mundos 1–4 foi semeado diretamente (reproduzindo exatamente a estrutura já confirmada no bloco 2, por código) para chegar ao Mundo 5 sem repetir 12 playthroughs completos; a transição real Mundo 5 → "Mundo 6" nesse bloco foi jogada de verdade.
4. Injeção controlada de dados inválidos/antigos/corrompidos em `localStorage`, sempre em contexto de navegador isolado e com dados fictícios — nunca com dados pessoais ou reais.

---

## 1. Estrutura atual dos dados

Chave única: `arruma_bagunca_progresso`, em `localStorage` (não `sessionStorage` — esse é usado só para o estado da trilha sonora e do Modo DEV).

Estrutura real, confirmada no código (`js/progresso.js`) e por leitura direta do `localStorage` após jogo real:

```json
{
  "mundosDesbloqueados": [1, 2, 3],
  "faseMaximaPorMundo": { "1": 3, "2": 1, "3": 1 },
  "fasesConcluidas": ["1-1", "1-2", "1-3", "2-1"]
}
```

- `mundosDesbloqueados`: array de números dos mundos liberados. Começa como `[1]`.
- `faseMaximaPorMundo`: objeto `{ mundoId: maiorFaseLiberadaNesseMundo }`. Começa como `{ 1: 1 }`.
- `fasesConcluidas`: array de strings no formato `"mundo-fase"` (ex.: `"1-1"`), para que a Fase 1 de mundos diferentes não colida.
- **Não existem** campos de pontuação, estrelas, conquistas, recordes ou qualquer métrica de desempenho — apenas os três campos acima.
- Valor inicial (quando a chave não existe): `{ mundosDesbloqueados: [1], faseMaximaPorMundo: { 1: 1 }, fasesConcluidas: [] }`, devolvido por `obterProgresso()` (`progresso.js:43-47`). Confirmado por execução: com `localStorage` vazio, `obterProgresso()` devolveu exatamente essa estrutura.

---

## 2. Fluxo de gravação e leitura

- **Única porta de leitura**: `obterProgresso()` (`progresso.js:37-48`) — lê a chave, faz `JSON.parse` e devolve o objeto, ou devolve o valor padrão se a chave não existir.
- **Única porta de gravação**: `desbloquearProximaFase(faseAtual, mundoAtual, totalFases)` (`progresso.js:60-98`) — chamada em um único lugar do projeto: `registrarConclusaoDaFase()` em `math.js:511-529`, que por sua vez é chamada pelas duas únicas rotas de conclusão de fase (`verificarRespostaMatematica` e `concluirEtapaFinal`, ambas em `math.js`). Não existe gravação paralela de progresso em nenhum outro arquivo.
- **Quem consome os dados**: `menu.js` (`atualizarBotoesModalFases`, `abrirModalFases`, `atualizarInterfaceProgresso`) para decidir o que mostrar como liberado/bloqueado, e `dev.js` para o atalho "Desbloquear Tudo"/"Resetar Progresso". O motor de jogo (`game.js`) e o bootstrap da fase (`main.js`) **nunca leem o progresso** — eles não sabem e não verificam se o jogador "deveria" poder jogar a fase pedida pela URL (ver seção 3).
- **Tratamento de dados ausentes/inválidos**: existe parcialmente, e de forma inconsistente — ver seção 8.

---

## 3. Testes de persistência

| Cenário | Resultado esperado | Resultado observado | Status |
|---|---|---|---|
| `localStorage` vazio → `obterProgresso()` | Estrutura padrão `{mundosDesbloqueados:[1], faseMaximaPorMundo:{1:1}, fasesConcluidas:[]}` | Exatamente essa estrutura | ✅ Confirmado |
| Concluir Mundo 1 Fase 1 (jogo real) | Grava `faseMaximaPorMundo.1 = 2` e adiciona `"1-1"` a `fasesConcluidas` | `{"mundosDesbloqueados":[1],"faseMaximaPorMundo":{"1":2},"fasesConcluidas":["1-1"]}` | ✅ Confirmado |
| Reconcluir a MESMA fase (jogador refaz a Fase 1 depois de já tê-la concluído) | `fasesConcluidas` não deveria duplicar `"1-1"` | `fasesConcluidas` permaneceu `["1-1"]` nas duas vezes | ✅ Confirmado — guarda `includes()` funciona |
| Reload de página após concluir uma fase | Progresso idêntico antes/depois | Idêntico; Fase 2 do Mundo 1 ficou habilitada (`#btn-iniciar-fase2` não desabilitado) | ✅ Confirmado |
| Voltar ao menu de mundos (`index.html?view=mundos`) após concluir | Progresso mantido | Mantido | ✅ Confirmado |
| "Fechar e reabrir" o jogo (nova aba, mesmo perfil de navegador) | Progresso mantido (`localStorage` sobrevive a fechar aba) | Mantido, idêntico | ✅ Confirmado |
| Clicar em JOGAR com progresso real salvo (Fase 1 concluída), **sem** Modo DEV | — | Progresso inteiro apagado (`localStorage.getItem(...)` retornou `null`) | 🔴 Ver achado DP-01 |
| Clicar em JOGAR com progresso real salvo, **com** `?dev=true` | — | Progresso preservado integralmente, idêntico ao de antes do clique | ✅ Confirmado (comportamento do Modo DEV funciona como projetado) |
| Acesso direto por URL à Fase 3 do Mundo 4 (última fase do último mundo implementado), com `localStorage` vazio | Deveria exigir progresso para ser alcançada pela UI | Carregou normalmente, com os 15 objetos reais da fase, totalmente jogável | 🟠 Ver achado DP-02 |
| Concluir de verdade a única fase do Mundo 5 (chegando lá com Mundos 1-4 marcados como concluídos) | `mundosDesbloqueados` ganha o número do "próximo mundo" (6) | Confirmado: `mundosDesbloqueados` passou a incluir `6`, e `faseMaximaPorMundo["6"] = 1` também foi criado | Ver seção "Artefato do Mundo 6" |
| `localStorage` com JSON corrompido (`"{isso nao e json valido"`) | — | `obterProgresso()` lança `SyntaxError` não tratado (2 `pageerror` capturados) | 🟠 Ver achado DP-03 |
| `localStorage` com progresso parcial (`{"mundosDesbloqueados":[1,2]}`, sem os outros dois campos) + jogador conclui uma fase de verdade | — | `desbloquearProximaFase()` lança `TypeError: Cannot read properties of undefined (reading '1')`; a fase NUNCA é marcada como concluída e os botões de conclusão nunca aparecem — o jogo trava silenciosamente após a criança responder corretamente | 🟠 Ver achado DP-04 |
| `localStorage` vazio (chave removida via `localStorage.clear()`) | Mundo 1 continua acessível | Mundo 1 continua sem overlay de bloqueado | ✅ Confirmado |

---

## 4. Desbloqueio de mundos e fases

- **Regra confirmada**: concluir a fase N de um mundo com `N < totalFases` eleva `faseMaximaPorMundo[mundo]` para `N+1` (libera só a próxima fase do MESMO mundo). Concluir a última fase (`N === totalFases`) adiciona `mundo+1` a `mundosDesbloqueados` e inicializa `faseMaximaPorMundo[mundo+1] = 1` (`progresso.js:77-88`).
- **Tratamento do Mundo 5**: não há tratamento especial algum no código de progresso — ele segue exatamente a mesma regra genérica dos Mundos 1-4 (`mundo+1` ao concluir a última/única fase). É essa generalidade, sem checagem de existência, que produz o artefato do "Mundo 6" (seção dedicada abaixo).
- **Representação visual**: `atualizarInterfaceProgresso()` (`menu.js`) adiciona/remove as classes `mundo-bloqueado`/`mundo-disponivel` e mostra/esconde o `.overlay-bloqueado` de cada `.card-mundo`, lendo `mundosDesbloqueados` a cada chamada — reflete corretamente o que está salvo, inclusive quando o progresso muda externamente (ex.: pelo painel DEV).
- **🟠 Divergência confirmada entre progresso salvo e acesso real**: o desbloqueio só existe na CAMADA DE INTERFACE (botões desabilitados, overlays). `main.js`/`game.js` — o motor que de fato carrega e executa uma fase — nunca consultam `obterProgresso()`. Resultado confirmado por execução: com `localStorage` inteiramente vazio, o acesso direto a `fase1.html?mundo=4&fase=3` (a fase final do jogo) carregou os 15 objetos da fase e é 100% jogável, sem qualquer bloqueio, erro ou redirecionamento. Esse comportamento é idêntico em qualquer combinação de mundo/fase, incluindo o Mundo 5. Isso já havia sido confirmado por execução na Tarefa 01 (achado AF-02) com outra fase; aqui foi reconfirmado deliberadamente com a fase mais "protegida" possível (a última do jogo) e com o storage certificadamente vazio.
- Não foi encontrado nenhum caso em que uma fase concluída "volte a aparecer como bloqueada" por iniciativa do próprio jogo — a única forma de isso acontecer é o progresso ser apagado (ver "Botão JOGAR" abaixo) ou editado manualmente.
- Não foi encontrado nenhum caso em que uma fase NÃO concluída apareça como concluída na interface — os cards/botões sempre refletem fielmente o que está no `localStorage` no momento da leitura.

---

## 5. Pontuação e conquistas

**Nada disso está implementado.** Busca exaustiva por `pontuacao`, `score`, `conquista`, `estrela`, `recorde`, `recompensa`, `achievement` e `ranking` em todo o projeto encontrou apenas um comentário em `game.js` (linha 83) que usa a palavra "pontuação" ao descrever a criação seguro de um elemento de **contador de itens** — não é um sistema de pontos.

- **Funcionalidade implementada**: nenhuma.
- **Dado apenas armazenado**: nenhum (os três campos do progresso são todos de desbloqueio/conclusão, não de desempenho).
- **Dado apenas exibido, sem persistência**: a porcentagem da barra de progresso do menu (`atualizarInterfaceProgresso`, `menu.js:253-271`) é calculada a cada chamada, a partir de marcos fixos (10/25/45/66/83/100%) conforme mundos/fases liberados — é um indicador de progressão, não uma pontuação, e não é salva separadamente (é recalculada, não armazenada). O contador de itens organizados por cesta (`updateDropZoneCounter`, `game.js`) também é apenas visual e não persiste entre fases.
- **Funcionalidade prevista, mas ausente**: sim — o próprio `README.md` (linha 63 e linha 249) documenta "pontuação/conquistas" como item do produto completo e lista explicitamente como "ainda não implementado". Não é uma omissão silenciosa; é uma decisão já registrada pela equipe.
- **Requisito que não se aplica ao modelo atual**: não há indicação de que avaliações/estrelas por desempenho sejam um requisito atual — o jogo é de conclusão binária (fez ou não fez a fase), não de pontuação por qualidade.

---

## 6. Botão JOGAR e limpeza de progresso

**Função responsável**: `js/menu.js`, listener do `#botao-jogar` (linhas 275-285):

```js
botaoJogar.addEventListener("click", function () {
  localStorage.removeItem("arruma_bagunca_progresso");
  telaInicial.classList.add("escondido");
  controlesIniciais.classList.add("escondido");
  menuFases.classList.remove("escondido");
  atualizarInterfaceProgresso();
});
```

- **Condição em que acontece**: TODA VEZ que o botão "JOGAR" da tela inicial é clicado — incondicional, não depende de haver ou não progresso salvo.
- **Dados apagados**: a limpeza é TOTAL — `removeItem` apaga a chave inteira (os 3 campos: mundos desbloqueados, fase máxima por mundo, fases concluídas), não uma limpeza parcial.
- **Diferença no Modo DEV**: sim, confirmada por execução. `js/dev.js` (linhas 556-571) intercepta o MESMO clique (um segundo listener no mesmo botão, registrado em modo de captura) e, só quando o Modo DEV está ativo, faz um backup do progresso ANTES do clique e o restaura via `setTimeout(…, 0)` logo depois — o resultado líquido é que, em Modo DEV, o progresso é apagado e imediatamente restaurado, ficando intacto para quem está olhando. Confirmado: sem `?dev=true` o progresso vira `null`; com `?dev=true` o progresso final é idêntico ao de antes do clique.
- **Ocorre em outra situação?** Não — é o único ponto do código que chama `removeItem` nessa chave. Não acontece ao recarregar a página, nem ao navegar entre mundos, nem ao fechar/reabrir o navegador.
- **Impacto sobre o jogador real**: qualquer criança que já tenha progresso salvo (mundos/fases liberados) e clique em "JOGAR" a partir da tela inicial perde TODO o progresso imediatamente, sem aviso, confirmação ou forma de desfazer — e, pelo fluxo normal do jogo, "JOGAR" é exatamente o botão que uma criança clicaria ao reabrir o jogo para continuar jogando.

**Classificação**: 🔴 **possível conflito direto com o requisito de persistência**, não um "comportamento intencional" documentado. O comentário do próprio `dev.js` ("Ao clicar em JOGAR, menu.js chama removeItem. No modo DEV, preservamos o progresso") mostra que a equipe já identificou esse comportamento como algo a CONTORNAR no Modo DEV — o que é evidência de que ele não é desejado para o jogador real, mas o contorno nunca foi aplicado fora do Modo DEV. Isso contradiz diretamente o requisito documentado no `README.md` ("persistência básica de progresso... implementado, multi-mundo") e a seção "Persistência e desbloqueio de progresso" do mesmo arquivo. Recomendo que a equipe reconfirme se isso é intencional (ex.: "JOGAR" deveria sempre recomeçar do zero por design) ou se é o bug que o atalho do Modo DEV sugere que seja.

---

## 7. Artefato do Mundo 6

- **Onde o número 6 é inserido**: `progresso.js`, dentro de `desbloquearProximaFase()` (linha 83): `const proximoMundo = mundo + 1;`. Quando `mundo` é 5 (o Mundo 5), `proximoMundo` é 6.
- **Existe uma regra genérica que desbloqueia `mundoAtual + 1`?** Sim, confirmado — é a MESMA regra usada para todos os mundos (1→2, 2→3, 3→4, 4→5), sem nenhum `if` especial para o Mundo 5 e sem verificar se `window.MUNDOS[mundo+1]` realmente existe antes de desbloquear.
- **Como o dado chega ao `localStorage`**: confirmado por execução real — ao jogar e concluir de fato a única fase do Mundo 5 (5 desafios + organização final), `mundosDesbloqueados` passou de `[1,2,3,4,5]` para `[1,2,3,4,5,6]`, e `faseMaximaPorMundo` ganhou a entrada `"6": 1`.
- **O menu usa esse dado?** Não. `window.MUNDOS[6]` é `undefined` (confirmado), não existe `<div class="card-mundo" data-mundo="6">` no HTML, e o carrossel continua mostrando exatamente 4 cards (Mundos 1-4) antes e depois do dado aparecer.
- **Isso altera a interface?** Não, em nenhum aspecto observável — nenhuma tela, contador ou texto reage ao valor `6` em `mundosDesbloqueados`.
- **O dado interfere em outros cálculos?** Não foi encontrada nenhuma interferência: a barra de progresso do menu (`atualizarInterfaceProgresso`) já atinge 100% ao detectar o Mundo 4 desbloqueado (não há um degrau para "Mundo 5" ou "Mundo 6" na escala), então o `6` não altera esse cálculo.
- **É possível chegar a uma rota real do "Mundo 6"?** Não — `fase1.html?mundo=6&fase=1` cairia no fallback de `main.js` (`mundos[mundoId] || mundos[MUNDO_PADRAO]`), que redireciona silenciosamente para a configuração do Mundo 1, já que `window.MUNDOS[6]` não existe. Não há tela, conteúdo ou mecânica de um "Mundo 6" em lugar nenhum.

**Classificação confirmada**: artefato de dados inofensivo, não uma funcionalidade real nem parcialmente implementada — exatamente como o enunciado desta tarefa antecipa. Risco: 🔵 Baixo, pela ausência total de efeito visível ou funcional; ainda assim, é um sinal de que a regra de desbloqueio não foi escrita pensando no "fim" do conteúdo disponível.

---

## 8. Dados inválidos, antigos ou inconsistentes

Todos os testes abaixo foram feitos em contexto de navegador isolado, com dados fictícios criados só para o teste — nenhum dado real foi apagado ou lido de um usuário.

| Cenário injetado | Resultado |
|---|---|
| `localStorage` sem a chave (nunca existiu) | `obterProgresso()` devolve a estrutura padrão. Sem erro. ✅ |
| `localStorage.clear()` (remoção explícita) | Idêntico ao caso acima — Mundo 1 continua acessível. ✅ |
| JSON corrompido/inválido (`"{isso nao e json valido"`) | `JSON.parse` dentro de `obterProgresso()` lança `SyntaxError` sem nenhum `try/catch` ao redor. Confirmado por 2 `pageerror` reais capturados pelo Playwright. 🟠 Ver DP-03. |
| Objeto vazio válido (`"{}"`) | Nenhum erro. `obterProgresso()` devolve `{}` literalmente — não reconstrói a estrutura padrão, já que o `dados` existe (string não vazia) e só o caso de chave *ausente* cai no padrão. Código que lê os campos individualmente (`menu.js`) tem fallback próprio (`progresso.mundosDesbloqueados || [1]`), então não há crash — mas é uma inconsistência: a "defesa" contra dados incompletos está espalhada pelos pontos de leitura, não centralizada em `obterProgresso()`. |
| Tipos incorretos (`mundosDesbloqueados: "nao-e-array"`, `faseMaximaPorMundo: "nao-e-objeto"`, `fasesConcluidas: null`) | Nenhum erro, porque `String.prototype.includes` também existe e silenciosamente faz uma busca de substring em vez de falhar — o resultado é tecnicamente "errado" (nenhum mundo aparece desbloqueado, mesmo que o número exista como parte da string), mas não há crash visível. |
| Mundo inexistente nos dados (`mundosDesbloqueados: [1,2,99]`, `faseMaximaPorMundo: {99: 5}`, `fasesConcluidas: ["99-1"]`) | Nenhum erro — mesmo comportamento do artefato do Mundo 6: o número "99" fica solto no array, sem card correspondente, sem efeito visível. |
| Valores negativos (`mundosDesbloqueados: [1,-2]`, `faseMaximaPorMundo: {1:-5}`) | Nenhum erro imediato. Não é um caso que o próprio jogo produza (todas as gravações são incrementais e positivas), mas confirma que não há validação/clamping na leitura — um valor negativo hipotético faria a Fase 2/3 do Mundo 1 parecerem bloqueadas mesmo que o jogador já as tivesse liberado antes de qualquer corrupção. |
| Progresso parcial (`{"mundosDesbloqueados":[1]}`, sem `faseMaximaPorMundo` nem `fasesConcluidas`) **seguido de uma conclusão de fase real** | `desbloquearProximaFase()` lança `TypeError: Cannot read properties of undefined (reading '1')` ao tentar acessar `progresso.faseMaximaPorMundo[mundo]` — `faseMaximaPorMundo` é `undefined` nesse cenário. Confirmado por execução real: a criança organiza os objetos, responde a conta corretamente, vê a mensagem de sucesso, e então **a tela trava**: os botões de conclusão (`.acoes-conclusao`) nunca aparecem, e o progresso gravado continua exatamente como antes (`{"mundosDesbloqueados":[1]}`), ou seja, a fase NUNCA é registrada como concluída. 🟠 Ver DP-04. |

**Sobre dados "de uma versão anterior"**: não existe, no código atual, nenhuma lógica de migração/versionamento de progresso (não há campo de versão no objeto, nem checagem de formato antigo). Qualquer progresso salvo por uma versão futura do jogo que mude a estrutura destes 3 campos herdaria os mesmos riscos acima (campos ausentes → possível `TypeError` na próxima conclusão de fase).

---

## 9. Consistência dos dados

- O sistema distingue corretamente **mundo desbloqueado** (`mundosDesbloqueados`) de **fase concluída** (`fasesConcluidas`) e de **fase máxima liberada** (`faseMaximaPorMundo`) — são três campos com propósitos e formatos diferentes, consistentemente usados.
- **Não existe** o conceito de "mundo iniciado, mas não concluído" — o sistema só registra conclusão, nunca progresso parcial dentro de uma fase (coerente: não há nada no requisito documentado que peça isso).
- **"Desafio final concluído" (Mundo 5) não tem tratamento distinto** de uma fase comum — ele é gravado exatamente como a conclusão de qualquer outra última-fase-de-um-mundo, o que é a causa direta do artefato do Mundo 6 (seção 7). Não há, por exemplo, um campo separado como `desafioFinalConcluido: true`.
- A interface (menu) e os dados salvos nunca divergiram nos testes realizados — toda vez que o `localStorage` foi alterado (por jogo real ou por injeção controlada), a próxima leitura do menu refletiu exatamente esse estado.
- A única divergência real encontrada entre "progresso salvo" e "o que é de fato alcançável" é a já descrita na seção 4: a interface respeita o desbloqueio, mas o motor do jogo (acessado diretamente por URL) não.

---

## 10. Aderência aos requisitos

| Requisito documentado (`README.md`) | Estado atual | Evidência | Pendência |
|---|---|---|---|
| "Persistência básica de progresso" | **Parcialmente atendido** | Persistência funciona corretamente entre reload/nova aba/navegação (seção 3), mas é apagada incondicionalmente ao clicar em "JOGAR" fora do Modo DEV (DP-01) | Reconfirmar com a equipe se isso é intencional |
| "Registro de fases concluídas" | **Atendido**, com uma ressalva | Grava corretamente, sem duplicar, sobrevive a reload/nova sessão | A ressalva é a fragilidade a dados corrompidos/parciais (DP-03, DP-04), não a lógica de registro em si |
| "Pontuação/conquistas" | **Não atendido** — mas isso já é esperado | README já documenta como "não implementado" | Nenhuma — não é um requisito pendente desta auditoria, é uma decisão já registrada |
| "Persistência limitada ao navegador local — ainda não há integração com backend externo" | **Atendido** (corretamente descrito) | Confirmado: tudo em `localStorage`, nenhuma chamada de rede relacionada a progresso em nenhum teste | — |
| "Conclusão de uma fase libera a próxima fase do mesmo mundo; concluir a última fase de um mundo libera o mundo seguinte" | **Atendido tecnicamente, mas sem guarda de limite** | Regra funciona para Mundos 1-4; para o Mundo 5 (o último mundo real) produz o artefato do "Mundo 6" | Depende de confirmação da equipe se vale a pena adicionar uma verificação de existência |
| Acesso a fases/mundos deveria respeitar o desbloqueio (inferido do próprio sistema de desbloqueio, não um requisito explícito separado) | **Não verificável como requisito formal**, mas o comportamento real diverge da intenção do próprio sistema | Qualquer fase de qualquer mundo é acessível por URL direta, sem checagem (seção 4) | Depende de confirmação da equipe: é um requisito de verdade, ou a trava de UI já é suficiente para o uso pretendido do jogo? |

Importante: `localStorage` é persistência **local ao navegador do dispositivo**, não um banco de dados compartilhado — não há, nestes requisitos, nenhuma exigência de sincronização entre dispositivos, e o `README.md` já é explícito sobre essa limitação ("ainda não há integração com backend externo"). Nenhuma exigência adicional foi inventada além do que está documentado.

---

## 11. Testes no navegador — registro consolidado

Todos os testes usaram Google Chrome real via Playwright, instalado fora do repositório, servindo o projeto por um servidor HTTP local temporário (também fora do repositório, encerrado ao final). Cada bloco de teste usou um contexto de navegador novo e isolado (perfil limpo), nunca compartilhando dados entre si nem com um navegador real.

Resumo (detalhes completos nas seções 3, 6, 7 e 8):
1. Estrutura padrão com storage vazio.
2. Conclusão real de fase (organização + matemática) e leitura da estrutura gravada.
3. Reconclusão da mesma fase (checagem de duplicação).
4. Persistência através de reload, navegação para o menu e nova aba no mesmo perfil.
5. Botão JOGAR com e sem Modo DEV.
6. Acesso direto por URL a uma fase avançada sem nenhum progresso salvo.
7. Conclusão real da única fase do Mundo 5 (a partir de um estado de Mundos 1-4 semeado diretamente, já validado por jogo real no teste 2) e verificação do artefato do Mundo 6.
8. Seis cenários de dados inválidos/corrompidos/parciais injetados em `localStorage`, incluindo um teste de conclusão de fase real sobre dados parciais (o que revelou DP-04).
9. `localStorage.clear()` e verificação de que o Mundo 1 continua acessível.

**Limitações do teste**: não foi possível (nem relevante) testar sincronização entre dispositivos físicos diferentes, já que o próprio requisito documentado exclui isso do escopo atual. Os cenários de "dados de versão anterior" foram simulados por inferência de código (não existe uma versão anterior real da estrutura de dados disponível neste repositório para testar com dados genuínos).

---

## Achados

### 🔴 DP-01 — Crítico — Botão JOGAR apaga todo o progresso salvo, fora do Modo DEV
- **Tipo**: Perda de dados / conflito com persistência
- **Arquivo**: `js/menu.js:275-285`
- **Comportamento atual**: qualquer clique em "JOGAR" na tela inicial apaga incondicionalmente a chave inteira de progresso (`localStorage.removeItem`), mesmo quando já existe progresso real salvo.
- **Comportamento esperado**: de acordo com o `README.md` ("persistência básica de progresso... implementado"), o progresso deveria sobreviver à navegação normal do jogo — e "JOGAR" é o botão mais óbvio para um jogador que está retomando uma sessão anterior.
- **Passos para reproduzir**: concluir qualquer fase → voltar para a tela inicial (ou fechar e reabrir o jogo) → clicar em "JOGAR" → o progresso desaparece.
- **Evidência**: teste real confirmou `localStorage.getItem("arruma_bagunca_progresso")` igual a `null` imediatamente após o clique, tendo progresso real (Fase 1 concluída) salvo antes.
- **Impacto**: qualquer criança que tenha avançado no jogo e volte a jogar depois perde todo o progresso ao clicar no botão mais natural para continuar.
- **Recomendação futura**: reconfirmar com a equipe se isso é intencional; se não for, o próprio `dev.js` já mostra, em código, exatamente o padrão de correção que a equipe já usou no Modo DEV (backup e restauração em torno do clique).

### 🟠 DP-02 — Alto — Qualquer fase, de qualquer mundo, é acessível por URL direta sem progresso
- **Tipo**: Inconsistência de desbloqueio
- **Arquivo**: `js/main.js` (não lê progresso), `js/game.js` (não lê progresso)
- **Comportamento atual**: o desbloqueio só existe na camada de interface do menu; o motor do jogo carrega e executa qualquer `fase1.html?mundo=X&fase=Y` existente, independente do progresso salvo.
- **Comportamento esperado**: não há um requisito formal e explícito de bloqueio no nível do motor (ver seção 10) — mas o próprio sistema de desbloqueio dá a entender que uma fase bloqueada não deveria ser jogável.
- **Passos para reproduzir**: `localStorage.clear()` → acessar diretamente `fase1.html?mundo=4&fase=3`.
- **Evidência**: a fase carregou com os 15 objetos reais, totalmente jogável, com `localStorage` comprovadamente vazio no momento do acesso.
- **Impacto**: nenhum risco de segurança real (é um jogo educativo client-side, sem dados sensíveis em jogo), mas é uma divergência entre o que a interface comunica ("essa fase está bloqueada") e o que o motor de fato permite.
- **Recomendação futura**: decisão da equipe — se o bloqueio por UI já é suficiente para o uso pretendido, documentar isso como decisão; se não, é um candidato a verificação futura em `main.js`.

### 🟠 DP-03 — Alto — JSON corrompido no progresso quebra `obterProgresso()` sem tratamento
- **Tipo**: Dados inválidos / ausência de tratamento de erro
- **Arquivo**: `js/progresso.js:38` (`JSON.parse(dados)` sem `try/catch`)
- **Comportamento atual**: se a chave `arruma_bagunca_progresso` contiver uma string que não seja JSON válido, toda chamada a `obterProgresso()` lança uma exceção não tratada.
- **Comportamento esperado**: idealmente, dados corrompidos deveriam cair de volta à estrutura padrão, como já acontece quando a chave está simplesmente ausente.
- **Passos para reproduzir**: `localStorage.setItem("arruma_bagunca_progresso", "{isso nao e json valido")` → recarregar a página.
- **Evidência**: 2 `pageerror` reais capturados (`SyntaxError: Expected property name or '}' in JSON...`), um por cada chamada independente de `atualizarInterfaceProgresso()` no carregamento do menu.
- **Impacto**: a tela inicial continua visível (é HTML estático), mas a atualização do estado visual de desbloqueio para aquele ciclo de renderização é interrompida pela exceção — um cenário de corrupção de dados (edição manual, extensão do navegador, bug futuro de gravação) deixaria o menu com informação de desbloqueio desatualizada ou incompleta.
- **Recomendação futura**: envolver o `JSON.parse` em `obterProgresso()` num `try/catch` que caia para a estrutura padrão em caso de erro — mesma reação já usada para a ausência da chave.

### 🟠 DP-04 — Alto — Progresso parcialmente gravado quebra a conclusão de uma fase
- **Tipo**: Dados inválidos / ausência de tratamento de erro
- **Arquivo**: `js/progresso.js:73` (`progresso.faseMaximaPorMundo[mundo]`, assume que `faseMaximaPorMundo` existe)
- **Comportamento atual**: se o objeto de progresso salvo não tiver o campo `faseMaximaPorMundo` (ou `fasesConcluidas`), a próxima conclusão de fase real lança `TypeError: Cannot read properties of undefined (reading '1')` dentro de `desbloquearProximaFase()`.
- **Comportamento esperado**: a conclusão de uma fase não deveria travar silenciosamente mesmo com dados anteriores incompletos.
- **Passos para reproduzir**: `localStorage.setItem("arruma_bagunca_progresso", JSON.stringify({mundosDesbloqueados:[1]}))` → jogar e concluir de verdade a Fase 1 do Mundo 1.
- **Evidência**: `pageerror` real capturado (`TypeError...`); confirmado que, após a criança responder corretamente (feedback de sucesso aparece), os botões `.acoes-conclusao` NUNCA são inseridos na tela, e o progresso salvo permanece exatamente como estava antes da tentativa (`{"mundosDesbloqueados":[1]}`) — a fase não é registrada.
- **Impacto**: sob corrupção de dados (hoje não produzida pelo próprio jogo em uso normal, já que todas as gravações atuais sempre escrevem o objeto completo — ver observação abaixo), uma criança pode responder tudo corretamente e ainda assim ficar "travada" sem nenhum aviso de erro, sem poder avançar nem voltar ao menu pela tela de conclusão.
- **Observação sobre reprodutibilidade em uso normal**: não foi encontrado nenhum caminho do próprio jogo (gravações em `progresso.js`, `menu.js`, `dev.js`) que produza hoje um objeto de progresso parcial como este — a condição exige uma corrupção externa (edição manual, extensão, ou uma mudança futura de código). Por isso a prioridade é 🟠 Alto (impacto severo se ocorrer) e não 🔴 Crítico (baixa probabilidade de ocorrer espontaneamente hoje).
- **Recomendação futura**: `desbloquearProximaFase()` poderia garantir a forma do objeto (preenchendo campos ausentes com os valores padrão) antes de operar sobre eles — o mesmo padrão defensivo que `menu.js` já aplica em alguns pontos de leitura (`progresso.mundosDesbloqueados || [1]`).

### 🔵 DP-05 — Baixo — Artefato "Mundo 6" em `mundosDesbloqueados`/`faseMaximaPorMundo`
- Ver seção 7 completa. Prioridade baixa pela ausência total de efeito visível ou funcional confirmado — é um número órfão dentro de um array/objeto persistido, nunca lido de volta por nenhuma tela ou cálculo.

### 💡 DP-06 — Melhoria — Leitura de progresso sem validação de tipos/limites
- **Tipo**: Melhoria
- **Arquivo**: `js/progresso.js`, `obterProgresso()`
- Tipos incorretos (string em vez de array) e valores negativos não causam erro, mas produzem resultados tecnicamente incorretos de forma silenciosa (ver seção 8). Não há evidência de que o próprio jogo produza esses casos hoje; é uma oportunidade de robustez, não um bug observado em uso normal.

---

## Resumo

- **Mecanismos de persistência existentes**: 1 — `localStorage`, chave única `arruma_bagunca_progresso`, com 3 campos (`mundosDesbloqueados`, `faseMaximaPorMundo`, `fasesConcluidas`). Nenhuma pontuação/conquista é armazenada (confirmado como decisão documentada, não uma omissão).
- **Testes realizados**: 9 blocos de teste reais em Chrome via Playwright (estrutura inicial, conclusão real de fase, reconclusão, persistência entre sessões, botão JOGAR com/sem DEV, acesso direto bloqueado, artefato do Mundo 6 via jogo real, 6 cenários de dados inválidos, `localStorage.clear()`).
- **Problemas de gravação/leitura confirmados**: 2 (DP-03 JSON corrompido quebra a leitura; DP-04 progresso parcial quebra a gravação na conclusão de fase).
- **Problemas de desbloqueio confirmados**: 1 (DP-02 — qualquer fase é acessível por URL direta, independente do progresso real).
- **Riscos de perda de progresso confirmados**: 1, e é o mais severo de toda a auditoria (DP-01 — botão JOGAR apaga tudo fora do Modo DEV).
- **Artefatos de dados confirmados, sem efeito funcional**: 1 (DP-05 — "Mundo 6").
- **Requisitos documentados**: 2 atendidos integralmente (persistência local sem backend; pontuação/conquistas corretamente marcada como não implementada), 2 parcialmente atendidos (persistência básica — quebrada pelo botão JOGAR; registro de fases concluídas — funciona, mas frágil a dados corrompidos), 1 sem requisito formal correspondente (bloqueio de acesso direto por URL).
- **Decisões que precisam ser confirmadas pela equipe**: (1) se a limpeza de progresso ao clicar em JOGAR é intencional ou um bug — a existência do contorno em `dev.js` sugere que não é intencional para o jogador real; (2) se o acesso direto a fases bloqueadas por URL é aceitável para o uso pretendido do jogo ou merece uma verificação futura no motor.
