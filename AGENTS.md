# AGENTS.md — Arruma a Bagunça

## 1. Sobre o projeto

O **Arruma a Bagunça** é um jogo educativo digital desenvolvido para a disciplina **Análise e Projeto de Sistemas II**.

O público-alvo são crianças de **7 a 10 anos**, aproximadamente do 2º ao 5º ano do Ensino Fundamental, da rede pública municipal de São Paulo.

O objetivo do jogo é apoiar o aprendizado de Matemática de forma **lúdica, visual, interativa e acessível**, evitando transformar a experiência em uma simples lista de exercícios.

O projeto será posteriormente integrado ao **Cruzeiro HUB por iframe**.

Para informações detalhadas sobre o estado atual do projeto, decisões da equipe, MVP e planejamento, consultar o `README.md`.

---

## 2. Regra de fonte de verdade

Diferenciar sempre:

* **Requisito da faculdade:** definido nos materiais oficiais fornecidos para o projeto.
* **Decisão da equipe:** decisão atualmente adotada pelo time.
* **Recomendação técnica:** sugestão feita durante o desenvolvimento.

Não apresentar uma recomendação técnica como requisito da faculdade.

Não inventar requisitos.

Quando houver conflito entre documentos ou decisões, sinalizar o conflito em vez de escolher arbitrariamente uma versão.

Não considerar funcionalidades planejadas como funcionalidades já implementadas.

---

## 3. Stack tecnológica

A stack prevista para o projeto é:

* HTML5
* CSS3
* JavaScript ES6+
* Node.js
* JavaScript Vanilla ou tecnologias front-end permitidas pelo projeto

Para soluções simples, preferir **HTML + CSS + JavaScript Vanilla**.

Frameworks, bibliotecas ou dependências externas não devem ser adicionados sem necessidade técnica clara.

---

## 4. Princípios de desenvolvimento

Priorizar:

1. Simplicidade.
2. Legibilidade.
3. Reutilização.
4. Pequenas alterações incrementais.
5. Separação de responsabilidades.
6. Acessibilidade.
7. Compatibilidade com dispositivos móveis.
8. Facilidade de teste e manutenção.

A equipe possui pouca experiência em desenvolvimento.

Portanto:

> **Simplicidade > sofisticação.**

Não criar arquitetura complexa apenas para antecipar necessidades futuras.

Quando uma solução futura puder ser considerada sem aumentar significativamente a complexidade atual, priorizar uma base reutilizável.

---

## 5. Fluxo de desenvolvimento

O desenvolvimento deve seguir este fluxo:

```text
Contextualizar
→ Definir tarefa
→ Planejar
→ Codificar
→ Entender
→ Testar
→ Corrigir
→ Validar
→ Git
```

Não pular diretamente para uma implementação quando a tarefa ainda não estiver suficientemente definida.

Para alterações relevantes:

1. entender o objetivo;
2. identificar os arquivos envolvidos;
3. planejar a solução;
4. avaliar impactos;
5. implementar;
6. explicar a alteração;
7. testar;
8. validar;
9. preparar o commit quando apropriado.

---

## 6. Estrutura do projeto

