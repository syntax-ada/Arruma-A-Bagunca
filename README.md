# Arruma a Bagunça

Jogo educativo digital desenvolvido para a disciplina **Análise e Projeto de Sistemas II**, com foco no ensino de Matemática de forma lúdica, visual, interativa e acessível.

O jogo é destinado a crianças de **7 a 10 anos**, aproximadamente do 2º ao 5º ano, da rede pública municipal de São Paulo.

A integração com o **Cruzeiro HUB via iframe** faz parte do projeto e será realizada posteriormente.

---

## 1. Sobre o projeto

O projeto utiliza uma experiência de jogo para apoiar o aprendizado de Matemática por meio de situações contextualizadas.

A criança organiza objetos em categorias e, em seguida, utiliza os resultados dessa organização para resolver um desafio matemático relacionado à atividade realizada.

A proposta é evitar que o jogo funcione apenas como uma lista de exercícios, utilizando interação, feedback e elementos visuais para apoiar o aprendizado.

O projeto está em desenvolvimento contínuo: o Mundo 1 já possui três fases jogáveis, e a evolução do produto (novos mundos, acessibilidade, UX/UI e demais requisitos) segue em andamento.

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

- 4 mundos principais com fases progressivas, mais 1 mundo bônus; *(Mundo 1 em desenvolvimento — ver seção 4)*

- persistência básica de progresso; *(implementado para o Mundo 1)*

- registro de fases concluídas; *(implementado para o Mundo 1)*

- pontuação/conquistas; *(não implementado)*

- mecânicas adequadas para crianças; *(em evolução contínua)*

- suporte a teclado; *(parcial — ver seção 6)*

- suporte a dispositivos móveis; *(parcial — ver seção 6)*

- integração com o Cruzeiro HUB via iframe. *(não implementado)*

> [Requisito oficial] A existência de um mundo/fase bônus é obrigatória, conforme os requisitos da faculdade.

[Decisão da equipe] A estrutura atual é de 4 mundos principais + 1 mundo bônus. O mundo bônus será voltado para todas as contas/conteúdos matemáticos trabalhados ao longo do jogo. O número exato de fases por mundo principal e os temas ainda não definidos seguem conforme o Plano de desenvolvimento (seção 3) evolui — não presuma quantidades ou temas além do que está documentado ali.

---

## 3. Plano de desenvolvimento

[Decisão da equipe] A estrutura definida é de **4 mundos principais + 1 mundo bônus** (este último obrigatório, conforme requisito da faculdade — ver seção 2). Só é preenchido abaixo o que já está definido no projeto — o restante permanece em aberto até decisão da equipe.

| Mundo | Tema | Fases | Estado |

|---|---|---|---|

| Mundo 1 | A Casa | Fase 1, Fase 2, Fase 3 | Em desenvolvimento |

| Mundo 2 | Ainda não definido | Ainda não definidas | Planejado |

| Mundo 3 | Ainda não definido | Ainda não definidas | Planejado |

| Mundo 4 | Ainda não definido | Ainda não definidas | Planejado |

| Mundo bônus | Ainda não definido | Todas as contas/conteúdos matemáticos trabalhados no jogo | Planejado |

A interface atual já exibe, no menu de seleção de mundos, nomes provisórios como "Escola" e "Petshop" para os mundos ainda bloqueados. Esses nomes são elementos provisórios da implementação visual e **não** representam decisões definitivas de tema da equipe.

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

Seleção de fase (dentro do Mundo 1)

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

### Mundo 1 e navegação

- Tela inicial com acesso ao menu de mundos.

- Menu de mundos em formato de carrossel: Mundo 1 (A Casa) disponível; Mundos 2 e 3 exibidos como bloqueados, atualmente com nomes provisórios ("Escola" e "Petshop") na interface, ainda não confirmados como tema definitivo pela equipe (ver seção 3).

- Modal de seleção de fases dentro do Mundo 1, com Fases 1, 2 e 3.

