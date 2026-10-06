# 05 — Auditoria de Áudio

Auditoria exclusivamente do sistema de áudio do jogo "Arruma a Bagunça": arquivos existentes, referências no código, controles de som e sincronização entre telas. Foco em **funcionalidade e integridade**, não em gosto musical ou qualidade artística.

Nenhum arquivo do jogo foi alterado, removido, substituído ou corrigido durante esta auditoria. Nenhum commit ou push foi realizado.

## Metodologia

1. **Análise estática**: inventário físico de `assets/audio/` (via listagem de diretório e hash MD5 com `certutil`) cruzado com busca textual (`grep`) por `assets/audio`, `.mp3`, `.wav`, `new Audio`, `data-controle-som` em todo o código-fonte (`.js`, `.html`, `.css`).
2. **Execução real em navegador**: Google Chrome via Playwright, instalado em pasta temporária **fora** do repositório, servindo o projeto por `python -m http.server 8000` (também temporário). Scripts de teste e capturas de tela ficaram fora do repositório durante todo o processo; o servidor foi encerrado ao final.
3. **Histórico do Git** (somente leitura, `git log`/`git show`): usado para confirmar se a referência de áudio ausente é um caso de arquivo "nunca existiu" ou "existiu e foi movido/renomeado" — informação relevante para a seção 3 do pedido ("referências antigas").

---

## 1. Inventário de áudio

`assets/audio/` contém **21 arquivos físicos**, organizados em 3 subpastas. Nenhum arquivo de áudio existe diretamente na raiz de `assets/audio/`.

| Pasta | Arquivos | Formato | Tamanho total |
|---|---|---|---|
| `Efeitos/` | 5 | `.wav` | ≈ 741 KB |
| `Mundos/` | 6 | `.mp3` | ≈ 25,4 MB |
| `Objetos/` | 10 | `.wav` | ≈ 1,45 MB |

Detalhamento (tamanho exato em bytes, obtido do disco):

**Efeitos/ (efeitos de interface/feedback)**
- `Efeitos - Botão.wav` (52.178 B)
- `Efeitos - Certo.wav` (128.502 B)
- `Efeitos - Errado.wav` (35.180 B)
- `Efeitos - FaseConcluida.wav` (259.972 B)
- `Efeitos - GameOver.wav` (294.730 B)

**Mundos/ (músicas de fundo por tema)**
- `Menu Principal.mp3` (4.377.093 B)
- `Mundo 1 - Casa.mp3` (4.288.692 B)
- `Mundo 2 - Parque.mp3` (4.141.364 B)
- `Mundo 3 - Praia.mp3` (4.212.836 B)
- `Mundo 4 - Acampamento.mp3` (4.255.468 B)
- `Fase Bonus - ChefãoFinal.mp3` (4.114.406 B)

**Objetos/ (sons específicos de itens arrastáveis)**
- `Som - Bola.wav`, `Som - Cachorro.wav`, `Som - Frutas.wav`, `Som - GarrafaDeAgua.wav`, `Som - Gato.wav`, `Som - HoverCesta.wav`, `Som - Passaro.wav`, `Som - Refrigerante.wav`, `Som - Robo.wav`, `Som - Tremzinho.wav`, `Som - Ursinho.wav` — 10 arquivos, 43 KB a 350 KB cada.

**Onde é utilizado / Função / Status**: nenhum dos 21 arquivos acima é referenciado em qualquer `.js`, `.html` ou `.css` do projeto (ver seção 2). Status de todos: **presente no disco, não utilizado pelo código**.

Não há áudios de instrução/narração no projeto — e isso é esperado: o README.md marca explicitamente "instruções com suporte a áudio" como **não implementado** (não é um requisito pendente desta auditoria, é uma decisão documentada da equipe).

---

## 2. Referências no código

Busca exaustiva (`grep -rniE` por `assets/audio`, `\.mp3`, `\.wav`, `new Audio`, `data-controle-som`) em **todos** os arquivos `.js`, `.html` e `.css` do projeto.

**Resultado: existe exatamente UMA referência de áudio em todo o código-fonte.**

```js
// js/audio.js, linha 39
const ARQUIVO_TRILHA = "assets/audio/everything-in-place.mp3";
// js/audio.js, linha 144
audio = new Audio(ARQUIVO_TRILHA);
```

- `js/audio.js` é incluído tanto em `index.html` (linha 121) quanto em `fase1.html` (linha 112).
- Nenhum outro arquivo JS (`game.js`, `math.js`, `operacoes.js`, `menu.js`, `progresso.js`, `dev.js`, `js/mundos/mundo1.js` a `mundo5.js`) contém qualquer string `.mp3`/`.wav`, chamada `new Audio()`, ou qualquer outra forma de referência a áudio.
- `js/dev.js` não tem nenhuma lógica relacionada a áudio (a única ocorrência da substring "som" ali é parte da palavra "assumir", sem relação).
- Não há construção dinâmica de caminhos de áudio (nenhum template literal ou concatenação que monte um nome de arquivo de `assets/audio/...`), então a lista de "não utilizados" pode ser tratada como definitiva, não apenas como suspeita.

