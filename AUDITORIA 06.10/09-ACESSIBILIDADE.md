# 09 — Acessibilidade

Auditoria de acessibilidade do jogo "Arruma a Bagunça" para crianças de 7 a 10 anos, incluindo crianças em processo de alfabetização. Nenhum arquivo do jogo foi alterado, nenhuma correção foi feita. Nenhum commit ou push foi realizado.

**Importante sobre o escopo da avaliação**: o `README.md` e o `AGENTS.md` documentam diretrizes gerais de UX/acessibilidade (alto contraste, cores não exclusivas, suporte a teclado, etc.) como escolhas da própria equipe para o projeto — nenhuma delas está marcada como `[Requisito oficial]` da faculdade (diferente, por exemplo, da habilidade BNCC e da obrigatoriedade do mundo bônus, ambas marcadas assim nos documentos). Por isso, este relatório avalia aderência às **diretrizes já documentadas pela equipe**, e usa normas gerais (ex.: tamanho mínimo de alvo de toque, padrão de foco em diálogos) apenas como **referência de boa prática**, nunca como certificação de conformidade — não foi avaliado, nem é afirmado aqui, que o jogo atende integralmente a WCAG ou qualquer outra norma completa.

## Metodologia

1. Leitura de `index.html`, `fase1.html`, `global.css`, `style-menu.css`, `style-fase1.css`, `js/menu.js`, `js/game.js`, `js/math.js`, `js/dev.js` com foco em semântica, atributos ARIA, manipulação de foco e regras de CSS relacionadas a foco/contraste.
2. Cálculo de contraste de cor (fórmula de luminância relativa do WCAG) para os pares de cor mais usados nas telas de fase, a partir dos valores reais declarados em `style-fase1.css`.
3. Testes reais em Google Chrome via Playwright, instalado fora do repositório, servindo o projeto por um servidor HTTP local temporário (também fora do repositório, encerrado ao final): navegação por Tab, estilo computado de foco, armadilha de foco em modais, conclusão de uma fase inteira só por teclado, tamanho de alvos de toque em viewport móvel, e leitura do atributo `aria-valuenow` da barra de progresso antes/depois de uma mudança real de estado.
4. Esta tarefa não repete a auditoria de responsividade (Tarefa 02) nem a auditoria técnica de áudio (Tarefa 05) — only os pontos de acessibilidade diretamente relacionados a elas são cobertos aqui, com referência cruzada quando aplicável.

---

## Resumo da acessibilidade atual

O jogo tem uma base de acessibilidade genuinamente cuidada nas telas de **gameplay** (dentro de `fase1.html`): regiões `aria-live` para todo feedback dinâmico, contraste de cor forte em praticamente todos os textos verificados, alternativa textual para o indicador de corações do Boss, seleção de cestas por teclado funcional, e indicadores de foco visíveis e bem desenhados nos elementos interativos da fase. Uma fase inteira do jogo foi completada de ponta a ponta nesta auditoria usando **somente teclado** (Tab + Enter), sem mouse, confirmando que isso já funciona na prática.

Em contraste, o **menu** (`index.html`) tem uma lacuna séria e bem confirmada: todos os botões do menu suprimem o indicador de foco do navegador (`outline: none` em `style-menu.css`, sem nenhum substituto), tornando a navegação por teclado no menu "funcional, mas invisível" — um usuário de teclado consegue operar os botões, mas não consegue ver onde o foco está em nenhum momento. Os dois diálogos modais do projeto (créditos e seleção de fases) também não implementam uma armadilha de foco (o Tab escapa para os elementos da tela de fundo enquanto o modal continua aberto), e um deles nem move o foco para dentro de si ao abrir.

Recursos de acessibilidade configuráveis pelo usuário **não existem de fato**: o botão "Configurações", presente em duas telas com `aria-label` correto, não tem nenhuma funcionalidade por trás (confirmado também na Tarefa 03) — não há ajuste de contraste, tamanho de fonte, ou qualquer outra preferência, exatamente como o `README.md` já documenta ("configurações de acessibilidade: não implementado").

---

