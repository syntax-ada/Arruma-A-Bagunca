# Auditoria 06.10 — Assets Visuais e Consistência de Design

**Data:** 06/10/2026
**Escopo:** inventário e consistência dos assets visuais (imagens) do jogo — arquivos quebrados/ausentes, não utilizados, duplicados, legados, provisórios e inconsistências visuais entre mundos. Responsividade (Tarefa 02) e telas/controles (Tarefa 03) não são repetidos aqui, exceto quando um achado de asset explica diretamente uma causa já registrada nelas (faço a referência cruzada em vez de duplicar a contagem). Áudio fica para uma auditoria própria — não conto o 404 de `everything-in-place.mp3` (já registrado nas Auditorias 01 e 02) como achado desta tarefa.

**Regra respeitada:** nenhum arquivo do jogo foi alterado, nenhum asset foi removido ou substituído, nenhuma correção de design foi aplicada. Nenhum commit ou push foi realizado. Único arquivo criado/alterado nesta etapa: este próprio documento. O ambiente de teste (Playwright, servidor HTTP local) ficou fora do repositório e foi encerrado ao final.

---

## 0. Metodologia

1. **Inventário completo do disco**: listei todos os 249 arquivos de `assets/` (227 imagens + 22 áudios).
2. **Cross-reference de referências**: extraí, por busca de texto, todo caminho `assets/images/...` citado em `index.html`, `fase1.html`, `global.css`, `style-menu.css`, `style-fase1.css` e nos 7 arquivos `.js`, e comparei contra a lista de arquivos existentes. Confirmei antes que **não há nenhuma construção dinâmica de caminho** no projeto (nenhum template literal nem concatenação de string formando um caminho de imagem) — todo caminho é escrito por extenso em algum lugar do código. Isso dá alta confiança ao cruzamento: se uma imagem não aparece em nenhum arquivo-fonte, ela realmente não é carregada por nenhum caminho possível do jogo atual.
3. **Confirmação por hash**: para os casos de suspeita de duplicidade, comparei os arquivos por MD5 (`certutil -hashfile`), não só por nome ou tamanho.
4. **Verificação visual real**: usei o Google Chrome (via Playwright, temporário, fora do projeto) para carregar os mundos de verdade, capturar screenshots e, em alguns casos, isolar um elemento específico (ex.: o ícone do marshmallow dentro do botão arrastável) para avaliar o resultado visual real, não a imagem isolada fora de contexto.
5. Todo achado de "asset não utilizado" foi classificado por confiança: **Confirmado** (sem nenhuma referência em nenhum arquivo-fonte, método exaustivo), **Provável** (sem referência encontrada, mas o propósito original não é totalmente claro) ou **Necessita verificação manual** (nenhum caso se encaixou aqui, dado o método exaustivo do passo 2).

---

## 1. Inventário de assets

