# 08 — Matemática e BNCC

Auditoria do conteúdo matemático do jogo "Arruma a Bagunça": correção dos cálculos em todas as fases dos Mundos 1–5, aderência à habilidade da BNCC documentada no projeto, e adequação pedagógica da mecânica para o público de 7 a 10 anos. Nenhum arquivo do jogo foi alterado, nenhuma fase/operação foi corrigida. Nenhum commit ou push foi realizado.

## Fonte da habilidade BNCC

O único registro de BNCC encontrado no projeto está em `README.md` (linhas 35-43):

> **EF02MA06 / EF03MA06 — operações e resolução de problemas com números naturais em situações do cotidiano.**
> A atividade matemática deve estar relacionada à ação realizada pela criança durante o jogo.
> [Requisito oficial] A definição das habilidades da BNCC deve seguir os materiais oficiais fornecidos pela faculdade. Não devem ser criadas ou alteradas habilidades sem validação da equipe.

Não existe, em nenhum outro documento do projeto, uma habilidade BNCC diferente por mundo ou por operação — é uma única habilidade, aplicada de forma geral a "Matemática". Por isso, a tabela da seção 2 usa a MESMA habilidade documentada para todos os mundos, e avalia a aderência real de cada um a ela — não inventei nem diferenciei códigos por conta própria, como o próprio `README.md` pede explicitamente para não fazer.

## Metodologia

1. Para cada uma das 13 fases reais (3 por Mundo 1–4) e dos 5 desafios do Mundo 5, recalculei manualmente o resultado esperado a partir das cotas declaradas em cada `js/mundos/mundoN.js`, incluindo o rastreamento passo a passo do algoritmo de duas passadas de `resolverExpressao()` (`operacoes.js`) para os 5 desafios compostos do Mundo 5.
2. Testei TODAS as 13 fases + os 5 desafios do Mundo 5 em Google Chrome real via Playwright (instalado fora do repositório, servindo o projeto por um servidor HTTP local temporário, também fora do repositório e encerrado ao final), organizando os objetos de verdade e lendo o desafio matemático ativo diretamente do motor (`window.obterDesafioMatematicoAtivo()`, já exposto pelo próprio `math.js` para o painel DEV — não é uma exposição criada por esta auditoria).
3. Em cada fase, testei uma resposta incorreta antes da correta, para confirmar rejeição de erro e aceitação de acerto.
4. Cruzei o texto de cada "pergunta" e do resumo de quantidades exibido na tela com a operação realmente configurada, para checar consistência entre configuração, enunciado e resposta aceita.

---

## 1. Validação matemática

**Resultado líquido: 18 de 18 desafios testados (13 fases + 5 desafios do Mundo 5) com resultado configurado idêntico ao resultado observado em execução real, nenhuma divisão inexata, nenhum teto de multiplicação excedido, nenhuma resposta incorreta aceita, nenhuma resposta correta rejeitada.**

| Mundo | Fase | Operação | Cálculo esperado | Resultado configurado | Resultado observado (execução real) | Status |
|---|---|---|---|---|---|---|
| 1 | 1 | Soma | 3 + 2 | 5 | 5 | ✅ |
| 1 | 2 | Soma | 3 + 3 + 3 | 9 | 9 | ✅ |
| 1 | 3 | Soma | 2 + 5 + 7 | 14 | 14 | ✅ |
| 2 | 1 | Subtração | 4 − 2 | 2 | 2 | ✅ |
| 2 | 2 | Subtração | 7 − 5 | 2 | 2 | ✅ |
| 2 | 3 | Subtração | 8 − 5 − 3 | 0 | 0 | ✅ |
| 3 | 1 | Multiplicação | 2 × 4 | 8 | 8 | ✅ |
| 3 | 2 | Multiplicação | 5 × 5 | 25 | 25 | ✅ |
| 3 | 3 | Multiplicação | 2 × 4 × 5 | 40 (= teto `LIMITE_MULTIPLICACAO`) | 40 | ✅ |
| 4 | 1 | Divisão | 4 ÷ 4 | 1 | 1 | ✅ |
| 4 | 2 | Divisão | 9 ÷ 3 | 3 | 3 | ✅ |
| 4 | 3 | Divisão | 10 ÷ 5 | 2 | 2 | ✅ |
| 5 | C1 | Composta | 9 + 8 − 2 | 15 | 15 | ✅ |
| 5 | C2 | Composta | 4 × 3 + 3 (× antes de +) | 15 | 15 | ✅ |
| 5 | C3 | Composta | 8 ÷ 4 − 1 (÷ antes de −) | 1 | 1 | ✅ |
| 5 | C4 | Composta | 2 × 5 + 2 − 1 (× antes de + e −) | 11 | 11 | ✅ |
| 5 | C5 | Composta | 20 ÷ 4 + 6 − 2 (÷ antes de + e −) | 9 | 9 | ✅ |