**Conclusão direta desta seção**: os 21 arquivos físicos do inventário (seção 1) estão 100% órfãos no código — nenhum é referenciado. Ao mesmo tempo, a única referência que existe no código (`everything-in-place.mp3`) não corresponde a nenhum arquivo físico presente.

---

## 3. Arquivos ausentes

**Confirmado**: `assets/audio/everything-in-place.mp3` é referenciado em `js/audio.js:39` e `js/audio.js:144`, e **não existe** no disco (confirmado por busca de arquivo em todo o repositório, incluindo nomes com variação de maiúsculas/minúsculas).

- **Onde é referenciada**: apenas em `js/audio.js`, dentro da função `iniciar()` (linha 143), chamada incondicionalmente sempre que o script carrega fora de um iframe (ou seja, em toda carga de `index.html`, e também em toda carga de `fase1.html` quando acessada diretamente, fora do iframe do menu).
- **Qual evento tenta reproduzi-la**: nenhum clique é necessário para a *tentativa de carregamento* — o objeto `Audio` é criado e `preload = "auto"` é definido imediatamente na inicialização do script. A *reprodução* (`audio.play()`) só é tentada após a primeira interação do usuário (`pointerdown`/`keydown`) ou ao clicar no botão de som — mas o carregamento (e o erro 404) ocorre independentemente disso.
- **Se o arquivo realmente não existe**: confirmado.
- **Em quais situações isso ocorre**: em 100% das cargas de página testadas (tela inicial, acesso direto a uma fase, dentro de um playthrough completo do Mundo 1, dentro de um playthrough completo do Mundo 5) — ver seção 11 para evidência de execução.
- **Se o erro afeta a funcionalidade**: não impede o jogo de funcionar (o `.catch()` em `tocar()` absorve a falha de reprodução silenciosamente), mas **impede qualquer música de fundo de ser ouvida**, em qualquer tela, durante toda a sessão.
- **Se existe algum fallback**: não. Não há arquivo alternativo, nem tratamento específico para erro de carregamento (`audio.error`) — apenas o `.catch()` genérico da Promise de `play()`, comentado como sendo para a política de autoplay dos navegadores, não para arquivo ausente (ver achado 💡 AA-05).

### Esse não é o único arquivo a investigar — e o histórico do Git explica o que aconteceu

Usando `git log`/`git show` (somente leitura) sobre o próprio repositório local, foi possível confirmar uma cadeia de eventos:

1. No commit `d5ae48d` ("Feat: adição de trilhas sonoras e efeitos"), os 20 novos arquivos de `Efeitos/`, `Mundos/` (exceto `Menu Principal.mp3`) e `Objetos/` foram adicionados **no mesmo commit em que `assets/audio/everything-in-place.mp3` foi deletado**.
2. Pouco depois (9 minutos, mesmo autor), no commit `9b1ffd8` ("Feat: Música do menu principal que estava faltando"), o arquivo `assets/audio/Mundos/Menu Principal.mp3` foi adicionado.
3. Comparando por hash MD5: o conteúdo do blob deletado em `d5ae48d` (`everything-in-place.mp3`) e o conteúdo atual de `assets/audio/Mundos/Menu Principal.mp3` são **byte-a-byte idênticos** (`b5fab7a70addad40841ed10133935344`, mesmo tamanho: 4.377.093 bytes).

Ou seja: o arquivo de trilha sonora não foi perdido — ele foi efetivamente **movido/renomeado** de `assets/audio/everything-in-place.mp3` para `assets/audio/Mundos/Menu Principal.mp3` ao longo de duas reorganizações de assets, e a constante `ARQUIVO_TRILHA` em `js/audio.js` nunca foi atualizada para o caminho novo. Isso classifica o achado como **referência antiga/obsoleta**, não como "recurso nunca implementado" (ver achado 🔴 AA-01).

Nenhuma outra referência de áudio quebrada foi encontrada (não há outras strings de caminho de áudio no código além dessa).

---

## 4. Menu

Testado em Chrome via Playwright, com interação real simulada (clique) para satisfazer a política de autoplay dos navegadores.

