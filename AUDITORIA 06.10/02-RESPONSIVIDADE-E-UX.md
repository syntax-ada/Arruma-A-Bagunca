# Auditoria 06.10 — Responsividade e UX Visual

**Data:** 06/10/2026
**Escopo:** experiência visual e responsividade do jogo em diferentes tamanhos de tela — layout, HUD, menu, gameplay, drag-and-drop, texto, overflow/rolagem e orientação. Acessibilidade formal (leitores de tela, contraste WCAG, navegação por teclado) **não** faz parte desta tarefa — fica para uma auditoria separada, conforme combinado.

**Regra respeitada:** nenhum arquivo do jogo foi alterado, corrigido ou refatorado. Nenhum commit ou push foi realizado. Único arquivo criado/alterado nesta etapa: este próprio documento. Todo o ambiente de teste (Playwright, servidor HTTP local, screenshots) ficou fora do repositório, em uma pasta temporária, e foi encerrado ao final.

---

## 0. Metodologia

Toda a auditoria foi feita por **execução real** no Google Chrome (via Playwright, instalado temporariamente fora do projeto, `channel: "chrome"`, sem baixar Chromium à parte), servindo o projeto por `python -m http.server 8000` (também temporário). Não foi feita avaliação só por leitura de CSS — cada tela foi de fato carregada no navegador, em cada uma das 8 viewports pedidas, e fotografada.

Para cada viewport, uma sessão de navegador percorreu:

1. Menu inicial → Seleção de mundos → Modal "Escolha uma fase" (Mundo 1).
2. **Mundo 1, Fase 1 completa**: organização com **drag-and-drop real** (arraste por eventos de ponteiro, igual ao que `game.js` escuta — inclusive uma tentativa proposital de soltar um objeto na cesta errada), desafio matemático (com uma resposta errada proposital antes da certa), tela de conclusão.
3. **Mundos 2, 3 e 4**: acesso direto à tela de organização de cada um (para avaliar o layout especificamente; o comportamento funcional desses mundos já foi validado na Auditoria 01).
4. **Mundo 5 completo**: os 5 desafios de conta composta (com uma resposta errada proposital no primeiro), leitura dos corações a cada acerto, organização final (drag-and-drop real dos 6 objetos), tela de vitória.

Em cada tela, além do screenshot, rodei checagens automáticas via JavaScript injetado (`page.evaluate`) para: overflow horizontal/vertical (`scrollWidth`/`scrollHeight` vs. `innerWidth`/`innerHeight`), elementos com parte do seu retângulo fora da viewport, e elementos com sobreposição de posição.

**Limitação importante sobre as checagens automáticas:** o detector de "elementos fora da viewport" por bounding box gera alguns falsos positivos que precisaram ser descartados manualmente após conferência visual — por exemplo, um elemento de uma tela escondida (`display:none` no ancestral, não no próprio elemento) ainda reporta um retângulo de tamanho zero, e um container transparente de ponta a ponta da tela (como o rodapé de cestas) "contém" outros elementos no sentido geométrico sem que exista sobreposição visual real. Todo achado final listado abaixo foi **confirmado visualmente por screenshot**, não apenas pelo relatório automático — e, inversamente, o bug mais importante encontrado (RF-01, texto sobreposto) só foi percebido porque os dois textos continuam **dentro** da viewport, então nenhuma checagem automática o detectaria sozinha; foi a inspeção visual das capturas que revelou.

**Nota sobre timing de animação:** o painel de vitória (`#painel-vitoria`) tem uma animação CSS de entrada de 500ms (`entrada-painel-vitoria`). A primeira rodada de screenshots capturou esse painel no meio da animação (aparência "apagada"/baixo contraste) em todas as viewports — refiz o teste aguardando a animação terminar e confirmei que o painel renderiza corretamente, com bom contraste, em todas as viewports. Registro isso para deixar claro que **não é um bug** — foi um artefato do meu próprio script de teste, corrigido antes de reportar.