| Grupo | Localização | Qtde. | Utilização | Status geral |
|---|---|---|---|---|
| Backgrounds do Mundo 1 | `tela_fase1/fundo.png`, `fundo_arrumado.png` | 2 | Background da casa (via CSS), bagunçado/arrumado | Em uso |
| Objetos do Mundo 1 | `tela_fase1/*.png` (banana, maçã, pera, lápis, borracha, apontador, urso, trenzinho) | 9 | Itens arrastáveis | Em uso |
| Sprites de cesta do Mundo 1 | `tela_fase1/sprites_cestas/{brinquedos,comidas,materiais}/*.png` | 51 | Preenchimento visual das cestas por quantidade | **Parcialmente em uso — ver AD-06** |
| Sprites de cesta "por modelo" do Mundo 1 | `tela_fase1/sprites_cestas/brinquedos/{robo,trem}/0..9.png` | 20 | Nunca conectadas ao código | **Não utilizado — ver AD-12** |
| HUD/interface do Mundo 1 | `tela_fase1/hud_branco.png`, `hud_branco2.png`, `hud_volume_e_engrenagem.png` | 3 | Só `hud_branco.png` é usado (compartilhado por todos os mundos) | `hud_branco2.png` não utilizado |
| Backgrounds do Mundo 2 | `mundo_2/Parque piqueninque.png`, `..._bagunçado.png` | 2 | Bagunçado/arrumado | Em uso |
| Objetos do Mundo 2 | `mundo_2/{cachorro,gato,hambuerguer,maça,melancia,passaro,robo,trem}.png` | 8 | Itens arrastáveis | Em uso |
| Sprites de cesta do Mundo 2 | `mundo_2/sprites_cestas_2/*.png` | 30 | Preenchimento visual (3 categorias × 10) | Em uso, cobertura completa |
| HUD do Mundo 2 | `mundo_2/hud_branco.png`, `hud_branco2.png` | 2 | Nenhum uso (o jogo sempre usa o HUD de `tela_fase1`) | **Não utilizado — ver AD-10** |
| Backgrounds do Mundo 3 | `mundo_3/praia.png`, `praia_bagunçado.png` | 2 | Bagunçado/arrumado; **também reutilizado pelo Mundo 5** | Em uso |
| Objetos do Mundo 3 | `mundo_3/{agua,algodão_doce,coca,maça,robo,sorvete}.png`, `bola de volei.png` | 7 | Itens arrastáveis; `robo.png` também usado como "Monstro da Bagunça" do Mundo 5 | Em uso |
| Sprites de cesta do Mundo 3 | `mundo_3/sprites_cestas_3/*.png` | 30 | Preenchimento visual (3 categorias × 10); **duplicadas no Mundo 4, ver AD-03** | Em uso |
| Arquivos sem nome descritivo do Mundo 3 | `mundo_3/Group.png`, `Group (1).png` | 2 | Nenhum uso encontrado | **Não utilizado — ver AD-09** |
| HUD do Mundo 3 | `mundo_3/hud_branco.png`, `hud_branco2.png` | 2 | Nenhum uso | **Não utilizado — ver AD-10** |
| Backgrounds do Mundo 4 | `mundo_4/acampamento.png`, `acampamento_bagunçado.png` | 2 | Bagunçado/arrumado; `acampamento_bagunçado.png` **também usado (indevidamente) como capa do card no menu** | Em uso — ver AD-02 |
| Objetos do Mundo 4 | `mundo_4/{binoculos,chapeu,maça,marshmellow,pao}.png`, `Group 499.png` (mapa) | 6 | Itens arrastáveis | Em uso — `marshmellow.png` com contraste baixo, ver AD-05; `Group 499.png` com nome não descritivo, ver AD-11 |
| Sprites de cesta "Comida" do Mundo 4 | `mundo_4/sprites_cestas_4/cesta_comida_praia-0..9.png` | 10 | Preenchimento visual da cesta de Comidas | Em uso, cobertura adequada (ver seção 4) — **mas são cópia idêntica da cesta de praia do Mundo 3, ver AD-03** |
| Sprites de cesta "Mochila" do Mundo 4 | `mundo_4/sprites_cestas_4/mochila-0..9.png` | 10 | Preenchimento visual da cesta Mochila | Em uso — índices 6-9 nunca alcançados na prática, ver AD-04 |
| Botão não utilizado do Mundo 4 | `mundo_4/botton_voltar.png` | 1 | Nenhum uso | **Não utilizado — ver AD-09** |
| HUD do Mundo 4 | `mundo_4/hud_branco.png`, `hud_branco2.png` | 2 | Nenhum uso | **Não utilizado — ver AD-10** |
| Assets do Mundo 5 | — (nenhuma pasta própria) | 0 arquivos próprios | 100% reaproveitado do Mundo 3 (fundo, modelos, sprites de cesta) — decisão já documentada nos comentários do próprio `mundo5.js` | Provisório, por design |
| Botões/arte do menu de fases (Mundo 1) | `mundo_1/fase_1_botao.png`, `fase_2_botao.png`, `fase_3_botao.png`, `botão_fechar.png` | 4 | Botões do modal "Escolha uma fase" (reaproveitados para todos os mundos, não é exclusivo do Mundo 1 apesar do nome da pasta) | Em uso |
| Botões não utilizados (pasta Mundo 1) | `mundo_1/fase_1_botao_hover.png`, `fase_4_botao.png`, `fase_5_botao.png`, `retangulo.png` | 4 | Nenhum uso | **Não utilizado — ver AD-09** |
| Menu atual (`nova_tela_menu de_fases/`) | `fundo.png`, `mundo_1.png`, `mundo_2.png`, `mundo_3.png` | 4 | Fundo do menu e capas dos cards dos Mundos 1-3 | Em uso |
| Menu atual — não utilizados | `mundo_4.png` (duplicata de `mundo_1.png`), `mundo_5.png` (placeholder 1×1px), `botão voltar.png`, `hud2.png`, `progress_bar.png`, `seta_direita.png`, `seta_esquerda.png` | 7 | Nenhum uso — a UI final usa texto/CSS em vez dessas imagens | **Não utilizado — ver AD-01 e AD-08** |
| Menu inicial (`tela_inicial/`) | `fundo.png`, `logotipo_arruma _a_bagunça.png`, `engrenagem.png`, `volume_solid_full_1.png`, `botão_fechar.png`, `creditos.png` | 6 | Tela inicial e modal de créditos | Em uso |
| Menu inicial — não utilizados | `Botão Créditos.png`, `botão_jogar.png` | 2 | Nenhum uso — os botões reais são texto/CSS | **Não utilizado — ver AD-08** |
| Pasta de menu legada (`tela_menu/`) | `bar.png`, `engrenagem.png`, `fase_1.png`...`fase_4.png`, `fundo.png`, `logotipo_arruma_a_Bagunça.png`, `volume_.png` | 8 | Nenhum uso em nenhum lugar | **Pasta inteira não utilizada — ver AD-07** |