- **Música de fundo**: tentativa de carregamento falha (ver seção 3); logo, não há música de fundo audível no menu, apesar do controle de som indicar "ligado" por padrão.
- **Efeitos**: nenhum efeito sonoro é disparado por nenhuma interação do menu (clique em JOGAR, CRÉDITOS, setas do carrossel, cards de mundo, modais) — confirmado por análise estática (seção 2) e por ausência de qualquer requisição de rede a arquivos de áudio durante essas interações.
- **Botão de som**: existem três botões físicos com `data-controle-som` controlando o **mesmo estado lógico global** (não é um estado por botão): `#btn-som` (tela inicial), `.controle-mundo[data-controle-som]` (menu de mundos) e `.btn-som-fase` (dentro de cada fase, via iframe).
- **Ativação/desativação**: testado no `#btn-som` da tela inicial — alterna corretamente `aria-pressed` (`false`→`true`→`false`) e `aria-label` ("Desativar"↔"Ativar música de fundo") a cada clique, inclusive sob 5 cliques consecutivos rápidos, sem travar ou dessincronizar.
- **Persistência durante a navegação**: ao clicar em JOGAR (tela inicial → menu de mundos), o estado do botão `.controle-mundo` reflete exatamente o estado que `#btn-som` tinha (`sincronizouAoEntrarNoMenu: true`). Ao voltar (botão "Voltar"), `#btn-som` mantém o estado que havia sido definido (`manteveAoVoltar: true`).
- **Sincronização entre menu e jogo**: ao entrar em uma fase (Mundo 1) e clicar no botão de som **dentro** do iframe, o estado é propagado de volta ao botão do menu em menos de 300 ms via `postMessage` (`arruma-bagunca:alternar-som` / `arruma-bagunca:estado-som`) — confirmado nos dois sentidos (clique dentro da fase atualiza o menu; clique a partir do controle do menu de mundos — quando acessível, ver achado AA-04 — atualiza a fase).
- **Abrir/fechar configurações**: o botão de "Configurações" (`#btn-config` / `.controle-mundo[aria-label="Configurações"]`) não tem qualquer relação com áudio — já investigado como botão sem função na Tarefa 03 (`03-TELAS-E-BOTOES.md`), não é um achado novo de áudio.
- **Estado visual × estado real**: ver achado 🟡 AA-07 — o ícone do botão de som nunca muda visualmente (mesmo ícone `volume_solid_full_1.png`/emoji 🔊 em qualquer estado); apenas o botão do menu de mundos e o botão dentro da fase trazem um texto (`"Som ligado"`/`"Som desligado"`) que muda; o botão da tela inicial (`#btn-som`) não tem texto nenhum, apenas o ícone estático.

---

## 5. Fases dos Mundos 1–4

A mecânica de organização e o desafio matemático são código **genérico e compartilhado** (`game.js` e `math.js`) — nenhum arquivo `js/mundos/mundoN.js` declara qualquer configuração de áudio própria (confirmado por grep: nenhum `mundoN.js` contém `audio`, `.mp3`, `.wav` ou `som`). Por isso, o teste completo (drag-and-drop, categoria completa, desafio matemático, conclusão) foi executado integralmente no **Mundo 1**, e o resultado é extrapolado para os Mundos 2–4 por compartilharem o mesmo motor sem qualquer diferenciação de áudio no código.

Playthrough real no Mundo 1 (Fase 1), com verificação de elementos `<audio>`/`<video>` no DOM e de requisições de rede de áudio em 4 pontos de checagem:

| Evento | Elementos de mídia observados | Requisição de áudio nova observada |
|---|---|---|
| Início da fase (antes de arrastar) | 0 | — |
| Objeto arrastado para cesta **errada** (teste de erro) | 0 | nenhuma |
| Todos os 5 objetos organizados corretamente | 0 | nenhuma |
| Resposta **errada** no desafio matemático | 0 | nenhuma |
| Resposta **certa** no desafio matemático | 0 | nenhuma |
| Tela de conclusão da fase | 0 | nenhuma |

- **Início da fase**: sem som dedicado (além da tentativa, já quebrada, da trilha de fundo).
- **Arrastar objeto**: sem som.
- **Objeto colocado corretamente**: sem som (apenas feedback visual — classe `is-correct`, contador).
- **Objeto colocado incorretamente**: sem som (apenas feedback visual/texto: *"Quase! Tente colocar a maçã em Comidas."*).
- **Conclusão de categoria**: sem som.
- **Conclusão da fase**: sem som.
- **Avanço para próxima fase / retorno**: sem som.

Não existe, em nenhum ponto de `game.js` ou `math.js`, qualquer lógica implementada para disparar os arquivos de `Efeitos/` ou `Objetos/` — a ausência de som aqui não é uma falha de reprodução, é uma ausência completa de lógica de disparo (ver achado 🟠 AA-02).

---

## 6. Mundo 5

Testado via acesso direto a `fase1.html?mundo=5&fase=1` (única forma de alcançar o Mundo 5, já que não há card dele no carrossel — conforme já documentado no AGENTS.md do projeto).

| Evento | Elementos de mídia observados | Resultado funcional |
|---|---|---|
| Introdução do "chefão" (5 corações exibidos) | 0 | ❤️❤️❤️❤️❤️ renderizado corretamente |
| Resposta **incorreta** (perda de coração) | 0 | 1 coração perdido corretamente (❤️❤️❤️❤️🤍) |
| 4 respostas corretas restantes | 0 | desafios avançam normalmente |
| Desaparecimento do chefão / organização da casa | 0 | tela de organização final aberta normalmente |
| Vitória | 0 | tela de conclusão aberta normalmente |

