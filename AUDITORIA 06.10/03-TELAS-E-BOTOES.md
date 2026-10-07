# Auditoria 06.10 — Telas, Botões e Navegação

**Data:** 06/10/2026
**Escopo:** funcionalidade dos controles e da navegação entre telas — inventário de telas, inventário de botões/controles, botões sem utilização, inconsistências HTML↔JS e mapeamento de navegação. Responsividade já foi coberta na Tarefa 02; acessibilidade formal fica para uma auditoria separada (menciono um ou outro ponto de `aria-label` só quando ele também revela uma inconsistência de conteúdo/HTML, não como avaliação de acessibilidade em si).

**Regra respeitada:** nenhum arquivo do jogo foi alterado, corrigido ou refatorado. Nenhum commit ou push foi realizado. Único arquivo criado/alterado nesta etapa: este próprio documento. O ambiente de teste (Playwright, servidor HTTP local) ficou fora do repositório e foi encerrado ao final.

---

## 0. Metodologia

1. **Inventário estático**: todos os `id`, `class` de elementos interativos e handlers (`addEventListener`, `onclick`) foram extraídos de `index.html`, `fase1.html` e dos 7 arquivos JS (`menu.js`, `main.js`, `game.js`, `math.js`, `operacoes.js`, `progresso.js`, `audio.js`, `dev.js`), e cada `id` referenciado por `querySelector`/`getElementById` foi cruzado contra os `id` realmente declarados no HTML (e vice-versa).
2. **Verificação dinâmica real** (Google Chrome via Playwright, temporário, fora do projeto, servindo o jogo por `http://localhost:8000`): todo achado candidato encontrado na leitura estática foi testado de fato no navegador antes de entrar neste relatório — clique real, leitura do DOM resultante (`classList`, HTML antes/depois), captura de console/page errors. Nenhum achado abaixo é "só leitura de código" quando podia ser testado.
3. Nenhuma correção foi aplicada em nenhum momento.

---

## 1. Inventário de telas

| Tela/Estado | Existe | Acessível | Funciona | Observação |
|---|---|---|---|---|
| Tela inicial (`#tela-inicial`) | Sim | Sim — padrão ao abrir `index.html` | Sim | Logo, JOGAR, CRÉDITOS, Som, Configurações. |
| Modal de Créditos (`#modal-creditos`) | Sim | Sim — botão CRÉDITOS | Sim | Abre/fecha corretamente por X, clique fora e Esc (testado, ver seção 5). |
| Seleção de mundos (`#menu-fases`) | Sim | Sim — botão JOGAR | Sim | Carrossel, setas, barra de progresso, Voltar. |
| Modal "Escolha uma fase" (`#modal-fases`) | Sim | Sim — clique num card de mundo desbloqueado | Sim | Abre/fecha corretamente por X e Esc (testado). |
| Tela de organização (`#tela-organizacao`, dentro de `fase1.html`) | Sim | Sim — ao iniciar qualquer fase | Sim, **mas sem controle de saída** | Ver achado CTRL-02: nenhum botão de voltar/sair enquanto a fase está em andamento. |
| Tela de matemática (`#tela-matematica`) | Sim | Sim — após organizar os objetos (ou de imediato, no Mundo 5) | Sim | Mesma observação do CTRL-02. |
| Área do adversário (`#area-boss`) | Sim | Sim — só quando a fase declara `boss` (hoje, só Mundo 5) | Sim | Escondida corretamente nos Mundos 1-4; aparece com corações, nome e imagem no Mundo 5. |
| Painel de vitória (`#painel-vitoria`) | Sim | Sim — só ao concluir a organização final de uma fase com `boss` (hoje, só Mundo 5) | Sim | Nos Mundos 1-4 a "conclusão" é só o painel de matemática + botões anexados, sem este painel dedicado — comportamento intencional (ver `exibirBotoesConclusao`/`concluirEtapaFinal` em `math.js`), não é uma tela ausente. |
| Mundo 5 (mundo inteiro) | Sim, implementado | **Parcial** — sem card no carrossel; só por URL direta (`fase1.html?mundo=5&fase=1`) ou painel DEV | Sim, joguei do início ao fim | Já registrado como estado conhecido/provisório no AGENTS.md e na Auditoria 01 (AF-02). Não é uma "tela órfã" por acidente — é um acesso incompleto já documentado pela própria equipe. |
| Painel DEV (`dev.js`) | Sim | Só com `?dev=true` na URL ou `sessionStorage` equivalente | Sim | Ferramenta de desenvolvimento, corretamente isolada do fluxo do jogador comum (confirmado na Auditoria 01) — fora do escopo de "telas do jogador", listada aqui só por completude do inventário. Painel flutuante com ~8 botões internos (ir para fase, completar etapa, próxima fase, desbloquear tudo, resetar progresso, fechar, etc.), todos fora do alcance de um jogador normal. |
| "Mundo 6" | **Não existe** | Não — nenhum arquivo `mundo6.js`, nenhum card, nenhuma fase | — | Artefato de dado: `progresso.js` grava `mundosDesbloqueados` incluindo `6` ao concluir o Mundo 5 (já registrado como AF-04 na Auditoria 01). Não é um sexto mundo implementado — é só um valor "órfão" dentro do `localStorage`, sem nenhuma tela ou rota correspondente. Tratado aqui como confirmação de que não há conteúdo nenhum por trás desse número. |