Pontos adicionais verificados:

- **Divisões exatas**: todas as 3 divisões simples (Mundo 4) e as 2 divisões dentro de contas compostas (Mundo 5, C3 e C5) são exatas — nenhum resto, nenhum divisor zero. `operacoes.js` tem guardas explícitas para os dois casos (`validar()` na divisão simples; checagem replicada dentro de `resolverExpressao()` para a divisão dentro de uma composta) e nenhuma delas foi acionada em nenhuma fase real, porque todas as cotas foram escolhidas corretamente pela equipe.
- **Teto de multiplicação**: `LIMITE_MULTIPLICACAO = 40` e a fase mais difícil do Mundo 3 (Fase 3: 2×4×5) chega exatamente a 40 — no limite, mas não o excede. Nenhuma fase real ultrapassa o teto.
- **Ordem de precedência no Mundo 5**: os 5 desafios respeitam corretamente "× e ÷ antes de + e −" — confirmado tanto pelo rastreamento manual do algoritmo de duas passadas de `resolverExpressao()` quanto pela execução real. Nenhuma divergência encontrada.
- **Consistência entre configuração, enunciado e resposta aceita**: em todas as 18 contas, o texto do resumo exibido na tela (`#resumo-quantidades`, ex.: `"🍎Comidas:4÷🎒Mochila:4"`) corresponde exatamente aos valores e ao operador configurados, e o botão com o valor numericamente igual ao `resultadoCorreto` é sempre o único aceito.
- **Respostas incorretas aceitas / respostas corretas rejeitadas**: nenhuma ocorrência em nenhuma das 18 contas testadas. Em cada uma, uma resposta deliberadamente errada foi clicada primeiro e corretamente rejeitada (com o botão permanecendo habilitado para nova tentativa), antes de a resposta certa ser aceita.
- **Progressão de dificuldade**:
  - Dentro de cada mundo, a quantidade total de objetos cresce a cada fase: Mundo 1 (5→9→14), Mundo 2 (6→12→16), Mundo 3 (6→10→11), Mundo 4 (8→12→15) — em todos os casos a Fase 3 também introduz ou mantém o maior número de categorias simultâneas.
  - Entre mundos, a sequência de operações (soma → subtração → multiplicação → divisão → composta) segue uma ordem crescente de exigência compatível com a sequência curricular usual dessas operações.
  - **Achado de conteúdo (não é erro de cálculo)**: nos 5 desafios do Mundo 5, o operador prioritário (× ou ÷) é sempre o PRIMEIRO da expressão, em todas as 5 contas (`9+8−2`, `4×3+3`, `8÷4−1`, `2×5+2−1`, `20÷4+6−2`). Isso significa que, matematicamente, ler e calcular a conta da esquerda para a direita SEM aplicar nenhuma regra de precedência produz exatamente o mesmo resultado que aplicá-la corretamente, nas 5 contas atuais. O motor (`operacoes.js`) implementa a precedência corretamente (confirmado acima), mas o conjunto de 5 contas escolhido nunca força essa regra a fazer diferença — ver achado MB-05.

---

## 2. Aderência à BNCC

Habilidade avaliada (a única documentada no projeto, aplicada aqui a cada mundo, não diferenciada por operação pelo próprio projeto): **EF02MA06 / EF03MA06 — operações e resolução de problemas com números naturais em situações do cotidiano.**