- **Nenhum evento do Mundo 5 reproduz qualquer som** — nem a perda de coração, nem a conclusão de um desafio, nem a vitória final. Isso é consistente com o Mundo 1-4: o mesmo motor genérico (`math.js` para os desafios, `game.js` para a organização final da casa) é reutilizado, sem qualquer lógica de áudio adicionada especificamente para o Mundo 5.
- Não há, no código de `mundo5.js`, `math.js` ou `game.js`, qualquer referência que indique que esses eventos *deveriam* ter som — portanto, a ausência aqui **não é classificada como achado novo**, apenas como confirmação de que o padrão observado nos Mundos 1–4 (seção 5) também vale para o Mundo 5.
- Teste de "game over" completo (perda de 5 corações) não foi executado para não precisar reiniciar o fluxo repetidamente de forma destrutiva ao teste; como a perda do 1º coração já testado passa pelo mesmo código de qualquer perda de coração (sem ramificação especial para a última vida), o resultado é extrapolável com alta confiança.

---

## 7. Controles de áudio

Existem **3 botões físicos**, todos usando o atributo `data-controle-som`, todos controlando o **mesmo estado lógico único** (não há estado independente por tela):

| Controle | Tela | Comportamento ao clicar | Estado inicial | Após navegação | Após clicar de novo |
|---|---|---|---|---|---|
| `#btn-som` | Tela inicial (`#controles-iniciais`) | Alterna `aria-pressed`/`aria-label` corretamente | `aria-pressed="false"` (som ligado) | Fica **oculto** (não removido, apenas escondido) a partir do clique em "JOGAR"; reaparece ao clicar em "Voltar", com o estado preservado | Alterna de volta corretamente, inclusive em sequência rápida (5 cliques) |
| `.controle-mundo[data-controle-som]` | Menu de mundos (`#menu-fases`) | Alterna o mesmo estado global; texto (`"Som ligado"`/`"Som desligado"`) atualiza | Sincronizado com `#btn-som` ao entrar | **Fica inclicável** enquanto uma fase está aberta (ver AA-04) | Funciona normalmente quando a fase não está aberta |
| `.btn-som-fase` | Dentro de cada fase (iframe de `fase1.html`) | Envia `postMessage` ao pai (`index.html`), que alterna o estado real e devolve o novo estado | Reflete o estado herdado do pai ao carregar | Permanece sincronizado durante toda a fase | Alterna corretamente, nos dois sentidos (fase→menu e menu→fase) |

Nenhum dos três controles está "sem função" — todos alteram, de fato, o estado real de mudo do único objeto `Audio` existente. Não foram encontrados controles de áudio duplicados com funções conflitantes, apenas o caso de inacessibilidade temporária descrito no achado AA-04.

---

## 8. Sincronização entre telas

Fluxo testado: Menu → Mundo 1 (fase incorporada) → interação dentro da fase → volta ao menu de mundos; e também reload completo de página.

- **Mute propagado corretamente**: alternar o som de dentro da fase atualiza o menu (pai) em até 300 ms, e vice-versa quando o controle do menu está acessível — confirmado nos dois sentidos.
- **Persistência ao recarregar a página**: o estado de mudo é salvo em `sessionStorage` (chave `arruma_bagunca_trilha`) a cada mudança; após um `reload()` completo da página, o botão de som manteve o estado salvo (`{"tocando":false,"silenciado":true,"tempo":0}` → `aria-pressed="true"` preservado).
- **Áudio que continua tocando quando deveria parar / para quando não deveria**: não aplicável/não verificável de forma significativa, já que nenhum áudio real chega a tocar (ver seção 3) — não há nada "tocando" para continuar ou parar incorretamente.
- **Múltiplas músicas tocando simultaneamente**: não reproduzido. O código de `js/audio.js` já trata explicitamente o caso de a fase estar dentro de um iframe (`window.parent !== window`): nesse caso, ele **não cria** uma segunda instância de `Audio`, apenas encaminha os cliques ao pai via `postMessage`. A única forma de existir uma segunda instância independente é acessar `fase1.html` diretamente como página de nível superior (fora do iframe) — e, nesse caso, o navegador descarta o documento anterior (e seu objeto `Audio`) ao navegar, então, dentro de uma única aba, não há sobreposição real de reprodução.
- **Efeito reproduzido duas vezes**: não aplicável — nenhum efeito é reproduzido nenhuma vez (seção 5/6).
- **Estado de mute perdido**: não observado — persiste corretamente via `sessionStorage` em todos os cenários testados (navegação interna e reload de página).
- **Estado visual diferente do estado real**: observado especificamente no botão `#btn-som` da tela inicial, que não tem indicação textual nem muda de ícone (ver achado AA-07); nos outros dois controles, o texto acompanha corretamente o estado real.

---

## 9. Duplicados e legado