## Problemas por prioridade

| ID | Prioridade | Resumo |
|---|---|---|
| AC-01 | 🟠 Alto | Foco do teclado invisível em todo o menu (`outline: none` sem substituto) |
| AC-02 | 🟠 Alto | `aria-valuenow` da barra de progresso nunca é atualizado — sempre "10" |
| AC-03 | 🟡 Médio | Nenhum dos dois modais implementa armadilha de foco (Tab escapa para o fundo) |
| AC-04 | 🟡 Médio | Modal de seleção de fases não move o foco para dentro de si ao abrir |
| AC-05 | 🔵 Baixo | Nenhuma página tem um `<h1>`; único heading de cada tela é dinâmico e condicional |
| AC-06 | 🔵 Baixo | Botões de ícone (som/configurações) e alguns botões de texto ficam abaixo de 44×44px |
| AC-07 | 🔵 Baixo | Botão "Configurações" tem rótulo acessível correto, mas nenhuma função real (cross-referência da Tarefa 03) |
| AC-08 | 💡 Melhoria | `#btn-som` da tela inicial não tem alternativa textual de estado (cross-referência AA-07 da Tarefa 05) |

---

## 1. Teclado e foco

- **Navegação por Tab**: confirmada em toda a interface — todos os controles interativos são elementos `<button>` nativos (focáveis por padrão), nenhum `<div>`/`<span>` clicável sem semântica de botão foi encontrado.
- **Foco visível**:
  - **Dentro da fase** (`fase1.html`): confirmado correto. O item arrastável focado via Tab mostra `outline: 4px solid rgb(224, 93, 47)` (laranja forte), computado de fato pelo navegador. `style-fase1.css` define `:focus-visible` explicitamente para `.draggable-item`, `.drop-zone`, `.botao-opcao-matematica` e `.btn-som-fase`.
  - **No menu** (`index.html`): confirmado AUSENTE. Testado em `#btn-som`, `#botao-jogar` e no card do Mundo 1 (`#botao-fase1`) — os três retornam `outlineStyle: "none"` e `boxShadow: "none"` quando focados via Tab. A causa é `style-menu.css`: `button { outline: none; }` (regra geral, linha 84) e `.game-container { outline: none !important; }` (linha 12), sem nenhuma regra `:focus`/`:focus-visible` em todo o arquivo (confirmado por busca textual — zero ocorrências da palavra "focus"). **Ver achado AC-01.**
- **Enter/Espaço**: confirmado funcional nos botões do menu (`Enter` ativa o botão focado, testado ao entrar no menu de mundos) e nas cestas de organização (`handleDropZoneKeyboard`, `game.js`, reage a `Enter`/`Espaço`).
- **Jogar sem mouse**: **confirmado possível, de ponta a ponta, numa fase real.** Usando só `Tab` (para focar cada cesta) e `Enter` (para confirmar), a Fase 1 do Mundo 1 foi organizada inteiramente, o desafio matemático foi respondido corretamente (focando a alternativa certa e pressionando Enter) e a tela de conclusão apareceu — tudo sem nenhum clique de mouse. O mecanismo (`handleDropZoneKeyboard`) sempre tenta posicionar o "próximo item pendente" na cesta focada; funciona de forma direta em fases com poucas categorias (testado com 2) e deve ficar mais repetitivo (ciclar pelas cestas até encaixar cada item) em fases com mais categorias — não testado exaustivamente em todas as 13 fases, mas o mecanismo subjacente é o mesmo em todas (`game.js` é compartilhado). Isso confirma, na prática, que o item do README "suporte a teclado: parcial" já cobre a organização e a resposta matemática; a parte ainda não implementada é especificamente **arrastar livremente com o teclado** (mover um item escolhido pelo próprio jogador), não a conclusão da fase em si.
- **Armadilhas de foco**: confirmadas em ambos os modais do projeto, de formas diferentes — ver seção dedicada a modais abaixo (achados AC-03 e AC-04).

---

## 2. Leitores de tela e semântica

