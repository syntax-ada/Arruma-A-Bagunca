**Status do documento:** contexto atual do projeto. Algumas decisões ainda estão em discussão e podem ser alteradas pela equipe.

**Importante:** este documento representa o estado atual das decisões da equipe. Algumas decisões ainda estão em discussão e podem ser alteradas. Não trate hipóteses futuras como funcionalidades já implementadas.

**Contexto do projeto**

Estamos desenvolvendo, para a disciplina **Análise e Projeto de Sistemas II**, um jogo educativo digital chamado provisoriamente **“Arruma a Bagunça”**.

O projeto é destinado a crianças de **7 a 10 anos**, aproximadamente do 2º ao 5º ano, da rede pública municipal de São Paulo.

O objetivo geral é utilizar uma experiência de jogo para apoiar o aprendizado de Matemática de forma **lúdica, visual, interativa e acessível**, evitando transformar o jogo simplesmente em uma lista de exercícios.

O projeto deverá ser integrado posteriormente ao **Cruzeiro HUB por iframe**.

---

## Conceito do jogo

A criança encontra diversos objetos misturados e precisa organizá-los em seus respectivos grupos utilizando principalmente **clique, arrastar e soltar**.

Exemplo:

🧸 🚗 ⚽ → Brinquedos  
🍎 🍌 🍞 → Comidas  
📚 ✏️ 📓 → Materiais escolares

Depois que a criança organiza os objetos, o jogo utiliza as quantidades dos grupos formados para apresentar **desafios matemáticos relacionados à situação**.

Fluxo principal:

**Objeto → arrastar → área correta → feedback → organização concluída → desafio matemático → resposta → feedback**

---

## BNCC atualmente considerada

A habilidade/conjunto de habilidades atualmente considerado pela equipe é:

**EF02MA06 / EF03MA06 — operações e resolução de problemas com números naturais em situações do cotidiano.**

**Importante:** não invente outras habilidades da BNCC nem altere essa definição sem que a equipe solicite.

A equipe ainda poderá definir uma segunda habilidade posteriormente.

---

## Estrutura prevista do jogo

O projeto completo deverá possuir:

- menu inicial;
- instruções com suporte a áudio;
- configurações de acessibilidade;
- seleção de avatar/apelido;
- 4 fases progressivas;
- 1 fase bônus;
- persistência básica de progresso;
- fases concluídas;
- pontuação/conquistas;
- mecânicas adequadas para crianças;
- suporte a teclado e dispositivos móveis;
- integração posterior com o Cruzeiro HUB via iframe.

**Porém, neste momento estamos desenvolvendo apenas o MVP da Sprint 01.**

---

## MVP atual

O MVP precisa demonstrar:

1. **Menu inicial funcional**
2. Entrada na primeira fase
3. Objetos disponíveis para organização
4. Áreas/categorias de destino
5. Mecânica de arrastar e soltar
6. Verificação de acerto/erro
7. Feedback visual
8. Conclusão da organização
9. Apresentação de um desafio matemático
10. Seleção de resposta
11. Verificação da resposta
12. Feedback final

Não é necessário implementar agora as quatro fases, fase bônus, banco de dados completo, sistema completo de conquistas ou funcionalidades avançadas.

**Prioridade absoluta: fazer o núcleo do MVP funcionar.**

---

## Público e UX

O público são crianças de 7 a 10 anos.

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
- interação simples;
- prevenção de frustração;
- erro como oportunidade de aprendizado, não como punição agressiva.

Não utilizar:

- violência;
- armas;
- linguagem ofensiva;
- punições severas;
- coleta desnecessária de dados pessoais.

---

## Tecnologia

A stack prevista permite:

- HTML5;
- CSS3;
- JavaScript ES6+;
- Node.js;
- Vanilla JavaScript ou frameworks/bibliotecas permitidos pelo projeto.

Para o MVP, **preferimos HTML + CSS + JavaScript Vanilla**, salvo motivo técnico claro para utilizar outra tecnologia.

Não criar arquitetura complexa sem necessidade.

A equipe possui pouca experiência em desenvolvimento e duas pessoas estão tendo contato com programação pela primeira vez.

Portanto:

**simplicidade > sofisticação.**

---

## Regras para ajudar no desenvolvimento

1. Não criar funcionalidades que não foram solicitadas.
2. Não transformar o MVP em um sistema complexo.
3. Explicar o código antes ou junto da implementação.
4. Evitar frameworks desnecessários.
5. Reutilizar componentes e funções.
6. Priorizar código simples e legível.
7. Não assumir que a equipe conhece conceitos avançados.
8. Se houver mais de uma solução, apresentar primeiro a mais simples.
9. Se uma decisão puder afetar o restante do projeto, avisar antes de implementá-la.
10. Não inventar requisitos da faculdade.

---

## Arquitetura inicial desejada

Queremos manter uma estrutura simples e organizada, separando as principais responsabilidades do jogo para facilitar o desenvolvimento simultâneo da equipe.

```text
Arruma-A-Bagunca/
├── index.html
├── style.css
│
├── js/
│   ├── main.js
│   ├── menu.js
│   ├── game.js
│   └── math.js
│
├── assets/
│   ├── images/
│   └── audio/
│
├── docs/
│
├── README.md
```

> **A estrutura acima é uma sugestão inicial, não uma exigência.**

## Responsabilidades de Desenvolvimento

### Pessoa 1 — Estrutura e Menu

Principais arquivos:

- `index.html`
- `style.css`
- `js/menu.js`

Responsável por:

- estrutura das telas;
- menu inicial;
- botão "Jogar";
- navegação para a primeira fase;
- estrutura visual básica;
- elementos de interface.

Pode utilizar:

- `assets/images/` para elementos visuais do menu;
- `assets/audio/` para instruções ou áudio do menu, quando necessário.

---

### Pessoa 2 — Mecânica Principal

Principal arquivo:

- `js/game.js`

Responsável por:

- objetos da fase;
- categorias;
- mecânica de arrastar e soltar;
- identificação do destino correto;
- feedback de acerto/erro;
- conclusão da etapa de organização.

Pode utilizar:

- `assets/images/` para objetos e elementos visuais da fase;
- `assets/audio/` para feedbacks relacionados à organização.

---

### Pessoa 3 — Desafio Matemático

Principal arquivo:

- `js/math.js`

Responsável por:

- apresentação da pergunta;
- alternativas de resposta;
- verificação da resposta;
- feedback de acerto/erro;
- conclusão do desafio matemático.

Pode utilizar:

- `assets/images/` para elementos visuais das perguntas;
- `assets/audio/` para instruções e feedbacks matemáticos.

---

### Integração

O `js/main.js` será utilizado para a inicialização e integração das principais partes do jogo.

As alterações que afetarem diretamente outra responsabilidade devem ser comunicadas ao integrante responsável antes de serem realizadas.

---

## Forma de trabalhar

Somos uma equipe iniciante.

Quando eu pedir código:

- explique o que ele faz;
- explique onde colocar;
- explique como testar;
- explique erros comuns;
- não entregue uma arquitetura gigante;
- não esconda decisões importantes.

Se eu estiver fazendo algo desnecessariamente complexo, questione.

Se minha ideia estiver tecnicamente ruim, explique por quê e proponha uma alternativa mais simples.

**Não assuma que uma funcionalidade existe só porque aparece no planejamento futuro.**

Diferencie sempre:

- requisito da faculdade;
- decisão atual da equipe;
- recomendação técnica sua.