- **Hashes MD5 comparados entre os 21 arquivos atuais de `assets/audio/`**: nenhum arquivo é duplicado de outro arquivo atualmente presente (todos os 21 hashes são distintos, todos os tamanhos em bytes são distintos).
- **Arquivo "legado" confirmado via Git** (não está mais presente, mas sua "sombra" explica o bug atual): `assets/audio/everything-in-place.mp3`, deletado no commit `d5ae48d`, é byte-a-byte idêntico ao atual `assets/audio/Mundos/Menu Principal.mp3` (mesmo hash MD5, mesmo tamanho — ver seção 3). Isso é uma referência antiga de versão anterior do projeto, ainda presa no código (`js/audio.js`), apontando para um caminho que não existe mais.
- **Arquivos "preparados mas nunca utilizados"**: todos os outros 20 arquivos (5 de `Efeitos/`, 5 de `Mundos/` exceto `Menu Principal.mp3`, 10 de `Objetos/`) se encaixam nessa categoria — existem, têm nomes que correspondem claramente a eventos reais do jogo, mas nunca foram conectados ao código.
- Nenhuma remoção foi feita como parte desta auditoria.

---

## 10. Limitações do teste

### Confirmado no código
- A referência quebrada a `everything-in-place.mp3` (`js/audio.js:39,144`).
- A ausência de qualquer chamada a `Audio`/arquivo de som fora de `js/audio.js`.
- A regra CSS que faz o iframe da fase cobrir o botão de som do menu de mundos (`global.css:14-22`).
- A ausência de texto/ícone dinâmico no botão `#btn-som`.

### Confirmado no navegador (execução real via Playwright/Chrome)
- O erro HTTP 404 e o console error correspondente, reproduzidos em 100% das cargas de página testadas.
- A ausência de qualquer requisição de rede para os 21 arquivos físicos, ao longo de playthroughs completos do Mundo 1 e do Mundo 5.
- A sincronização correta (e os casos de falha de sincronização) entre os três botões de som.
- A persistência do estado de mudo via `sessionStorage` após reload.
- A inacessibilidade por clique do botão de som do menu de mundos enquanto uma fase está aberta.

### Não verificável automaticamente neste ambiente
- **Reprodução física real do som** (mesmo se o arquivo existisse e o `play()` tivesse sucesso) — o ambiente de teste é um Chrome headless controlado por Playwright, sem placa de som/saída de áudio física monitorável; a confirmação usada aqui foi sempre indireta (estado do elemento, eventos de rede, console), nunca "ouvir" o som.
- **Volume percebido** e qualidade/mixagem do áudio.
- **Comportamento em Safari/iOS** ou em outros navegadores/dispositivos reais — só havia Google Chrome disponível no ambiente.
- **Teste de "game over" completo** no Mundo 5 (5 corações perdidos em sequência) — extrapolado a partir do teste de 1 coração perdido, que usa o mesmo caminho de código.
- Essas limitações **não foram tratadas como bugs** — apenas como informação não verificável automaticamente, conforme pedido.

---

## 11. Teste no navegador

Todos os testes abaixo foram executados com Google Chrome real (não um motor simulado), via Playwright, a partir de um servidor HTTP local temporário (`python -m http.server 8000`), ambos fora do repositório do projeto.

Resumo do que foi executado (detalhes já descritos nas seções 4–8):
1. Carga da tela inicial + interação real (clique) + captura de rede/console/erros de página.
2. Clique simples, duplo e 5 cliques rápidos consecutivos no botão de som da tela inicial.
3. Navegação tela inicial → menu de mundos → volta, com verificação de sincronização do botão de som.
4. Entrada em uma fase (Mundo 1) via menu, verificação de sincronização do botão de som entre o menu (pai) e a fase (iframe), em ambos os sentidos.
5. Acesso direto a `fase1.html?mundo=1&fase=1` fora do iframe (confirmando `window.parent === window` nesse caso) e verificação de que o 404 também ocorre nesse caminho.
6. Playthrough completo do Mundo 1 (organização com erro proposital + acerto, desafio matemático com erro proposital + acerto, conclusão), com contagem de elementos de mídia em 4 pontos e monitoramento contínuo de rede.
7. Playthrough completo do Mundo 5 (introdução, 1 resposta errada com perda de coração, 4 respostas corretas, organização final, vitória), com os mesmos pontos de verificação.
8. Reload de página após silenciar, para verificar persistência via `sessionStorage`.

Os testes dos Mundos 2, 3 e 4 **não foram repetidos integralmente** porque usam exatamente o mesmo motor (`game.js`/`math.js`) sem qualquer diferenciação de áudio por mundo (confirmado por grep nos respectivos `js/mundos/mundoN.js`) — o resultado do Mundo 1 foi extrapolado para eles com alta confiança.

Nenhuma captura de rede revelou qualquer requisição a um arquivo de áudio além do único 404 de `everything-in-place.mp3`, em nenhum dos 8 testes acima.

---

## Achados

