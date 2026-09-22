# AGENTS.md

## Objetivo

Este repositório contém o projeto "Arruma a Bagunça", jogo educativo desenvolvido
para a disciplina Análise e Projeto de Sistemas II, destinado a crianças de 7 a 10 anos.

Este documento define como um agente deve trabalhar neste projeto — não é
documentação de produto (isso vive no README.md).

---

## Fonte de contexto e fonte de verdade

Antes de qualquer alteração, considere sempre:

- o estado real do código;
- o README.md;
- as decisões registradas neste AGENTS.md.

Além disso, diferencie sempre:

1. **Requisito da faculdade** — vem do material oficial fornecido pela disciplina.
   Esse material não está neste repositório; não presuma seu conteúdo.
2. **Decisão da equipe** — escolha já feita pelo projeto (registrada no README/AGENTS.md).
3. **Recomendação técnica** — sugestão do próprio agente.

Regras:

- Nunca apresente uma recomendação como requisito.
- Nunca invente requisitos.
- Se houver conflito entre essas fontes (código, README, AGENTS.md), **sinalize
  o conflito** em vez de escolher uma interpretação arbitrariamente.

---

## Princípios

- Simplicidade > sofisticação.
- Escopo controlado: altere somente o necessário para a tarefa pedida.
- Reutilize código existente quando fizer sentido; não duplique lógica já pronta.
- Evite overengineering, abstrações, bibliotecas ou dependências desnecessárias.
- Considere que a equipe é iniciante — calibre explicações e soluções para esse nível.
- Preserve código existente que já funciona, salvo necessidade justificada.
- Não faça refatorações fora do escopo da tarefa.
- Não implemente mais do que foi solicitado.

---

## Tipos de tarefa

- **Correção** — corrige um comportamento existente que está errado ou quebrado.
- **Melhoria** — aprimora algo que já existe, sem ser uma funcionalidade nova.
- **Feature** — adiciona uma nova funcionalidade.
- **UX/UI** — altera interface, experiência de uso, acessibilidade ou apresentação visual.
- **Arquitetura** — altera responsabilidades, estrutura ou comunicação entre módulos.

Identifique o tipo de tarefa antes de implementar — isso ajuda a calibrar o quanto alterar.

---

## Fluxo de trabalho

Para qualquer tarefa:

1. Entender o código existente relevante.
2. Planejar a alteração.
3. Alterar somente o necessário.
4. Testar (ver seção **Testes**).
5. Verificar regressões em funcionalidades próximas.
6. Relatar o resultado (ver seção **Comunicação**).

Atenção especial a `game.js`: ele é compartilhado pelas três fases do jogo.
Quando uma alteração nesse arquivo puder afetar mais de uma fase, avalie o
impacto e sinalize antes de implementar.

---

## Git

**Agentes nunca executam `git commit` nem `git push`, em nenhuma circunstância,
mesmo que solicitado explicitamente durante a conversa.**

Commit e push são responsabilidade exclusiva de uma pessoa da equipe, feitos
manualmente após revisão. O agente pode consultar `git status` e `git diff`
para facilitar essa revisão, mas nunca confirma nem envia alterações.

Outras práticas:

- Verifique o estado do repositório antes de alterar arquivos.
- Evite alterações simultâneas desnecessárias nos mesmos arquivos.
- Não sobrescreva, descarte ou reescreva trabalho existente (próprio ou de
  outra pessoa da equipe) sem confirmação explícita.

---

## Arquitetura atual

Principais responsabilidades:

- `index.html` → menu inicial (jogar, créditos) e seleção de mundos/fases;
- `fase1.html` → tela de jogo genérica (organização de objetos + desafio matemático);
- `menu.js` → navegação do menu, carrossel de mundos e modais de fases e créditos;
- `main.js` → ponto de entrada (bootstrap) da fase: lê os parâmetros da URL (`?mundo=X&fase=Y`), resolve o mundo e a fase via `window.MUNDOS` e inicializa o motor com `startGame(config)`;
- `game.js` → mecânica de organização dos objetos, motor compartilhado por todos os mundos e fases orquestrado por `startGame()`;
- `math.js` → motor do desafio matemático desacoplado, resolvendo a conta via `window.OPERACOES` e disparando a progressão;
- `operacoes.js` → catálogo e regras das operações matemáticas (Soma, Subtração, Multiplicação e Divisão);
- `progresso.js` → serviço de persistência de progresso (`localStorage`) multi-mundo e multi-fase;
- `dev.js` → ferramenta de desenvolvimento e painel de testes (ativado por `?dev=true` ou `sessionStorage`);
- `js/mundos/` → arquivos declarativos de configuração de cada mundo (`mundo1.js` a `mundo4.js`), auto-registrados em `window.MUNDOS`.