- **Navegador:** Google Chrome real (headless), via Playwright.
- **URL:** `http://localhost:8000` (servidor HTTP temporário).
- **Telas/fluxos efetivamente testados:** Menu inicial, Seleção de mundos, Modal de fases, Mundo 1 (fluxo completo com drag-and-drop + matemática), Mundos 2/3/4 (tela de organização), Mundo 5 (fluxo completo: 5 desafios + organização final + vitória), em **8 viewports** + 2 testes extras de orientação (celular retrato x paisagem).
- **Page errors (exceções JS):** zero, em todas as 8 viewports.
- **Console:** só o mesmo 404 de áudio já registrado na Auditoria 01 (`assets/audio/everything-in-place.mp3`) — nenhum erro novo relacionado a layout.
- **Drag-and-drop:** testado com interação real de ponteiro em **todas as 8 viewports** (não só uma desktop e uma pequena) — 100% de sucesso (5/5 objetos corretamente posicionados) em todas elas, incluindo a menor (375×667). A interação touch real de um dedo humano não pôde ser fisicamente reproduzida (ver limitação na Auditoria 01, item AF-03); o que foi testado aqui é o arraste via eventos de ponteiro do Chrome, que é o mesmo mecanismo que `game.js` escuta, só que simulado por mouse em vez de um dedo.

---

## 1. Achados

### RF-01 — 🟠 Alto — Bug confirmado: texto do HUD se sobrepõe ao texto da própria imagem de fundo, ficando ilegível em celulares

- **Tela/Mundo/Fase:** cabeçalho de instrução (`.hud-container`) de **todos os 5 mundos** — confirmado visualmente nos Mundos 1, 2, 3, 4 e 5 (tela de organização) e também no cabeçalho da tela matemática do Mundo 5.
- **Viewport:** confirmado em 430×932, 390×844 e 375×667 (as 3 viewports de celular). Em 768×1024 (tablet) e nas 4 viewports de desktop, o mesmo elemento aparece **sem colisão**, só com texto redundante (ver "possível causa").
- **Descrição:** a imagem `assets/images/tela_fase1/hud_branco.png` (o balão branco de instrução) já traz texto desenhado nela mesma ("Arrume a Bagunça! Coloque cada item em sua respectiva cesta.") e é reaproveitada, pela mesma classe CSS `.caixa-instrucoes`, tanto no cabeçalho da tela de organização quanto no cabeçalho da tela de matemática — onde um texto dinâmico diferente (`#feedback-message`, `#titulo-matematica`, ou a mensagem de sucesso/erro) é desenhado por cima via `position: absolute`.
- **Comportamento observado:** em celulares, o texto dinâmico (ex.: "Arraste cada item até a cesta correta!", "Desafio Matemático", "Parabéns! Você organizou todos os objetos!") aparece **visualmente colado e entrelaçado** com o texto fixo da imagem, tornando ambos difíceis de ler.
- **Comportamento esperado:** o texto dinâmico deveria permanecer legível e separado do texto da imagem em qualquer tamanho de tela.
- **Evidência:** screenshots confirmando o problema em:
  - Mundo 1, organização, 375×667 e 430×932.
  - Mundo 2, organização, 375×667.
  - Mundo 3, organização, 375×667.
  - Mundo 4, organização, 375×667.
  - Mundo 5, desafio matemático, 375×667, 390×844 e 430×932.
  - Mundo 5, tela de vitória (banner superior), 375×667.

  Em contraste, a mesma tela em 768×1024 e em todas as viewports de desktop mostra os dois textos legíveis, um abaixo do outro, sem colisão (só redundantes).
- **Arquivo(s) relacionado(s):** `fase1.html` (reaproveita `assets/images/tela_fase1/hud_branco.png` nas duas telas via `.caixa-instrucoes`); `style-fase1.css`:
  - `.hud-container { width: min(85vw, 680px); }` e `.caixa-instrucoes { width: 100%; height: auto; }` — a **imagem** escala proporcionalmente com a largura da viewport (`vw`).
  - `.feedback-message { position: absolute; font-size: 1.15rem; ... }` (linha ~85) e `.hud-texto-matematica { font-size: 1.3rem; }` (linha ~466) — o **texto sobreposto** usa um tamanho de fonte **fixo** em `rem`, que não acompanha o encolhimento da imagem.