---

## 2. Inventário de controles (botões e elementos interativos)

| Controle | Tela | Arquivo | Evento/Função | Funciona? | Observação |
|---|---|---|---|---|---|
| JOGAR (`#botao-jogar`) | Tela inicial | `menu.js` | `click` → mostra `#menu-fases`, apaga progresso | ⚠️ | Funciona como navegação; apaga progresso fora do Modo Dev — já é o **AF-01** da Auditoria 01, não repito a classificação aqui. |
| CRÉDITOS (`#botao-creditos`) | Tela inicial | `menu.js` | `click` → abre `#modal-creditos` | ✅ | Testado em execução real. |
| Fechar créditos (`#btn-fechar-creditos`) | Modal de créditos | `menu.js` | `click` → fecha modal | ✅ | Testado. |
| Clique fora do modal de créditos | Modal de créditos | `menu.js` | `click` no backdrop → fecha | ✅ | Testado; clique **dentro** do conteúdo não fecha (testado, correto). |
| Tecla Esc (créditos) | Modal de créditos | `menu.js` | `keydown` → fecha se aberto | ✅ | Testado. |
| Som (`#btn-som`, tela inicial) | Tela inicial | `audio.js` | `click` (`data-controle-som`) → alterna mudo | ✅ | Testado; estado sincroniza com a pílula do menu de mundos e com o botão dentro da fase (ver teste de sincronização, seção 5). |
| **Configurações (`#btn-config`, tela inicial)** | Tela inicial | — | **nenhum** | ❌ | **CTRL-01** — sem handler em nenhum arquivo JS. |
| Botão Voltar (`#btn-voltar`) | Seleção de mundos | `menu.js` | `click` → volta para tela inicial, fecha modal de fases | ✅ | Testado. |
| Som (pílula, `.controle-mundo[data-controle-som]`) | Seleção de mundos | `audio.js` | `click` → alterna mudo | ✅ | Mesmo handler genérico do botão de som. |
| **Configurações (pílula, `.controle-mundo`)** | Seleção de mundos | — | **nenhum** | ❌ | **CTRL-01** — segunda instância do mesmo botão morto. |
| Perfil "Jogador" (avatar) | Seleção de mundos | — | — | — | Elemento decorativo (`<div>`/`<span>`, não é `<button>`) — corretamente não-interativo, não é um bug. |
| Setas do carrossel (`.btn-seta`) | Seleção de mundos | `menu.js` | `click` → `scrollBy` no carrossel | ✅ | Testado com 6 cliques seguidos em cada direção; o carrossel para corretamente no limite (nunca estoura o `scrollWidth`), sem travar. |
| Cards de mundo (`.card-mundo`) | Seleção de mundos | `menu.js` | `click` → abre modal de fases (se desbloqueado) | ✅ | Testado nos 4 mundos acessíveis pela UI. Card do Mundo 4 funciona, mas tem inconsistência visual — ver **CTRL-03**. |
| Barra de progresso | Seleção de mundos | `menu.js` | — (só leitura, `atualizarInterfaceProgresso`) | ✅ | Informativa, não interativa — correto. |
| Fechar modal de fases (`#btn-fechar-modal`) | Modal de fases | `menu.js` | `click` → fecha modal | ✅ | Testado. |
| Tecla Esc (modal de fases) | Modal de fases | `menu.js` | `keydown` → fecha se aberto | ✅ | Testado. |
| Botões "Jogar Fase 1/2/3" (`#btn-iniciar-fase1/2/3`) | Modal de fases | `menu.js` | `click` → `abrirFase(...)` | ✅ | Testado nos 4 mundos; fases bloqueadas ficam com `disabled` (confirmado via `isDisabled()`, não apenas visual). |
| Som (`.btn-som-fase`, dentro da fase) | Organização/Matemática | `audio.js` (encaminha via `postMessage`) | `click` → alterna mudo no menu pai | ✅ | Testado — sincroniza corretamente com o menu. |
| Objetos arrastáveis (`.draggable-item`) | Organização | `game.js` | `pointerdown/move/up` | ✅ | Já exaustivamente testado nas Auditorias 01 e 02. |
| Cestas (`.drop-zone`, foco+Enter) | Organização | `game.js` | `keydown` (Enter/Espaço) → coloca o próximo item pendente | ✅ | Caminho alternativo por teclado, funciona, mas coloca sempre o "próximo item disponível" (não o que está em foco) — comportamento já documentado no próprio código como provisório ("o teclado será melhorado na próxima etapa"); não é um bug, é uma funcionalidade parcialmente implementada por design. |
| Botões de resposta (`.botao-opcao-matematica`) | Matemática | `math.js` | `click` → `verificarRespostaMatematica` | ✅ | Testado exaustivamente nas Auditorias 01 e 02 (certo, errado, cliques repetidos). |
| "Voltar para o Menu" (`.btn-conclusao`) | Conclusão de fase/vitória | `math.js` | `click` → `postMessage`/`location.href` para o menu | ✅ | Testado em todos os mundos. |
| "Próxima Fase" (`.btn-conclusao`) | Conclusão de fase | `math.js` | `click` → `postMessage`/`location.href` para a próxima fase | ✅ | Testado; só aparece quando há de fato uma próxima fase no mesmo mundo (confirmado nos 4 mundos). |
| Corações do adversário (`#boss-coracoes`) | Matemática (Mundo 5) | `math.js` | — (só leitura) | ✅ | Informativo, não interativo — correto. |