- **Regiões `aria-live` bem aplicadas**: `#feedback-message`, `#feedback-matematica`, `#aviso-organizacao`, `#painel-vitoria` e `.boss-vida` usam `role="status" aria-live="polite"` — todo feedback dinâmico relevante do jogo é anunciado automaticamente. Isso é um ponto forte, confirmado por leitura de código em `fase1.html`.
- **Nomes acessíveis**: todos os botões testados têm `aria-label` claro e específico (ex.: `"Jogar Fase 1"`, `"Mundo 2, Parque, bloqueado"`, `"Fechar seleção de fases"`). Imagens decorativas dentro de botões já rotulados usam `alt=""` corretamente (ex.: o ícone dentro de `.card-mundo`), evitando duplicar a informação para quem usa leitor de tela.
- **Papéis (roles)**: `role="dialog" aria-modal="true"` nos dois modais; `role="progressbar"` na barra de progresso; `role="group"` nas alternativas de resposta; `role="region"` na área de organização. Uso consistente e apropriado dos papéis ARIA, na maior parte dos casos.
- **🟠 AC-02 — Estado desatualizado em `aria-valuenow`**: a barra de progresso (`.trilho-progresso`, `index.html:107`) declara `role="progressbar" aria-valuenow="10"` no HTML estático. Confirmado por execução real: ao desbloquear todo o progresso (via painel DEV, ferramenta já exposta pelo próprio jogo), o texto visível mudou corretamente para `"100%"` e a barra visual preencheu 100%, **mas o atributo `aria-valuenow` continuou "10"**. A causa é que `menu.js` (`atualizarInterfaceProgresso`) atualiza `trilhoPreenchimento.style.width` (a barra visual) e `textoProgresso.textContent` (o texto), mas nunca toca no atributo `aria-valuenow` do elemento `.trilho-progresso` que o declara. Um leitor de tela sempre anunciaria "10%" nessa barra, independentemente do progresso real — uma divergência direta entre o que é comunicado visualmente e o que é comunicado via acessibilidade.
- **🔵 AC-05 — Ausência de `<h1>` e estrutura de headings mínima**: nem `index.html` nem `fase1.html` têm qualquer `<h1>`. O único heading encontrado em cada tela é um `<h2>` dinâmico e condicional: `#titulo-modal-fases` (só existe depois de abrir o modal de seleção de fases) no menu, e `#pergunta-matematica` (só existe depois de a etapa matemática aparecer) na fase. Isso significa que, ao carregar a tela inicial ou a tela de organização de objetos, não existe NENHUM heading disponível para navegação rápida por leitor de tela.
- Não foram encontrados botões ou controles sem nome acessível, nem imagens informativas sem `alt`.

---

## 3. Contraste, cores e textos

- **Contraste calculado (fórmula de luminância relativa, WCAG) a partir das cores reais do CSS**:

| Elemento | Cor do texto | Fundo | Contraste aproximado | Resultado |
|---|---|---|---|---|
| `.feedback-message` (texto padrão) | `#1f2933` | próximo de branco (`hud_branco.png`) | ≈ 14,8:1 | Excelente (AAA) |
| `.feedback-message.is-success` | `#156936` | próximo de branco | ≈ 6,8:1 | Bom (AA, perto de AAA) |
| `.feedback-message.is-error` | `#b9442a` | próximo de branco | ≈ 5,3:1 | Bom (AA) |
| `.feedback-matematica` (fundo neutro) | `#1f2933` | `#ffd966` | ≈ 10,8:1 | Excelente (AAA) |
| `.btn-conclusao` | `#ffffff` | `#1f7a45` | ≈ 5,3:1 | Bom (AA) |
| `.btn-jogar` (tela inicial) | `#ffffff` | `#000000` | 21:1 | Máximo possível |

Amostra verificada sem nenhum caso de contraste insuficiente — todos os pares calculados passam no mínimo AA (4.5:1) para texto normal, vários chegam a AAA. Não foi feita uma varredura de 100% das combinações de cor do CSS (isso exigiria uma nova auditoria visual completa, fora do escopo pedido), mas a amostra cobre os textos mais frequentemente vistos pela criança (feedback de acerto/erro, botões de conclusão, botão principal).

