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

  // Fallback robusto ao ler os parâmetros da URL
  const rawMundo = params.get("mundo");
  const rawFase = params.get("fase");

  const mundoId = (rawMundo !== null && rawMundo !== undefined && rawMundo.trim() !== "")
    ? (parseInt(rawMundo, 10) || MUNDO_PADRAO)
    : MUNDO_PADRAO;

  const faseId = (rawFase !== null && rawFase !== undefined && rawFase.trim() !== "")
    ? (parseInt(rawFase, 10) || FASE_PADRAO)
    : FASE_PADRAO;

  const mundos = window.MUNDOS || {};
  const mundo = mundos[mundoId] || mundos[MUNDO_PADRAO];

  if (!mundo) {
    const msgErro = `[main.js] Erro crítico: Mundo "${mundoId}" não foi encontrado em window.MUNDOS. Verifique se o script do mundo (ex: js/mundos/mundo${mundoId}.js) foi importado antes de main.js.`;
    console.error(msgErro);
    const feedbackEl = document.querySelector("#feedback-message");
    if (feedbackEl) {
      feedbackEl.textContent = "Erro ao carregar o mundo. Retorne ao menu inicial.";
      feedbackEl.classList.add("is-error");
    }
    return;
  }

  const config = mundo.fases?.[faseId] || mundo.fases?.[FASE_PADRAO];

  if (!config) {
    const msgErro = `[main.js] Mundo ${mundo.id} (${mundo.nome}) não possui a fase ${faseId} nem a fase padrão ${FASE_PADRAO}.`;
    console.error(msgErro);
    const feedbackEl = document.querySelector("#feedback-message");
    if (feedbackEl) {
      feedbackEl.textContent = "Fase não encontrada neste mundo. Retorne ao menu.";
      feedbackEl.classList.add("is-error");
    }
    return;
  }

  // Identidade do mundo ativo e da fase ativa
  window.obterMundoAtivo = function () {
    return mundo.id;
  };

  window.obterFaseAtiva = function () {
    return faseId;
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
