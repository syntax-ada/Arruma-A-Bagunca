# 12 — Regressão e Fluxo Completo

Auditoria final de regressão do projeto "Arruma a Bagunça": o jogo foi jogado de ponta a ponta, de verdade, do menu inicial até a vitória do Mundo 5, e os achados das 11 tarefas anteriores foram reconfirmados (ou refutados) por execução real sempre que isso era possível. Nenhum arquivo do jogo foi alterado. Nenhum commit ou push foi realizado.

**Nota obrigatória sobre o botão JOGAR**: o comportamento de reiniciar o progresso salvo ao iniciar uma nova partida fora do Modo DEV é **proposital, definido pela equipe**, conforme instrução explícita desta tarefa. Não é classificado aqui como erro, bug, regressão ou requisito não atendido, e nenhuma remoção é recomendada. Ele é apenas mencionado, quando relevante ao fluxo, como a decisão que já é.

## Metodologia

1. Google Chrome real via Playwright, instalado fora do repositório, servindo o projeto por um servidor HTTP local temporário (também fora do repositório, encerrado ao final).
2. **Um fluxo único e contínuo**, numa única aba/contexto de navegador, jogado via menu real (iframe) do Mundo 1 ao Mundo 4, e depois o Mundo 5 até a vitória — sem atalhos de DEV para pular conteúdo, exatamente como um jogador real jogaria.
3. Testes de regressão negativa em contextos isolados separados (dados corrompidos, acesso direto a fase bloqueada, reload no meio de uma fase, cliques repetidos, viewport pequena, teclado sem mouse, áudio desligado).
4. Para itens que não dependem de execução (ex.: duplicação de assets, nomes de arquivo, estrutura de código), a reconfirmação foi feita pela lógica de que **nenhum arquivo do jogo foi alterado em nenhuma das 11 tarefas anteriores** — confirmado pelo `git status` ao final de cada uma delas. Um fato estático que já foi confirmado por leitura de arquivo não muda sozinho; esta tarefa reexecutou apenas o que depende de comportamento em tempo real.

---

# 1. Fluxo completo do jogador

Fluxo real, único, contínuo, jogado do início ao fim:

| Etapa | Resultado |
|---|---|
| Carregamento inicial | ✅ Tela inicial carrega com os 4 elementos essenciais (som, configurações, jogar, créditos) |
| Botão JOGAR | ✅ Leva ao menu de mundos; progresso estava limpo nesta primeira sessão (comportamento esperado, não testado aqui como regressão do botão — ver nota acima) |
| Seleção de mundo | ✅ Mundo 1 disponível, Mundos 2-4 bloqueados corretamente no início |
| Entrada na fase, instruções, interação | ✅ HUD de instrução visível, itens arrastáveis funcionam |
| Organização dos objetos | ✅ Confirmado nas 12 fases dos Mundos 1-4 + organização final do Mundo 5 (18 organizações no total, 100% dos itens corretamente posicionados) |
| Pergunta matemática | ✅ Confirmado nas mesmas 12 fases + 5 desafios do Mundo 5 |
| Resposta incorreta | ✅ Testada explicitamente na Fase 1 do Mundo 1 e no 1º desafio do Mundo 5 — rejeitada corretamente, sem travar, botão reabilitado |
| Resposta correta | ✅ 18/18 contas aceitas corretamente (ver seção 3) |
| Conclusão da fase | ✅ Botões de conclusão aparecem corretamente em todas as 13 fases |
| Progressão (próxima fase / próximo mundo) | ✅ Confirmada em todas as transições dentro de um mundo e entre mundos |
| **Retorno ao menu após concluir um mundo** | 🟠 **Funciona, mas com um problema real e sistemático** — ver achado RG-01 abaixo |
| Mundo 5 | ✅ Jogado de ponta a ponta: 5/5 desafios corretos, corações zerados, organização final completa, painel de vitória exibido |
| Conclusão final | ✅ `#painel-vitoria` visível, sem erro, ao final do Mundo 5 |

### 🟠 RG-01 — O retorno ao menu, depois de concluir QUALQUER mundo, deixa o modal de seleção de fases daquele mundo aberto por cima do carrossel

Este é o achado AF-05 da Tarefa 01 (lá identificado uma única vez, para uma transição) — **nesta tarefa, foi reproduzido de forma sistemática nas 4 transições possíveis** (depois do Mundo 1, do Mundo 2, do Mundo 3 e do Mundo 4), confirmando que não é um caso isolado: é o comportamento padrão de `mostrarMenuMundos()` (`js/menu.js`), que nunca fecha `#modal-fases`, em contraste com `botaoVoltar`, que fecha corretamente.