### 🔴 AA-01 — Crítico — Referência quebrada / Áudio ausente
- **Prioridade**: 🔴 Crítico
- **Mundo/tela**: Todas (tela inicial, menu de mundos, todas as fases de todos os mundos)
- **Arquivo de áudio**: `assets/audio/everything-in-place.mp3` (referenciado, não existe)
- **Arquivo de código**: `js/audio.js:39` (`ARQUIVO_TRILHA`) e `:144` (`new Audio(ARQUIVO_TRILHA)`)
- **Evento**: carregamento de qualquer página do jogo
- **Comportamento atual**: toda inicialização do motor de áudio gera uma requisição HTTP que retorna 404; a trilha nunca é ouvida, mesmo com o controle de som no estado "ligado"
- **Comportamento esperado**: reprodução contínua da trilha de fundo, documentada no README.md (linha 243) como "já implementada"
- **Reprodução**: 100% (4/4 cenários de execução testados)
- **Evidência**: resposta de rede HTTP 404 idêntica em toda carga de página; histórico do Git confirma que o arquivo foi efetivamente renomeado/movido para `assets/audio/Mundos/Menu Principal.mp3` (hash MD5 idêntico, `b5fab7a70addad40841ed10133935344`) em dois commits (`d5ae48d` e `9b1ffd8`), sem atualização da constante em `js/audio.js`
- **Impacto**: o jogo não tem nenhuma música de fundo audível, apesar de toda a UI sugerir que o recurso funciona

### 🟠 AA-02 — Alto — Áudio não reproduzido (ausência de lógica)
- **Prioridade**: 🟠 Alto
- **Mundo/tela**: Todos os mundos (código compartilhado via `game.js`/`math.js`)
- **Arquivo de áudio**: `Efeitos - Botão.wav`, `Certo.wav`, `Errado.wav`, `FaseConcluida.wav`, `GameOver.wav`
- **Arquivo de código**: nenhum (ausência confirmada por busca em todo o projeto)
- **Evento**: clique de botão, objeto correto/incorreto, fase concluída, perda de coração
- **Comportamento atual**: nenhum som é disparado; nenhuma requisição de rede ocorre para esses arquivos em nenhum dos eventos testados (10 checkpoints, Mundos 1 e 5)
- **Comportamento esperado**: não há requisito formal confirmado, mas a existência de 5 arquivos com nomes que correspondem exatamente a eventos reais do jogo sugere que a conexão foi planejada e não concluída
- **Reprodução**: 100%
- **Evidência**: contagem de elementos de mídia + monitoramento de rede ao longo de playthroughs completos
- **Impacto**: ausência de feedback sonoro de acerto/erro/vitória (o feedback visual já existente cumpre o requisito de acessibilidade do AGENTS.md por outro meio)

### 🟡 AA-03 — Médio — Áudio não utilizado (músicas por mundo)
- **Prioridade**: 🟡 Médio
- **Arquivo de áudio**: `Mundo 1 - Casa.mp3`, `Mundo 2 - Parque.mp3`, `Mundo 3 - Praia.mp3`, `Mundo 4 - Acampamento.mp3`, `Fase Bonus - ChefãoFinal.mp3`
- **Arquivo de código**: `js/audio.js` não tem qualquer mecanismo de troca de faixa por mundo/fase
- **Comportamento atual**: os 5 arquivos ficam órfãos; o motor de áudio é genérico e usa um único arquivo fixo
- **Reprodução**: confirmado por análise estática e por execução (zero requisições de rede)
- **Impacto**: conteúdo de áudio pronto (temático por mundo) não é aproveitado

### 🟡 AA-04 — Médio — Controle duplicado parcialmente inacessível
- **Prioridade**: 🟡 Médio
- **Tela**: `#menu-fases`, botão `.controle-mundo[data-controle-som]`
- **Arquivo de código**: `global.css:14-22` (`.conteudo-fase { position:fixed; inset:0; z-index:1000 }`)
- **Comportamento atual**: o iframe da fase cobre completamente a tela, incluindo esse botão, que fica presente e com estado correto, mas **fisicamente inclicável** enquanto qualquer fase está aberta
- **Comportamento esperado**: não há requisito formal; o botão equivalente dentro da fase sempre está disponível
- **Reprodução**: 100% (confirmado por timeout de clique com "iframe intercepts pointer events")
- **Impacto**: nenhum funcional direto (alternativa sempre acessível); inconsistência de UI — controle redundante fica morto na prática pela maior parte do tempo de uso real do jogo

### 🟡 AA-07 — Médio — Estado visual não acompanha o estado real no botão da tela inicial
- **Prioridade**: 🟡 Médio
- **Tela**: Tela inicial, botão `#btn-som`
- **Arquivo de código**: `index.html:15-17` (sem `data-texto-som`); nenhuma regra de CSS troca o ícone (`volume_solid_full_1.png`) com base em `aria-pressed`
- **Comportamento atual**: ao silenciar/reativar o som, apenas atributos de acessibilidade (`aria-pressed`, `aria-label`) mudam; não há nenhuma mudança visível (ícone ou texto) para a criança que está jogando
- **Comportamento esperado**: o AGENTS.md pede explicitamente feedback visual claro e que cores/estado não dependam só de atributos não visíveis — os outros dois botões de som do jogo (`menu de mundos` e `dentro da fase`) já cumprem isso com um texto que troca; este não
- **Reprodução**: 100%
- **Impacto**: uma criança de 7-10 anos não tem como saber, olhando a tela inicial, se o som está ligado ou desligado