---

## 2. Assets quebrados/ausentes

**Nenhum encontrado.** Cruzei todas as referências de imagem do HTML/CSS/JS contra os arquivos reais em disco: **100% delas apontam para um arquivo existente**, sem diferença de maiúsculas/minúsculas, extensão ou nome. Isso bate com o que já foi observado nas Auditorias 01 e 02 (nenhum erro 404 de imagem apareceu no console durante os testes reais no navegador, em nenhum mundo, em nenhuma viewport). O único 404 encontrado em qualquer auditoria até agora é de áudio (`everything-in-place.mp3`), que é tratado à parte.

---

## 3. Assets não utilizados

### Confirmados (método exaustivo — sem nenhuma referência em HTML/CSS/JS, sem construção dinâmica de caminho em todo o projeto)

**Pasta inteira:**
- `assets/images/tela_menu/` — 8 arquivos (ver AD-07).

**Menu (`nova_tela_menu de_fases/`):**
- `mundo_4.png`, `mundo_5.png`, `botão voltar.png`, `hud2.png`, `progress_bar.png`, `seta_direita.png`, `seta_esquerda.png` (ver AD-01, AD-08).

**Tela inicial:**
- `tela_inicial/Botão Créditos.png`, `tela_inicial/botão_jogar.png` (ver AD-08).

**Mundo 1:**
- `mundo_1/fase_1_botao_hover.png`, `fase_4_botao.png`, `fase_5_botao.png`, `retangulo.png` (ver AD-09).
- `tela_fase1/hud_branco2.png`, `hud_volume_e_engrenagem.png`, `robo (2).png`.
- `tela_fase1/sprites_cestas/brinquedos/{robo,trem}/0..9.png` — 20 arquivos (ver AD-12).
- `tela_fase1/sprites_cestas/{brinquedos,comidas,materiais}/4..9.png` (variando por categoria) — ver AD-06, pois estes são os sprites que resolveriam o problema ali descrito, caso fossem conectados.

**Mundo 2:**
- `mundo_2/hud_branco.png`, `hud_branco2.png` (ver AD-10).

**Mundo 3:**
- `mundo_3/Group.png`, `Group (1).png` (ver AD-09).
- `mundo_3/hud_branco.png`, `hud_branco2.png` (ver AD-10).

**Mundo 4:**
- `mundo_4/botton_voltar.png` (ver AD-09).
- `mundo_4/hud_branco.png`, `hud_branco2.png` (ver AD-10).

### Prováveis (sem referência encontrada, mas propósito original incerto)

- `nova_tela_menu de_fases/hud2.png` — não há nenhuma pista de para que serviria; pode ter sido um design alternativo de HUD descartado.

### Necessita verificação manual

Nenhum caso — o método de cruzamento foi exaustivo (sem construções dinâmicas de caminho em todo o código-fonte do projeto), então todos os resultados acima têm confiança máxima dentro do que é possível verificar por código. A única checagem que este método **não cobre** é um asset referenciado por algum arquivo fora da árvore do projeto (ex.: um link externo ou uma ferramenta de design) — fora do alcance desta auditoria.

---

## 4. Assets duplicados

| Arquivos | São idênticos? | Onde cada um é usado | Avaliação |
|---|---|---|---|
| `nova_tela_menu de_fases/mundo_4.png` × `nova_tela_menu de_fases/mundo_1.png` | **Sim — hash MD5 idêntico** (`bfa0fa83b948d713c9a16776f96dfe49`) | Nenhum dos dois é usado pelo card do Mundo 4 hoje (ver AD-01/AD-02) | Cópia/placeholder esquecido, não reutilização intencional |
| `mundo_4/sprites_cestas_4/cesta_comida_praia-0..9.png` × `mundo_3/sprites_cestas_3/cesta_comida_praia-0..9.png` | **Sim — hash MD5 idêntico** nos arquivos testados (índices 0 e 9), e tamanho em bytes idêntico nos 10 arquivos | Cesta de "Comida" do Mundo 4 (Acampamento) × cesta de "Comida" do Mundo 3 (Praia) | Reutilização literal de um asset temático de outro mundo — ver AD-03 |
| `mundo_X/hud_branco.png` e `hud_branco2.png` (mundo_2, mundo_3, mundo_4) × `tela_fase1/hud_branco.png`/`hud_branco2.png` | Não testados por hash (nomes diferentes de pasta, propósito plausivelmente redundante por design, não por cópia acidental) | Nenhum dos 6 arquivos de `mundo_X/` é carregado — o jogo sempre usa `tela_fase1/hud_branco.png` | Redundância estrutural (arquivos preparados por mundo que nunca foram conectados), não uma duplicata "acidental" de conteúdo — ver AD-10 |

