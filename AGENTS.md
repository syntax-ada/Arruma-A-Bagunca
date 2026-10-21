# AGENTS.md

Regras permanentes para agentes de IA que trabalham no projeto "Arruma a Bagunça" (jogo educativo para crianças de 7 a 10 anos, disciplina Análise e Projeto de Sistemas II).

Este arquivo define **como trabalhar**. O produto, a arquitetura, as decisões da equipe e o estado do projeto estão no [`README.md`](README.md). **Nada sobre o estado do projeto deve ser registrado aqui.**

---

## 1. Fontes de verdade

Antes de qualquer alteração, consulte o código real, o `README.md` e este arquivo. Confira o código antes de afirmar algo: não presuma nomes de funções, parâmetros nem formatos de resposta.

Diferencie sempre:

1. **Requisito da faculdade:** vem do material oficial da disciplina, que não está neste repositório. Não presuma seu conteúdo.
2. **Decisão da equipe:** escolha já registrada no `README.md`.
3. **Recomendação técnica:** sugestão do próprio agente.

- Nunca apresente uma recomendação como requisito. Nunca invente requisitos, funcionalidades ou decisões.
- Se código, README e este arquivo se contradisserem, **sinalize o conflito** em vez de escolher uma interpretação.
- Não trate como feito o que é só planejado. Se algo não puder ser verificado, diga que não foi verificado.

---

## 2. Princípios e fluxo de trabalho

- Simplicidade > sofisticação. Escopo controlado: altere somente o necessário e não implemente mais do que foi pedido.
- Reutilize o que já existe; não duplique lógica, não refatore fora do escopo e preserve o que já funciona.
- Sem dependências, bibliotecas, frameworks ou camadas novas sem necessidade clara e aprovação.
- A equipe é iniciante: calibre explicações e soluções. Se o pedido for ambíguo, pergunte; se uma abordagem for tecnicamente ruim, explique e proponha uma alternativa simples.

Tipos de tarefa (identifique antes de implementar): **Correção**, **Melhoria**, **Feature**, **UX/UI**, **Arquitetura**.

Fluxo: entender o código relevante → planejar → alterar só o necessário → testar → verificar regressões próximas → relatar.

---

## 3. Git

Estas são **regras operacionais do projeto**, não exigências da faculdade.

- **Agentes nunca executam `git commit` nem `git push`, em nenhuma circunstância, mesmo que solicitado.** Commit e push são feitos por uma pessoa da equipe, após revisão.
- Também não alterar o índice (`git add`, `git reset`, `git rm`), o histórico nem descartar trabalho (`checkout`, `restore`, `stash`, `clean`).
- Pode consultar `git status`, `git diff` e `git log` para apoiar a revisão. Verifique o estado do repositório antes de alterar arquivos.
- Não sobrescreva nem descarte trabalho existente, próprio ou de outra pessoa, sem confirmação explícita.

---

## Arquitetura atual

Principais responsabilidades:

- `index.html` → menu inicial (jogar, créditos) e seleção de mundos/fases;
- `fase1.html` → tela de jogo genérica (organização de objetos + desafio matemático);
- `menu.js` → navegação do menu, carrossel de mundos e modais de fases e créditos;
- `main.js` → ponto de entrada (bootstrap) da fase: lê os parâmetros da URL (`?mundo=X&fase=Y`), resolve o mundo e a fase via `window.MUNDOS` e inicializa o motor com `startGame(config)`;
- `game.js` → mecânica de organização dos objetos, motor compartilhado por todos os mundos e fases orquestrado por `startGame()`;
- `math.js` → motor do desafio matemático desacoplado, resolvendo a conta via `window.OPERACOES` e disparando a progressão;
- `operacoes.js` → catálogo e regras das operações matemáticas (Soma, Subtração, Multiplicação, Divisão e contas compostas);
- `progresso.js` → serviço de persistência de progresso (`localStorage`) multi-mundo e multi-fase;
- `dev.js` → ferramenta de desenvolvimento e painel de testes. Só ele decide se o modo DEV liga: em ambiente local (`localhost`, `127.0.0.1`, `file://`), por `?dev=true`; no site publicado, `?dev=true` ou o `sessionStorage` sozinhos **não** ligam — o painel só abre depois do login em `admin.html` e da conferência da sessão no servidor (`GET /api/admin/sessao`). O `menu.js` apenas lê o resultado (`window.modoDevLiberado`);
- `admin.html` + `js/admin.js` → login administrativo da equipe; `api/admin/*` e `api/_lib/admin.js` → login, logout e sessão no servidor (use `exigirSessaoAdmin(req)` em todo endpoint administrativo);
- `js/mundos/` → arquivos declarativos de configuração de cada mundo (`mundo1.js` a `mundo5.js`), auto-registrados em `window.MUNDOS`.

