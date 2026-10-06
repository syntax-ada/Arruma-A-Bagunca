# Arruma a Bagunça

Jogo educativo digital desenvolvido para a disciplina **Análise e Projeto de Sistemas II**, com foco no ensino de Matemática de forma lúdica, visual, interativa e acessível.

O jogo é destinado a crianças de **7 a 10 anos**, aproximadamente do 2º ao 5º ano, da rede pública municipal de São Paulo.

A integração com o **Cruzeiro HUB via iframe** faz parte do projeto e será realizada posteriormente.

---

## 1. Sobre o projeto

O projeto utiliza uma experiência de jogo para apoiar o aprendizado de Matemática por meio de situações contextualizadas.

A criança organiza objetos em categorias e, em seguida, utiliza os resultados dessa organização para resolver um desafio matemático relacionado à atividade realizada.

A proposta é evitar que o jogo funcione apenas como uma lista de exercícios, utilizando interação, feedback e elementos visuais para apoiar o aprendizado.

O projeto está em desenvolvimento contínuo: os Mundos 1 a 4 já possuem três fases jogáveis cada e o Mundo 5 (desafio final) já está implementado no engine, enquanto a evolução do produto (acessibilidade, UX/UI e demais requisitos) segue em andamento.

---

## 2. Requisitos e fundamentos

### Público-alvo

- Crianças de 7 a 10 anos;

- aproximadamente do 2º ao 5º ano;

- estudantes da rede pública municipal de São Paulo;

- interface deve considerar crianças alfabetizadas e em processo de alfabetização.

### BNCC

A habilidade atualmente considerada para Matemática é:

**EF02MA06 / EF03MA06 — operações e resolução de problemas com números naturais em situações do cotidiano.**

A atividade matemática deve estar relacionada à ação realizada pela criança durante o jogo.

> [Requisito oficial] A definição das habilidades da BNCC deve seguir os materiais oficiais fornecidos pela faculdade. Não devem ser criadas ou alteradas habilidades sem validação da equipe.

### Requisitos previstos para o produto completo

O projeto completo prevê:

- menu inicial; *(implementado)*

- instruções com suporte a áudio; *(não implementado)*

- configurações de acessibilidade; *(não implementado)*

- seleção de avatar/apelido; *(não implementado)*

- 4 mundos principais com fases progressivas, mais 1 mundo bônus; *(Mundos 1 a 4 implementados; mundo bônus implementado no engine — ver seções 3 e 5)*

- persistência básica de progresso; *(implementado, multi-mundo)*

- registro de fases concluídas; *(implementado, multi-mundo)*

- pontuação/conquistas; *(não implementado)*

- mecânicas adequadas para crianças; *(em evolução contínua)*

- suporte a teclado; *(parcial — ver seção 6)*

- suporte a dispositivos móveis; *(parcial — ver seção 6)*

- integração com o Cruzeiro HUB via iframe. *(não implementado)*

> [Requisito oficial] A existência de um mundo/fase bônus é obrigatória, conforme os requisitos da faculdade.

[Decisão da equipe] A estrutura atual é de 4 mundos principais + 1 mundo bônus. Os quatro mundos principais já têm tema e operação definidos (ver seção 3), cada um com 3 fases. O mundo bônus (Mundo 5 — Desafio Final) é voltado a todas as contas/conteúdos matemáticos trabalhados ao longo do jogo e reúne cinco desafios de contas compostas numa única fase; o cenário e a arte dele ainda são provisórios. Não presuma quantidades, temas ou arte além do que está documentado na seção 3.

---

## 3. Plano de desenvolvimento

[Decisão da equipe] A estrutura definida é de **4 mundos principais + 1 mundo bônus** (este último obrigatório, conforme requisito da faculdade — ver seção 2). Só é preenchido abaixo o que já está definido no projeto — o restante permanece em aberto até decisão da equipe.

| Mundo | Tema | Operação | Fases | Estado |
|---|---|---|---|---|
| Mundo 1 | A Casa | Soma (`+`) | Fase 1, Fase 2, Fase 3 | Implementado |
| Mundo 2 | Parque | Subtração (`−`) | Fase 1, Fase 2, Fase 3 | Implementado |
| Mundo 3 | Praia | Multiplicação (`×`) | Fase 1, Fase 2, Fase 3 | Implementado |
| Mundo 4 | Acampamento | Divisão (`÷`) | Fase 1, Fase 2, Fase 3 | Implementado |
| Mundo bônus | Ainda não definido | Revisão geral | Todas as contas/conteúdos matemáticos trabalhados no jogo | Planejado |