---

## 5. Mundo 1

- **Background**: `fundo.png`/`fundo_arrumado.png`, consistentes com o tema "casa bagunçada/arrumada", sem problema técnico encontrado.
- **Objetos e cestas**: todos carregam corretamente; nenhuma imagem incompatível com a categoria.
- **Problema técnico confirmado**: ver **AD-06** — a ilustração das cestas de Comida e Material Escolar não acompanha a contagem real de itens na Fase 3 (a arte "trava" no estágio de 3 itens).
- **Observação de design (não é bug)**: existem 20 sprites de cesta "por modelo específico" (robô, trem) preparados e nunca conectados — ver **AD-12**. Não prejudica a experiência atual; é só uma granularidade visual que ficou pela metade.

## 6. Mundo 2

- **Objetos, cestas e background**: carregam corretamente, sem inconsistência visual encontrada entre o tema "Parque" e os assets usados (cachorro, gato, hambúrguer, melancia, passarinho, robô, trenzinho — todos coerentes com um piquenique de parque).
- **Sprites de cesta**: cobertura completa (10 sprites por categoria), suficiente para a maior quantidade já usada em qualquer fase (8, na Fase 3).
- **Arquivos antigos/não utilizados**: só os dois HUD (`hud_branco.png`, `hud_branco2.png`) — ver AD-10. Fora isso, nenhum achado novo neste mundo.

## 7. Mundo 3

- **Praia, backgrounds, objetos (bebidas, comidas, brinquedos), sprites, HUD**: tudo carrega corretamente e é tematicamente coerente.
- **Arquivos aparentemente não utilizados de versão anterior**: `Group.png` e `Group (1).png` — nomes de exportação de ferramenta de design, sem indício de propósito, sem nenhuma referência no código — ver AD-09. Também os dois HUD (`hud_branco.png`, `hud_branco2.png`) — ver AD-10.
- **Relevância para outros mundos**: os assets do Mundo 3 são a base de **dois** outros contextos — a cesta de comida é duplicada (não só reaproveitada estruturalmente, mas copiada byte a byte) no Mundo 4 (AD-03), e o fundo + modelos de objetos inteiros são reaproveitados pelo Mundo 5 (ver seção 9).

## 8. Mundo 4 (seção detalhada, conforme pedido)

### Tema

Tratado aqui como **Acampamento**, a implementação atual — não considerei nenhuma versão anterior/provisória do Mundo 4 como se fosse o estado atual.

### Card do Mundo 4 — AD-02 🟡 Médio — Tipo: Inconsistência visual / Design
*(Já contabilizado como achado CTRL-03 na Auditoria 03 — aqui acrescento só a evidência do lado dos assets, sem duplicar a contagem.)*

- **Qual imagem o card usa:** `assets/images/mundo_4/acampamento_bagunçado.png` — confirmei que é **exatamente o mesmo arquivo** usado como cenário "bagunçado" dentro da própria Fase 1 do Mundo 4 (`FUNDO_MUNDO_4_BAGUNCADO` em `mundo4.js`), e **não** uma arte de capa dedicada.
- **Dimensões:** medi no navegador — essa imagem é **1920×1080px** (2,7MB em disco), enquanto as capas realmente usadas pelos Mundos 1-3 (`nova_tela_menu de_fases/mundo_1.png`, `mundo_2.png`, `mundo_3.png`) são **490×375px**, um arquivo de miniatura dedicado, muito mais leve. O card do Mundo 4 está usando uma imagem de cenário em resolução de tela cheia, redimensionada para caber num card pequeno — tecnicamente funciona, mas é a imagem errada para a função.
- **Existe um asset próprio de capa?** Existe um arquivo no caminho "certo" (`nova_tela_menu de_fases/mundo_4.png`, seguindo exatamente o padrão de nomes dos Mundos 1-3), mas conferi por hash MD5 e **esse arquivo é uma cópia idêntica de `mundo_1.png`** — ou seja, não é uma arte de Acampamento perdida esperando para ser usada, é um placeholder/cópia que nunca foi substituído pela arte real. Portanto: não há hoje nenhum asset de capa genuína do Mundo 4 pronto e sem uso — há um "buraco" no slot certo, preenchido por uma cópia temporária de outro mundo.
- **Faixa/título:** os cards dos Mundos 1-3 mostram uma faixa colorida com o nome ("Mundo: 2 - Parque") — isso faz parte da própria arte de capa (`mundo_2.png` etc. já trazem o texto desenhado). Como o card do Mundo 4 usa uma imagem diferente (o cenário bagunçado, sem essa faixa desenhada), ele não tem nenhuma faixa de nome — confirmado visualmente (ver screenshot já registrado na Auditoria 03).
- **Comparação visual:** o cenário de Acampamento usado no card tem iluminação noturna (ver screenshot), destoando do estilo diurno das capas dos Mundos 1-3.