Não altere responsabilidades arquiteturais importantes sem sinalizar o impacto antes.

---

## Estado atual dos mundos e fases

| Mundo | Tema | Operação | Fases | Acessível pela UI? |
|---|---|---|---|---|
| 1 | A Casa | Soma (`+`) | 3 fases (5, 9 e 14 objetos) | Sim (Fases 1, 2 e 3 acessíveis pela UI via modal e progressão) |
| 2 | Parque | Subtração (`−`) | 3 fases (Comidas, Animais, Brinquedos) | Sim (desbloqueado após concluir Mundo 1) |
| 3 | Praia | Multiplicação (`×`) | 3 fases (Bebidas, Comidas, Brinquedos) | Sim (desbloqueado após concluir Mundo 2) |
| 4 | Acampamento | Divisão (`÷`) | 3 fases (Comida, Mochila) | Sim (desbloqueado após concluir Mundo 3) |
| 5 | Desafio Final (Boss) | Expressões Compostas | 1 fase (Batalha contra o Boss + Organização Noturna) | Sim (Sidebar lateral do Boss desbloqueada após Mundo 4 / Dev Mode) |

As Fases 1, 2 e 3 do Mundo 1 estão totalmente acessíveis pela UI (a Fase 1 liberada por padrão e as Fases 2 e 3 desbloqueadas progressivamente). Os Mundos 2, 3 e 4 estão implementados no engine com suas respectivas operações matemáticas e mecânicas completas, e são desbloqueados em sequência pelo carrossel.

O Mundo 5 (`mundo5.js`) é o desafio final contra o Monstro da Bagunça: reúne cinco desafios de expressões compostas com precedência de operadores e uma etapa final de organização na sala à noite (`sala_noite_bagunçada.jpeg` durante a batalha e arrumação, mudando para `sala_noite.png` ao concluir a organização). É acessível na tela de seleção de mundos por meio de uma sidebar vertical azul dedicada à direita, que é liberada após a conclusão do Mundo 4 (ou com `?dev=true`) e conta com botão de fechar e ícone flutuante minimizado para reabertura. Na batalha, o monstro fica centralizado com balão de risada, acompanhado de 5 corações dinâmicos de vida no HUD, balões de instrução personalizados (`hud_branco.png` e `hud_branco2.png`) e transição suave para a organização dos itens após derrotar o adversário.

Esta tabela reflete o estado no momento da última revisão deste documento —
se o código mudar, atualize-a como parte da tarefa que a alterou.
## 4. Limites de atuação

**Exigem autorização explícita** (e sinalização do impacto antes):

| O quê | Regra |
|---|---|
| `js/progresso.js` | Não alterar por iniciativa própria nem fora do escopo da tarefa. Alterações excepcionais só com autorização explícita da equipe e justificativa (por exemplo, a futura etapa de persistência do progresso no banco). Preservar as assinaturas `obterProgresso()` e `desbloquearProximaFase(faseAtual, mundoAtual, totalFases)`. |
| `js/game.js` | É compartilhado por todos os mundos. Avaliar e sinalizar o impacto antes de alterar. |
| Comportamento do botão JOGAR | Apagar o progresso local é intencional. Não alterar sem decisão da equipe. |
| Estrutura oficial de fases | A faculdade exige 4 fases principais + 1 fase bônus. Não remover, reduzir nem descaracterizar a fase bônus (Mundo 5) sem decisão da equipe. |
| Supabase | Nunca executar SQL, migrações, alterações de esquema, RLS ou exclusão de registros. Criar ou rodar migrações é tarefa futura da equipe: só com pedido explícito. Consultas somente de leitura, e só se pedidas. Não presuma que o projeto acessível por uma ferramenta é o do jogo: confirme antes. |
| Vercel | Não fazer deploy nem alterar projetos, variáveis ou configurações. |
| Dependências e build | Não adicionar `package.json`, bibliotecas ou ferramentas de build. |
| Ações destrutivas | Apagar arquivos ou dados, reescrever histórico. |

---

## 5. Invariantes de arquitetura

Preserve estes acoplamentos. Para o mapa completo, veja a seção Arquitetura do `README.md`.