---

## 3. Botões sem utilização confirmados

### CTRL-01 — 🟡 Médio — Tipo: Botão sem utilização

- **Elemento(s) afetado(s):** `#btn-config` (tela inicial) e o segundo botão "Configurações" dentro de `.pílula-controles` (seleção de mundos, sem `id` próprio, só `aria-label="Configurações"`).
- **Arquivo(s):** `index.html` (linhas 18 e ~53); nenhum arquivo `.js` referencia `btn-config` ou trata o clique nesse botão em nenhum lugar (confirmei com busca em todos os arquivos `.js` do projeto).
- **Comportamento atual (confirmado em execução real):** cliquei nos dois botões separadamente; em ambos os casos o HTML da página não mudou em nada (comparei `page.content()` antes/depois, idêntico), nenhum console.error novo apareceu além do 404 de áudio já conhecido (não relacionado ao clique), nenhum `pageerror`.
- **Comportamento esperado:** um botão com ícone de engrenagem e rótulo "Configurações", presente em duas telas, sugere que deveria abrir algum painel de configurações (ex.: volume, idioma, contraste). Hoje ele é puramente decorativo.
- **Como reproduzir:** abrir o jogo, clicar no ícone de engrenagem no canto superior direito da tela inicial (ou, dentro do menu de mundos, no botão "Configurações" da pílula) e observar que nada acontece.
- **Evidência:** teste automatizado confirmou `htmlMudou: false` nas duas instâncias; screenshot da tela inicial mostra o ícone de engrenagem ao lado do ícone de som, ambos com a mesma aparência de botão funcional.
- **Possível causa:** funcionalidade de configurações planejada na interface, mas ainda não implementada no JavaScript — o `README.md` já lista "Configurações de acessibilidade (contraste, tamanho de fonte, etc.)" na seção "Ainda não implementado", o que é consistente com este botão ser um placeholder visual para algo que a equipe já sabe que falta.
- **Impacto:** nenhuma funcionalidade é perdida (não existe comportamento esperado documentado que esteja quebrado), mas um botão clicável sem efeito nenhum pode confundir — especialmente uma criança, que pode clicar repetidamente esperando algo acontecer.
- **Classificação:** não é exatamente um "bug" no sentido de algo que quebrou — é uma funcionalidade prevista na interface e nunca implementada no JS, coerente com o que o próprio README já relata como pendência. Mantenho prioridade 🟡 Médio porque é um controle visível e proeminente (aparece em 2 telas, bem no topo) sem qualquer feedback de "em breve" ou desabilitado.