### Sprites da cesta de Comida — AD-03 🟠 Alto — Tipo: Asset reutilizado / Inconsistência visual

- **Caminho:** `assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-0..9.png`.
- **Quantos sprites existem:** 10 (índices 0 a 9).
- **Maior valor disponível:** índice 9.
- **Como o código usa:** `js/mundos/mundo4.js` declara o array `SPRITES_CESTA_COMIDAS_MUNDO4` com os 10 caminhos, e `game.js` (`updateDropZoneCounter`) escolhe `sprites[Math.min(quantidadeColocada, 9)]` — ou seja, a lógica de seleção está correta e completa.
- **Existe suporte visual adequado para a quantidade máxima da fase?** A maior quantidade de itens de Comida em qualquer fase do Mundo 4 é **10** (Fase 3: "10 ÷ 5 = 2"). Com sprites de índice 0 a 9 (10 níveis), a cobertura é **tecnicamente suficiente** — para 9 ou 10 itens, o jogo usa o mesmo sprite de índice 9 (não existe diferença visual entre "9 cheia" e "10 cheia", mas não há nenhum item sem representação visual). Isto é uma limitação cosmética pequena (não registro como achado separado), mas **não** é o problema principal deste grupo de sprites.
- **O problema real confirmado:** comparei os arquivos `mundo_4/sprites_cestas_4/cesta_comida_praia-0.png` e `mundo_3/sprites_cestas_3/cesta_comida_praia-0.png` por hash MD5 — **são idênticos** (`ee293cba02683b30a207839159f52f4a`). O mesmo vale para o índice 9 (`e5060665efc6fe834f92ec31ee229a25` nos dois) e os tamanhos em bytes batem exatamente nos 10 índices. **A cesta de comida do Acampamento é, pixel a pixel, a cesta de piquenique de praia do Mundo 3** — inclusive o próprio nome do arquivo ("praia") denuncia a origem, mesmo estando dentro da pasta `mundo_4/`.
- **Impacto:** o jogador vê uma cesta de piquenique de praia (com guarda-sol estampado, se for o caso — não inspecionei o desenho interno de cada sprite em detalhe, mas confirmei que é o arquivo idêntico) enquanto joga uma fase ambientada num acampamento noturno na floresta. É uma inconsistência temática clara, não uma preferência estética — o asset foi literalmente copiado de outro mundo sem adaptação.
- **Recomendação futura (sem implementar):** criar uma arte de cesta/caixa de comida com tema de acampamento (ex.: uma cesta de piquenique de trilha, ou um recipiente hermético de comida de camping), mantendo a mesma lógica de 10 níveis de preenchimento já implementada.

### Sprites da cesta Mochila — AD-04 💡 Melhoria — Tipo: Asset provisório

- **Caminho:** `assets/images/mundo_4/sprites_cestas_4/mochila-0..9.png` — 10 sprites, nomenclatura consistente com a categoria (ao contrário da cesta de comida, aqui o nome do arquivo bate com o conteúdo).
- **Correspondência sprite↔categoria:** correta — não há mistura com outra categoria.
- **Cobertura real:** a maior quantidade de itens de Mochila em qualquer fase é **5** (Fase 3). Isso significa que, na prática, apenas os índices 0 a 5 (6 sprites) chegam a ser exibidos durante o jogo; os índices 6 a 9 (4 sprites) existem, estão corretamente referenciados no array, mas nunca são alcançados com os dados atuais das fases.
- **Avaliação:** não é um problema — é uma arte preparada "com folga" para quantidades maiores do que as fases usam hoje. Registro como observação organizacional, não como bug.
- **Arquivos herdados:** nenhum indício de que esses sprites venham de outro mundo — parecem ser arte original do Mundo 4.

### Comida: `marshmellow.png` — AD-05 🟡 Médio — Tipo: Design