O carrossel do menu de mundos tem cards para os Mundos 1 a 4, já com os temas definidos acima. O Mundo 5 ainda não tem card no carrossel: ele é carregado e registrado em `window.MUNDOS[5]`, e hoje só é alcançado por URL direta (`fase1.html?mundo=5&fase=1`) ou pelo painel dev. A arte do Mundo 5 é provisória — reaproveita o cenário do Mundo 3 (Praia) e um asset dele como adversário, conforme marcado em `js/mundos/mundo5.js`.

---

## 4. Conceito e fluxo do jogo

A criança encontra objetos misturados e deve organizá-los em seus respectivos grupos, principalmente com a mecânica de arrastar e soltar (mouse/toque). Exemplo:

🧸 🚗 ⚽ → Brinquedos

🍎 🍌 🍞 → Comidas

📚 ✏️ 📓 → Materiais escolares

Após a organização, as quantidades obtidas são utilizadas no desafio matemático.

### Fluxo completo

```text

Tela inicial

  ↓

Menu de mundos

  ↓

Seleção de fase (dentro do mundo escolhido)

  ↓

Organização dos objetos (arrastar e soltar; seleção por teclado parcial)

  ↓

Validação por categoria

  ↓

Contador da categoria +1 e atualização visual da cesta

  ↓

Objeto organizado é ocultado da área de arraste

  ↓

Todos os objetos organizados → feedback de conclusão

  ↓

Desafio matemático (soma das quantidades reais organizadas)

  ↓

Resposta entre alternativas embaralhadas

  ↓

Feedback de acerto ou erro

  ↓

Desbloqueio da próxima fase (ou do próximo mundo, ao concluir a última fase)

  ↓

Navegação: voltar ao menu ou seguir para a próxima fase

```

---

## 5. Estado atual do produto

Esta seção é uma fotografia do desenvolvimento real, refletindo o código atual do repositório.

### Mundos e navegação

- Tela inicial com acesso ao menu de mundos.

- Menu de mundos em formato de carrossel, com cards para os Mundos 1 a 4: o Mundo 1 (A Casa) começa disponível e os Mundos 2 (Parque), 3 (Praia) e 4 (Acampamento) aparecem bloqueados até serem desbloqueados pela progressão. O Mundo 5 não tem card no carrossel (ver seção 3).

- Modal de seleção de fases do mundo escolhido, com até 3 fases — o modal respeita o `totalFases` declarado pelo mundo.

- Progressão de fases: Fase 2 e Fase 3 ficam bloqueadas até a conclusão da fase anterior.

### Fases do Mundo 1

Todas as fases, de todos os mundos, usam o mesmo motor de jogo (`game.js`), com configurações próprias. No Mundo 1:

| Fase | Categorias | Total de objetos |

|---|---|---|

| Fase 1 | Brinquedos, Comidas | 5 (3 brinquedos + 2 comidas) |

| Fase 2 | Brinquedos, Comidas, Materiais | 9 (3 + 3 + 3) |

| Fase 3 | Brinquedos, Comidas, Materiais | 14 (2 brinquedos + 5 comidas + 7 materiais) |

Os Mundos 2, 3 e 4 seguem o mesmo formato, com 3 fases cada e suas próprias categorias e cotas de objetos (Mundo 2: Comidas, Animais e Brinquedos; Mundo 3: Bebidas, Comidas e Brinquedos; Mundo 4: Comidas e Mochila). O Mundo 5 tem uma única fase.

### Mecânica de organização

- Mecânica principal: arrastar e soltar via ponteiro (mouse/toque), com o objeto centralizado sob o cursor durante o arraste.

- Suporte a teclado é parcial: existe uma seleção assistida, em que Enter/Espaço sobre uma cesta posiciona nela o próximo objeto disponível. Não existe, atualmente, movimentação/arraste dos objetos pelo teclado — o teclado não é uma alternativa completa ao arrastar e soltar.

- Validação por categoria, com retorno do objeto à posição inicial em caso de erro.

- Feedback textual imediato de acerto e erro.