- **Dependência exclusiva de cor**: não encontrada. Todos os indicadores binários relevantes têm reforço textual ou de ícone: o contador de categoria mostra número (não só cor), os corações do Boss (`aria-hidden`) são acompanhados do texto "X de Y corações", o cadeado de mundo bloqueado é um emoji (não apenas uma borda vermelha), e o feedback de erro/acerto muda tanto a cor quanto o texto da mensagem. Isso confirma, na prática, a diretriz já documentada no `README.md`/`AGENTS.md`.
- **Legibilidade**: fontes sem serifa (Arial/Helvetica) em todos os textos de jogo verificados, tamanhos na faixa de 1.05rem–1.3rem para texto de feedback — adequado para a faixa etária. Não foi encontrado texto minúsculo ou de baixo contraste nos elementos centrais do jogo.
- **Linguagem**: frases curtas, diretas, em português simples, com uso de emojis de apoio (ex.: "Quase! Tente colocar a maçã em Comidas.", "Muito bem! Você acertou!"). Adequado ao público de 7–10 anos, inclusive em processo de alfabetização, na avaliação desta auditoria.

---

## 4. Áudio e alternativas

Esta seção não repete a auditoria técnica de áudio (Tarefa 05) — trata apenas da existência de alternativas visuais/textuais para informação sonora.

- Não existem instruções narradas no jogo hoje (confirmado também no README: "instruções com suporte a áudio: não implementado") — logo, não há narração sem alternativa textual, porque não há narração.
- O único elemento sonoro real é a trilha de fundo (atualmente quebrada por referência a um arquivo ausente — ver `05-AUDIO.md`, achado AA-01), que não carrega nenhuma informação funcional além de ambientação — sua ausência não compromete a compreensão do jogo.
- O controle de som tem alternativa textual em 2 dos 3 botões equivalentes (o de dentro do menu de mundos e o de dentro da fase, ambos com um `<span>` de texto "Som ligado"/"Som desligado"); o terceiro (`#btn-som`, tela inicial) não tem esse texto, só o ícone estático — já registrado como achado AA-07 na Tarefa 05 (**referenciado aqui como AC-08**, não duplicado como achado novo).

---

## 5. Interação por mouse e toque

- **Alvos de clique/toque, medidos em viewport móvel real (390×844px)**:

| Elemento | Tamanho medido | Observação |
|---|---|---|
| `#btn-som` / `#btn-config` (tela inicial) | 38×38px | Abaixo da referência comum de 44×44px |
| `#botao-jogar` | 332×79px | Confortável |
| `#botao-creditos` | 138×34px | Altura abaixo de 44px |
| `.card-mundo` (carrossel) | 281×215px | Confortável |
| `#btn-voltar` | 66×34px | Altura abaixo de 44px |
| `.draggable-item` | 60×60px | Confortável |
| `.drop-zone` | 113×99px | Confortável |

**🔵 AC-06**: alguns controles secundários (ícones de som/configurações, "Créditos", "Voltar") ficam abaixo da referência comum de 44×44px para alvos de toque confortáveis em telas pequenas. Os controles mais centrais ao jogo (botão JOGAR, cards de mundo, itens arrastáveis, cestas) já atendem a essa referência com folga. Esta referência é uma boa prática amplamente adotada (não um requisito documentado pelo projeto), citada aqui como recomendação, não como não conformidade com uma norma.

- **Arrastar e soltar**: testado via mouse em tarefas anteriores (Tarefas 01–03) com sucesso consistente. A alternativa ao drag-and-drop (seleção por teclado) foi confirmada funcional nesta auditoria (seção 1).
- **Feedback de acerto/erro na interação**: imediato e consistente — texto, cor e (quando aplicável) o retorno do item à posição inicial sem punição, conforme já documentado e confirmado em tarefas anteriores.

---

## 6. Modais e armadilha de foco