### 🔵 AA-06 — Baixo — Nomenclatura inconsistente entre pastas
- **Prioridade**: 🔵 Baixo
- **Observação**: a pasta `Mundos/` nomeia o arquivo do Mundo 5 como `Fase Bonus - ChefãoFinal.mp3`, enquanto o restante do projeto (código, README, AGENTS.md) chama esse conteúdo de "Mundo 5" ou "Desafio Final". Pequena divergência de nomenclatura entre assets e documentação; não afeta funcionamento, já que o arquivo não é referenciado de qualquer forma (ver AA-03)

### 💡 AA-05 — Melhoria — Sem diagnóstico quando a trilha falha ao carregar
- **Prioridade**: 💡 Melhoria
- **Arquivo de código**: `js/audio.js`, função `tocar()` (linha ~109)
- **Observação**: o `.catch()` de `audio.play()` é genérico e comentado apenas para a política de autoplay dos navegadores; não há `addEventListener("error", ...)` no elemento `Audio` para diferenciar "bloqueado por política do navegador" (inofensivo) de "arquivo não encontrado" (o caso real do AA-01). Um log de diagnóstico nesse ponto teria revelado o problema do AA-01 durante o próprio desenvolvimento

---

## Resultado do relatório

### Inventário de áudio

| Arquivo | Localização | Utilização | Status | Observação |
|---|---|---|---|---|
| `Efeitos - Botão.wav` | `assets/audio/Efeitos/` | Nenhuma referência no código | Não utilizado (confirmado) | Nome sugere uso em clique de botão |
| `Efeitos - Certo.wav` | `assets/audio/Efeitos/` | Nenhuma referência no código | Não utilizado (confirmado) | Nome sugere uso em resposta/colocação correta |
| `Efeitos - Errado.wav` | `assets/audio/Efeitos/` | Nenhuma referência no código | Não utilizado (confirmado) | Nome sugere uso em resposta/colocação incorreta |
| `Efeitos - FaseConcluida.wav` | `assets/audio/Efeitos/` | Nenhuma referência no código | Não utilizado (confirmado) | Nome sugere uso na conclusão de fase |
| `Efeitos - GameOver.wav` | `assets/audio/Efeitos/` | Nenhuma referência no código | Não utilizado (confirmado) | Nome sugere uso na derrota do Mundo 5 |
| `Menu Principal.mp3` | `assets/audio/Mundos/` | Nenhuma referência direta — mas idêntico, por hash, ao arquivo que `js/audio.js` tenta carregar sob outro caminho | Não utilizado pelo caminho atual do código / provável trilha de fundo pretendida | Ver AA-01 |
| `Mundo 1 - Casa.mp3` | `assets/audio/Mundos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Mundo 2 - Parque.mp3` | `assets/audio/Mundos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Mundo 3 - Praia.mp3` | `assets/audio/Mundos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Mundo 4 - Acampamento.mp3` | `assets/audio/Mundos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Fase Bonus - ChefãoFinal.mp3` | `assets/audio/Mundos/` | Nenhuma referência no código | Não utilizado (confirmado) | Nome diverge da nomenclatura "Mundo 5" usada no resto do projeto |
| `Som - Bola.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - Cachorro.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - Frutas.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - GarrafaDeAgua.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - Gato.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - HoverCesta.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | Nome sugere uso em hover sobre cesta |
| `Som - Passaro.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - Refrigerante.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - Robo.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - Tremzinho.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `Som - Ursinho.wav` | `assets/audio/Objetos/` | Nenhuma referência no código | Não utilizado (confirmado) | — |
| `everything-in-place.mp3` | referenciado em `js/audio.js:39` | Única referência de áudio existente em todo o código | **Ausente do disco** | Idêntico por hash ao atual `Menu Principal.mp3` — ver AA-01 |

### Referências quebradas

- `js/audio.js:39` e `:144` → `assets/audio/everything-in-place.mp3` — arquivo não existe (confirmado em disco e via HTTP 404 em todo carregamento). É a **única** referência de áudio em todo o código, e é quebrada em 100% dos casos. Nenhuma outra referência quebrada foi encontrada, pois não há nenhuma outra referência de áudio no código além desta.

### Áudios não utilizados

**Confirmados** (nenhuma referência no código, nenhuma requisição de rede observada em nenhum teste de execução, nenhuma construção dinâmica de caminho possível):
- Os 5 arquivos de `Efeitos/`
- Os 10 arquivos de `Objetos/`
- 5 dos 6 arquivos de `Mundos/` (`Mundo 1 - Casa.mp3`, `Mundo 2 - Parque.mp3`, `Mundo 3 - Praia.mp3`, `Mundo 4 - Acampamento.mp3`, `Fase Bonus - ChefãoFinal.mp3`)

**Prováveis** (não referenciado pelo caminho atual, mas com forte evidência de ser o recurso pretendido):
- `assets/audio/Mundos/Menu Principal.mp3` — idêntico por hash ao arquivo que `js/audio.js` tenta carregar sob o caminho antigo `everything-in-place.mp3` (ver AA-01). Tecnicamente "não utilizado" no estado atual do código, mas tudo indica que é o arquivo correto, apenas no caminho errado.