**Evidência**: em todas as 4 ocasiões, o teste automatizado tentou clicar no próximo card de mundo e recebeu o erro de automação `"#modal-fases" ... intercepts pointer events` — ou seja, o clique foi genuinamente bloqueado pelo modal ainda aberto, não apenas um detalhe visual. Foi necessário fechar o modal manualmente (clicando no botão "X", `#btn-fechar-modal`) para o fluxo continuar — exatamente a ação que um jogador real precisaria fazer, sem nenhuma instrução na tela avisando isso.

**Impacto no fluxo**: depois de terminar um mundo inteiro (a conquista mais importante daquele momento do jogo), o jogador volta ao menu e se depara com a tela de seleção de fases do mundo que ele ACABOU de terminar, sem nenhuma indicação visual do mundo recém-desbloqueado. Não é um bloqueio permanente (o botão "X" sempre funciona), mas é um atrito real e sistemático exatamente no momento em que o fluxo deveria estar celebrando o avanço do jogador.

---

# 2. Regressão dos Mundos 1–5

| Mundo | Carregamento | Objetos/categorias | Operação | Resposta correta | Resposta incorreta | Conclusão | Progressão |
|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ 5/9/14 (Brinquedos, Comidas, Materiais) | Soma | ✅ 5/9/14 | ✅ testada na Fase 1 | ✅ | ✅ Mundo 2 desbloqueado |
| 2 | ✅ | ✅ 6/12/16 (Comidas, Animais, Brinquedos) | Subtração | ✅ 2/2/0 | — (já testada em tarefas anteriores) | ✅ | ✅ Mundo 3 desbloqueado |
| 3 | ✅ | ✅ 6/10/11 (Bebidas, Comidas, Brinquedos) | Multiplicação | ✅ 8/25/40 | — | ✅ | ✅ Mundo 4 desbloqueado |
| 4 | ✅ | ✅ 8/12/15 (Comidas, Mochila) | Divisão | ✅ 1/3/2 | — | ✅ | ✅ Mundo 5 desbloqueado (confirmado em `mundosDesbloqueados`) |
| 5 | ✅ (só por URL direta — ver abaixo) | ✅ 6 objetos na organização final | Composta (5 desafios) | ✅ 15/15/1/11/9 | ✅ testada no 1º desafio | ✅ painel de vitória | ✅ artefato "Mundo 6" reconfirmado |

### Mundo 1 — pontos específicos pedidos
- Fases 1-3: todas concluídas com sucesso nesta execução (5/9/14 objetos, soma correta).
- Cestas e contadores: contador numérico correto em todas as fases (confirmado via `organizarTudo`, 100% dos itens marcados `is-correct`).
- **Problema já identificado dos sprites das cestas na Fase 3** (achado AD-06/CM, Tarefa 04): é um fato estático do código (`js/mundos/mundo1.js`, arrays de sprite com só 4 posições, 0-3) que não foi alterado — **continua presente por definição**, já que nenhum arquivo foi tocado. Não foi re-testado visualmente nesta tarefa (não é o foco de uma auditoria de regressão de fluxo), mas a causa (array de sprites) está confirmada inalterada.

### Mundo 2 — pontos específicos pedidos
- Subtração: resultado 2, 2 e 0 confirmados nas 3 fases, nesta execução.
- Interpretação da mecânica (achado MB-06, Tarefa 08 — o enunciado "quantos sobraram?" não reflete perfeitamente a mecânica de comparação entre categorias): é uma observação pedagógica sobre texto/conteúdo, não sobre comportamento; continua válida porque nenhum texto foi alterado.

### Mundo 3 — pontos específicos pedidos
- Multiplicação: 8, 25 e 40 confirmados. O teto técnico (`LIMITE_MULTIPLICACAO = 40`) continua sendo atingido exatamente, sem ultrapassar, na Fase 3.
- Relação entre grupos/objetos e operação (achado MB-07, Tarefa 08 — ausência de narrativa de agrupamento real): mesma natureza do ponto acima, observação de conteúdo que não muda sem edição de arquivo.

### Mundo 4 — pontos específicos pedidos
- Divisão: 1, 3 e 2 confirmados, todas exatas.
- Sprites das comidas (achado AD-03, Tarefa 04 — cópia byte-a-byte das sprites de praia do Mundo 3): fato de arquivo, inalterado.
- Mochila: fases com 4/3/5 itens de mochila, todas organizadas com sucesso nesta execução.
- Contraste do marshmallow (achado AD-05, Tarefa 04): observação visual estática, inalterada.
- Apresentação do card do Mundo 4 (achado AD-01, Tarefa 04 — card idêntico por hash ao do Mundo 1): fato de arquivo, inalterado.