A estrutura inicial desejada é:

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
└── README.md
```

Essa estrutura é uma organização inicial e pode ser alterada quando houver justificativa técnica.

### Responsabilidades dos arquivos

`index.html`

* estrutura HTML das telas e elementos do jogo.

`style.css`

* estilos;
* layout;
* responsividade;
* apresentação visual.

`js/main.js`

* inicialização;
* integração entre as principais partes do jogo.

`js/menu.js`

* lógica do menu;
* navegação inicial;
* controles relacionados ao menu.

`js/game.js`

* mecânica principal do jogo;
* objetos;
* categorias;
* interação com objetos;
* validação dos destinos;
* feedback relacionado à organização;
* conclusão das etapas de organização.

`js/math.js`

* desafios matemáticos;
* perguntas;
* alternativas;
* seleção de respostas;
* verificação;
* feedback matemático.

---

## 7. Separação de responsabilidades

Respeitar a responsabilidade definida para cada arquivo.

Evitar modificar arquivos pertencentes a outra responsabilidade para resolver um problema local.

Quando uma alteração em outro arquivo for realmente necessária:

1. explicar por que ela é necessária;
2. informar o impacto;
3. alterar somente o necessário.

Não reestruturar o projeto inteiro para resolver uma pequena tarefa.

---

## 8. Reutilização

As funcionalidades devem ser desenvolvidas pensando na possibilidade de reutilização nas diferentes fases do jogo.

A reutilização deve acontecer sem criar abstrações desnecessariamente complexas.

Exemplo:

Uma mecânica de interação com objetos deve permitir que diferentes objetos, categorias e fases utilizem a mesma lógica quando isso for adequado.

Evitar criar código específico para um único elemento quando uma pequena estrutura reutilizável puder resolver o problema de forma simples.

---

## 9. UX infantil e acessibilidade

O público-alvo possui entre 7 e 10 anos.

Priorizar:

* botões grandes;
* elementos visuais claros;
* pouco texto;
* instruções objetivas;
* feedback imediato;
* alto contraste;
* fontes legíveis;
* identificação que não dependa exclusivamente de cores;
* interação simples;
* prevenção de frustração.

Considerar crianças em processo de alfabetização.

Sempre que possível, utilizar informações visuais e, quando previsto pelo projeto, suporte de áudio.

A interação deve considerar:

* mouse;
* toque em dispositivos móveis;
* teclado e alternativas acessíveis quando necessário.

---

## 10. Segurança e privacidade

O projeto deve respeitar as restrições de privacidade e LGPD definidas para o público infantil.

Não implementar coleta desnecessária de dados pessoais reais de crianças.

Não solicitar ou armazenar:

* nome completo;
* documentos;
* e-mail;
* fotos;
* localização;
* outras informações pessoais desnecessárias.

Não criar mecanismos de coleta de dados pessoais sem requisito explícito e validação da equipe.

---

## 11. Violência e tratamento de erros

O jogo possui abordagem de **violência zero**.

Não utilizar:

* armas;
* agressão;
* linguagem ofensiva;
* punições agressivas;
* punições severas;
* Game Over como consequência de erro pedagógico.

Erros devem gerar feedback claro e orientativo, tratando o erro como oportunidade de aprendizado.

---

## 12. Escopo

Não implementar funcionalidades que não tenham sido solicitadas ou aprovadas pela equipe.

Não assumir que uma funcionalidade futura deve ser implementada agora.

Antes de adicionar uma funcionalidade, verificar:

> **Isso faz parte da tarefa atual?**

Se não fizer, não implementar.

Não adicionar apenas por "boa prática" funcionalidades que aumentem o escopo sem necessidade.

---

## 13. Código

Preferir:

* funções pequenas;
* nomes descritivos;
* estruturas simples;
* JavaScript moderno e legível;
* comentários quando ajudarem no entendimento.

Evitar:

* abstrações prematuras;
* padrões de projeto desnecessários;
* funções excessivamente grandes;
* duplicação evitável;
* dependências desnecessárias;
* código difícil de entender para iniciantes.

O código deve ser compreensível por uma equipe com pouca experiência em programação.

---

## 14. Testes

Toda alteração funcional deve informar como pode ser testada.

Os testes devem verificar:

1. comportamento esperado;
2. comportamento incorreto;
3. interação com os elementos envolvidos;
4. possíveis erros comuns;
5. impactos em funcionalidades relacionadas.

Quando a funcionalidade envolver interação, considerar também diferentes formas de entrada quando aplicável, especialmente mouse, toque e teclado.

---

## 15. Explicação das alterações

Ao implementar uma mudança, explicar de forma simples:

* o que foi alterado;
* por que foi alterado;
* quais arquivos foram modificados;
* como a solução funciona;
* como testar;
* possíveis limitações;
* possíveis impactos em outras partes do projeto.

Não esconder decisões técnicas importantes.

Não assumir conhecimento avançado da equipe.

---

## 16. Git

O código deve ser versionado utilizando **GitHub**, conforme definido para o projeto.

Commits devem representar alterações compreensíveis e relacionadas a uma tarefa.

Evitar misturar várias funcionalidades não relacionadas em um único commit.

Antes de sugerir um commit, verificar se a alteração foi testada e validada.

---

## 17. Regra principal

Ao trabalhar neste projeto:

> **Implemente somente o necessário, de forma simples, compreensível, reutilizável e testável.**

Quando houver mais de uma solução tecnicamente adequada:

1. apresentar primeiro a mais simples;
2. explicar as diferenças;
3. considerar impacto nas próximas fases;
4. evitar complexidade desnecessária.

Não implementar funcionalidades, requisitos ou decisões que não estejam definidos no contexto atual do projeto.