Não altere responsabilidades arquiteturais importantes sem sinalizar o impacto antes.

---

## Estado atual dos mundos e fases

| Mundo | Tema | Operação | Fases | Acessível pela UI? |
|---|---|---|---|---|
| 1 | A Casa | Soma (`+`) | 3 fases (5, 9 e 14 objetos) | Sim (Fases 1, 2 e 3 acessíveis pela UI via modal e progressão) |
| 2 | Parque | Subtração (`−`) | 3 fases (Comidas, Animais, Brinquedos) | Sim (desbloqueado após concluir Mundo 1) |
| 3 | Praia | Multiplicação (`×`) | 3 fases (Bebidas, Comidas, Brinquedos) | Sim (desbloqueado após concluir Mundo 2) |
| 4 | Estrutura provisória | Divisão (`÷`) | 3 fases (Comidas, Bebidas) | Sim (desbloqueado após concluir Mundo 3) |

As Fases 1, 2 e 3 do Mundo 1 estão totalmente acessíveis pela UI (a Fase 1 liberada por padrão e as Fases 2 e 3 desbloqueadas progressivamente). Os Mundos 2, 3 e 4 estão implementados no engine com suas respectivas operações matemáticas e mecânicas completas.

Esta tabela reflete o estado no momento da última revisão deste documento —
se o código mudar, atualize-a como parte da tarefa que a alterou.

---

## UX, acessibilidade e LGPD

O jogo é destinado a crianças de 7 a 10 anos. Priorize:

- interface simples, botões grandes, pouco texto e legível;
- alto contraste;
- cores não devem ser o único meio de identificação (usar também ícone/texto);
- feedback imediato e claro;
- suporte a mouse/toque e, quando aplicável à tarefa, a teclado;
- responsividade para dispositivos móveis, quando aplicável à tarefa;
- erros como oportunidade de aprendizado — nunca punição agressiva ou Game Over.

Não adicionar violência, armas, linguagem ofensiva ou coleta desnecessária de dados pessoais.

Não coletar nem armazenar dados pessoais reais de crianças (nome completo,
e-mail, documentos, fotos, localização). Quando for necessário identificar o
jogador, usar mecanismos genéricos (avatar, apelido lúdico ou código/token).

---

## Testes

Sempre que aplicável, verificar:

- comportamento funcional da alteração;
- regressões em funcionalidades relacionadas;
- `node --check` para arquivos JavaScript alterados;
- `git diff --check` antes de finalizar;
- comportamento visual no navegador, quando relevante;
- interação por teclado, mouse/touch e responsividade, quando fizerem parte da tarefa.

Testes automatizados não substituem teste manual quando o comportamento visual
ou de interação for relevante para a tarefa.

---

## Comunicação

Ao concluir uma tarefa, informe:

- os arquivos alterados;
- o que mudou, de forma objetiva;
- os testes realizados;
- problemas ou limitações encontrados.

Não é necessário explicar o código linha por linha, a menos que seja solicitado.

---

## Regra final

Simplicidade > sofisticação. Não implemente mais do que foi solicitado.

Respeite o escopo da tarefa atual — pendências e melhorias futuras registradas
no README não são obrigações imediatas.

Não invente requisitos. Se uma decisão puder afetar outras partes do projeto,
pare e sinalize o impacto antes de implementar. Se a solicitação estiver
ambígua, pergunte em vez de presumir. Se uma abordagem parecer tecnicamente
ruim, explique o problema e proponha uma alternativa simples.

Agentes nunca fazem commit ou push, em nenhuma circunstância.