---

### CTRL-02 — 🟠 Alto — Tipo: Navegação / Funcionalidade ausente

**Não existe nenhum controle para sair/voltar de uma fase em andamento antes de concluir o desafio matemático.**

- **Tela/Mundo/Fase:** qualquer fase, de qualquer mundo, durante a etapa de organização ou durante a etapa de matemática (antes de responder corretamente).
- **Elemento(s) afetado(s):** inexistência de um botão — não é um elemento quebrado, é a ausência de um.
- **Comportamento atual (confirmado em execução real):** inspecionei todos os `<button>` presentes na tela de organização do Mundo 1, Fase 1, antes de qualquer interação: a lista é só o botão de som + os 5 objetos arrastáveis. **Nenhum botão de "voltar", "sair" ou "menu".** O único jeito de sair de uma fase em andamento é:
  1. Recarregar a página (funciona e é seguro para o progresso salvo, conforme já estabelecido na Auditoria 01 — mas não existe nenhuma indicação na tela de que isso é "a forma de sair"); ou
  2. Usar o botão **Voltar do navegador** — que testei e **não volta para o menu do jogo**: como o jogo nunca usa `history.pushState` e a troca de fase/menu acontece só trocando o `src` do `<iframe>` (sem navegação real da página de cima), o histórico do navegador não tem nenhuma entrada "intermediária" para o menu. Pressionar Voltar leva para **fora do jogo inteiro** (para a página que o jogador tinha aberto antes de entrar no jogo), não para uma tela anterior dentro do jogo.
- **Comportamento esperado:** um botão "Sair"/"Voltar ao Menu" visível durante a fase, para quem quiser interromper sem precisar recarregar a página ou arriscar sair do jogo pelo botão do navegador.
- **Como reproduzir:**
  1. Abrir o jogo, JOGAR → Mundo 1 → Fase 1 (a tela de organização carrega).
  2. Observar que não há nenhum botão de saída na tela.
  3. (Opcional) Clicar no botão "Voltar" do navegador e observar que ele sai do jogo inteiro, em vez de voltar ao menu de mundos.
