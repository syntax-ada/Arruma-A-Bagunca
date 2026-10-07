# 06 — Código Morto e Legado

Auditoria de código morto, funções sem utilização, variáveis abandonadas, trechos legados e duplicações nos arquivos JavaScript do jogo "Arruma a Bagunça". Foco em **confiabilidade do diagnóstico**, não em remoção: nenhum arquivo foi alterado, nenhum código foi removido, nenhuma refatoração foi feita. Nenhum commit ou push foi realizado.

## Metodologia

1. Leitura integral de todos os 13 arquivos `.js` do projeto (`js/menu.js`, `js/main.js`, `js/progresso.js`, `js/game.js`, `js/math.js`, `js/operacoes.js`, `js/dev.js`, `js/audio.js`, `js/mundos/mundo1.js` a `mundo5.js`).
2. Para cada função, variável, constante e propriedade de `window` declarada, busca textual (`grep`) de todas as ocorrências no projeto inteiro (`.js` e `.html`), para separar "declarado" de "realmente consumido".
3. Rastreamento manual do fluxo de execução real (não apenas contagem de ocorrências) nos casos ambíguos — por exemplo, confirmar que um campo de configuração nunca é lido dentro do caminho de código que de fato executa, e não apenas que ele "parece" não ser lido.
4. Cruzamento com os arquivos HTML (`index.html`, `fase1.html`) para confirmar ordem de carregamento dos scripts, já que vários arquivos dependem de funções globais definidas por outros scripts carregados antes.
5. Verificação complementar de seletores CSS (`style-fase1.css`, `style-menu.css`, `global.css`) contra classes realmente aplicadas por HTML ou por JavaScript (inclusive classes construídas dinamicamente, como `posicao-${cat.posicao}`).
6. Consulta ao histórico do Git (somente leitura) quando útil para confirmar se um trecho é um estágio anterior do projeto.

Nenhum teste de execução em navegador foi necessário para os achados desta tarefa — todos são comprováveis por leitura e rastreamento estático do código, que é mais confiável aqui do que inferir "não utilização" a partir do comportamento observado em runtime. Quando a config temporária de Playwright já usada nas tarefas anteriores teria agregado confiança (ex.: confirmar em runtime que um campo nunca é lido), isso foi feito por rastreamento de código, que é equivalente e mais preciso para este tipo de achado.

---

## Escopo analisado

- `js/menu.js` (389 linhas) — navegação do menu, carrossel, modais.
- `js/main.js` (99 linhas) — bootstrap da fase.
- `js/progresso.js` (98 linhas) — persistência de progresso.
- `js/game.js` (535 linhas) — motor de organização/arraste.
- `js/math.js` (633 linhas) — motor do desafio matemático e do Boss.
- `js/operacoes.js` (491 linhas) — catálogo das operações matemáticas.
- `js/dev.js` (930 linhas) — painel e ferramentas de desenvolvimento.
- `js/audio.js` (192 linhas) — trilha sonora (revisado para consistência de integração; achados específicos de áudio já estão em `05-AUDIO.md`, não duplicados aqui).
- `js/mundos/mundo1.js` a `mundo5.js` (372, 349, 341, 309, 258 linhas) — configuração declarativa de cada mundo.
- `index.html` e `fase1.html` — apenas para confirmar ordem de carregamento de scripts e referências de IDs/classes usadas pelo JavaScript.
- `global.css`, `style-fase1.css`, `style-menu.css` — apenas para a verificação complementar da seção de CSS (não foi feita uma nova auditoria visual).

---

## Código sem utilização confirmado