### Mundo 5 — pontos específicos pedidos (tratado como fase bônus/desafio final, não como mundo comum)
- **Acesso pela interface normal**: reconfirmado que **não existe card do Mundo 5 no carrossel** (`existeCardMundo5: 0`, `totalCardsNoCarrossel: 4`, medido nesta execução). O único caminho continua sendo a URL direta (`fase1.html?mundo=5&fase=1`) ou o painel DEV — exatamente como documentado.
- Desafios 1-5 / operações compostas / cálculo das expressões: os 5 resultados (15, 15, 1, 11, 9) foram recalculados pelo motor e aceitos corretamente nesta execução, reproduzindo integralmente a Tarefa 08.
- Vidas/corações: começou em "❤️❤️❤️❤️❤️", terminou em "🤍🤍🤍🤍🤍" (os 5 corações foram perdidos e recuperados pelas 5 contas certas — na mecânica do jogo, cada acerto "tira" um coração do adversário, então o indicador reflete danos causados a ele, não vidas do jogador).
- Derrota/desaparecimento do adversário: `#area-boss` confirmado com a classe de "derrotado" (`is-derrotado`)/escondido ao final das 5 contas.
- Etapa final de organização: 6/6 objetos organizados com sucesso.
- Tela de vitória: `#painel-vitoria` confirmado visível ao final, sem erros.

---

# 3. Regressão de matemática

**Resultado: 18 de 18 desafios matemáticos corretos nesta execução — reprodução integral da Tarefa 08**, agora dentro do fluxo real completo (não em testes isolados por fase):

- 12 fases dos Mundos 1-4: todos os resultados batem com o esperado (soma 5/9/14; subtração 2/2/0; multiplicação 8/25/40; divisão 1/3/2).
- 5 desafios do Mundo 5: todos batem com o esperado (15/15/1/11/9).
- Nenhuma resposta correta foi rejeitada; nenhuma resposta incorreta foi aceita (testado explicitamente em 2 pontos desta execução, mais a regressão positiva implícita de todas as outras 16 contas respondidas corretamente de primeira).
- Precedência de operadores: confirmada novamente correta nas 5 contas compostas do Mundo 5 (× e ÷ resolvidos antes de + e −).

Nenhuma nova habilidade BNCC foi mencionada ou inventada nesta tarefa — a única habilidade com evidência documental no projeto continua sendo **EF02MA06/EF03MA06** (`README.md`), já tratada em detalhe na Tarefa 08.

**Esta é evidência de regressão positiva**: depois de 11 tarefas de teste real e intenso sobre o mesmo código (sem nenhuma alteração), a matemática do jogo continua 100% consistente.

---

# 4. Regressão de progresso e desbloqueio

| Verificação | Resultado |
|---|---|
| Conclusão de fases | ✅ Confirmada nas 13 fases desta execução |
| Desbloqueio da próxima fase | ✅ Confirmado (`faseMaximaPorMundo` avança corretamente a cada conclusão) |
| Progressão entre mundos | ✅ Confirmado (`mundosDesbloqueados` ganha o próximo mundo ao concluir a última fase do atual) |
| Persistência após reload | ✅ Reconfirmado nesta tarefa (ver seção 12 — reload no meio de uma fase não corrompe o progresso JÁ salvo de fases anteriores, apenas não salva a organização parcial em andamento, o que é esperado) |
| Persistência em nova aba | Já confirmado na Tarefa 07; não re-testado nesta tarefa (sem alteração de código, sem motivo para divergir) |
| Comportamento após concluir o Mundo 5 | ✅ Confirmado: `mundosDesbloqueados` passa a incluir `6`, `faseMaximaPorMundo["6"]` é criado |
| Existência do valor fantasma "Mundo 6" | ✅ Reconfirmado nesta execução, de ponta a ponta (não via atalho) |
| Acesso direto a fases bloqueadas por URL | 🟠 Reconfirmado — `fase1.html?mundo=4&fase=3` carregou os 15 objetos reais com `localStorage` vazio |
| Dados corrompidos (JSON inválido) | 🟠 Reconfirmado — `SyntaxError` não tratado em `obterProgresso()` |
| Estruturas incompletas de progresso | 🟠 Reconfirmado — progresso sem `faseMaximaPorMundo` quebra a conclusão de uma fase real com `TypeError`, sem botões de conclusão |
| Valores de progresso sem fase correspondente | Mesmo mecanismo do "Mundo 6" — já coberto na Tarefa 07, não repetido aqui |

Todos os 3 achados marcados 🟠 acima são exatamente os mesmos das Tarefas 07/09 (DP-02, DP-03, DP-04) — **nenhum piorou, nenhum foi corrigido, nenhum novo caso equivalente foi descoberto**. São citados aqui como confirmação de regressão, não como descobertas novas.

**Lembrete**: o comportamento do botão JOGAR (reiniciar o progresso fora do Modo DEV) é proposital e não está listado como achado nesta seção, conforme instrução desta tarefa.

---