- **Evidência:** inventário de botões da tela (seção 2 acima, linha "Objetos arrastáveis") e teste de navegação (`page.goBack()` levou a página para fora de `index.html`).
- **Arquivo(s) relacionado(s):** `fase1.html` (`<header class="topo-fase1">` só tem o botão de som, nenhum botão de saída); nenhum arquivo `.js` chama `history.pushState`/`history.replaceState`.
- **Possível causa:** o fluxo foi desenhado assumindo que o jogador sempre completa a fase (organização → matemática → "Voltar para o Menu"/"Próxima Fase"), sem considerar o caso de alguém querer desistir no meio.
- **Impacto:** quem entra na fase errada, ou simplesmente muda de ideia no meio da organização ou da conta, fica sem uma saída óbvia e seguramente destacada na interface — a opção que realmente funciona (recarregar a página) não é comunicada em lugar nenhum.
- **Classificação:** Funcionalidade ausente / Navegação.

---

### CTRL-03 — 🟡 Médio — Tipo: HTML/JS inconsistente / Elemento legado

**O card do Mundo 4 no carrossel não segue o mesmo padrão visual dos outros três cards.**

- **Tela/Mundo/Fase:** Seleção de mundos — card do Mundo 4.
- **Elemento(s) afetado(s):** `#card-mundo-4` (`index.html`, linha ~79).
- **Comportamento atual (confirmado em execução real, com screenshot):**
  1. **Sem legenda**: os cards dos Mundos 1, 2 e 3 mostram uma faixa colorida com o nome do mundo ("Mundo: 1 - A Casa", "Mundo: 2 - Parque", "Mundo: 3 - Praia") na parte inferior da ilustração. O card do Mundo 4 **não tem nenhuma faixa ou texto** — é só a imagem com o cadeado por cima.
  2. **Imagem reaproveitada do jogo, não uma ilustração de capa dedicada**: o `src` da imagem do card do Mundo 4 é `assets/images/mundo_4/acampamento_bagunçado.png` — confirmei que esse é exatamente o mesmo arquivo usado em `js/mundos/mundo4.js` como `FUNDO_MUNDO_4_BAGUNCADO`, isto é, o cenário "bagunçado" usado **dentro do jogo** na Fase 1, não uma ilustração desenhada especificamente para o card do menu (como são `mundo_1.png`, `mundo_2.png`, `mundo_3.png`, da pasta `nova_tela_menu de_fases/`). Isso também explica o problema 1: as imagens de capa dos Mundos 1-3 parecem ter o texto do nome desenhado na própria arte; a imagem reaproveitada do Mundo 4 nunca teve esse texto.
  3. **`aria-label` sem o nome do mundo**: `aria-label="Mundo 4, bloqueado"`, enquanto os Mundos 2 e 3 têm `aria-label="Mundo 2, Parque, bloqueado"` e `aria-label="Mundo 3, Praia, bloqueado"` — o nome "Acampamento" nunca aparece no card do Mundo 4, nem visualmente nem no rótulo.
- **Comportamento esperado:** um card com a mesma faixa de nome e o mesmo estilo de ilustração dos demais (cena diurna e dedicada, com o nome "Mundo: 4 - Acampamento").
- **Como reproduzir:** abrir o menu de mundos e rolar o carrossel até o Mundo 4 (ele é o 4º card; em telas largas aparece parcialmente à direita; em qualquer largura, dá para chegar nele pelas setas ou arrastando).
- **Evidência:** screenshot do carrossel mostrando os 3 primeiros mundos com faixa de nome colorida e o Mundo 4 sem nenhuma faixa, com uma ilustração noturna destoante do estilo diurno dos outros três.
- **Arquivo(s) relacionado(s):** `index.html` (linha 79-82); `js/mundos/mundo4.js` (comentário do próprio arquivo já menciona que a arte usada no jogo é de `assets/images/mundo_4/`, mas não há menção a uma arte de capa dedicada para o menu, diferente do padrão dos Mundos 1-3).
- **Possível causa:** quando o Mundo 4 foi implementado, a arte de capa específica para o carrossel do menu aparentemente não foi criada — alguém usou a imagem de cenário do próprio jogo como substituta temporária, e isso nunca foi substituído pela arte definitiva.
- **Impacto:** o card continua funcional (clicável, mostra o cadeado quando bloqueado, abre o modal corretamente quando desbloqueado) — não é um bug que impede jogar. Mas visualmente destoa dos outros três cards de forma bem perceptível, e um jogador não consegue identificar o nome "Acampamento" olhando só para o card.
- **Classificação:** Elemento legado / inconsistência de conteúdo (não é uma preferência estética — é uma peça do mesmo "componente card de mundo" visivelmente incompleta em comparação às outras três instâncias idênticas).