| Item | Arquivo | Evidência | Risco de remoção |
|---|---|---|---|
| `ITENS_FASE_1` (array de 5 objetos fixos, linhas 135-176) | `js/mundos/mundo1.js` | Único uso é o fallback `: ITENS_FASE_1` dentro de `gerarItensFase1()`, acionado apenas se `gerarItensFase`/`window.gerarItensFase` não existir. `game.js` (dono dessa função) é carregado ANTES de `mundo1.js` em `fase1.html`, e em `index.html` a função nunca é chamada (menu.js só lê `totalFases`/`nome`). Em nenhum dos dois HTMLs esse fallback é alcançável hoje. | Baixo — sem consumidor em nenhum fluxo atual |
| `getCategoryCounts()` (linhas 298-310) | `js/game.js` | Função pura declarada; busca em todo o projeto não encontra nenhuma chamada, nem dentro do próprio `game.js`. Foi superada por `getCategorySummary()`, que é a função de fato usada para montar o resumo da conta. | Baixo — função pura, sem efeito colateral |
| `window.MUNDO_1` … `window.MUNDO_5` (linha final de cada `mundoN.js`) | `js/mundos/mundo1.js`…`mundo5.js` | Atribuídos em todos os 5 arquivos; busca em todo o projeto não encontra nenhuma leitura de `MUNDO_1`…`MUNDO_5` ou `window.MUNDO_1`…`window.MUNDO_5` em qualquer outro arquivo. Todo o código (`main.js`, `menu.js`, `math.js`, `dev.js`) acessa os mundos exclusivamente via `window.MUNDOS[id]`. | Baixo — atribuição sem leitor |
| `window.embaralharArray` (linha 533) | `js/game.js` | Exportado para `window`, mas nenhum arquivo do projeto (incluindo os 5 `mundoN.js`, que só chamam `window.gerarItensFase`) o referencia. | Baixo |
| `botaoFase1`, `cardMundo2`, `cardMundo3`, `cardMundo4` (linhas 6-9) | `js/menu.js` | `document.querySelector` para IDs que já não existem no `index.html` atual (o carrossel usa `.card-mundo[data-mundo]` genérico). Declaradas e nunca lidas depois. Já identificado do lado da interface na Tarefa 03 (`03-TELAS-E-BOTOES.md`); aqui confirmado também do lado do código. | Baixo — `querySelector` de ID inexistente apenas retorna `null`, sem erro |
| Branch "2. objeto legado" de `iniciarDesafioMatematico` (linhas 266-279, comentário "objeto legado") | `js/math.js` | Os 3 pontos de chamada de `iniciarEtapaMatematica` em todo o projeto (`game.js:198,268,519`) só passam `null`, um array (`getCategorySummary()`) ou uma conta composta — nunca um objeto simples não-array. Esse branch não tem produtor ativo hoje. | Baixo — branch morta, mantida apenas por compatibilidade declarada no próprio comentário |
| `.btn-continuar-menu` (CSS, linhas 608-626) | `style-fase1.css` | Classe nunca aplicada em nenhum HTML/JS. Está imediatamente antes do comentário `/* NOVOS BOTÕES DO FINAL DO DESAFIO MATEMÁTICO */`, que introduz `.acoes-conclusao`/`.btn-conclusao` — os botões realmente usados hoje (`math.js` → `exibirBotoesConclusao`). | Nenhum — CSS não executa |
| `.etiqueta-texto-categoria` (CSS, linha 257) | `style-fase1.css` | Classe nunca aplicada. Superada por `.etiqueta-categoria`, efetivamente criada em `game.js` (`imgEtiqueta.className = "etiqueta-categoria categoria-img"`). | Nenhum |

---

## Código provavelmente obsoleto

| Item | Arquivo | Evidência | O que falta confirmar |
|---|---|---|---|
| Comentário e campo `operacao: "multiplicacao"` da fase do Mundo 5 (cabeçalho, linhas 39-44, e linha 183-184) | `js/mundos/mundo5.js` | O comentário afirma que o campo vale "enquanto o motor não souber percorrer a lista 'desafios'". Rastreando `math.js` (`iniciarEtapaMatematica`, linhas 110-121): quando a fase declara `desafios`, o motor JÁ percorre a lista inteira e a conta é resolvida via `ehContaComposta()` → operação `"composta"` — o campo `operacao` da fase nunca é lido nesse caminho. O comentário descreve um estágio anterior do motor que parece já ter sido superado. | Confirmar com a equipe se existe algum outro ponto (fora deste repositório, ou um plano futuro) que ainda dependa desse campo antes de considerá-lo seguro para remover/atualizar o comentário |
| Fallback de carregamento dinâmico de `js/mundos/mundo1.js` quando `window.MUNDOS` está indefinido (linhas 36-44) | `js/dev.js` | Comentado como sendo para "ex: index.html", mas o `index.html` atual já carrega `mundo1.js` a `mundo5.js` antes de `dev.js` (confirmado pelas tags `<script>` do arquivo) — logo `window.MUNDOS` nunca está indefinido nas duas páginas existentes do jogo. Mesmo se fosse alcançado, carregaria só `mundo1.js`, deixando os Mundos 2-5 ausentes de `window.MUNDOS`. | Confirmar se existe algum outro ponto de entrada HTML (não encontrado nesta auditoria) em que os arquivos de mundo não sejam pré-carregados |