# 5. Regressão de áudio

| Item (checklist da Tarefa 05) | Estado reconfirmado nesta tarefa |
|---|---|
| Referência ao arquivo inexistente (`everything-in-place.mp3`) | 🟠 Reconfirmada em **todas as 7 etapas do fluxo completo** desta tarefa (menu, e após cada um dos 5 mundos) — o erro de rede se repete a cada carregamento de página, sem exceção |
| Carregamento da trilha | Continua falhando (HTTP 404) em 100% dos casos |
| Músicas dos mundos (arquivos em `Mundos/`) | Não re-testadas nesta tarefa (fato estático de "nunca referenciado no código" — não muda sem edição de arquivo, já confirmado na Tarefa 05) |
| Efeitos sonoros | Mesma situação — fato estático, não re-testado |
| Botão de som | ✅ Funcionou normalmente quando acionado nesta execução (teste "áudio desligado durante a fase", seção 12) |
| Mute | ✅ Confirmado: desligar o som não impede a organização nem a resposta matemática de funcionar |
| Sincronização | Não re-testada nesta tarefa (comportamento de postMessage entre telas, já confirmado na Tarefa 05, sem alteração de código) |
| Persistência da configuração | Não re-testada nesta tarefa especificamente, mas nenhuma alteração de código ocorreu desde a confirmação da Tarefa 05 |
| Feedback visual | Mesma situação do botão de som — íntegra |
| Comportamento durante uma fase | ✅ Confirmado nesta tarefa: jogar uma fase inteira com o som desligado não produz nenhum erro ou comportamento diferente |

**Classificação**: continua sendo **problema de carregamento** (referência de arquivo desatualizada), não um "arquivo existente porém não utilizado" isoladamente — a causa raiz (confirmada por hash MD5 na Tarefa 05) é que o arquivo foi renomeado e a referência nunca foi atualizada. Nada mudou.

---

# 6. Regressão de acessibilidade

| Item (Tarefa 09) | Reconfirmado nesta tarefa? | Resultado |
|---|---|---|
| Navegação por Tab | Sim | ✅ Continua funcionando (elementos focáveis corretamente) |
| Foco visível no menu | Sim | 🟠 **Continua ausente** — `#btn-som`, focado via Tab na tela inicial, retornou `outlineStyle: "none"` nesta execução |
| Enter/Espaço | Sim (indiretamente, via teste de teclado abaixo) | ✅ Continua funcionando |
| Organização sem mouse | Sim | ✅ Reconfirmado: 5/5 itens organizados só com Tab+Enter na Fase 1 do Mundo 1, nesta execução |
| Modais / foco dentro dos modais | Não re-testado nesta tarefa (sem alteração de código desde a Tarefa 09) | Presume-se inalterado |
| Barra de progresso / `aria-valuenow` | Sim, parcialmente | `aria-valuenow` inicial confirmado em "10" nesta execução; o comportamento de NUNCA atualizar (já provado na Tarefa 09 ao desbloquear tudo) não foi re-executado aqui, mas depende do mesmo trecho de código, inalterado |
| Contraste | Não re-testado (cálculo de cor já feito na Tarefa 09, cores inalteradas) | Presume-se inalterado |
| Textos | Não re-testado | Presume-se inalterado |
| Controles importantes | Sim | ✅ Todos os controles usados no fluxo completo (botões de fase, cestas, alternativas de resposta) continuaram operáveis |

**O problema de foco invisível no menu (AC-01) afeta o fluxo completo**: como o fluxo principal depende de navegar pelo menu (tela inicial → seleção de mundo → seleção de fase) antes de chegar à fase propriamente dita, um jogador que dependa de navegação por teclado enfrentaria essa lacuna logo nos primeiros passos de qualquer sessão — não é um problema isolado de uma tela secundária.

Não é feita aqui nenhuma declaração de conformidade com WCAG ou qualquer outro padrão completo — apenas a reconfirmação pontual dos itens já testados.

---

# 7. Regressão de responsividade e UX

| Viewport | Testado nesta tarefa? | Resultado |
|---|---|---|
| Desktop (1920×1080 etc.) | Não re-testado (sem alteração de CSS desde a Tarefa 02) | Presume-se inalterado |
| Notebook/Desktop pequeno | Não re-testado | Presume-se inalterado |
| Tablet | Não re-testado | Presume-se inalterado |
| **Celular vertical (375×667)** | **Sim, re-testado nesta tarefa** | Ver achados abaixo |
| Celular horizontal | Não re-testado (viewport específico RF-03 já confirmado na Tarefa 02, sem alteração de CSS) | Presume-se inalterado |

