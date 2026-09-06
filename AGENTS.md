# AGENTS.md

## Objetivo

Este repositório contém o projeto "Arruma a Bagunça", desenvolvido para a disciplina
Análise e Projeto de Sistemas II.

Antes de qualquer alteração, considere o estado real do código e as decisões atuais
registradas no README.md.

## Regras gerais

- Não invente requisitos.
- Não trate recomendações como requisitos da faculdade.
- Diferencie:
  - requisito da faculdade;
  - decisão da equipe;
  - recomendação técnica.
- Se encontrar conflito entre documentos, não escolha arbitrariamente: sinalize.
- Não implemente funcionalidades fora do escopo solicitado.
- Não faça refatorações não relacionadas à tarefa.
- Prefira a solução mais simples que atenda ao objetivo.
- Evite arquitetura, abstrações, bibliotecas ou dependências desnecessárias.
- Considere que a equipe é iniciante.
- Preserve código existente que esteja funcionando, salvo necessidade justificada.
- Antes de alterar uma decisão que possa afetar outras partes do projeto, sinalize o impacto.

## Desenvolvimento

Stack preferencial:
- HTML5
- CSS3
- JavaScript ES6+
- Node.js quando necessário

Para o MVP, prefira JavaScript Vanilla.

Ao implementar:
1. entenda o código existente;
2. planeje a alteração;
3. altere somente o necessário;
4. teste;
5. verifique regressões.

Não crie sistemas complexos para resolver problemas simples.

## UX, acessibilidade e segurança

O jogo é destinado a crianças de 7 a 10 anos.

Priorize:
- interface simples;
- elementos visuais claros;
- botões adequados;
- feedback imediato;
- texto curto e legível;
- alto contraste;
- cores não devem ser o único meio de identificação;
- interação por mouse/toque e, quando aplicável, teclado.

Erros devem fornecer feedback orientativo, sem punição agressiva ou Game Over.

Não adicionar:
- violência;
- armas;
- linguagem ofensiva;
- coleta desnecessária de dados pessoais.

Não coletar dados pessoais reais de crianças.

## Git

- Não fazer commit automaticamente.
- Não fazer push automaticamente.
- Não reescrever ou remover trabalho de outros integrantes.
- Não alterar arquivos fora do escopo sem necessidade.
- Se uma alteração puder afetar arquivos compartilhados ou outra responsabilidade, avise antes.
- Antes de commit/push, a equipe deve revisar as alterações.

## Comunicação

Ao concluir uma tarefa:
- informe os arquivos alterados;
- informe brevemente o que mudou;
- informe os testes realizados;
- destaque problemas ou limitações encontrados.

Não é necessário explicar código linha por linha, a menos que seja solicitado.

## Regra principal

Simplicidade > sofisticação.

Não implemente mais do que foi solicitado.# AGENTS.md

## Contexto

Este repositório pertence ao projeto acadêmico **Arruma a Bagunça**, desenvolvido para a disciplina **Análise e Projeto de Sistemas II**.

É um jogo educativo para crianças de 7 a 10 anos.

O MVP da Fase 1 já está concluído. O projeto encontra-se em evolução pós-MVP.

---

## Fonte de verdade

Diferencie sempre:

1. **Requisito da faculdade** — vem do material oficial fornecido.
2. **Decisão da equipe** — escolha feita pelo projeto.
3. **Recomendação técnica** — sugestão do agente.

Nunca apresente uma recomendação como requisito.

Não invente requisitos.

Se houver conflito entre documentos, sinalize o conflito antes de escolher uma interpretação.

---

## Princípios

Priorize:

- simplicidade;
- código legível;
- escopo controlado;
- reutilização quando fizer sentido;
- acessibilidade;
- manutenção;
- soluções proporcionais ao tamanho do projeto.

Evite:

- overengineering;
- abstrações desnecessárias;
- frameworks ou dependências sem necessidade;
- refatorações não solicitadas;
- funcionalidades fora do escopo.

**Simplicidade > sofisticação.**

---

## Tipos de tarefa

Classifique as tarefas como:

- **Correção** — corrigir comportamento existente;
- **Melhoria** — aprimorar ou limpar algo existente;
- **Feature** — nova funcionalidade;
- **UX/UI** — interface, experiência ou acessibilidade;
- **Arquitetura** — estrutura, responsabilidades ou comunicação entre módulos.

---

## Execução

Quando uma tarefa for delegada a um agente:

**agente implementa → agente testa → nós testamos quando fizer sentido → commit.**

O agente deve:

- alterar somente o necessário;
- preservar funcionalidades existentes;
- evitar refatorações fora da tarefa;
- executar testes adequados;
- informar arquivos alterados;
- resumir o resultado de forma objetiva.

Não fazer commit automaticamente, salvo solicitação explícita.

---

## Testes

Sempre que aplicável, verificar:

- comportamento funcional;
- regressões;
- `node --check` para JavaScript;
- `git diff --check`;
- comportamento visual no navegador;
- interação por teclado/toque quando fizer parte da tarefa.

Testes automatizados do agente não substituem testes manuais quando o comportamento visual ou de interação for relevante.

---

## Git e desenvolvimento

- O projeto utiliza Git e GitHub.
- Antes de alterar arquivos, preserve o trabalho existente e verifique o estado do repositório quando necessário.
- Evite alterações simultâneas desnecessárias nos mesmos arquivos.
- Após uma implementação, execute os testes adequados antes de considerar a tarefa concluída.
- Não faça commit automaticamente, salvo solicitação explícita.
- Não sobrescreva ou descarte alterações existentes sem confirmação.
- O deploy do projeto utiliza Vercel.

---

## Arquitetura atual

Principais responsabilidades:

- `index.html` → menu;
- `fase1.html` → Fase 1;
- `menu.js` → menu/navegação;
- `game.js` → organização dos objetos;
- `math.js` → desafio matemático;
- `main.js` → responsabilidade ainda em definição.

Não alterar responsabilidades arquiteturais importantes sem discutir a mudança primeiro.

---

## Fase 1

A Fase 1 atualmente possui:

- 9 objetos;
- 3 categorias;
- 3 destinos;
- drag-and-drop;
- contadores;
- feedback;
- conclusão da organização;
- desafio matemático baseado nas quantidades reais.

A mecânica existente já foi validada.

Alterações nessa mecânica devem priorizar não quebrar o comportamento existente.

---

## UX e acessibilidade

O público é infantil.

Priorizar:

- interface simples;
- botões grandes;
- feedback claro;
- pouco texto;
- alto contraste;
- instruções acessíveis;
- suporte a teclado e toque;
- erro como oportunidade de aprendizado.

Não utilizar violência, armas, linguagem ofensiva ou punições agressivas.

---

## Dados e LGPD

Não criar coleta desnecessária de dados pessoais de crianças.

Não adicionar:

- nome real;
- e-mail;
- documentos;
- fotos;
- localização;
- outros dados pessoais desnecessários.

---

## Regra final

Se uma solução funcionar sem complexidade adicional, prefira-a.

Se uma decisão puder afetar outras partes do projeto, pare e apresente o impacto antes de implementar.

Se a solicitação estiver ambígua, não invente requisitos.

Se uma abordagem parecer tecnicamente ruim, explique o problema e proponha uma alternativa simples.