---

## Duplicações e lógica repetida

- **Detecção do Modo DEV duplicada** entre `js/menu.js` (`isModoDevAtivo()`, linhas 90-107) e `js/dev.js` (linhas 19-34): as duas leem/interpretam independentemente o parâmetro de URL `?dev=true/false/1/0`. Hoje as duas leituras concordam (não há bug observável), mas é lógica repetida que pode divergir se uma das duas for alterada sem a outra. **Classificação: duplicação problemática em potencial, não um bug atual.**
- **Dois algoritmos de embaralhamento Fisher-Yates independentes**: `embaralharArray()` (`js/game.js`, linhas 10-17) e `embaralharAlternativas()` (`js/math.js`, linhas 428-436) implementam exatamente o mesmo algoritmo, em dois arquivos diferentes, sem compartilhar código. **Classificação: duplicação de algoritmo, candidata simples a unificação futura.**
- **`getGerarItensFaseFn()` repetida idêntica em todos os 5 `mundoN.js`** (3 linhas idênticas por arquivo): este é um caso de **duplicação intencional**, não um problema — o cabeçalho de cada arquivo de mundo declara explicitamente que "cada arquivo de mundo é uma IIFE fechada" e que os dados de outros mundos "não são importáveis", "como manda o padrão do projeto". A repetição é a arquitetura escolhida pela equipe, não um descuido.
- **Catálogos de modelos (`MODELOS_COMIDAS`, `MODELOS_BEBIDAS`, etc.) redeclarados em `mundo5.js` a partir de `mundo3.js`**: também **intencional e autodocumentado** — o próprio cabeçalho de `mundo5.js` explica que o cenário é provisório e reaproveita o Mundo 3 por não haver, ainda, arte definitiva do "Boss". Não é duplicação por descuido.

---

## Código legado por área

### Menu (`menu.js`)
- 4 variáveis mortas (`botaoFase1`, `cardMundo2/3/4`) — ver tabela de código confirmado.
- Lógica de detecção do Modo DEV duplicada com `dev.js` — ver seção de duplicações.
- Nenhum outro código morto encontrado em `menu.js`: todas as demais funções (`abrirFase`, `mostrarMenuMundos`, `obterLarguraPassoCarrossel`, `atualizarBotoesModalFases`, `abrirModalFases`, `atualizarInterfaceProgresso`, `verificarParametroView`) têm pelo menos um ponto de chamada real confirmado.

### Gameplay e motor (`game.js`, `math.js`, `operacoes.js`)
- `getCategoryCounts()` morta em `game.js` — ver tabela.
- Branch "objeto legado" morta em `math.js` — ver tabela.
- `window.embaralharArray` exportado sem consumidor — ver tabela.
- `operacoes.js` está limpo: todas as 5 operações (`SOMA`, `SUBTRACAO`, `MULTIPLICACAO`, `DIVISAO`, `COMPOSTA`) são registradas em `OPERACOES` e localizadas por `math.js` via `config.operacao`; não há operação morta no catálogo.
- Pequena observação de baixíssimo risco: `normalizarExpressao()` (`operacoes.js`, linhas 326-335) aceita dois formatos de entrada (`resolverExpressao(valores, operadores)` e `resolverExpressao({valores, operadores})`), mas `COMPOSTA.calcular`/`COMPOSTA.validar` — os únicos chamadores — sempre usam o primeiro formato. O segundo formato é flexibilidade de API nunca exercida hoje. **Classificação: Intencional/sem risco**, não chega a ser um achado prioritário.

### Mundos (`mundo1.js` a `mundo5.js`)
- `ITENS_FASE_1` morto, exclusivo do Mundo 1 — ver tabela. Nenhum outro mundo tem um fallback hardcoded equivalente (Mundos 2, 3 e 4 usam `: []` como fallback).
- Comentário/campo desatualizado no Mundo 5 sobre o campo `operacao` — ver tabela de "provavelmente obsoleto".
- `window.MUNDO_1`…`window.MUNDO_5` mortos, um por mundo — ver tabela.
- **Mundo 6**: não existe como código em lugar nenhum do projeto (nenhuma ocorrência de "mundo 6"/"MUNDO_6" em `.js`/`.html`/`.css`). Existe apenas como artefato de dados de progresso — ver seção seguinte.
- Nenhuma lógica foi encontrada "copiada entre mundos com diferenças relevantes" além do padrão intencional já descrito (`getGerarItensFaseFn`, catálogos redeclarados). A estrutura de `CONFIG_FASE_N` é consistente entre os 5 arquivos.

