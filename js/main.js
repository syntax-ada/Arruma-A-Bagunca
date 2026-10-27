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
  document.body.classList.remove("mundo-1", "mundo-2", "mundo-3", "mundo-4", "mundo-5");
  document.body.classList.add(`mundo-${mundo.id}`);

  function sincronizarAltoContrasteFase() {
    let ativo = false;
    try {
      ativo = localStorage.getItem("arruma_bagunca_alto_contraste") === "true";
      if (!ativo && window.parent && window.parent !== window && window.parent.document) {
        ativo = window.parent.document.body.classList.contains("alto-contraste");
      }
    } catch (_erro) {
      ativo = false;
    }
    document.body.classList.toggle("alto-contraste", ativo);
    document.documentElement.classList.toggle("alto-contraste", ativo);

    const btnVoltarImg = document.querySelector("#btn-voltar-fase img");
    if (btnVoltarImg) {
      btnVoltarImg.src = ativo
        ? "assets/images/nova_tela_menu de_fases/Acessibilidade/botton_voltar.png"
        : "assets/images/mundo_4/botton_voltar.png";
    }

    if (typeof window.atualizarVisualCestasAltoContraste === "function") {
      window.atualizarVisualCestasAltoContraste();
    }
  }

  sincronizarAltoContrasteFase();
  window.addEventListener("storage", function (evento) {
    if (evento.key === "arruma_bagunca_alto_contraste") {
      sincronizarAltoContrasteFase();
    }
  });

  window.obterMundoAtivo = function () {
    return mundo.id;
  };

  window.obterFaseAtiva = function () {
    return faseId;
  };

  window.obterTotalFasesMundoAtivo = function () {
    return mundo.totalFases;
  };

  // Atualiza a trilha sonora para o áudio correspondente do mundo ativo
  if (typeof window.trocarTrilhaFundo === "function") {
    window.trocarTrilhaFundo(mundo.id);
  }

  const btnVoltarFase = document.querySelector("#btn-voltar-fase");
  if (btnVoltarFase) {
    btnVoltarFase.addEventListener("click", function () {
      if (typeof window.tocarEfeito === "function") {
        window.tocarEfeito("botao");
      }
      if (typeof window.trocarTrilhaFundo === "function") {
        window.trocarTrilhaFundo("menu");
      }
      if (typeof navegarEntreTelasDoJogo === "function" && window.parent !== window) {
        navegarEntreTelasDoJogo("menu", "index.html");
      } else {
        window.location.href = "index.html";
      }
    });
  }

  // Isola a barra de volume da fase contra interferência dos eventos de arrastar do jogo
  const sliderVolumeFase = document.querySelector("#volume-container-fase .volume-slider");
  if (sliderVolumeFase) {
    const eventosIsolamento = [
      "mousedown",
      "mousemove",
      "mouseup",
      "touchstart",
      "touchmove",
      "touchend",
      "pointerdown",
      "pointermove",
      "pointerup"
    ];
    eventosIsolamento.forEach(function (eventoNome) {
      sliderVolumeFase.addEventListener(eventoNome, function (evento) {
        evento.stopPropagation();
      });
    });
  }

  // ==========================================================================
  // MODO DAS CESTAS NO CELULAR (critério O4)
  // ==========================================================================
  // O painel temporário de cestas (style-fase1.css, [data-modo-cestas="celular"])
  // só vale quando as TRÊS condições são verdadeiras:
  //   1. o ponteiro principal é toque: (pointer: coarse);
  //   2. o menor lado da tela do aparelho (screen) tem até 500 px;
  //   3. o menor lado da área do jogo tem até 500 px. A área do jogo é esta
  //      janela: dentro do iframe do menu, innerWidth/innerHeight medem o iframe.
  // Assim, tablets (em tela cheia ou dividida) e computadores, com qualquer
  // tamanho de janela, ficam com o comportamento de sempre.
  // O painel depende de :has() no CSS para saber quando aparecer; sem esse
  // suporte o modo não liga. Qualquer erro aqui também deixa o modo desligado:
  // as cestas continuam como sempre e a fase pode ser concluída.
  const LIMITE_MODO_CELULAR_PX = 500;

  function deveUsarCestasDeCelular() {
    try {
      const toque = window.matchMedia("(pointer: coarse)").matches;
      const menorLadoTela = Math.min(window.screen.width, window.screen.height);
      const menorLadoJogo = Math.min(window.innerWidth, window.innerHeight);
      const cssEntendeHas = typeof CSS !== "undefined" && typeof CSS.supports === "function"
        && CSS.supports("selector(:has(*))");

      return toque && cssEntendeHas
        && menorLadoTela > 0 && menorLadoTela <= LIMITE_MODO_CELULAR_PX
        && menorLadoJogo > 0 && menorLadoJogo <= LIMITE_MODO_CELULAR_PX;
    } catch (erro) {
      return false;
    }
  }

  // O tutorial de arraste da fase 1-1 aponta para as cestas na posição de
  // sempre, que no celular só aparecem durante o arraste. Por enquanto ele não
  // roda nesse modo. removerElementosTutorialArraste (game.js) só desfaz o
  // tutorial: não mexe em objetos, cestas, contadores nem progresso.
  function encerrarTutorialDeArrasteNoCelular() {
    if (document.querySelector("#tutorial-overlay") && typeof removerElementosTutorialArraste === "function") {
      removerElementosTutorialArraste();
    }
  }

  function aplicarModoDasCestas() {
    const raiz = document.documentElement;
    if (deveUsarCestasDeCelular()) {
      raiz.dataset.modoCestas = "celular";
      encerrarTutorialDeArrasteNoCelular();
    } else {
      delete raiz.dataset.modoCestas;
    }
  }

  // Antes de startGame, para o primeiro desenho já sair no modo certo.
  aplicarModoDasCestas();

  // Reavalia ao girar, redimensionar ou trocar o tipo de ponteiro (ex.: mouse
  // conectado ao celular).
  window.addEventListener("resize", aplicarModoDasCestas);
  window.addEventListener("orientationchange", aplicarModoDasCestas);
  try {
    const consultaPonteiro = window.matchMedia("(pointer: coarse)");
    if (typeof consultaPonteiro.addEventListener === "function") {
      consultaPonteiro.addEventListener("change", aplicarModoDasCestas);
    } else if (typeof consultaPonteiro.addListener === "function") {
      consultaPonteiro.addListener(aplicarModoDasCestas);
    }
  } catch (erro) {
    // Sem matchMedia: o modo já ficou desligado acima.
  }

  startGame(config);

  // startGame pode ter aberto o tutorial de arraste (fase 1-1). No modo celular
  // ele é encerrado aqui mesmo, antes de a tela ser desenhada.
  aplicarModoDasCestas();
})();
