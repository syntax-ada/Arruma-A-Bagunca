# Arruma a Bagunça

Jogo educativo digital desenvolvido para a disciplina **Análise e Projeto de Sistemas II**, com foco no ensino de Matemática de forma lúdica, visual, interativa e acessível.

O jogo é destinado a crianças de **7 a 10 anos**, aproximadamente do 2º ao 5º ano, da rede pública municipal de São Paulo.

A integração com o **Cruzeiro HUB via iframe** faz parte do projeto e será realizada posteriormente.

---

## 1. Sobre o projeto

O projeto utiliza uma experiência de jogo para apoiar o aprendizado de Matemática por meio de situações contextualizadas.

A criança organiza objetos em categorias e, posteriormente, utiliza os resultados dessa organização para resolver um desafio matemático relacionado à atividade realizada.

A proposta é evitar que o jogo funcione apenas como uma lista de exercícios, utilizando interação, feedback e elementos visuais para apoiar o aprendizado.

---

## 2. Conceito do jogo

A criança encontra objetos misturados e deve organizá-los em seus respectivos grupos utilizando principalmente a mecânica de arrastar e soltar.

Exemplo:

🧸 🚗 ⚽ → Brinquedos

🍎 🍌 🍞 → Comidas

📚 ✏️ 📓 → Materiais escolares

Após a organização, as quantidades obtidas são utilizadas no desafio matemático.

### Fluxo atual

**Organização → contagem → conclusão → desafio matemático → resposta → feedback**

---

## 3. Público-alvo

- Crianças de 7 a 10 anos;
- aproximadamente do 2º ao 5º ano;
- estudantes da rede pública municipal de São Paulo.

A interface deve considerar crianças alfabetizadas e em processo de alfabetização.

---

## 4. Estado atual

### MVP da Sprint 01 — Fase 1

**Concluído.**

A primeira versão funcional possui:

- menu inicial;
- entrada na Fase 1;
- 9 objetos;
- 3 categorias;
- 3 destinos;
- mecânica de arrastar e soltar;
- validação por categoria;
- feedback de acerto e erro;
- retorno do objeto em caso de erro;
- contador individual por categoria;
- remoção visual dos objetos corretamente organizados;
- conclusão da organização;
- transição para o desafio matemático;
- desafio matemático baseado nas quantidades reais organizadas;
- alternativas de resposta;
- verificação da resposta;
- feedback matemático;
- conclusão do desafio.

### Estado pós-MVP

O MVP da Sprint 01 foi concluído.

O projeto encontra-se agora em etapa de evolução do produto, envolvendo melhorias técnicas, UX/UI, acessibilidade, novas fases, arquitetura e demais requisitos ainda não implementados.

---

## 5. Fluxo atual da Fase 1

```text
Menu
  ↓
Fase 1
  ↓
Organização dos objetos
  ↓
Validação da categoria
  ↓
Contador da categoria +1
  ↓
Objeto ocultado visualmente
  ↓
Todos os objetos organizados
  ↓
Feedback de conclusão
  ↓
Tela matemática
  ↓
Desafio baseado nas quantidades reais
  ↓
Resposta
  ↓
Feedback
  ↓
Conclusão
```

---

## 6. BNCC

A habilidade atualmente considerada para Matemática é:

**EF02MA06 / EF03MA06 — operações e resolução de problemas com números naturais em situações do cotidiano.**

A atividade matemática deve estar relacionada à ação realizada pela criança durante o jogo.

A equipe ainda deverá definir e documentar as demais habilidades da BNCC que serão trabalhadas no produto, conforme o escopo das fases.

> A definição das habilidades da BNCC deve seguir os materiais oficiais fornecidos pela faculdade. Não devem ser criadas ou alteradas habilidades sem validação da equipe.

---

## 7. Requisitos previstos para o produto completo

O projeto completo prevê:

- menu inicial;
- instruções com suporte a áudio;
- configurações de acessibilidade;
- seleção de avatar/apelido;
- 4 fases progressivas;
- 1 fase bônus;
- persistência básica de progresso;
- registro de fases concluídas;
- pontuação/conquistas;
- mecânicas adequadas para crianças;
- suporte a teclado;
- suporte a dispositivos móveis;
- integração com o Cruzeiro HUB via iframe.

Nem todos esses requisitos estão implementados atualmente.

---

## 8. Arquitetura atual

O projeto utiliza uma arquitetura simples baseada em HTML, CSS e JavaScript.

A Fase 1 possui duas telas/estados dentro de `fase1.html`:

```text
fase1.html
│
├── Tela de organização
│      ↓
│   js/game.js
│
└── Tela matemática
       ↓
    js/math.js
```

O menu utiliza:

```text
index.html
    ↓
js/menu.js
```