### Progresso (`progresso.js`)
- Nenhuma função morta encontrada: `obterProgresso()` e `desbloquearProximaFase()` são as únicas funções do arquivo, e ambas têm múltiplos chamadores confirmados (`menu.js`, `math.js`, `dev.js`).
- O comportamento que gera o artefato "Mundo 6" vem de uma ausência de verificação (não de código morto): `desbloquearProximaFase()` (linhas 82-87) sempre desbloqueia `mundoAtual + 1` ao concluir a última fase, sem checar se esse número corresponde a um mundo real em `window.MUNDOS`. Isso já foi confirmado por execução real na Tarefa 01 (achado AF-04): depois de concluir a única fase do Mundo 5, `mundosDesbloqueados` passa a conter `6`.

### Modo DEV (`dev.js`)
- Fallback de carregamento de mundo obsoleto — ver tabela de "provavelmente obsoleto".
- Lógica de detecção duplicada com `menu.js` — ver duplicações.
- Pequena assimetria entre console e interface: `window.dev.completarFase()` é uma função real, funcional e documentada na própria ajuda do console (`exibirAjudaDev()`, linha 513), mas não tem botão correspondente no painel visual (`criarPainelDevDOM()` só cria botões para `completarEtapa`, `proximaFase`, `desbloquearTudo` e `resetarProgresso`) nem atalho de teclado. **Classificação: Intencional/Melhoria** — não é um bug, apenas uma função que só é alcançável via `dev.completarFase()` no console.
- Fora esses dois pontos, `dev.js` está bem conectado: todas as demais funções internas (`navegarDev`, `irPara`, `irParaMenu`, `desbloquearTudo`, `resetarProgresso`, `simularInteracaoComCesta`, `etapaEstaVisivel`, `faseFoiConcluida`, `haDesafioParaResponder`, `haObjetoParaOrganizar`, `aguardarProximoEstadoDoJogo`, `completarEtapa`, `completarFase`, `proximaFase`, `desativarModoDev`, `exibirAjudaDev`, `desbloquearMenuVisualSeNecessario`, `injetarEstilosDev`, `atualizarOpcoesPainelDev`, `criarPainelDevDOM`) têm uso confirmado por atalho de teclado, botão do painel, ou exposição deliberada em `window.dev`.

---

## Referências a funcionalidades antigas

- **Mundo 6**: confirmado como artefato de dados de progresso (`localStorage` pode conter `6` em `mundosDesbloqueados`), nunca como código, config ou tela. Não há `window.MUNDOS[6]`, não há card, não há arquivo `mundo6.js`. É consequência de uma verificação ausente em `progresso.js`, não uma funcionalidade parcialmente implementada.
- **CSS legado de uma versão anterior da tela de conclusão**: `.btn-continuar-menu` (ver tabela) é indício forte de que a tela de fim de fase já teve um único botão "Continuar" antes do atual par "Voltar para o Menu" / "Próxima Fase" (`.acoes-conclusao`/`.btn-conclusao`, usado por `math.js`).
- **CSS legado de rótulo de categoria em texto**: `.etiqueta-texto-categoria` (ver tabela) sugere uma versão anterior em que a etiqueta da cesta era texto estilizado, antes de se tornar a imagem (`etiquetaImgSrc`) usada hoje em todos os mundos.
- **Comentário desatualizado sobre o motor do Mundo 5**: ver "Código provavelmente obsoleto" — o texto descreve o motor como incapaz de ler `desafios`, o que já não é verdade.
- **Variantes de posicionamento de cesta nunca usadas**: `.posicao-dir-topo` e `.posicao-dir-base` (CSS construído dinamicamente via `posicao-${cat.posicao}` em `game.js`) existem como regras prontas, mas nenhuma fase declarada em `mundo1.js` a `mundo5.js` usa os valores `"dir-topo"` ou `"dir-base"` — apenas `"esq-topo"`, `"esq-centro"`, `"esq-base"` e `"dir-centro"` aparecem de fato. Diferente de uma classe morta "de verdade", esta é uma variante preparada e nunca exercitada pela configuração atual.
- Dois seletores CSS compostos têm uma metade órfã sem efeito prático: `.cenario-fase, .tela-fase1 { … }` e `.area-cestas, .categorias { … }` (`style-fase1.css`) — a regra continua funcionando porque a segunda classe de cada par está em uso; apenas a primeira (`cenario-fase`, `area-cestas`) não é aplicada por nada.