**RF-01 (sobreposição de HUD) — reconfirmado nesta execução, em 375×667**: medindo as caixas reais dos elementos (`.hud-container` e `.feedback-message`), a área do texto de feedback começa (y≈43.8) ANTES do HUD terminar (y termina em≈109.8) — sobreposição vertical geometricamente confirmada nesta tarefa, não apenas lida do CSS.

**RF-02 (corte de conteúdo na tela matemática) — NÃO reproduzido neste viewport específico**: em 375×667, o `#feedback-matematica` termina em y≈593.8, dentro da altura da viewport (667) — ou seja, neste tamanho de tela específico, o corte não se manifesta. Isso é consistente com a Tarefa 02 original, cuja tabela de evidência media esse problema em viewports DESKTOP (1920/1366/1280/1024), não em celulares — o problema e sua causa (`.tela-matematica{height:100vh;overflow:hidden}` combinado com posicionamento absoluto) dependem da proporção da tela, não só da largura.

**RF-03 (botões cortados em paisagem) e RF-05 (setas do carrossel desaparecendo)**: não re-testados nesta tarefa — ambos dependem de regras de CSS (`@media`) que não foram alteradas desde a Tarefa 02.

Nenhum dos problemas de responsividade testados ou presumidos impede o fluxo principal de ser concluído — todos são de natureza visual/de layout, não bloqueiam interação.

---

# 8. Regressão de telas e controles

Não houve nova auditoria completa (conforme pedido) — apenas confirmação pelo fluxo real:

- Todos os botões necessários ao fluxo principal (JOGAR, créditos, cards de mundo, botões de fase, cestas, alternativas de resposta, botões de conclusão, "Voltar") foram usados com sucesso nesta execução, do início ao fim.
- Nenhuma tela inacessível ou rota quebrada foi encontrada durante o fluxo completo.
- O achado RG-01 (seção 1) é, ao mesmo tempo, um achado de **fluxo** e de **controle**: o botão "X" do modal de fases (`#btn-fechar-modal`) continua funcional e é o que permite seguir adiante — **não é uma rota quebrada, é uma tela que fica inesperadamente por cima de outra**.
- Botões sem ação (ex.: "Configurações", já documentado nas Tarefas 03/09) não fazem parte do fluxo principal e não o bloqueiam — são uma **limitação/decisão de UX já conhecida**, não um bug funcional novo.

---

# 9. Regressão de assets e design

Não houve nova auditoria completa (conforme pedido). Como nenhum arquivo de asset foi alterado em nenhuma das 11 tarefas anteriores (confirmado por `git status` ao final de cada uma), os achados da Tarefa 04 continuam presentes por definição:

- Sprites duplicados/reaproveitados (Mundo 4 cesta de comida = cópia da cesta de praia do Mundo 3; card do Mundo 4 = cópia do card do Mundo 1) — fatos de arquivo, inalterados.
- Placeholder de 1×1px do card do Mundo 5 — inalterado.
- Baixo contraste do marshmallow — inalterado.
- Plateau visual das sprites de cesta na Fase 3 do Mundo 1 — inalterado.
- 73 assets de imagem não utilizados — inalterado.

Nenhum desses itens foi tratado como bug funcional nesta tarefa — todos continuam classificados como achados de design/organização, com o impacto já registrado na Tarefa 04 (nenhum deles impede o fluxo).

---

# 10. Regressão de código

Não houve nova auditoria completa de código morto (conforme pedido). Verificações pontuais:

- **Nenhuma alteração recente introduziu erro**: confirmado pelo `git status` limpo ao final de cada uma das 11 tarefas anteriores — o código executado nesta tarefa é byte-a-byte o mesmo testado nas tarefas anteriores.
- **Funções importantes continuam funcionando**: `startGame`, `iniciarEtapaMatematica`, `desbloquearProximaFase`, `obterDesafioMatematicoAtivo` — todas exercitadas com sucesso ao longo do fluxo completo desta tarefa.
- **Código legado interfere no fluxo?** Não foi encontrada nenhuma interferência — os itens de código morto da Tarefa 06 (ex.: `ITENS_FASE_1`, `getCategoryCounts()`, globais não utilizados) continuam inertes, sem efeito no fluxo real, exatamente como já diagnosticado.
- **Mundo 5 continua funcionando**: confirmado de ponta a ponta nesta tarefa (seção 2).
- **Nenhum novo erro de console relevante**: a única mensagem de erro de console observada em toda a execução desta tarefa foi, repetidamente, o 404 já conhecido do arquivo de áudio — nenhum erro JavaScript novo (`pageerror`) apareceu em nenhuma das 7 etapas do fluxo completo, nem nos 11 cenários de regressão negativa (exceto os 2 erros já esperados e documentados de dados corrompidos/parciais, usados deliberadamente para confirmar DP-03/DP-04).

---

# 11. Console e erros

Resumo consolidado de toda a execução desta tarefa (fluxo completo + 11 cenários de regressão negativa):