- **Possível causa:** como a imagem encolhe proporcionalmente à largura da tela mas o texto sobreposto mantém um tamanho de fonte fixo, em telas largas há espaço de sobra (textos ficam empilhados sem se tocar) e em telas estreitas a imagem fica pequena demais para o texto fixo, que passa a invadir a área onde o texto da própria imagem está desenhado. Reaproveitar a mesma imagem (com texto fixo "Arrume a Bagunça...") para a tela de matemática, que deveria ter um cabeçalho "genérico" sem texto embutido, agrava o problema mesmo fora do cenário de colisão (ver observação abaixo).
- **Impacto:** prejudica diretamente a compreensão da instrução em tela em celulares — que é exatamente o tipo de problema que a seção "Texto" deste pedido de auditoria pede para diferenciar de uma preferência estética. Aqui há prejuízo real de legibilidade, não só de estética.
- **Classificação:** Bug confirmado (reproduzido visualmente em múltiplas viewports e múltiplos mundos).

> **Observação à parte (não é bug, é achado de conteúdo):** mesmo nas viewports onde não há colisão visual (desktop e tablet), a tela de matemática do Mundo 5 mostra "Arrume a Bagunça! Coloque cada item em sua respectiva cesta." acima de "Desafio Matemático" — um texto de instrução de organização aparecendo durante a luta com o adversário, antes de qualquer objeto estar à vista. Isso é consequência do mesmo reaproveitamento de imagem e é mais um problema de conteúdo/copy do que de layout, mas registro aqui porque a causa raiz é a mesma.

---

### RF-02 — 🟠 Alto — Bug confirmado: `overflow: hidden` + altura fixa cortam o rodapé da tela de matemática do Mundo 5 em resoluções comuns de notebook

- **Tela/Mundo/Fase:** Mundo 5, tela de desafio matemático (`#tela-matematica` / `.painel-matematica`).
- **Viewport:** confirmado em **1366×768, 1280×720 e 1024×768** (3 das 4 viewports "Desktop"/"Desktop pequeno" pedidas — 1366×768 é historicamente uma das resoluções de notebook mais comuns) e também nas 3 viewports de celular (375, 390, 430 — mesma causa, mas disparada pela largura/empilhamento do HUD descrito em RF-01, não só pela altura).
- **Descrição:** medi com precisão a posição do elemento `#feedback-matematica` (onde aparece "Escolha uma das opções acima." antes de responder, e a mensagem de acerto/erro depois de responder) em relação à altura da viewport:

  | Viewport | Altura da viewport | Base do `#feedback-matematica` | Cortado? |
  |---|---|---|---|
  | 1920×1080 | 1080px | 785px | Não |
  | 1366×768 | 768px | 785px | **Sim, por 17px** |
  | 1280×720 | 720px | 785px | **Sim, por 65px** |
  | 1024×768 | 768px | 785px | **Sim, por 17px** |

  Os **botões de resposta continuam visíveis e clicáveis** nessas 3 resoluções (a base deles fica em 717px, cabendo até em 720px de altura, com apenas 3px de folga em 1280×720) — mas o texto de instrução/feedback abaixo deles fica cortado, e **não há nenhuma forma de rolar para vê-lo**: tentei rolagem manual (`mouse.wheel` e `window.scrollTo`) e a posição do elemento não mudou — `.tela-matematica` usa `overflow: hidden` com `height: 100vh`, então o conteúdo que excede a altura da tela fica literalmente inacessível, não apenas escondido atrás de uma rolagem não óbvia.
- **Comportamento esperado:** toda a tela de matemática (pergunta, alternativas e mensagem de feedback) deveria caber ou, se não couber, ser rolável.
- **Evidência:** screenshot do Mundo 5 em 1280×720 mostra o painel de alternativas cortado na borda inferior da tela; medições de `getBoundingClientRect()` confirmam exatamente os valores da tabela acima.
- **Arquivo(s) relacionado(s):** `style-fase1.css` — `.tela-matematica { width: 100vw; height: 100vh; ...; overflow: hidden; }` (por volta da linha 455-464); a altura extra vem de `#area-boss` (presente só no Mundo 5), que soma ~230px acima do `.painel-matematica` e empurra o conjunto para baixo da área visível em telas de 720-768px de altura.
- **Possível causa:** o layout da tela de matemática foi dimensionado pensando nos Mundos 1-4 (sem a área do adversário); ao reaproveitar o mesmo layout para o Mundo 5, a altura adicional do `#area-boss` não foi compensada, e `overflow: hidden` esconde o excedente em vez de permitir rolagem ou reduzir o espaçamento.
- **Impacto:** o jogo continua jogável (os botões de resposta estão visíveis), mas a mensagem de acerto/erro — que é o reforço positivo pedagógico do jogo — fica invisível para quem joga o Mundo 5 num notebook comum (1366×768) ou num celular. Confirmei que isso **não acontece** nos Mundos 1-4 nas mesmas resoluções (testei o Mundo 1 explicitamente): lá a mesma mensagem fica em 559px de altura, bem dentro do limite mesmo em 720px — então é um problema específico do Mundo 5.
- **Classificação:** Bug confirmado (reproduzido e medido com precisão).