- Abri o arquivo isoladamente e, depois, dentro do botão arrastável real do jogo (que tem fundo quase branco, `rgba(255,255,255,0.75)`).
- **Avaliação de contraste:** o marshmallow é desenhado em tons de branco/creme muito claros, só com uma sombra sutil para dar volume. Comparado lado a lado com os outros itens da mesma cesta de Comida (`pao.png`, cor marrom forte; `maça.png`, vermelho vivo com folha verde), o marshmallow é visivelmente **menos destacado** — ainda é possível distingui-lo (o espeto marrom ajuda), mas ele "some" muito mais facilmente num relance rápido do que seus vizinhos de alto contraste.
- **Impacto:** não impede a interação (o item continua arrastável, tem `aria-label` com o nome por extenso, e a criança pode identificá-lo pela posição/forma do espeto), mas é uma fragilidade visual real, não uma preferência estética — confirmada lado a lado com os outros ícones da mesma cesta.
- Não propus nem apliquei nenhuma correção de cor/contraste.

### Assets de praia reutilizados — consolidado no AD-03 acima

Já coberto em detalhe na seção da cesta de Comida — é o achado mais concreto desta categoria. Não encontrei outra reutilização de assets de praia no Mundo 4 além dessa (os backgrounds, o pão, a maçã, o chapéu, os binóculos e o mapa são todos arquivos próprios da pasta `mundo_4/`, sem correspondência de hash com `mundo_3/`).

---

## 9. Mundo 5

- **Background:** `mundo_3/praia_bagunçado.png` / `praia.png` — reaproveitamento **total e explicitamente documentado** no próprio código (`mundo5.js` comenta "provisório — reaproveita cenário do Mundo 3" em várias linhas). Não é uma descoberta nova desta auditoria — é um estado já conhecido e assumido pela equipe.
- **"Monstro":** `mundo_3/robo.png` — o mesmo objeto "robô de brinquedo" usado como item arrastável do Mundo 3 é reaproveitado como a imagem do adversário "Monstro da Bagunça". Também documentado como provisório no próprio arquivo (`boss: { imgSrc: "assets/images/mundo_3/robo.png", ... } // ⚠️ ARTE PROVISÓRIA`).
- **Coração/vida:** não há um asset de imagem — os corações do adversário são renderizados como caracteres de emoji (`❤️`/`🤍`) diretamente no texto, não como arquivos PNG. Funciona tecnicamente, mas é uma solução de interface mais simples que o restante do jogo (que usa sprites de imagem para quase tudo).
- **Objetos/cestas da organização final:** mesmos modelos do Mundo 3 (bola de vôlei, robô, água, refrigerante) e mesmos sprites de cesta (`sprites_cestas_3`) — também provisório e documentado.
- **O que é definitivo:** as **cinco contas matemáticas** em si (`DESAFIOS_MUNDO_5`, dados numéricos, não visuais) e a estrutura de boss (corações = quantidade de contas) são a parte "real" e específica do Mundo 5 — não há nada de visual que seja, hoje, exclusivo e definitivo do Mundo 5.
- **O que é placeholder:** o background, o monstro, os objetos e as cestas são 100% reaproveitados, não placeholders "vazios" no sentido técnico (não há nenhuma imagem quebrada ou ausente), mas sim conteúdo emprestado de outro mundo à espera de arte própria.
- **Avaliação:** não registro isso como um problema novo — é exatamente o estado que o próprio código já relata, e meu papel aqui é só confirmar e documentar para a decisão da equipe, como pedido. Fica registrado que, quando a arte definitiva do Mundo 5 for produzida, ela precisará de: 1 background bagunçado/arrumado próprio, 1 imagem de adversário própria, e pelo menos um conjunto de objetos/cestas tematicamente coerente com o "desafio final" (hoje são objetos de praia).

---

## 10. HUD e elementos de interface

- **Texto incorporado na imagem:** confirmado — `tela_fase1/hud_branco.png` tem o texto "Arrume a Bagunça! Coloque cada item em sua respectiva cesta." desenhado na própria arte, reaproveitado tanto na tela de organização quanto na tela de matemática (onde esse texto não faz sentido). Esse é exatamente o asset por trás do achado **RF-01** da Tarefa 02 (sobreposição de texto ilegível em celular) — não repito a classificação aqui, só registro a causa do lado do asset: a imagem não devia ter texto embutido, ou deveria haver uma segunda versão "em branco" dela para a tela de matemática.
- **Assets utilizados para finalidade diferente da original:** o `mundo_4/acampamento_bagunçado.png` servindo de thumbnail de card (AD-02) é o caso mais claro.
- **Versões duplicadas:** os 7 arquivos de HUD por mundo nunca usados (AD-10).
- **Assets que sobraram de versões anteriores:** a pasta `tela_menu/` inteira (AD-07) e os controles gráficos de `nova_tela_menu de_fases/` que a versão final não usa (AD-08).
- **Inconsistência entre mundos:** nenhuma inconsistência de HUD *entre* mundos além da já registrada — o HUD é, na prática, idêntico em todos os mundos (usa sempre o mesmo arquivo), então não há uma "variação" de HUD por mundo para comparar.

---

## 11. Nomenclatura e organização