---

### CTRL-04 — 🔵 Baixo — Tipo: Elemento legado (código morto, sem impacto funcional)

**Variáveis declaradas em `menu.js` para os cards dos mundos nunca são usadas.**

- **Arquivo(s) relacionado(s):** `js/menu.js`, linhas 6-9:
  ```js
  const botaoFase1 = document.querySelector("#botao-fase1");
  const cardMundo2 = document.querySelector("#card-mundo-2");
  const cardMundo3 = document.querySelector("#card-mundo-3");
  const cardMundo4 = document.querySelector("#card-mundo-4");
  ```
- **Comportamento atual:** confirmei, com busca no arquivo inteiro, que nenhuma dessas quatro variáveis é referenciada em nenhum outro lugar de `menu.js` depois da declaração. A navegação real dos cards é feita por um laço genérico mais abaixo no arquivo (`document.querySelectorAll(".card-mundo").forEach(...)`), que não depende dessas variáveis. Na mesma função desse laço, também há uma linha `card.onclick = null;` antes de `addEventListener` — defensiva contra um atributo `onclick` inline que não existe em nenhum lugar do HTML atual, também sem efeito prático hoje.
- **Comportamento esperado:** não há expectativa funcional quebrada aqui — é puramente uma observação de limpeza de código.
- **Impacto:** nenhum — zero efeito no comportamento do jogo, confirmado pela navegação funcionar normalmente nos testes desta e das auditorias anteriores.
- **Classificação:** Elemento legado, provavelmente resíduo de uma versão anterior do menu que tratava cada card individualmente antes de ser migrada para o laço genérico atual.

---

### CTRL-05 — 🔵 Baixo — Tipo: Elemento legado (já registrado na Auditoria 01)

**Referência de progresso a um "Mundo 6" inexistente.**

Já documentado como achado **AF-04** na Auditoria 01 (`01-FUNCIONALIDADE-E-FLUXO.md`) — repito aqui apenas para fechar o pedido específico desta Tarefa 03 de registrar qualquer referência a um Mundo 6. Confirmei novamente que **não existe** nenhum arquivo `mundo6.js`, nenhum card, nenhuma fase — é só um valor gravado em `progresso.js` (`mundosDesbloqueados`/`faseMaximaPorMundo`) ao concluir o Mundo 5, sem nenhuma tela ou rota correspondente. Não conto este achado de novo no resumo final desta tarefa, para não duplicar a contagem de problemas entre os dois relatórios.

---

## 4. Botões testados e sem problema encontrado (ações repetidas, aberturas/fechamentos)

Testei explicitamente, em execução real, os seguintes comportamentos considerados de risco (clique duplo, abrir/fechar repetido, cliques fora de ordem) — **nenhum problema encontrado** em nenhum deles:

| Teste | Resultado |
|---|---|
| Abrir créditos → fechar pelo X → reabrir → fechar clicando fora (backdrop) → reabrir → fechar com Esc | ✅ Todos os caminhos fecham corretamente |
| Clicar dentro do conteúdo do modal de créditos (não deveria fechar) | ✅ Continua aberto, como esperado |
| Abrir modal de fases → fechar pelo X → reabrir → fechar com Esc | ✅ Ambos funcionam |
| Clicar na seta "Próximo mundo" 6 vezes seguidas (mais do que necessário para chegar ao fim do carrossel) | ✅ Para corretamente no limite, sem estourar nem travar |
| Clicar na seta "Mundo anterior" 6 vezes seguidas, a partir do fim | ✅ Volta corretamente ao início |
| Alternar o som dentro de uma fase e conferir se o botão do menu (fora do iframe) reflete o novo estado | ✅ Sincroniza corretamente via `postMessage` |
| Responder errado 3 vezes seguidas num desafio matemático, depois acertar | ✅ (já testado nas Auditorias 01 e 02) nunca trava |
| Duplo clique na resposta certa / em "Próxima Fase" | ✅ (já testado na Auditoria 01) sem duplicação de painel, sem erro |