- Progressão de fases: Fase 2 e Fase 3 ficam bloqueadas até a conclusão da fase anterior.

### Fases 1, 2 e 3

As três fases usam o mesmo motor de jogo (`game.js`), com configurações próprias:

| Fase | Categorias | Total de objetos |

|---|---|---|

| Fase 1 | Brinquedos, Comidas | 5 (3 brinquedos + 2 comidas) |

| Fase 2 | Brinquedos, Comidas, Materiais | 9 (3 + 3 + 3) |

| Fase 3 | Brinquedos, Comidas, Materiais | 14 (2 brinquedos + 5 comidas + 7 materiais) |

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

- Baseado na soma real das quantidades organizadas pela criança (não em valores fixos).

- Alternativas de resposta geradas dinamicamente (resposta correta + distratores).

- Verificação da resposta com feedback de acerto/erro.

- Ao final: botão para voltar ao menu de mundos e, quando ainda houver próxima fase, botão para avançar diretamente a ela.

### Persistência e desbloqueio de progresso

- Progresso salvo em `localStorage` (fases concluídas, fase máxima liberada, mundos desbloqueados).

- Conclusão de uma fase libera a próxima fase do Mundo 1; conclusão da Fase 3 libera o Mundo 2.

- Persistência limitada ao navegador local — ainda não há integração com backend externo.

### Responsividade

- Regras de layout responsivo já implementadas para o menu e para a tela de fase, cobrindo diferentes larguras de tela (incluindo dispositivos móveis). Ajustes finos e testes em mais dispositivos seguem em andamento.

### Ainda não implementado

- Áudio e configurações de acessibilidade (botões existem na interface, sem funcionalidade associada).

- Seleção de avatar/apelido (interface exibe um avatar/nome fixo).

- Pontuação ou sistema de conquistas.

- Integração com o Cruzeiro HUB via iframe.

---

## 6. Arquitetura e estrutura do projeto

O projeto utiliza uma arquitetura simples baseada em HTML, CSS e JavaScript, sem frameworks.

```text

Arruma-A-Bagunca/

│

├── index.html          → tela inicial e menu de mundos/fases

├── fase1.html           → tela de organização + tela de desafio matemático

├── global.css           → estilos globais

├── style-menu.css       → estilos do menu

├── style-fase1.css      → estilos da tela de fase

├── README.md

├── AGENTS.md

│

├── js/

│   ├── menu.js           → navegação do menu, mundos e fases

│   ├── game.js           → mecânica de organização dos objetos, compartilhada

│   │                        pelas Fases 1, 2 e 3 via CONFIG_FASE_1/2/3

│   ├── math.js            → desafio matemático

│   ├── progresso.js       → serviço de persistência de progresso (localStorage);

│   │                        usado por menu.js e math.js para desbloquear fases/mundos

│   └── main.js            → responsabilidade ainda não definida

│

└── assets/

    ├── audio/

    └── images/

        ├── tela_inicial/

        ├── tela_fase1/

        │   └── sprites_cestas/

        ├── mundo_1/                     → botões de fase do modal de seleção

        └── nova_tela_menu de_fases/     → menu de mundos (carrossel, progresso)

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

- suporte a áudio;

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

- avaliar o papel definitivo do `main.js`;

- revisar suporte de teclado para arrastar objetos (hoje só a seleção por cesta é assistida);

- ampliar testes de responsividade em dispositivos móveis reais;

- implementar áudio, configurações de acessibilidade e seleção de avatar/apelido;

- definir tema e fases dos Mundos 2, 3 e 4, conforme o Plano de desenvolvimento evoluir.

As próximas prioridades serão definidas pela equipe considerando requisitos da faculdade, impacto no produto, UX/UI, acessibilidade, qualidade técnica e capacidade da equipe. Novas funcionalidades não devem ser implementadas apenas porque foram previstas para o futuro — cada incremento deve ser avaliado antes do desenvolvimento.