- Contador individual por categoria, atualizado em tempo real.

- Sprite da cesta muda conforme a quantidade de itens organizados.

- Objetos organizados corretamente são ocultados/removidos da área de arraste.

### Randomização

- Os objetos de cada fase são sorteados a partir de um catálogo de modelos por categoria, variando a cada execução.

- As alternativas do desafio matemático são embaralhadas a cada tentativa.

### Desafio matemático

- Baseado nas quantidades reais organizadas pela criança (não em valores fixos), com a operação declarada por cada fase: soma no Mundo 1, subtração no Mundo 2, multiplicação no Mundo 3 e divisão no Mundo 4.

- A fase do Mundo 5 declara, em vez disso, uma lista de cinco desafios de contas compostas (mais de um operador na mesma conta, com a precedência convencional) e um adversário: `math.js` mostra a área do adversário com um coração por conta a acertar.

- Alternativas de resposta geradas dinamicamente (resposta correta + distratores).

- Verificação da resposta com feedback de acerto/erro.

- Ao final: botão para voltar ao menu de mundos e, quando ainda houver próxima fase, botão para avançar diretamente a ela.

### Persistência e desbloqueio de progresso

- Progresso salvo em `localStorage` (fases concluídas, fase máxima liberada, mundos desbloqueados).

- Conclusão de uma fase libera a próxima fase do mesmo mundo; concluir a última fase de um mundo libera o mundo seguinte.

- Persistência limitada ao navegador local — ainda não há integração com backend externo.

### Responsividade

- Regras de layout responsivo já implementadas para o menu e para a tela de fase, cobrindo diferentes larguras de tela (incluindo dispositivos móveis). Ajustes finos e testes em mais dispositivos seguem em andamento.

### Ainda não implementado

- Configurações de acessibilidade (contraste, tamanho de fonte, etc.). A trilha sonora contínua entre menu e fases, com botão de ligar/desligar, já está implementada (`js/audio.js`).

- Seleção de avatar/apelido (interface exibe um avatar/nome fixo).

- Card do Mundo 5 no carrossel do menu e arte definitiva dessa fase.

- Pontuação ou sistema de conquistas.

- Integração com o Cruzeiro HUB via iframe.

---

## 6. Arquitetura e estrutura do projeto

O projeto utiliza uma arquitetura simples baseada em HTML, CSS e JavaScript, sem frameworks.

```text

Arruma-A-Bagunca/

│

├── index.html          → tela inicial (jogar, créditos), menu de mundos/fases e tela-base que mantém a trilha durante as fases
├── fase1.html          → tela de jogo genérica (organização + desafio matemático)
├── global.css          → estilos globais
├── style-menu.css      → estilos do menu e modais (fases e créditos)
├── style-fase1.css     → estilos da tela de fase
├── README.md
├── AGENTS.md
│
├── js/
│   ├── main.js         → ponto de entrada (bootstrap) da fase: lê parâmetros da URL
│   │                     (?mundo=X&fase=Y), resolve o mundo/fase via window.MUNDOS e
│   │                     chama startGame(config)
│   ├── game.js         → mecânica de organização dos objetos, motor compartilhado por
│   │                     todas as fases via startGame()
│   ├── math.js         → motor do desafio matemático desacoplado; consome window.OPERACOES
│   ├── operacoes.js    → catálogo e regras das operações matemáticas (Soma, Subtração,
│   │                     Multiplicação, Divisão e contas compostas)
│   ├── progresso.js    → serviço de persistência de progresso (localStorage) multi-mundo e multi-fase;
│   ├── audio.js        → trilha sonora contínua, mantida pela tela-base durante as transições de fases;
│   ├── menu.js         → navegação do menu, carrossel de mundos e modais de fases e créditos
│   ├── dev.js          → ferramenta de desenvolvimento e testes (ativado por ?dev=true)
│   │
│   └── mundos/         → arquivos declarativos de configuração dos mundos (window.MUNDOS)
│       ├── mundo1.js   → Mundo 1: A Casa (Soma)
│       ├── mundo2.js   → Mundo 2: Parque (Subtração)
│       ├── mundo3.js   → Mundo 3: Praia (Multiplicação)
│       ├── mundo4.js   → Mundo 4: Acampamento (Divisão)
│       └── mundo5.js   → Mundo 5: Desafio Final (contas compostas, fase bônus)
│
└── assets/
    ├── audio/
    └── images/
        ├── tela_inicial/
        ├── tela_fase1/
        │   └── sprites_cestas/
        ├── mundo_1/            → botões de fase do modal de seleção
        ├── mundo_2/            → cenários, objetos e sprites_cestas_2 do Mundo 2
        ├── mundo_3/            → cenários, objetos e sprites_cestas_3 do Mundo 3
        ├── mundo_4/            → cenários, objetos e sprites_cestas_4 do Mundo 4
        └── nova_tela_menu de_fases/ → menu de mundos (carrossel, progresso)
```