| Mundo/Fase | Habilidade prevista | Evidência da atividade | Aderência | Justificativa |
|---|---|---|---|---|
| Mundo 1 (Soma) | EF02MA06/EF03MA06 | A criança organiza objetos reais em categorias e depois é perguntada pela quantidade TOTAL do que ela mesma organizou — a soma é literalmente a ação que ela acabou de fazer. | **Direta** | É o único mundo em que a operação corresponde exatamente à ação realizada (contar o total do que foi feito), satisfazendo com precisão o requisito do próprio README ("a atividade matemática deve estar relacionada à ação realizada pela criança"). |
| Mundo 2 (Subtração) | EF02MA06/EF03MA06 | A criança organiza duas (ou três) categorias e é perguntada por uma subtração entre as quantidades reais de categorias diferentes (ex.: Animais − Brinquedos). | **Direta, com ressalva de enunciado** | Os números são reais e vêm da ação da criança (atendendo a "números naturais em situações do cotidiano"), e a subtração-como-comparação entre dois grupos é um significado legítimo da subtração. A ressalva: o texto da pergunta ("Quantos objetos sobraram?") sugere um "retirar/sobrar", mas nada é de fato retirado na mecânica — são dois grupos organizados de forma independente, comparados. Ver achado MB-06 (pedagógico, não um erro de cálculo). |
| Mundo 3 (Multiplicação) | EF02MA06/EF03MA06 | A criança organiza duas categorias e é perguntada pelo produto entre suas quantidades (ex.: Brinquedos × Bebidas). | **Parcial** | O cálculo é correto e usa números reais da ação da criança, atendendo à parte "resolução de problemas com números naturais". Porém a mecânica não representa uma situação de multiplicação propriamente dita (grupos iguais, "X vezes Y itens cada") — é o produto entre duas contagens de categorias sem nenhuma relação narrativa de agrupamento. A criança pratica a CONTA, mas a atividade não evidencia o CONCEITO multiplicativo (adição de parcelas iguais) que costuma acompanhar a introdução desse conteúdo. |
| Mundo 4 (Divisão) | EF02MA06/EF03MA06 | A criança organiza duas categorias e é perguntada pelo quociente entre suas quantidades (ex.: Comidas ÷ Mochila). | **Parcial** | Mesma lógica do Mundo 3: a conta está correta e exata, mas não há, na mecânica, uma distribuição visível em grupos iguais (ex.: "separar a comida em tantos grupos quanto itens de mochila") — a divisão é aplicada a duas contagens sem relação de agrupamento entre si. |
| Mundo 5 (Composta) | EF02MA06/EF03MA06 (aplicação declarada pelo projeto) | A criança resolve 5 expressões com múltiplos operadores e regra de precedência, usando os mesmos tipos de operação dos Mundos 1–4, mas fora do contexto de organização de objetos específicos daquela conta (os valores vêm fixos no arquivo do mundo, não de uma contagem feita pela criança naquele momento). | **Parcial/Temática — pendente de confirmação** | A operação "composta" com regra de precedência é um conteúdo tipicamente trabalhado em anos posteriores ao 2º/3º ano (EF02/EF03) citados na habilidade documentada — o público do jogo chega até o 5º ano (ver README), então pode ser apropriado como desafio final, mas os documentos do projeto não confirmam isso explicitamente para o Mundo 5. Registro como dúvida, não como erro: **depende de confirmação da equipe/professor** se o Mundo 5 deveria mapear para a mesma habilidade EF02MA06/EF03MA06 ou para uma habilidade de anos posteriores (não documentada aqui, e que esta auditoria não tem autorização para presumir ou inventar). |

Observação geral: em nenhum mundo a habilidade foi considerada atendida apenas por tema (ex.: "o jogo é sobre organizar e contar, logo atende a BNCC de matemática") — a avaliação acima se baseou na atividade cognitiva real exigida pelo motor e confirmada em execução (ver seção 1), não na ambientação visual dos mundos.

---

## 3. Adequação pedagógica

Problemas objetivos (fatos verificáveis no código/execução) e sugestões pedagógicas (juízo de valor sobre design) estão separados abaixo.

### Fatos objetivos relevantes à pedagogia