| Modal | Foco ao abrir | Tab escapa para o fundo? | Observação |
|---|---|---|---|
| `#modal-creditos` | Move corretamente para `#btn-fechar-creditos` (dentro do modal) | **Sim** — após 1 Tab, o foco sai do modal e vai para `<body>`, depois cicla pelos botões da tela de fundo (`#btn-som`, `#btn-config`, `#botao-jogar`, `#botao-creditos`), enquanto o modal continua visualmente aberto | Começa certo, mas não prende o foco |
| `#modal-fases` | **Não move** — permanece no card que foi clicado (`#botao-fase1`), que fica atrás do modal já aberto | **Sim** — o Tab continua pelos outros cards de mundo (`card-mundo-2/3/4`) antes de alcançar os controles de dentro do modal (`#btn-fechar-modal`, `#btn-iniciar-fase1`) | Nem move o foco para dentro, nem prende depois |

**🟡 AC-03** (armadilha de foco ausente nos dois modais) e **🟡 AC-04** (modal de fases não move o foco para dentro de si ao abrir) — ambos confirmados por execução real com Playwright, navegando por Tab a partir do estado "modal aberto" em cada caso. Clicar com mouse em qualquer botão de fundo enquanto o modal está aberto já havia sido testado na Tarefa 03 e não produzia nenhum efeito visível (o clique "passa por baixo" do overlay) — mas um usuário de teclado consegue, de fato, **focar e ativar** esses controles de fundo com Tab + Enter enquanto o modal permanece técnicamente aberto, o que é uma barreira real de acessibilidade, não presente para quem usa mouse.

---

## 7. Configurações de acessibilidade

Conforme pedido explicitamente nesta tarefa, um botão de configurações sem funcionalidade não foi contado como recurso implementado.

- **O que existe**: dois botões "Configurações" (`#btn-config` na tela inicial; `.controle-mundo[aria-label="Configurações"]` no menu de mundos), ambos com `aria-label` correto.
- **O que realmente funciona**: nada. Confirmado na Tarefa 03 (`03-TELAS-E-BOTOES.md`) que nenhum clique nesses botões produz qualquer mudança no HTML, e confirmado por busca em todo o código (Tarefa 06) que `#btn-config` não aparece em nenhum arquivo `.js` — não há listener algum.
- **Conclusão**: não existe, hoje, nenhum ajuste de contraste, tamanho de fonte, velocidade de animação, ou qualquer outra preferência de acessibilidade configurável pelo jogador. Isso está consistente com o próprio `README.md`, que já marca "configurações de acessibilidade" como **não implementado** — não é uma descoberta nova desta auditoria, é uma confirmação de uma lacuna já documentada pela equipe (**AC-07**).

---

## 8. Diferenças entre os Mundos 1–5

- A mecânica de acessibilidade (foco em cestas, feedback `aria-live`, estrutura de teclado) é **inteiramente compartilhada** por todos os mundos via `game.js`/`math.js` — não há diferença de acessibilidade entre Mundos 1, 2, 3 e 4 além da quantidade de categorias/itens (mais categorias = mais cestas para ciclar via teclado, mas o mesmo mecanismo).
- **Mundo 5 (desafio final)** tem uma diferença real: a área do Boss (`#area-boss`) introduz o indicador de corações, que já tem alternativa textual (seção 2/3) — nenhuma barreira adicional de acessibilidade encontrada além das já descritas para os demais mundos. Como o Mundo 5 não tem card no carrossel (confirmado em tarefas anteriores), ele só é alcançável via URL direta ou painel DEV — isso não é uma barreira de acessibilidade em si (é uma limitação de navegação já documentada como decisão/estado atual do projeto, não desta auditoria).
- Nenhuma diferença de contraste, tamanho de fonte ou estrutura de foco foi encontrada entre os mundos — todos herdam o mesmo `style-fase1.css`.

---

## Requisitos atendidos, parciais ou ausentes