---

### RF-03 — 🟠 Alto — Bug confirmado: em celular na orientação paisagem, os botões "JOGAR" e "CRÉDITOS" ficam fora da área visível, sem nenhuma indicação de que é preciso rolar

- **Tela/Mundo/Fase:** Menu inicial e Seleção de mundos.
- **Viewport:** testado com um celular comum girado (844×390 — a versão "paisagem" de 390×844) além das 8 viewports principais, já que nenhuma delas testava uma altura tão baixa.
- **Comportamento observado:** o screenshot da tela inicial em 844×390 mostra só o logotipo "Arruma a Bagunça" e a ponta de um botão preto na última linha — os botões **"JOGAR"** e **"CRÉDITOS"** estão abaixo da área visível. Confirmei via `getBoundingClientRect()` que o botão JOGAR está em `y: 384px` (a viewport tem só 390px de altura — ele está na borda, praticamente invisível) e que **rolar a página manualmente** (`window.scrollTo`) o traz para `y: 236px`, totalmente visível — ou seja, o conteúdo não está irremediavelmente cortado (diferente do RF-02), mas **não há nenhuma pista visual** (seta, sombra, texto) de que é preciso rolar para encontrar o botão principal do jogo.
  - A mesma viewport na tela de **Seleção de mundos** reproduz o problema de forma ainda mais ampla: `.card-mundo`, `.btn-voltar`, `.topo-mundos` e `.pílula-controles` também ficam parcialmente fora da área visível sem rolagem.
- **Comportamento esperado:** os elementos de ação principal (JOGAR, navegação) deveriam estar visíveis sem rolagem em qualquer orientação razoável, ou pelo menos dar alguma pista visual de que há mais conteúdo abaixo.
- **Evidência:** screenshot `orientacao-paisagem-01-menu.png` mostra o logotipo ocupando quase toda a tela, com o botão cortado na última linha de pixels.
- **Arquivo(s) relacionado(s):** `style-menu.css` — `#tela-inicial { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }`. Como o conteúdo (logo grande + dois botões) é centralizado verticalmente dentro de `min-height: 100vh`, numa viewport baixa (390px de altura) o conjunto simplesmente não cabe, e o `justify-content: center` empurra metade do conteúdo para fora da tela, tanto para cima quanto para baixo.
- **Possível causa:** o layout não tem uma regra de `@media (max-height: ...)` para reduzir o tamanho do logo ou os espaçamentos quando a altura da viewport é pequena (comum em celulares na horizontal) — só existem `@media (max-width: ...)`.
- **Impacto:** quem abrir o jogo com o celular já na horizontal (ou girar o celular na tela inicial) pode não encontrar o botão JOGAR imediatamente. Não é um bloqueio definitivo (rolar resolve), mas para o público de 7-10 anos a ausência de qualquer pista visual é um obstáculo real.
- **Classificação:** Bug confirmado (reproduzido e, nesse caso específico, "contornável" via rolagem manual — diferente do RF-02, que é irremediável).

---

### RF-04 — 🟡 Médio — Bug confirmado: texto "Configurações" cortado e colado ao botão "Voltar" em celulares estreitos