O arquivo `main.js` existe no projeto, mas sua responsabilidade de integração ainda não está consolidada e poderá ser redefinida conforme a arquitetura evoluir.

### Princípio arquitetural

A equipe prioriza:

**simplicidade > sofisticação**

Não devem ser introduzidas abstrações, frameworks ou camadas adicionais sem necessidade técnica clara.

---

## 9. Estrutura do projeto

```text
Arruma-A-Bagunca/
│
├── index.html
├── fase1.html
├── global.css
├── style-menu.css
├── style-fase1.css
├── README.md
├── AGENTS.md
│
├── js/
│   ├── main.js
│   ├── menu.js
│   ├── game.js
│   └── math.js
│
└── assets/
    ├── audio/
    └── images/
        ├── tela_inicial/
        ├── tela_menu/
        └── tela_fase1/
            └── sprites_cestas/
```

### Principais responsabilidades atuais

- `index.html` — menu inicial;
- `fase1.html` — interface da Fase 1;
- `global.css` — estilos globais;
- `style-menu.css` — estilos do menu;
- `style-fase1.css` — estilos da Fase 1;
- `menu.js` — comportamento e navegação do menu;
- `game.js` — mecânica de organização dos objetos;
- `math.js` — desafio matemático;
- `main.js` — inicialização/integração, ainda em definição.

Essas responsabilidades representam a organização atual do projeto e podem evoluir conforme a arquitetura for definida.

---

## 10. Tecnologias

Tecnologias utilizadas ou previstas:

- HTML5;
- CSS3;
- JavaScript ES6+;
- Node.js;
- Git;
- GitHub;
- Vercel.

A implementação atual utiliza principalmente **JavaScript Vanilla**.

O uso de tecnologias adicionais deve ser justificado pela necessidade do projeto.

---

## 11. Acessibilidade e UX

O jogo deve ser adequado para crianças de 7 a 10 anos.

Priorizar:

- interface simples;
- botões grandes;
- elementos visuais claros;
- pouco texto;
- instruções objetivas;
- feedback imediato;
- suporte a áudio;
- alto contraste;
- fontes legíveis;
- cores não devem ser o único meio de identificação;
- suporte a teclado;
- suporte a dispositivos móveis;
- prevenção de frustração;
- erros tratados como oportunidade de aprendizado.

A acessibilidade deve ser considerada durante o desenvolvimento, e não somente como uma etapa final.

---

## 12. LGPD

O jogo não deve coletar dados pessoais reais de crianças sem necessidade.

Evitar:

- nome completo;
- documentos;
- e-mail;
- fotos;
- localização;
- outras informações pessoais desnecessárias.

Quando for necessário identificar o jogador, utilizar mecanismos genéricos, como avatar, apelido lúdico ou código/token.

---

## 13. Tipos de tarefa

As tarefas do projeto são classificadas como:

### Correção

Corrige um comportamento existente que está errado ou quebrado.

### Melhoria

Aprimora uma implementação existente ou reduz dívida técnica sem representar uma nova funcionalidade.

### Feature

Adiciona uma nova funcionalidade ao produto.

### UX/UI

Altera interface, experiência de uso, acessibilidade ou apresentação visual.

### Arquitetura

Altera responsabilidades, estrutura, comunicação ou organização técnica do sistema.

---

## 14. Desenvolvimento e Git

O projeto utiliza Git e GitHub para controle de versão.

O desenvolvimento deve evitar alterações simultâneas desnecessárias nos mesmos arquivos.

Antes de integrar alterações:

1. atualizar a branch;
2. verificar conflitos;
3. testar;
4. revisar as alterações;
5. realizar o commit;
6. enviar para o GitHub.

O deploy atual utiliza Vercel.

---

## 15. Pendências conhecidas

Entre os pontos identificados atualmente:

- corrigir o deslocamento do objeto em relação ao cursor durante o arraste;
- revisar suporte de teclado para múltiplos objetos;
- revisar responsividade e interação em dispositivos móveis;
- avaliar o papel definitivo do `main.js`;
- revisar código que deixou de ser necessário após mudanças na mecânica;
- continuar evolução da acessibilidade;
- implementar requisitos ainda não contemplados nas próximas fases.

Esses itens são pendências atuais e não devem ser tratados automaticamente como prioridade sem avaliação da equipe.

---

## 16. Próximos objetivos

Após a conclusão do MVP da Sprint 01, o foco passa a ser a evolução do produto.

As próximas prioridades serão definidas pela equipe considerando:

- requisitos da faculdade;
- impacto no produto;
- UX/UI;
- acessibilidade;
- qualidade técnica;
- prazo;
- dependências entre tarefas;
- capacidade da equipe.

Novas funcionalidades não devem ser implementadas apenas porque foram previstas para o futuro. Cada incremento deve ser avaliado antes do desenvolvimento.