- **Acentuação e espaços em nomes de pasta/arquivo:** `nova_tela_menu de_fases/` (espaço no meio do nome da pasta), `mundo_2/Parque piqueninque.png` ("piqueninque" — provável erro de digitação de "piquenique" — mas não proponho renomear, só registro), vários arquivos com espaço (`bola de volei.png`, `uso 3.png`, `robo (2).png`, `botão voltar.png`). Funciona tecnicamente (os caminhos no código são sempre strings exatas e batem com os arquivos), mas é um risco para qualquer scriptagem futura ou upload que não trate espaços/acentos com cuidado.
- **Nomes de exportação de ferramenta de design deixados como estão:** `mundo_3/Group.png`, `Group (1).png`, `mundo_4/Group 499.png` (ver AD-11) — o último está em uso (é o "mapa"), os dois primeiros não têm uso encontrado.
- **Nomes que não representam mais a função atual:** `mundo_4/sprites_cestas_4/cesta_comida_praia-*.png` (ver AD-03) — o nome "praia" não corresponde ao Acampamento.
- **Pastas com nomenclatura inconsistente:** `tela_menu/` vs. `nova_tela_menu de_fases/` (a palavra "nova" no nome é, ela mesma, um indício de versionamento informal dentro da árvore de assets, em vez de a pasta antiga ter sido removida). `tela_fase1/` é compartilhada por todos os mundos (contém o HUD genérico e os objetos/cestas do Mundo 1 ao mesmo tempo), enquanto os Mundos 2-4 têm pastas próprias — padrão inconsistente, mas sem risco funcional, pois os caminhos estão corretos em cada config de mundo.
- **Cópias com nomes como `Group (1).png`:** confirmado — `mundo_3/Group.png` e `Group (1).png` são exatamente esse padrão.
- **Risco de uma eventual renomeação:** baixo tecnicamente (os caminhos são todos literais, uma renomeação só quebraria o que não for atualizado junto no JS/CSS correspondente), mas não proponho nenhuma renomeação — só registro os casos.

---

## 12. Consistência visual

### Problemas reais (sustentados por evidência)

- **AD-03** — cesta de comida do Mundo 4 reaproveitando pixel a pixel a cesta de praia do Mundo 3 — a inconsistência mais objetiva encontrada nesta auditoria.
- **AD-02** (já contado na Auditoria 03) — card do Mundo 4 com estilo (resolução, iluminação noturna, ausência de faixa de nome) destoante dos Mundos 1-3.
- **AD-06** — preenchimento visual das cestas do Mundo 1 Fase 3 não acompanha a quantidade real de itens, diferente do comportamento correto nos Mundos 2, 3 e 4.
- **AD-05** — baixo contraste do `marshmellow.png` comparado aos vizinhos de cesta.

### Melhorias / observações (não é bug, não é preferência estética isolada — é uma oportunidade objetiva de reduzir arquivos órfãos e preparar o próximo mundo)

- Os Mundos 2, 3 e 4 têm identidade visual própria e coerente internamente (background, objetos, cestas combinando com o tema) — isso **funciona bem** e não precisa de uniformização forçada.
- O Mundo 5, por ser reconhecidamente provisório, é a maior pendência de identidade visual do projeto — mas isso já está sinalizado pela própria equipe.
- Os sete arquivos de HUD por mundo nunca usados (AD-10) sugerem que, em algum momento, o plano era dar um HUD visualmente distinto a cada mundo — se essa ainda for a intenção, os arquivos já existem; se não for mais, são candidatos a limpeza.
- O "slot" de capa do Mundo 4 e do Mundo 5 já existe no caminho certo (`nova_tela_menu de_fases/mundo_4.png` e `mundo_5.png`) — só falta a arte de verdade.

---

## 13. Teste visual no navegador — resumo

Confirmei visualmente, com Chrome real (headless) e screenshots:
- Carregamento de imagens nos Mundos 1-5: **sem nenhuma imagem quebrada** em nenhuma tela visitada (organização, matemática, boss do Mundo 5, vitória, menu, modais).
- Card do Mundo 4 no carrossel: capturado com zoom, confirma ausência de faixa de nome e estilo destoante (ver AD-02, evidência já anexada na Auditoria 03).
- Cesta de Comida do Mundo 1, Fase 3, totalmente organizada: capturada, sprite da cesta confirmado como `3_cesta_comida.png` (e `3_cesta_material.png`) via inspeção do atributo `src` renderizado, apesar do contador numérico (correto) mostrar 5 e 7.
- `marshmellow.png` isolado e dentro do botão arrastável real: capturado para avaliação de contraste lado a lado com os demais itens da cesta.
- Nenhum erro de console/`pageerror` relacionado a carregamento de imagem em nenhum teste.

---