- As 4 operações básicas e a composta estão corretamente implementadas e nenhuma conta real do jogo produz resultado inválido (seção 1).
- O feedback de erro ("Quase lá! Vamos contar de novo? Tente outra resposta.") é idêntico em todas as operações e mundos — não há dica diferenciada por tipo de erro (ex.: não diferencia um erro "próximo" de um erro "distante" do valor correto).
- O enunciado da pergunta muda por operação (ex.: "Quantos objetos sobraram?" para subtração, "Quantos objetos há no total?" para multiplicação), mas o RESUMO visual da conta (`#resumo-quantidades`) sempre mostra os ícones e nomes reais das categorias organizadas, o que ajuda a criança a relacionar a conta ao que ela acabou de fazer.
- Em todos os mundos com mais de uma categoria (2–5), a ORDEM das categorias no array `categorias` de cada fase determina a ordem dos termos da conta (significativo para subtração/divisão, irrelevante para multiplicação) — essa ordem é fixa por fase, então o enunciado nunca muda de ordem entre tentativas da mesma fase.
- Nos Mundos 2–4, os dois (ou três) números da conta vêm de categorias DIFERENTES e sem relação narrativa entre si (ex.: "comidas" dividido por "itens de mochila") — a criança não vê uma distribuição real entre grupos, só dois totais que o jogo decidiu combinar com um operador.

### Sugestões pedagógicas (juízo de valor, não bugs)

- 💡 O enunciado de subtração ("Quantos objetos sobraram?") poderia refletir melhor a mecânica real (comparação entre dois grupos organizados) em vez de sugerir remoção — por exemplo, "quantos [categoria A] a mais que [categoria B]?".
- 💡 Nos Mundos 3 e 4, a experiência poderia reforçar mais o CONCEITO de multiplicação/divisão (agrupamento) se a narrativa ligasse as duas categorias de alguma forma (ex.: "quantas bebidas cabem em cada bolsa, se cada bolsa leva X bebidas"), em vez de apenas aplicar o operador a duas contagens de categorias não relacionadas.
- 💡 No Mundo 5, já que o motor sabe aplicar precedência corretamente, ao menos uma das 5 contas poderia ser escrita com o operador prioritário NO MEIO ou no FIM da expressão (ex.: "9 − 2 × 3"), para que a regra de precedência realmente faça diferença no resultado e seja de fato exercitada pela criança — hoje nenhuma das 5 contas testa isso (ver achado MB-05).
- 💡 O feedback de erro não diferencia a distância do erro (ex.: responder 1 a mais vs. responder um valor muito distante) — uma mensagem graduada poderia ajudar mais no "erro como oportunidade de aprendizado" já citado no AGENTS.md.

---

## Problemas encontrados

### 🟡 MB-05 — Médio — As 5 contas do Mundo 5 nunca exigem aplicar a regra de precedência
- **Arquivo**: `js/mundos/mundo5.js:70-85` (array `DESAFIOS_MUNDO_5`)
- **Evidência**: nas 5 contas (`9+8−2`, `4×3+3`, `8÷4−1`, `2×5+2−1`, `20÷4+6−2`), o operador prioritário (× ou ÷) é sempre o primeiro da expressão — calcular da esquerda para a direita, ignorando por completo a regra de precedência, produz o mesmo resultado correto nas 5 contas. Confirmado por rastreamento manual do algoritmo e por execução real.
- **Impacto**: o motor (`operacoes.js`) implementa corretamente a precedência (× e ÷ antes de + e −), mas o conteúdo atual do Mundo 5 nunca testa essa regra na prática — uma criança pode "acertar" as 5 contas usando apenas leitura da esquerda para a direita, sem nunca precisar entender por que × vem antes de +.
- **Recomendação futura**: reescrever (ou acrescentar) ao menos uma conta com o operador prioritário no meio/fim da expressão, para que a regra de precedência tenha efeito observável no resultado.

### 🟡 MB-06 — Médio — Enunciado da subtração sugere "retirar", mas a mecânica é uma comparação entre grupos
- **Arquivo**: `js/operacoes.js` (`SUBTRACAO.pergunta`, linha 115); `js/mundos/mundo2.js` (categorias independentes)
- **Evidência**: o texto "Quantos objetos sobraram?" implica remoção/sobra de um mesmo conjunto, mas a conta real é a diferença entre as contagens de duas categorias organizadas de forma independente (ex.: Animais − Brinquedos), nunca uma remoção de itens de um mesmo grupo.
- **Impacto**: possível confusão conceitual — a criança pode não entender por que "sobrou" um número que não corresponde a nada sendo fisicamente retirado da tela.
- **Recomendação futura**: ajustar o enunciado para refletir uma comparação ("quantos a mais"), ou reformular a mecânica para uma subtração de retirada real, conforme decisão pedagógica da equipe.