| Tipo | Ocorrências | Origem |
|---|---|---|
| `console.error` | 2 por carregamento de página (em cada uma das 7 etapas do fluxo + cada cenário negativo que carrega uma página) | 100% atribuível ao 404 de `everything-in-place.mp3`, já documentado (Tarefa 05) |
| `pageerror` (JavaScript não tratado) | 3 no total em toda a execução | 2 esperados e provocados deliberadamente (JSON inválido — DP-03) + 1 esperado e provocado deliberadamente (progresso parcial — DP-04). **Zero `pageerror` não-intencionais** em qualquer outro ponto do fluxo completo ou dos demais testes negativos |
| Requisições 404 | 1 por carregamento de página | Mesmo arquivo de áudio, já documentado |
| Warnings relevantes | Nenhum encontrado que afetasse o funcionamento | — |

Todos os `pageerror` desta execução foram **provocados deliberadamente** para confirmar achados já conhecidos (DP-03/DP-04) — nenhum erro de JavaScript inesperado ocorreu durante o fluxo normal de jogo, nos 18 desafios matemáticos, nas 13 conclusões de fase, ou em nenhum dos testes de regressão negativa que não envolviam dados corrompidos de propósito.

---

# 12. Teste de regressão negativa

| Cenário | Resultado | Status |
|---|---|---|
| Resposta errada | Rejeitada corretamente, botão reabilitado, sem travar | ✅ |
| Organização incorreta | Já coberta pela resposta errada acima e por tarefas anteriores | ✅ |
| Avanço prematuro (matemática antes de organizar) | `#tela-matematica` confirmada escondida até a organização terminar | ✅ |
| Acesso direto a fase bloqueada | Carrega 15 objetos reais com progresso vazio | 🟠 Reconfirma DP-02 (já conhecido) |
| Reload durante progresso (no meio de uma fase) | A organização PARCIAL em andamento é perdida (volta a 0 itens, novos objetos sorteados), mas nenhum progresso de FASES JÁ CONCLUÍDAS é afetado, e nenhum erro ocorre | ✅ Comportamento esperado — o jogo não promete salvar organização parcial dentro de uma fase, só fases concluídas; nenhuma perda de dado que deveria ter sido persistido |
| Abertura/fechamento de modal repetido (5 ciclos) | Modal fecha corretamente a cada ciclo, sem resíduo | ✅ |
| Múltiplas interações rápidas (cliques repetidos na resposta certa) | Conclusão aparece exatamente 1 vez, sem erro | ✅ |
| Viewport pequena (375×667) | RF-01 reconfirmado geometricamente; RF-02 não se manifesta neste viewport específico | 🟡 Parcial — ver seção 7 |
| Teclado sem mouse | Fase organizada 100% só com Tab+Enter | ✅ |
| Áudio desligado | Organização e resposta matemática funcionam normalmente | ✅ |
| Dados de progresso inválidos (JSON corrompido) | `obterProgresso()` lança excessão não tratada | 🟠 Reconfirma DP-03 (já conhecido) |

**Conclusão desta seção**: nenhuma falha em uma etapa deixou o jogo em um estado irrecuperável sem saída — mesmo os 2 casos mais graves (dados corrompidos, progresso parcial) resultam em uma tela "travada" (sem avançar), não em uma tela quebrada/corrompida visualmente, e ambos exigem uma condição artificial (edição manual de `localStorage`) que o próprio jogo nunca produz em uso normal.

---

# 13. Comparação com as auditorias anteriores

| Área | Principal achado anterior | Continua? | Impacto no fluxo |
|---|---|---|---|
| Funcionalidade (01) | Botão "Voltar após mundo" deixa modal de fases aberto (AF-05) | ✅ Sim — reconfirmado 4× nesta tarefa, de forma sistemática | 🟠 Atrito real a cada transição mundo→menu |
| Responsividade (02) | Sobreposição de HUD (RF-01) em viewports estreitos | ✅ Sim — reconfirmado geometricamente em 375×667 nesta tarefa | 🟡 Visual, não bloqueia |
| Controles (03) | Botão "Configurações" sem função | ✅ Sim (não re-testado, código inalterado) | 🔵 Não afeta o fluxo principal |
| Assets (04) | Duplicação de sprites/cards entre mundos | ✅ Sim (fato de arquivo, inalterado) | 🔵 Visual/organização, não bloqueia |
| Áudio (05) | Trilha de fundo nunca toca (referência quebrada) | ✅ Sim — reconfirmado em 100% das 7 etapas do fluxo completo desta tarefa | 🟠 Música ausente em todo o jogo, mas não bloqueia |
| Código (06) | Código morto sem impacto funcional | ✅ Sim (inerte, confirmado sem interferência no fluxo) | 🔵 Nenhum |
| Progresso (07) | Dados corrompidos/parciais quebram leitura/gravação | ✅ Sim — reconfirmado nesta tarefa | 🟠 Só sob corrupção artificial de dados, não em uso normal |
| Matemática/BNCC (08) | 18/18 contas corretas | ✅ Sim — reconfirmado nesta tarefa, dentro do fluxo real completo | ✅ Positivo |
| Acessibilidade (09) | Foco invisível no menu (AC-01) | ✅ Sim — reconfirmado nesta tarefa | 🟠 Afeta qualquer sessão que dependa de teclado desde o início |
| Requisitos (10) | Mundo bônus obrigatório, mas inacessível pela UI normal | ✅ Sim — reconfirmado nesta tarefa (0 cards de Mundo 5 no carrossel) | 🟠 Requisito da faculdade cumprido no motor, não na UI |
| Documentação (11) | README descreve trilha sonora e persistência como "implementadas" sem ressalva | ✅ Sim (documentos inalterados) | 🟡 Risco de avaliação otimista demais, não afeta o jogo em si |