**Necessita verificação manual**: nenhum item restante — a cobertura de busca textual foi exaustiva e não há construção dinâmica de caminhos no projeto, então não há ambiguidade remanescente.

### Controles de áudio

| Controle | Tela | Função | Funciona | Observação |
|---|---|---|---|---|
| `#btn-som` | Tela inicial | Ligar/desligar música de fundo | Sim (estado lógico correto) | Sem feedback visual de ícone/texto — ver AA-07; oculto durante o jogo, reaparece só via "Voltar" |
| `.controle-mundo[data-controle-som]` | Menu de mundos | Ligar/desligar música de fundo (mesmo estado global) | Parcialmente | Sincroniza perfeitamente ao entrar/voltar; fica inclicável (coberto pelo iframe) enquanto qualquer fase está aberta — ver AA-04 |
| `.btn-som-fase` | Dentro de cada fase (todos os mundos) | Ligar/desligar música de fundo via `postMessage` ao pai | Sim | Único controle de fato clicável durante o jogo propriamente dito; sincroniza nos dois sentidos em <300 ms |

### Fluxos testados

- **Menu**: carga inicial, interação real, alternância de som (1x, 2x, 5x rápidos), navegação tela inicial ↔ menu de mundos, reload de página.
- **Mundos 1–4**: playthrough completo executado no Mundo 1 (organização com erro+acerto, desafio matemático com erro+acerto, conclusão); extrapolado para os Mundos 2–4 por compartilharem o mesmo motor sem qualquer diferenciação de áudio no código (confirmado por grep em cada `js/mundos/mundoN.js`).
- **Mundo 5**: acesso direto por URL, introdução, 1 resposta errada (perda de coração), 4 respostas corretas, organização final, vitória.
- **Navegação entre telas**: sincronização do botão de som entre tela inicial, menu de mundos e interior da fase, em ambos os sentidos; persistência do estado de mudo via `sessionStorage` após reload completo da página.

### Problemas encontrados

**🔴 Crítico**
- AA-01 — Trilha sonora de fundo nunca é reproduzida (referência quebrada para um arquivo que foi renomeado/movido sem atualizar o código).

**🟠 Alto**
- AA-02 — Nenhum efeito sonoro de interação é reproduzido (ausência completa de lógica de disparo, apesar dos arquivos existirem).

**🟡 Médio**
- AA-03 — 5 trilhas musicais específicas por mundo nunca são carregadas.
- AA-04 — Botão de som do menu de mundos fica inclicável enquanto uma fase está aberta (coberto pelo iframe).
- AA-07 — Botão de som da tela inicial não dá nenhum feedback visual de estado (ícone/texto estáticos).

**🔵 Baixo**
- AA-06 — Nome do arquivo de música do Mundo 5 ("Fase Bonus - ChefãoFinal") diverge da nomenclatura usada no resto do projeto ("Mundo 5").

**💡 Melhoria**
- AA-05 — Ausência de log/diagnóstico de erro de carregamento de áudio, que teria revelado o AA-01 mais cedo.

### Limitações dos testes

- Não é possível confirmar a reprodução física real de áudio (saída de som de hardware, volume percebido) neste ambiente — todas as conclusões de "tocou"/"não tocou" foram obtidas por evidência indireta, porém direta no sentido técnico: estado do elemento `Audio` (`paused`, `muted`, `currentTime`), eventos de rede (sucesso/404) e console, não por audição humana.
- Não foi possível testar em Safari/iOS ou outros navegadores/dispositivos reais — apenas Google Chrome estava disponível no ambiente.
- O "game over" completo do Mundo 5 (5 corações perdidos em sequência) não foi executado; o resultado foi extrapolado a partir da perda do 1º coração, que usa exatamente o mesmo caminho de código.
- Nenhuma dessas limitações foi tratada como bug — são lacunas do ambiente de teste automatizado, não evidência de comportamento incorreto do jogo.

### Resumo

- **Total de arquivos de áudio no projeto**: 21 (5 `Efeitos/` + 6 `Mundos/` + 10 `Objetos/`)
- **Referências quebradas**: 1 (`everything-in-place.mp3`, única referência de áudio existente em todo o código)
- **Áudios ausentes**: 1 (o mesmo arquivo acima — não existe no disco sob o caminho referenciado)
- **Áudios não utilizados**: 20 confirmados (todos exceto `Menu Principal.mp3`, que entra como "provável" candidato ao arquivo correto da trilha de fundo)
- **Controles de áudio quebrados**: 0 funcionalmente quebrados; 1 parcialmente inacessível por sobreposição de iframe (AA-04); todos os 3 controles alteram corretamente o mesmo estado lógico real
- **Problemas de sincronização entre telas**: 0 confirmados (mute propaga e persiste corretamente em todos os cenários testados)
- **Total de achados**: 7 (1 🔴 Crítico, 1 🟠 Alto, 3 🟡 Médio, 1 🔵 Baixo, 1 💡 Melhoria)
- **Melhorias recomendadas**: 1 (log de diagnóstico de erro de carregamento de áudio)