### 🔵 MB-07 — Baixo — Multiplicação e divisão não demonstram o conceito de agrupamento
- **Arquivo**: `js/mundos/mundo3.js`, `js/mundos/mundo4.js` (categorias independentes combinadas por × ou ÷)
- **Evidência**: seção 2 (tabela BNCC) e seção 3.
- **Impacto**: a conta é sempre matematicamente correta, mas a atividade não evidencia o significado conceitual de multiplicação (grupos iguais) nem de divisão (repartição/agrupamento) — risco de a criança aprender a "decorar a conta" sem construir o conceito por trás dela.
- **Recomendação futura**: decisão pedagógica da equipe/professor — avaliar se vale a pena redesenhar a narrativa dessas duas mecânicas para expressar agrupamento real.

### 💡 MB-08 — Melhoria — Mundo 5 pode exceder o nível de ano citado na habilidade documentada
- **Arquivo**: `README.md:39` (habilidade) vs. `js/mundos/mundo5.js` (conteúdo)
- **Evidência**: a habilidade documentada cita EF02MA06/EF03MA06 (2º/3º ano); expressões compostas com precedência de operadores costumam aparecer em anos posteriores no currículo brasileiro. Não há, nos documentos do projeto, confirmação de que o Mundo 5 deveria mapear para essa mesma habilidade ou para outra.
- **Recomendação futura**: **depende de confirmação da equipe/professor responsável pela disciplina** — não é uma afirmação desta auditoria de que o conteúdo está "errado" para a idade, apenas um ponto que os documentos atuais não permitem confirmar com segurança.

---

## Melhorias pedagógicas

(Consolidado da seção 3 — nenhuma delas é um bug, todas dependem de validação da equipe/professor antes de qualquer implementação)

1. Reformular o enunciado da subtração para refletir comparação em vez de remoção (relacionado a MB-06).
2. Dar uma narrativa de agrupamento real à multiplicação e à divisão (relacionado a MB-07).
3. Incluir ao menos uma conta do Mundo 5 em que a precedência de operadores realmente altere o resultado (relacionado a MB-05).
4. Diferenciar o feedback de erro pela distância da resposta errada em relação à correta.

---

## Resumo

- **Fases/desafios verificados**: 18 (13 fases dos Mundos 1–4 + 5 desafios compostos do Mundo 5) — 100% da matemática atualmente jogável no projeto.
- **Erros matemáticos confirmados**: 0. Nenhuma divisão inexata, nenhum teto excedido, nenhuma resposta incorreta aceita, nenhuma resposta correta rejeitada, em nenhuma das 18 contas testadas por execução real.
- **Divergências entre código e jogo**: 0 — o resultado configurado em cada `mundoN.js` correspondeu exatamente ao resultado observado em execução real, nas 18 contas.
- **Aderência à BNCC (EF02MA06/EF03MA06, única habilidade documentada)**: Direta no Mundo 1 (soma); Direta com ressalva de enunciado no Mundo 2 (subtração); Parcial nos Mundos 3 e 4 (multiplicação/divisão — conta correta, conceito de agrupamento não evidenciado); Parcial/Temática e pendente de confirmação no Mundo 5 (possível desalinhamento de ano escolar, não confirmável pelos documentos atuais).
- **Problemas encontrados**: 3 (2 🟡 Médio — conteúdo do Mundo 5 não testa precedência; enunciado de subtração — e 1 🔵 Baixo — ausência de conceito de agrupamento em multiplicação/divisão), além de 1 💡 Melhoria sobre possível desalinhamento de ano escolar no Mundo 5.
- **Pontos que precisam de validação da equipe ou do professor**: (1) se o Mundo 5 deveria ser mapeado para a mesma habilidade EF02MA06/EF03MA06 ou para uma habilidade de anos posteriores; (2) se a ausência de narrativa de agrupamento em multiplicação/divisão é aceitável para os objetivos pedagógicos atuais ou merece redesenho; (3) se o enunciado da subtração deveria ser ajustado para refletir com mais precisão a mecânica de comparação entre grupos.