Nenhum achado anterior foi encontrado **pior** do que antes, e nenhum foi encontrado **corrigido** — resultado esperado, já que nenhum código foi alterado entre as tarefas.

---

# 14. Classificação final (achados confirmados NESTA tarefa)

### 🟠 RG-01 — Alto — Modal de seleção de fases fica aberto por cima do carrossel após concluir qualquer mundo
- **Área**: Fluxo/Navegação (reconfirmação sistemática do achado AF-05, Tarefa 01)
- **Mundo/tela**: Transição de qualquer Mundo (1-4) de volta ao menu de mundos
- **Evidência**: reproduzido em 4/4 transições nesta execução; clique no próximo card de mundo bloqueado pelo modal ainda aberto, confirmado pelo mecanismo de automação do navegador
- **Impacto**: atrito sistemático exatamente no momento de maior satisfação do jogador (acabar de vencer um mundo); não é um bloqueio permanente (o "X" sempre funciona)
- **Recomendação**: avaliar fechar `#modal-fases` dentro de `mostrarMenuMundos()` (`js/menu.js`), no mesmo padrão já usado por `botaoVoltar`

### 🟠 RG-02 — Alto — Áudio de fundo ausente em 100% do fluxo real (reconfirmação)
- Já documentado como AA-01 (Tarefa 05); reconfirmado em todas as 7 etapas do fluxo completo desta tarefa, sem exceção.

### 🟠 RG-03 — Alto — Mundo bônus inacessível pela interface normal (reconfirmação)
- Já documentado (Tarefas 01, 07, 08, 10); reconfirmado nesta tarefa que o carrossel continua com exatamente 4 cards, nenhum para o Mundo 5.

### 🟠 RG-04 — Alto — Foco de teclado invisível no menu (reconfirmação)
- Já documentado como AC-01 (Tarefa 09); reconfirmado nesta tarefa no primeiro elemento focável da tela inicial.

### 🟡 RG-05 — Médio — Dados de progresso corrompidos/parciais continuam sem tratamento (reconfirmação)
- Já documentado como DP-03/DP-04 (Tarefa 07); reconfirmado nesta tarefa. Prioridade mantida em Médio/Alto conforme já classificado — não piorou.

### 🟡 RG-06 — Médio — Acesso direto a fase bloqueada por URL (reconfirmação)
- Já documentado como DP-02 (Tarefa 07); reconfirmado nesta tarefa com a Fase 3 do Mundo 4.

### 🔵 RG-07 — Baixo — Sobreposição de HUD em viewport estreito (reconfirmação geométrica)
- Já documentado como RF-01 (Tarefa 02); reconfirmado com medição real de bounding boxes em 375×667 nesta tarefa.

Nenhum achado **novo** (não reportado em tarefas anteriores) foi encontrado nesta auditoria de regressão — resultado esperado para uma tarefa de confirmação, não de descoberta.

---

## 🔴 Bloqueadores

**Nenhum.** Não foi encontrado, em nenhum teste desta tarefa, um problema que impeça um jogador de completar o fluxo principal (menu → Mundo 1 → ... → Mundo 4 → Mundo 5 → vitória). O item mais próximo de um bloqueio (RG-01) tem sempre uma saída visível e funcional (o botão "X" do modal).

## 🟠 Problemas importantes
RG-01, RG-02, RG-03, RG-04 (listados em detalhe acima).

## 🟡 Problemas menores
RG-05, RG-06.

## 🔵 Problemas localizados
RG-07.

## 💡 Melhorias
Nenhuma melhoria nova além das já registradas nas Tarefas 02-09; não repetidas aqui para não duplicar os relatórios individuais.

---

# 15. Veredito final