---

## 5. Navegação

**Fluxo mapeado e testado:**

```
Tela inicial
  → JOGAR → Seleção de mundos
      → clique num mundo desbloqueado → Modal "Escolha uma fase"
          → clique numa fase desbloqueada → Tela de organização (dentro do iframe)
              → objetos organizados → Tela de matemática
                  → resposta certa → Conclusão (Voltar para o Menu | Próxima Fase, se houver)
                      → Próxima Fase → [repete organização/matemática na fase seguinte]
                      → Voltar para o Menu → Seleção de mundos
  → CRÉDITOS → Modal de créditos → fechar → Tela inicial
  → Botão Voltar (na Seleção de mundos) → Tela inicial
```

**Caminhos testados e confirmados funcionando:** todos os trechos acima, nos 4 mundos acessíveis pela UI e no Mundo 5 (por URL direta).

**Problemas de navegação encontrados:**

- **CTRL-02** (já detalhado acima): nenhuma saída disponível durante uma fase em andamento; o botão Voltar do navegador sai do jogo inteiro em vez de voltar a uma tela anterior do próprio jogo, porque a navegação interna nunca usa `history.pushState`.
- Nenhum **loop inesperado**, **link quebrado** ou **parâmetro de URL incorreto** foi encontrado nos caminhos mapeados acima — os parâmetros `?mundo=` e `?fase=` resolvem corretamente em todos os casos testados (inclusive o caso de acesso direto ao Mundo 5, que é um uso intencional do mesmo mecanismo).
- Nenhuma **tela órfã por acidente** foi encontrada — toda tela do inventário (seção 1) tem pelo menos um caminho de acesso real, ainda que o do Mundo 5 seja incompleto por decisão já conhecida da equipe (sem card no carrossel), não por um link quebrado.

---

## 6. HTML ↔ JavaScript

- **IDs referenciados pelo JS que não existem no HTML:** nenhum encontrado nos arquivos do jogo em si. Todos os `querySelector`/`getElementById` de `menu.js`, `game.js`, `math.js`, `main.js` e `audio.js` correspondem a um `id` real em `index.html` ou `fase1.html` — com a exceção esperada dos seletores de `dev.js` que apontam para elementos que o próprio `dev.js` **cria dinamicamente** (o painel flutuante do Modo Dev), o que é um padrão correto, não um erro.
- **IDs duplicados:** nenhum encontrado — conferi `index.html` e `fase1.html` inteiros, todos os `id` são únicos.
- **Elementos com `id` nunca usados por JS, mas referenciados por HTML (via `aria-labelledby`):** `#titulo-matematica` e `#boss-nome` não são buscados por `querySelector` em lugar nenhum pelo próprio `id`, mas são referenciados por `aria-labelledby` em outros elementos do mesmo HTML — uso legítimo, não é um problema (`#boss-nome` também é manipulado por `math.js`, então tem uso duplo: JS **e** referência de acessibilidade).
- **`#play-area`** (no `<main>` de `fase1.html`) não é referenciado por nenhum JS nem por nenhum atributo `aria-*` — é um `id` sem uso aparente, mas sem nenhum efeito negativo (não aparenta ser interativo, não confunde nada). Registro por completude, sem abrir um achado formal para isso — impacto zero.
- **Classes esperadas pelo JS que não existem no HTML:** nenhuma encontrada — toda classe usada em seletores (`.card-mundo`, `.drop-zone`, `.draggable-item`, `.botao-opcao-matematica`, `.btn-conclusao`, `.acoes-conclusao`, etc.) corresponde a elementos de fato presentes (estáticos ou gerados dinamicamente pelos próprios `game.js`/`math.js`, que são os únicos a criar esses elementos, então a consistência depende só deles mesmos, já exaustivamente testada nas Auditorias 01 e 02).