| Diretriz (origem) | Estado | Evidência |
|---|---|---|
| "Suporte a teclado" (AGENTS.md, diretriz geral da equipe) | **Parcialmente atendido**, mais avançado do que o README sugere | Fase completa (organização + matemática) jogável só por teclado, confirmado por execução real; falta mover itens livremente pelo teclado (já documentado como requisito em aberto) |
| "Cores não devem ser o único meio de identificação" (AGENTS.md) | **Atendido** | Confirmado em todos os indicadores binários verificados (seção 3) |
| "Alto contraste" (AGENTS.md) | **Atendido na amostra verificada** | Cálculo de contraste real em 6 pares de cor, todos ≥ AA |
| "Feedback imediato e claro" (AGENTS.md) | **Atendido** | `aria-live` consistente, feedback visual e textual simultâneos |
| "Configurações de acessibilidade" (README, já documentado como não implementado) | **Não atendido** (decisão/estado já conhecido, não uma descoberta nova) | Seção 7 |
| Foco visível ao navegar por teclado (boa prática geral, não documentada explicitamente como requisito do projeto) | **Não atendido no menu; atendido na fase** | Seção 1, achado AC-01 |
| Diálogos modais sem fuga de foco (boa prática geral/padrão ARIA, não documentada explicitamente como requisito do projeto) | **Não atendido** | Seção 6, achados AC-03/AC-04 |
| Tamanho mínimo de alvo de toque (boa prática geral, não documentada explicitamente como requisito do projeto) | **Parcialmente atendido** | Seção 5, achado AC-06 |

---

## Achados detalhados

### 🟠 AC-01 — Alto — Foco do teclado invisível em todo o menu
- **Área afetada**: Tela inicial, seleção de mundos, modais (quando o foco está sobre um controle do menu)
- **Arquivo**: `style-menu.css:12` (`.game-container { outline: none !important; }`) e `:84` (`button { outline: none; }`), sem nenhuma regra `:focus`/`:focus-visible` em todo o arquivo
- **Evidência**: focando `#btn-som`, `#botao-jogar` e `#botao-fase1` via Tab real no Chrome, `getComputedStyle` retornou `outlineStyle: "none"` e `boxShadow: "none"` para os três
- **Impacto**: um usuário que navegue só por teclado no menu não tem como saber em qual botão o foco está, tornando a navegação tecnicamente possível mas praticamente inutilizável sem visão do cursor do mouse como referência
- **Recomendação futura**: adicionar uma regra `:focus-visible` em `style-menu.css`, no mesmo padrão já usado com sucesso em `style-fase1.css`

### 🟠 AC-02 — Alto — `aria-valuenow` da barra de progresso nunca é atualizado
- **Área afetada**: Menu de mundos, barra de progresso
- **Arquivo**: `index.html:107` (`aria-valuenow="10"` estático); `js/menu.js` (`atualizarInterfaceProgresso`, atualiza `style.width` e `textContent`, nunca o atributo `aria-valuenow`)
- **Evidência**: após desbloquear todo o progresso via painel DEV, o texto visível e a largura da barra foram a 100%, mas `aria-valuenow` permaneceu "10"
- **Impacto**: um leitor de tela sempre anuncia "10%" nessa barra, independentemente do progresso real do jogador
- **Recomendação futura**: atualizar `aria-valuenow` no mesmo ponto em que `textContent`/`style.width` já são atualizados

### 🟡 AC-03 — Médio — Nenhum dos dois modais prende o foco (armadilha de foco ausente)
- Ver seção 6. Impacto: um usuário de teclado pode ativar controles de fundo (incluindo `#botao-jogar`, que apaga o progresso — ver `07-DADOS-E-PROGRESSO.md`, achado DP-01) enquanto um modal está tecnicamente aberto por cima.
- Recomendação futura: implementar o padrão usual de "focus trap" de diálogo (ciclar o Tab apenas entre os elementos focáveis internos do modal enquanto ele estiver aberto).

### 🟡 AC-04 — Médio — Modal de seleção de fases não move o foco para dentro de si ao abrir
- Ver seção 6. Diferente do modal de créditos (que ao menos começa movendo o foco corretamente), o modal de fases deixa o foco no card de mundo que disparou a abertura.
- Recomendação futura: mover o foco para o primeiro elemento focável do modal (ex.: o botão de fechar, ou o primeiro botão de fase habilitado) ao abri-lo — mesmo padrão que o modal de créditos já usa.