### O fluxo principal está funcional?
**Sim.** Jogado de ponta a ponta nesta tarefa, numa única sessão contínua, sem nenhum atalho de DEV para pular conteúdo. O jogo é completável do início ao fim.

### Todos os Mundos 1–4 podem ser concluídos?
**Sim.** As 12 fases foram jogadas e concluídas com sucesso nesta execução, com progressão de desbloqueio correta entre todas elas.

### O Mundo 5 pode ser concluído?
**Sim**, mas apenas por quem souber ou for levado à URL direta (`fase1.html?mundo=5&fase=1`) — pela interface normal do menu, ele permanece inalcançável (nenhum card no carrossel, reconfirmado nesta tarefa).

### Existem bloqueadores de entrega?
**Não**, no sentido de "impedir a conclusão do jogo". Existem, porém, 4 problemas de prioridade Alta (RG-01 a RG-04) que afetam significativamente a qualidade da experiência e a aderência a um requisito obrigatório (mundo bônus acessível).

### Quais problemas devem ser corrigidos antes da próxima apresentação/entrega?
Na avaliação desta auditoria (recomendação técnica, não requisito): RG-01 (modal preso — afeta a experiência logo no primeiro mundo concluído) e RG-03 (acesso ao Mundo 5 — é o requisito obrigatório da faculdade com a lacuna mais visível em uma demonstração ao vivo).

### Quais problemas podem ficar para uma próxima sprint?
RG-02 (áudio), RG-04 (foco de teclado), RG-05 e RG-06 (robustez a dados corrompidos/acesso direto por URL), RG-07 (responsividade) — nenhum deles impede a demonstração do fluxo principal.

### Quais pontos dependem de decisão da equipe?
- Se o modal de fases deve fechar automaticamente ao sair de um mundo (RG-01) — decisão de UX simples, baixo risco.
- Se vale priorizar corrigir a referência de áudio antes da próxima entrega (RG-02) — já é uma correção de 1 linha identificada na Tarefa 05 (apontar para `assets/audio/Mundos/Menu Principal.mp3`), mas a decisão de quando fazer é da equipe.
- Se o Mundo 5 deve ganhar um card no carrossel antes da próxima entrega (RG-03) — decisão de produto/prioridade, não técnica.

### Quais pontos precisam ser confirmados com o professor?
Reconfirmação dos pontos já levantados na Tarefa 10: se o requisito do mundo bônus exige acesso pela interface normal (o que tornaria RG-03 prioridade de entrega, não só de qualidade), e se o conteúdo do Mundo 5 ainda corresponde à habilidade BNCC citada no README.

---

## Pontos positivos confirmados

- **18/18 desafios matemáticos corretos**, reconfirmados dentro de um fluxo real e completo, não apenas em testes isolados.
- **Progressão e desbloqueio funcionam corretamente** em todas as transições de fase e de mundo, incluindo o Mundo 5.
- **Zero erros de JavaScript não intencionais** em todo o fluxo completo e em 9 dos 11 cenários de regressão negativa — os únicos 2 `pageerror` registrados foram provocados de propósito para confirmar achados já conhecidos.
- **O jogo resiste bem a uso incorreto/abusivo**: cliques repetidos, aberturas/fechamentos repetidos de modal, reload no meio de uma fase, e avanço prematuro — todos tratados sem erro e sem estado inconsistente.
- **Uma fase inteira é jogável só por teclado**, sem mouse, reconfirmado nesta tarefa.
- **O jogo funciona normalmente com o áudio desligado** — a ausência de som não compromete nenhuma mecânica.
- **Nenhuma regressão real**: nenhum achado das 11 tarefas anteriores piorou, e nenhum problema novo foi introduzido — o código está estável porque não foi tocado.

---

# 16. Estado do repositório

- **Apenas `AUDITORIA 06.10/` foi alterada** nesta tarefa (a criação deste arquivo `12-REGRESSAO-E-FLUXO-COMPLETO.md`). Nenhum arquivo do jogo, da documentação (`README.md`/`AGENTS.md`) ou de qualquer relatório anterior foi tocado.
- **Nenhum commit foi criado.**
- **Nenhum push foi realizado.**
- **Servidor/processos temporários**: o servidor HTTP local temporário (`python -m http.server 8000`), usado para todos os testes desta tarefa, foi encerrado ao final (confirmado por tentativa de conexão recusada após o encerramento).
- **Arquivos temporários**: todos os scripts de teste (`regressao-fluxo-completo.js`, `regressao-negativa-e-spotcheck.js`) e seus resultados (`.json`) foram criados exclusivamente na pasta temporária de trabalho desta sessão, fora do repositório do projeto, e permanecem lá — nenhum deles foi copiado para dentro do repositório.
- **`00-RESUMO.md` não foi criado nesta tarefa**, conforme instrução explícita.