---

## 7. Resultado final

### Inventário de telas

Ver tabela completa na seção 1 (10 linhas: Tela inicial, Modal de Créditos, Seleção de mundos, Modal de fases, Organização, Matemática, Área do adversário, Painel de vitória, Mundo 5 como um todo, Painel DEV, mais a confirmação de que "Mundo 6" não existe).

### Inventário de controles

Ver tabela completa na seção 2 (24 controles catalogados).

### Problemas encontrados (por prioridade)

- 🔴 Crítico: nenhum.
- 🟠 Alto: **CTRL-02** — ausência de controle de saída durante uma fase em andamento / Voltar do navegador sai do jogo.
- 🟡 Médio: **CTRL-01** — botão "Configurações" sem função (2 instâncias); **CTRL-03** — card do Mundo 4 sem legenda e com arte reaproveitada do jogo em vez de ilustração de capa.
- 🔵 Baixo: **CTRL-04** — variáveis mortas em `menu.js`; **CTRL-05** — referência residual a "Mundo 6" no progresso salvo (já contabilizado na Auditoria 01, não duplicado aqui).
- 💡 Melhoria: nenhuma adicional além do que já foi coberto pelos achados acima.

### Controles sem utilização

- **`#btn-config`** (tela inicial) — confirmado sem handler em nenhum arquivo JS, clique sem efeito algum (testado).
- **Botão "Configurações" da pílula** (seleção de mundos) — mesma situação, segunda instância.
- (Não listo as variáveis `botaoFase1`/`cardMundo2`/`cardMundo3`/`cardMundo4` aqui porque elas não são "controles sem utilização" no sentido de botões mortos na tela — são variáveis de código sem uso, já cobertas no CTRL-04.)

### Navegação

Ver mapa de fluxo e resultados na seção 5. Único problema confirmado: **CTRL-02**. Nenhuma tela órfã, nenhum loop, nenhum link ou parâmetro de URL quebrado.

### Resumo

- **Total de telas auditadas:** 10 (tela inicial, modal de créditos, seleção de mundos, modal de fases, organização, matemática, área do adversário, painel de vitória, Mundo 5 como conjunto, painel DEV) + confirmação formal de que "Mundo 6" não existe.
- **Total de controles auditados:** 24 (ver inventário completo na seção 2).
- **Botões sem utilização:** 2 (as duas instâncias do botão "Configurações" — achado CTRL-01).
- **Botões quebrados (função incorreta):** 0 — todos os controles que têm alguma função a executam corretamente nos testes realizados (cliques simples, repetidos, fora de ordem, abrir/fechar modais).
- **Problemas de navegação:** 1 (CTRL-02 — sem saída durante uma fase em andamento, e o botão Voltar do navegador não tem suporte interno).
- **Telas órfãs:** 0 (o Mundo 5 tem acesso incompleto pela UI, mas isso já era conhecido e está documentado — não é uma tela acidentalmente inacessível).
- **Elementos legados:** 2 (CTRL-04 — variáveis mortas em `menu.js`; CTRL-05 — referência residual a "Mundo 6", já contabilizada na Auditoria 01) + a arte reaproveitada do card do Mundo 4 (CTRL-03), que é legado de conteúdo, não de código.
- **Melhorias recomendadas:** implementar (ou remover a aparência de clicável d)o botão "Configurações" até que exista uma função real por trás dele; adicionar um controle visível de "Sair"/"Voltar ao Menu" durante uma fase em andamento; substituir a arte do card do Mundo 4 por uma ilustração de capa dedicada, consistente com os Mundos 1-3.