## 14. Resultado final

### Inventário de assets

Ver tabela completa na seção 1 — 29 grupos de assets catalogados, cobrindo os 227 arquivos de imagem do projeto.

### Assets quebrados/ausentes

**Nenhum.** Confirmado por cruzamento exaustivo de referências e por execução real no navegador (seção 2).

### Assets não utilizados

- **Confirmados:** 72 arquivos (lista completa na seção 3), incluindo a pasta inteira `tela_menu/` (8 arquivos).
- **Prováveis:** 1 (`nova_tela_menu de_fases/hud2.png`, propósito original incerto).
- **Necessita verificação manual:** nenhum.

### Assets duplicados

3 casos relevantes (tabela na seção 4): `mundo_4.png` = cópia de `mundo_1.png`; cesta de comida do Mundo 4 = cópia pixel a pixel da cesta de praia do Mundo 3; e a redundância estrutural dos HUDs por mundo nunca conectados.

### Mundo 4 — consolidado

- **Card:** usa o cenário interno em vez de uma capa dedicada; o arquivo no caminho "certo" para a capa é uma cópia de Mundo 1, não arte própria (AD-01, AD-02 — este último já contado na Auditoria 03).
- **Cesta de comida:** 10 sprites, cobertura numérica suficiente, mas são cópia idêntica da cesta de praia do Mundo 3 (AD-03, 🟠 Alto — o achado mais importante desta tarefa).
- **Cesta mochila:** 10 sprites, nomenclatura e categoria corretas, índices 6-9 nunca alcançados pelas fases atuais (AD-04, melhoria).
- **Marshmallow:** contraste baixo comparado aos vizinhos de cesta (AD-05).
- **Assets de praia reutilizados:** confirmados só na cesta de comida (AD-03); backgrounds e demais objetos são próprios do Mundo 4.
- **Outros:** `botton_voltar.png` não utilizado (AD-09); `Group 499.png` em uso mas com nome não descritivo (AD-11).

### Mundo 5 — consolidado

- **Placeholders/reutilizações:** 100% do visual (background, "monstro", objetos, cestas) é reaproveitado do Mundo 3, de forma já documentada e assumida no próprio código como provisória.
- **Assets próprios:** nenhum asset visual exclusivo do Mundo 5 hoje — só os dados numéricos das 5 contas, que não são um asset visual.
- **Pendências visuais:** background, adversário e objetos/cestas temáticos próprios, quando a equipe decidir produzi-los. O "slot" de capa do card (`nova_tela_menu de_fases/mundo_5.png`) já existe no projeto, mas como um placeholder de 1×1px.

### Consistência visual

Ver seção 12 — 4 problemas reais sustentados por evidência (AD-02, AD-03, AD-05, AD-06) separados de observações/melhorias organizacionais.

### Resumo

- **Total de grupos de assets analisados:** 29 (seção 1), cobrindo 227 arquivos de imagem.
- **Assets quebrados:** 0.
- **Assets ausentes:** 0.
- **Assets não utilizados:** 72 confirmados + 1 provável = 73.
- **Assets duplicados (casos):** 3.
- **Placeholders identificados:** 2 diretos (`mundo_4.png` = cópia de `mundo_1.png`; `mundo_5.png` = imagem 1×1px) + o conjunto inteiro do Mundo 5 (reaproveitamento documentado, não um placeholder "vazio").
- **Problemas visuais (achados novos desta tarefa, por prioridade):**
  - 🔴 Crítico: 0
  - 🟠 Alto: 2 (AD-03 — cesta de comida do Mundo 4 duplicada da praia; AD-06 — preenchimento de cesta do Mundo 1 não acompanha a quantidade real)
  - 🟡 Médio: 2 (AD-01 — capas duplicada/placeholder; AD-05 — contraste do marshmallow)
  - 🔵 Baixo: 5 (AD-07, AD-08, AD-09, AD-10, AD-11 — todos de organização/legado, sem impacto na experiência de jogo)
  - 💡 Melhoria: 2 (AD-04, AD-12)
  - (AD-02 já contabilizado na Auditoria 03, não duplicado aqui.)
- **Melhorias recomendadas (sem implementar):** criar arte de cesta de comida própria do Acampamento (hoje copiada do Mundo 3); criar uma capa de card dedicada ao Mundo 4 (490×375px, seguindo o padrão dos Mundos 1-3, já que o nome de arquivo "certo" existe mas está vazio/duplicado); revisar o contraste do `marshmellow.png`; conectar os sprites de cesta que já existem prontos (`4..9` em comidas/materiais do Mundo 1) para resolver o AD-06; decidir se os 73 assets não utilizados devem ser limpos do projeto ou mantidos para uso futuro (nenhuma ação tomada nesta auditoria, apenas o registro).