---

## Recomendações futuras

Nenhuma destas recomendações foi implementada nesta auditoria — são sugestões para uma tarefa futura, organizadas por prioridade/risco.

**🟡 Médio — vale revisar com a equipe antes de decidir**
1. Atualizar o comentário (e avaliar remover o campo `operacao`) da fase do Mundo 5 em `mundo5.js`, já que o motor em `math.js` já sabe consumir `desafios` — o texto atual pode confundir quem for dar continuidade ao "Boss" definitivo.
2. Remover a branch "objeto legado" de `iniciarDesafioMatematico` (`math.js`) se a equipe confirmar que nenhum código externo a este repositório depende desse formato.
3. Consolidar a detecção do Modo DEV num único lugar (hoje duplicada entre `menu.js` e `dev.js`), para eliminar o risco de divergência futura.
4. Unificar os dois algoritmos de embaralhamento (`embaralharArray` em `game.js` e `embaralharAlternativas` em `math.js`) numa única função compartilhada.

**🔵 Baixo — segura para limpar quando a equipe decidir revisar o projeto**
5. Remover `ITENS_FASE_1` de `mundo1.js` (fallback inalcançável).
6. Remover `getCategoryCounts()` de `game.js` (função morta, superada por `getCategorySummary()`).
7. Remover as 5 atribuições `window.MUNDO_1`…`window.MUNDO_5` e `window.embaralharArray` (globais sem consumidor).
8. Remover `botaoFase1`, `cardMundo2`, `cardMundo3`, `cardMundo4` de `menu.js`.
9. Remover ou atualizar o fallback de carregamento dinâmico de mundo em `dev.js` (linhas 36-44), hoje inalcançável e, mesmo se alcançado, incompleto.
10. Limpar os seletores CSS órfãos (`.btn-continuar-menu`, `.etiqueta-texto-categoria`) e simplificar os dois seletores compostos parcialmente órfãos (`.cenario-fase`, `.area-cestas`).

**💡 Melhoria — oportunidades menores, sem urgência**
11. Adicionar a `desbloquearProximaFase()` (`progresso.js`) uma verificação de que o próximo mundo existe em `window.MUNDOS` antes de desbloqueá-lo, para que o artefato "Mundo 6" deixe de aparecer em `localStorage`.
12. Decidir se `window.dev.completarFase()` merece um botão/atalho no painel visual, já que hoje só é alcançável via console.

---

## Resumo

- **Arquivos examinados**: 13 arquivos `.js` (100% dos scripts do jogo) + 2 arquivos `.html` (apenas para ordem de carregamento) + 3 arquivos `.css` (verificação complementar).
- **Funções/variáveis suspeitas investigadas**: 20+ (todas as declarações de função e `window.*` do projeto foram cruzadas contra seus usos).
- **Código morto confirmado**: 8 itens (`ITENS_FASE_1`, `getCategoryCounts()`, 5× `window.MUNDO_N`, `window.embaralharArray`, 4 variáveis mortas em `menu.js`, branch "objeto legado" em `math.js`, 2 classes CSS órfãs) — todos de risco de remoção **Baixo**.
- **Código provavelmente obsoleto**: 2 itens (comentário/campo do Mundo 5 sobre `operacao`; fallback de carregamento de mundo em `dev.js`), ambos pendentes de uma confirmação final com a equipe antes de agir.
- **Duplicações relevantes**: 2 (detecção do Modo DEV entre `menu.js`/`dev.js`; algoritmo de embaralhamento entre `game.js`/`math.js`) — além de 2 padrões de duplicação **intencional e autodocumentada** (estrutura repetida dos arquivos de mundo; reaproveitamento do Mundo 3 pelo Mundo 5).
- **Referências a funcionalidades antigas**: Mundo 6 (artefato de progresso, não código), 2 classes CSS indicando uma versão anterior da tela de conclusão e do rótulo de categoria, 1 comentário desatualizado sobre o motor do Mundo 5, e 2 variantes de posicionamento de cesta nunca exercitadas pela configuração atual.
- **Casos que precisam de validação manual com a equipe** (não apenas leitura de código): os 2 itens da tabela "Código provavelmente obsoleto" — ambos têm evidência forte de obsolescência, mas a decisão de remover/atualizar depende de contexto que só a equipe tem (planos futuros para o Boss do Mundo 5; outros pontos de entrada HTML não presentes neste repositório).