- Os scripts são clássicos, com globais e sem módulos: **respeite a ordem de carregamento** nos HTML (por exemplo, `main.js` é o último script de `fase1.html`).
- Cada mundo é um arquivo declarativo em `js/mundos/` que se registra em `window.MUNDOS`. Regras de jogo ficam no motor (`game.js`, `math.js`, `operacoes.js`), não nos mundos.
- A fase roda em um iframe do menu e volta a ele por `postMessage` (`arruma-bagunca:navegacao`). Mantenha o contrato.
- **JOGAR:** o `removeItem` do progresso acontece no clique, antes da identificação, e `dev.js` faz o backup do progresso num listener de captura no mesmo botão. Preserve a ordem. `?view=mundos` **não** apaga o progresso e pede o apelido se a aba não tem jogador.
- O jogador identificado fica em `sessionStorage` **só para exibição**. Nunca é prova de identidade nem de permissão.
- Backend (`api/`): CommonJS, só APIs nativas do Node, sem dependências. `api/_lib/` não vira rota. Erros no formato `{ erro, mensagem }`.
- A validação, a normalização e o filtro do apelido vivem **só no servidor** (`api/_lib/apelido.js`), que é a fonte única da regra. O navegador apenas exibe a mensagem recebida.
- O Supabase só é acessado por `api/_lib/supabase.js`, e só pelo servidor. O avatar gravado é sempre o padrão; o valor enviado pelo navegador é ignorado.
- Texto vindo do usuário é inserido na página com `textContent`, nunca com `innerHTML`.

---

## 6. Segurança e segredos

- **Nunca imprima, copie, registre ou faça commit de valores de chaves, PINs, tokens ou do conteúdo de `.env.local`.** Para verificar, informe apenas se a variável está configurada (sim ou não), sem revelar prefixo, tamanho nem qualquer parte do valor. Evite abrir `.env.local`; se precisar, extraia apenas os nomes.
- `.env.example` contém **somente nomes**, sem valor algum. Confira o diff dele antes de concluir qualquer tarefa que o toque.
- A chave do Supabase fica só no servidor e deve ser a **secreta**, nunca a publicável. Nenhum segredo em `js/`, HTML, logs, respostas da API ou testes (nos testes, use valores obviamente falsos).
- Logs não registram apelidos, chaves nem endereços do projeto: apenas status e códigos de erro.
- `?dev=true`, `sessionStorage`, `localStorage` e qualquer dado controlado pelo navegador **nunca** são autenticação. Operações administrativas exigem autenticação e autorização próprias no servidor.
- Em falha de rede ou de configuração, mostre uma mensagem amigável com nova tentativa. Não crie modo convidado nem dados falsos.
- Se um segredo aparecer em arquivo versionável ou em mensagem, avise imediatamente e recomende trocar a chave.

---

## 7. UX, acessibilidade e LGPD

- Interface simples, botões grandes, pouco texto, alto contraste e fonte legível. A cor nunca é o único meio de identificação (use também ícone ou texto).
- Feedback imediato e claro, com suporte a mouse/toque e, quando couber, a teclado. Responsividade para celular quando couber.
- Erros são oportunidade de aprendizado: nunca punição agressiva nem Game Over. Mensagens de erro adequadas a crianças.
- Sem violência, armas, linguagem ofensiva ou coleta desnecessária de dados.
- **Não coletar nem armazenar dados pessoais reais de crianças** (nome completo, e-mail, documentos, fotos, localização). Para identificar o jogador, use mecanismos genéricos: avatar, apelido lúdico ou código.

---

## 8. Testes e critério de conclusão

Sempre que aplicável, execute e relate o resultado **real**:

- `node --check` nos arquivos JavaScript alterados;
- `node --test` na raiz;
- `git diff --check`;
- verificação no navegador quando o comportamento for visual ou de interação (mouse, toque, teclado, responsividade).

Regras:

- Não altere um teste só para fazê-lo passar: verifique se o comportamento esperado continua correto.
- Testes com serviços externos usam simulação, sem credenciais e sem dados reais.
- Testes automatizados não substituem o teste manual do que é visual.

**Uma tarefa só está concluída quando:**

1. o escopo pedido foi atendido, sem extras;
2. as verificações acima foram executadas e o resultado real foi relatado, inclusive falhas;
3. não há segredos no diff;
4. as funcionalidades próximas foram checadas contra regressão;
5. `README.md` ou este arquivo foram atualizados **apenas** se uma regra, decisão ou comportamento real mudou;
6. integrações com serviços reais (Supabase, Vercel) só são chamadas de prontas depois de validadas no serviço real. O que ficou sem validação é listado como pendente.

Ao relatar, diga **qual nível** foi verificado, sem misturá-los: **teste simulado** (`node --test`, serviços de mentira), **teste local** (servidor local e navegador), **integração real** (Supabase de verdade) e **deploy verificado** (ambiente publicado). Um nível não vale pelo outro; o que não foi verificado é dito como tal.

---

## 9. Comunicação

Responda em português. Ao concluir, informe: os arquivos alterados, o que mudou (de forma objetiva), os testes feitos com seus resultados reais, e os problemas, limitações e pendências. Separe o que foi **verificado** do que é **hipótese**. Sinalize conflitos e decisões que dependem da equipe. Não é preciso explicar o código linha por linha, a menos que seja pedido.

---

## 10. Manutenção deste documento

Altere este arquivo apenas quando uma **regra** permanente mudar. Estado do projeto, listas de arquivos, contagens e decisões de produto pertencem ao `README.md` ou ao próprio código.