### 🔵 AC-05 — Baixo — Ausência de `<h1>` e estrutura mínima de headings
- Ver seção 2. Nenhuma tela do jogo tem um heading principal fixo; o único heading de cada tela é dinâmico e só existe depois de certas interações.
- Recomendação futura: considerar um `<h1>` oculto visualmente (mas acessível) com o nome do jogo/tela atual, para apoiar navegação por landmarks em leitores de tela.

### 🔵 AC-06 — Baixo — Alguns alvos de toque ficam abaixo de 44×44px
- Ver seção 5. Afeta principalmente os ícones de som/configurações e os botões "Créditos"/"Voltar".
- Recomendação futura: avaliar aumentar a área de toque (via padding) desses controles secundários, especialmente em telas pequenas.

### 🔵 AC-07 — Baixo — Botão "Configurações" com rótulo correto, mas sem função (cross-referência)
- Já documentado na Tarefa 03; aqui apenas confirmado que, apesar do `aria-label` correto, não há nenhuma configuração de acessibilidade real por trás dele (ver seção 7).

### 💡 AC-08 — Melhoria — Botão de som da tela inicial sem alternativa textual de estado (cross-referência)
- Já documentado como achado AA-07 na Tarefa 05. Reafirmado aqui sob a lente de acessibilidade: dos 3 botões de som do jogo, só este não tem um `<span>` de texto que acompanhe a troca de ícone/estado.

---

## Melhorias recomendadas (separadas de bugs confirmados)

Nenhuma das sugestões abaixo foi implementada nesta auditoria; são oportunidades para avaliação futura da equipe, distintas dos achados AC-01 a AC-08 (que são problemas confirmados por evidência direta):

1. Adicionar uma régua de "modo de alto contraste" ou ajuste de tamanho de fonte, já que o botão "Configurações" existe visualmente mas está vazio — aproveitaria uma UI que a criança já veria na tela.
2. Considerar uma forma de mover itens pelo teclado além da seleção assistida por cesta (ex.: teclas de seta para mover o item focado entre cestas), para fechar o item "suporte completo a teclado" já listado como requisito em aberto no README.
3. Avaliar texto alternativo mais descritivo para o ícone de cadeado (`🔒`) dos mundos bloqueados — hoje é `aria-hidden`, e a informação "bloqueado" já está no `aria-label` do botão, então a alternativa já existe; a sugestão é só sobre reforço visual (ex.: traço diagonal ou símbolo redundante) para crianças com baixa visão que não usam leitor de tela.

---

## Resumo

- **Pontos fortes confirmados**: regiões `aria-live` consistentes para todo feedback dinâmico; contraste de cor forte em todos os pares verificados; ausência de dependência exclusiva de cor; fase completa jogável de ponta a ponta somente por teclado; foco visível e bem desenhado dentro das telas de fase.
- **Problemas confirmados**: 7 (2 🟠 Alto — foco invisível no menu, `aria-valuenow` desatualizado; 2 🟡 Médio — ausência de armadilha de foco nos 2 modais, foco não movido ao abrir o modal de fases; 3 🔵 Baixo — ausência de `<h1>`, alvos de toque pequenos, botão de configurações sem função).
- **Melhorias sugeridas (não bugs)**: 3, listadas separadamente na seção acima.
- **Requisitos documentados pela equipe**: 4 diretrizes gerais do AGENTS.md avaliadas, 3 atendidas na amostra verificada (cores, contraste, feedback) e 1 parcialmente atendida (teclado — mais avançada na prática do que o README sugere, mas ainda sem movimento livre de itens).
- **Requisito já documentado como não implementado pela própria equipe**: configurações de acessibilidade — confirmado, não é uma descoberta nova.
- **Pontos que dependem de confirmação da equipe**: se a ausência de armadilha de foco nos modais e o foco invisível no menu devem ser tratados como prioridade antes de outras pendências já conhecidas (ex.: suporte completo a teclado para arrastar), e se a referência de 44×44px para alvos de toque deve ser adotada formalmente como padrão do projeto.