- **Tela/Mundo/Fase:** Seleção de mundos — barra superior (`.pílula-controles` + `.btn-voltar`).
- **Viewport:** confirmado em 375×667, 390×844 e 430×932 (as 3 viewports de celular retrato). Em 768×1024 (tablet) e acima, há espaço de sobra e o problema não ocorre.
- **Comportamento observado:** o texto "Configurações" (dentro da pílula branca com Jogador / Som ligado / Configurações) é cortado — aparece como "Con", "Config" ou "Configuraçõe" dependendo da largura exata — e a pílula branca encosta diretamente no botão preto "Voltar", sem nenhum espaçamento entre eles, dando a impressão de elementos colados/sobrepostos.
- **Comportamento esperado:** o texto não deveria ser cortado; se não houver espaço, o rótulo deveria encolher antes (ex.: abreviar ou esconder o texto, mantendo só o ícone) em vez de cortar no meio da palavra.
- **Evidência:** screenshots em 375×667, 390×844 e 430×932 mostram o corte; em 430×932 o texto quase cabe inteiro, mas ainda sem respiro antes do botão Voltar.
- **Arquivo(s) relacionado(s):** `style-menu.css` — a barra `.topo-mundos` e `.pílula-controles` não têm uma regra específica de `@media (max-width: 480px)` (ou faixa parecida) que reduza o texto, esconda o rótulo "Configurações" e mantenha só o ícone, ou empilhe os elementos.
- **Possível causa:** o design foi ajustado para a faixa de 600-850px (breakpoint em que as setas do carrossel já somem) mas não para celulares mais estreitos especificamente.
- **Impacto:** não impede nenhuma ação (o botão Configurações e o botão Voltar continuam clicáveis, mesmo com o texto cortado), mas é visualmente confuso e pode dificultar que a criança identifique os dois controles como botões separados.
- **Classificação:** Bug confirmado (reproduzido em 3 viewports).

---

### RF-05 — 💡 Melhoria: setas de navegação do carrossel somem abaixo de 850px, sem indicador alternativo de que há mais mundos

- **Tela/Mundo/Fase:** Seleção de mundos — carrossel de cards.
- **Viewport:** confirmado em 768×1024, 430×932, 390×844 e 375×667 (todas ≤850px de largura).
- **Comportamento observado:** `style-menu.css` esconde `.btn-seta` via `@media (max-width: 850px) { .btn-seta { display: none; } }`. Nessas larguras, a única forma de ver os Mundos 2, 3 e 4 é arrastar/rolar o carrossel horizontalmente com o dedo (`overflow-x: auto` + `scroll-snap-type: x mandatory`) — **testei e isso funciona tecnicamente** (o carrossel rola normalmente). Em 375-430px, uma fatia do próximo card (~15-20% da largura dele) fica visível na borda direita, dando uma pista discreta de que há mais conteúdo; em 768px, o segundo card inteiro já aparece ao lado do primeiro, então a necessidade de rolar fica óbvia por si só.
- **Comportamento esperado:** não há um requisito formal aqui — é uma sugestão. Algum indicador visual (pontinhos de página, uma sombra de gradiente na borda, ou um texto "deslize para o lado") ajudaria crianças a perceberem que o carrossel rola, especialmente nos tamanhos mais estreitos (375-430px) onde a pista visual é só uma fatia fina do próximo card.
- **Evidência:** screenshots de 375×667, 390×844 e 430×932 mostram a fatia do próximo card; o de 768×1024 mostra dois cards completos lado a lado.
- **Arquivo(s) relacionado(s):** `style-menu.css`, bloco `@media (max-width: 850px)`.
- **Impacto:** nenhum bloqueio funcional — é uma oportunidade de UX, não um bug.
- **Classificação:** Melhoria recomendada.

---

## 2. Matriz de Viewports

✅ Sem problema observado · ⚠️ Problema parcial/menor · ❌ Problema confirmado · ❓ Não testado/não verificável

| Tela/Fluxo | 1920x1080 | 1366x768 | 1280x720 | 1024x768 | 768x1024 | 430x932 | 390x844 | 375x667 |
|---|---|---|---|---|---|---|---|---|
| Menu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seleção de mundos | ✅ | ✅ | ✅ | ✅ | ⚠️ (RF-05) | ❌ (RF-04, RF-05) | ❌ (RF-04, RF-05) | ❌ (RF-04, RF-05) |
| Seleção de fases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mundo 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (RF-01) | ❌ (RF-01) | ❌ (RF-01) |
| Mundo 2 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (RF-01) | ❌ (RF-01) | ❌ (RF-01) |
| Mundo 3 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (RF-01) | ❌ (RF-01) | ❌ (RF-01) |
| Mundo 4 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (RF-01) | ❌ (RF-01) | ❌ (RF-01) |
| Mundo 5 | ✅ | ❌ (RF-02) | ❌ (RF-02) | ❌ (RF-02) | ✅ | ❌ (RF-01) | ❌ (RF-01) | ❌ (RF-01, RF-02) |
| Vitória | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (RF-01, banner superior) | ❌ (RF-01, banner superior) | ❌ (RF-01, banner superior) |

