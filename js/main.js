/**
 * @file main.js
 * @description Ponto de entrada do jogo.
 *
 * ============================================================================
 * RESPONSABILIDADE ÚNICA: RESOLVER A IDENTIDADE E INICIAR
 * ============================================================================
 * Fluxo:
 *
 *   URL (?mundo=X&fase=Y)
 *     ↓
 *   identifica mundo e fase
 *     ↓
 *   localiza o mundo em MUNDOS
 *     ↓
 *   localiza a fase dentro do mundo
 *     ↓
 *   obtém a configuração
 *     ↓
 *   startGame(config)
 *
 * Este arquivo NÃO contém lógica de fase nem regras de jogo — apenas resolve
 * qual configuração deve ser usada e entrega ao motor (game.js).
 *
 * ⚠️ ORDEM DE CARREGAMENTO: main.js deve ser o ÚLTIMO script do HTML.
 * Ele depende de game.js (startGame) e dos arquivos de mundo (MUNDOS), que são
 * scripts clássicos com funções/variáveis globais — nada declara essa
 * dependência automaticamente.
 *
 * Compatibilidade: a ausência de ?mundo é tratada como Mundo 1, para que as
 * URLs atuais (fase1.html?fase=2) continuem funcionando sem alteração.
 * ============================================================================
 */

(function iniciarJogo() {
  const MUNDO_PADRAO = 1;
  const FASE_PADRAO = 1;

  const params = new URLSearchParams(window.location.search);

  // Ausência ou valor inválido cai no padrão (mantém o comportamento atual).
  const mundoId = Number(params.get("mundo")) || MUNDO_PADRAO;
  const faseId = Number(params.get("fase")) || FASE_PADRAO;

  const mundos = window.MUNDOS || {};
  const mundo = mundos[mundoId] || mundos[MUNDO_PADRAO];

  if (!mundo) {
    console.error(
      `[main.js] Nenhum mundo registrado em MUNDOS. Verifique se o arquivo do mundo está sendo carregado no HTML antes de main.js.`
    );
    return;
  }

  const config = mundo.fases?.[faseId] || mundo.fases?.[FASE_PADRAO];

  if (!config) {
    console.error(
      `[main.js] Mundo ${mundo.id} não possui a fase ${faseId} nem a fase ${FASE_PADRAO}.`
    );
    return;
  }

  // Identidade do mundo ativo, consumida por math.js ao gravar o progresso.
  // Fica aqui (e não em game.js) para que o motor continue genérico.
  window.obterMundoAtivo = function () {
    return mundo.id;
  };

  window.obterTotalFasesMundoAtivo = function () {
    return mundo.totalFases;
  };

  if (typeof startGame !== "function") {
    console.error("[main.js] startGame não encontrado. game.js foi carregado antes de main.js?");
    return;
  }

  startGame(config);
})();