Essa organização reflete o estado atual do projeto e pode evoluir conforme a arquitetura for definida.

### Princípio arquitetural

A equipe prioriza:

**simplicidade > sofisticação**

Não devem ser introduzidas abstrações, frameworks ou camadas adicionais sem necessidade técnica clara.

---

## 7. Tecnologias

Tecnologias utilizadas ou previstas:

- HTML5;

- CSS3;

- JavaScript ES6+;

- Git;

- GitHub;

- Vercel (deploy).

A implementação atual utiliza **JavaScript Vanilla**, sem build tooling, gerenciador de pacotes ou dependências externas no repositório.

O uso de tecnologias adicionais deve ser justificado pela necessidade do projeto.

---

## 8. UX, acessibilidade e LGPD

### Diretrizes gerais

O jogo deve ser adequado para crianças de 7 a 10 anos. Priorizar:

- interface simples, botões grandes, elementos visuais claros e pouco texto;

- instruções objetivas e feedback imediato;

- alto contraste e fontes legíveis;

- cores não devem ser o único meio de identificação;

- suporte a teclado e a dispositivos móveis;

- prevenção de frustração — erros tratados como oportunidade de aprendizado, nunca punição.

A acessibilidade deve ser considerada durante o desenvolvimento, e não somente como uma etapa final.

### O que já está implementado

- Feedback imediato de acerto/erro na organização e no desafio matemático;

- objeto retorna à posição inicial em caso de erro (sem penalidade);

- contador de categoria com número e ícone (não depende só de cor);

- seleção assistida por teclado nas cestas;

- layout responsivo para diferentes tamanhos de tela.

### O que ainda é diretriz/requisito em aberto

- Suporte completo a teclado (incluir arrastar objetos, não só selecionar cesta);

- controles adicionais de áudio (além da trilha de fundo já implementada);

- configurações de acessibilidade (contraste, tamanho de fonte, etc.);

- revisão e testes mais amplos de responsividade em dispositivos móveis reais.

### LGPD

O jogo não deve coletar dados pessoais reais de crianças sem necessidade. Evitar nome completo, documentos, e-mail, fotos, localização ou outras informações pessoais desnecessárias.

Quando for necessário identificar o jogador, utilizar mecanismos genéricos, como avatar, apelido lúdico ou código/token. Atualmente, o progresso é salvo localmente (`localStorage`) e não contém nenhum dado pessoal.

---

## 9. Processo de desenvolvimento

O projeto utiliza Git e GitHub para controle de versão, com deploy atual via Vercel.

As tarefas do projeto são classificadas como Correção, Melhoria, Feature, UX/UI ou Arquitetura.

Regras detalhadas de fluxo de trabalho, revisão e comportamento esperado de agentes/IA ao alterar o código estão documentadas em `AGENTS.md` e não são repetidas aqui.

---

## 10. Pendências e próximos objetivos

Pontos identificados atualmente que ainda merecem atenção:

- revisar suporte de teclado para arrastar objetos (hoje só a seleção por cesta é assistida);

- ampliar testes de responsividade em dispositivos móveis reais;

- implementar configurações de acessibilidade e seleção de avatar/apelido;

- definir a arte e o cenário definitivos do Mundo 5, hoje reaproveitados do Mundo 3;

- dar acesso ao Mundo 5 pela UI (hoje não há card dele no carrossel do menu).

As próximas prioridades serão definidas pela equipe considerando requisitos da faculdade, impacto no produto, UX/UI, acessibilidade, qualidade técnica e capacidade da equipe. Novas funcionalidades não devem ser implementadas apenas porque foram previstas para o futuro — cada incremento deve ser avaliado antes do desenvolvimento.