**Orientação (suplementar, fora da matriz de 8 colunas acima):** celular 390×844 retrato = ✅ (sem problemas novos); o mesmo celular em paisagem (844×390) = ❌ nas telas de Menu e Seleção de mundos (RF-03); tela de organização em paisagem = ✅ (sem problema adicional).

---

## 3. Resultado final

### Total de problemas: 5

- 🔴 Crítico: **0**
- 🟠 Alto: **3** (RF-01, RF-02, RF-03)
- 🟡 Médio: **1** (RF-04)
- 🔵 Baixo: **0**
- 💡 Melhoria: **1** (RF-05)

### Principais problemas em celular (375-430px)

1. **RF-01** — texto do HUD sobreposto e ilegível em todos os 5 mundos (o problema mais abrangente: afeta todas as telas de organização e a tela matemática/vitória do Mundo 5).
2. **RF-04** — "Configurações" cortado e colado ao botão "Voltar" na seleção de mundos.
3. **RF-02** (parcialmente) — no Mundo 5 especificamente, a combinação de largura estreita com `overflow:hidden` também corta o rodapé da tela matemática em 375×667.
4. Orientação paisagem (**RF-03**) é um problema de celular por definição, embora fora da matriz principal de 8 viewports.

### Principais problemas em desktop

1. **RF-02** — nas 3 resoluções mais comuns de notebook testadas (1366×768, 1280×720, 1024×768), a mensagem de acerto/erro do Mundo 5 fica cortada por `overflow: hidden`, sem nenhuma forma de rolar até ela. É o único achado desta auditoria que afeta desktop/notebook, não só celular.
2. Fora isso, desktop (1920×1080 e as 3 resoluções menores) passou **limpo** em todas as outras telas — nenhum elemento cortado, nenhuma sobreposição real, carrossel com setas funcionando normalmente.

### Principais problemas do Mundo 5

O Mundo 5 é, de longe, o mais afetado desta auditoria: sofre tanto o RF-01 (texto sobreposto, em celulares) quanto o RF-02 (rodapé cortado, em notebooks **e** celulares) — os dois únicos achados 🟠 Alto que dependem do conteúdo específico de uma tela, e não de telas genéricas do menu. Isso bate com o que a própria AGENTS.md já registra: o Mundo 5 é "provisório" e reaproveita arte/layout do Mundo 3 — a área extra do adversário (`#area-boss`), que não existe nos Mundos 1-4, é o que estoura a altura disponível em telas mais baixas.

### Principais problemas de drag-and-drop

**Nenhum.** O arraste real de objetos (testado nas 8 viewports, incluindo a menor, 375×667) funcionou perfeitamente em 100% das tentativas, com espaço suficiente para arrastar e cestas sempre acessíveis, mesmo nos celulares mais estreitos. A única ressalva, já registrada na Auditoria 01 (achado AF-03), é que a simulação de arraste por mouse não reproduz com fidelidade um cenário de **multi-toque físico simultâneo** — isso continua como limitação do ambiente, não como problema confirmado.

### Principais melhorias recomendadas

1. **RF-05** — adicionar algum indicador visual de que o carrossel de mundos rola horizontalmente em telas ≤850px (pontinhos, sombra de borda ou texto "deslize"), já que as setas de navegação somem nesse breakpoint.
2. Como melhoria mais ampla (não numerada como achado formal, pois depende de decisão de design): tratar o `.caixa-instrucoes`/`hud_branco.png` como uma imagem **sem** texto embutido, deixando todo o texto para os elementos HTML dinâmicos — isso resolveria o RF-01 na raiz e evitaria que o mesmo problema reapareça se um novo mundo reaproveitar a mesma imagem.
3. Considerar uma regra de `@media (max-height: ...)` para a tela inicial e para a tela de matemática do Mundo 5, reduzindo espaçamento/tamanho de logo em telas baixas, resolvendo RF-02 e RF-03 na mesma linha de raciocínio.
