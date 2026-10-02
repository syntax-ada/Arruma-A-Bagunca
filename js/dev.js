// DEV ONLY
// Não utilizar para lógica do jogo.
// Ferramentas auxiliares para desenvolvimento e testes.

(function inicializarModoDev() {
  const CHAVE_SESSION_DEV = "arruma_bagunca_dev";
  const CHAVE_STORAGE_PROGRESSO = "arruma_bagunca_progresso";

  const storageSession = typeof window !== "undefined" && window.sessionStorage ? window.sessionStorage : null;
  const storageLocal = typeof window !== "undefined" && window.localStorage ? window.localStorage : null;

  if (!storageSession || !storageLocal) {
    return;
  }

  // ==========================================================
  // 1. DETECÇÃO E PERSISTÊNCIA DA SESSÃO DEV
  // ==========================================================
  const urlParams = new URLSearchParams(window.location.search);
  const devParam = urlParams.get("dev");

  if (devParam === "false" || devParam === "0") {
    storageSession.removeItem(CHAVE_SESSION_DEV);
    return;
  }

  if (devParam === "true" || devParam === "1" || urlParams.has("dev")) {
    storageSession.setItem(CHAVE_SESSION_DEV, "true");
  }

  const isDevAtivo = storageSession.getItem(CHAVE_SESSION_DEV) === "true";
  if (!isDevAtivo) {
    return;
  }

  // Se o catálogo de mundos não foi carregado na página (ex: index.html), carrega dinamicamente
  if (typeof window.MUNDOS === "undefined" && typeof document !== "undefined") {
    const scriptMundo = document.createElement("script");
    scriptMundo.src = "js/mundos/mundo1.js";
    scriptMundo.onload = () => {
      atualizarOpcoesPainelDev();
    };
    document.head.appendChild(scriptMundo);
  }

  // ==========================================================
  // 2. FUNÇÕES AUXILIARES DE SUPORTE
  // ==========================================================
  function obterMundosDisponiveis() {
    return window.MUNDOS || {
      1: { id: 1, nome: "A Casa", totalFases: 3, html: "fase1.html" },
    };
  }

  function obterMundoFaseAtivos() {
    const params = new URLSearchParams(window.location.search);
    const mundoAtual = typeof window.obterMundoAtivo === "function"
      ? window.obterMundoAtivo()
      : (Number(params.get("mundo")) || 1);

    const faseAtual = typeof window.obterFaseAtiva === "function"
      ? window.obterFaseAtiva()
      : (Number(params.get("fase")) || 1);

    const totalFases = typeof window.obterTotalFasesMundoAtivo === "function"
      ? window.obterTotalFasesMundoAtivo()
      : (obterMundosDisponiveis()[mundoAtual]?.totalFases || 3);

    return { mundoAtual, faseAtual, totalFases };
  }

  function notificarDev(mensagem) {
    console.log(`%c[DEV]%c ${mensagem}`, "color: #ffaa00; font-weight: bold;", "color: inherit;");
    const statusEl = document.querySelector("#dev-painel-status");
    if (statusEl) {
      statusEl.textContent = mensagem;
      statusEl.classList.remove("dev-status-anim");
      void statusEl.offsetWidth; // trigger reflow
      statusEl.classList.add("dev-status-anim");
    }
  }

  // ==========================================================
  // 3. DEV 01 — ACESSO DIRETO
  // ==========================================================
  /**
   * Ponto único de navegação do DEV: avisa no painel e mantém a sessão DEV
   * explícita na URL de destino. Todos os destinos (fases e menus) passam
   * por aqui para não duplicar a montagem da URL.
   */
  function navegarDev(url, descricao) {
    notificarDev(`Navegando para ${descricao}...`);
    const separador = url.includes("?") ? "&" : "?";
    window.location.href = `${url}${separador}dev=true`;
  }

  function irPara(mundo = 1, fase = 1) {
    const mundos = obterMundosDisponiveis();
    const configMundo = mundos[mundo] || mundos[1];
    const paginaDestino = configMundo?.html || "fase1.html";

    navegarDev(`${paginaDestino}?mundo=${mundo}&fase=${fase}`, `Mundo ${mundo}, Fase ${fase}`);
  }

  // Destinos de navegação que não são fases (telas de menu).
  const DESTINOS_MENU = {
    menu: { url: "index.html", rotulo: "Menu" },
    mundos: { url: "index.html?view=mundos", rotulo: "Menu de Mundos" },
  };

  function irParaMenu(destino = "menu") {
    const alvo = DESTINOS_MENU[destino] || DESTINOS_MENU.menu;
    navegarDev(alvo.url, alvo.rotulo);
  }

  // ==========================================================
  // 4. DEV 02 — CONTROLE DE PROGRESSO
  // ==========================================================
  function desbloquearTudo() {
    const mundos = obterMundosDisponiveis();
    const mundosDesbloqueados = [];
    const faseMaximaPorMundo = {};
    const fasesConcluidas = [];

    Object.values(mundos).forEach((m) => {
      const mId = Number(m.id);
      mundosDesbloqueados.push(mId);
      const total = Number(m.totalFases) || 3;
      faseMaximaPorMundo[mId] = total;

      for (let f = 1; f <= total; f++) {
        fasesConcluidas.push(`${mId}-${f}`);
      }
    });

    const progressoTotal = {
      mundosDesbloqueados,
      faseMaximaPorMundo,
      fasesConcluidas,
    };

    storageLocal.setItem(CHAVE_STORAGE_PROGRESSO, JSON.stringify(progressoTotal));

    if (typeof atualizarInterfaceProgresso === "function") {
      atualizarInterfaceProgresso();
    }
    desbloquearMenuVisualSeNecessario();

    notificarDev("Todas as fases e mundos foram desbloqueados com sucesso!");
  }

  function resetarProgresso() {
    const progressoInicial = {
      mundosDesbloqueados: [1],
      faseMaximaPorMundo: { 1: 1 },
      fasesConcluidas: [],
    };

    storageLocal.setItem(CHAVE_STORAGE_PROGRESSO, JSON.stringify(progressoInicial));

    if (typeof atualizarInterfaceProgresso === "function") {
      atualizarInterfaceProgresso();
    }

    notificarDev("Progresso resetado para o início (Mundo 1, Fase 1).");
  }

  // ==========================================================
  // 5. DEV 03 — SIMULAÇÃO REAL
  // ==========================================================
  /**
   * Simula a interação do jogador com uma cesta.
   *
   * O jogo expõe DOIS pontos de entrada equivalentes para organizar um objeto:
   * o arraste (pointerup -> finishDrag) e o teclado (keydown -> handleDropZoneKeyboard).
   * O segundo não depende de coordenadas de ponteiro, por isso é o que o DEV usa.
   *
   * A partir daqui quem manda é game.js: ele escolhe o item, valida a categoria,
   * posiciona, marca is-correct, atualiza contador/sprite, emite o feedback e
   * decide (via isOrganizationComplete) se abre o desafio matemático.
   * O DEV não sabe — e não deve saber — nada disso.
   */
  function simularInteracaoComCesta(cesta) {
    cesta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
    );
  }

  /**
   * ESTADO REAL DA FASE, lido do próprio jogo.
   *
   * O DEV não guarda estado nem supõe a ordem das etapas. Uma fase pode começar
   * pela organização (fluxo tradicional: organização → matemática → conclusão)
   * ou pelo desafio (fluxo com adversário: matemática → organização →
   * conclusão), e quem decide isso é a configuração da fase — não o DEV.
   *
   * Por isso aqui só existem perguntas sobre o que está acontecendo AGORA. É o
   * que permite atravessar os dois fluxos com o mesmo código, sem nenhuma regra
   * baseada no número do mundo e sem repetir a lógica que já vive em game.js e
   * math.js.
   */
  function etapaEstaVisivel(seletor) {
    const tela = document.querySelector(seletor);
    return !!tela && !tela.classList.contains("escondido");
  }

  /**
   * A fase terminou quando o jogo monta os botões de conclusão — é o mesmo
   * sinal que o botão "Próxima Fase" do DEV já usa. Serve para os dois fluxos:
   * os botões aparecem no painel matemático (fluxo tradicional) ou no painel de
   * vitória (depois da organização final do fluxo com adversário).
   */
  function faseFoiConcluida() {
    return !!document.querySelector(".acoes-conclusao");
  }

  // Há uma conta aberta esperando resposta? Depois de um acerto o jogo desativa
  // os botões, então "botão ativo" é o que distingue uma conta nova de uma
  // conta já respondida.
  function haDesafioParaResponder() {
    return etapaEstaVisivel("#tela-matematica")
      && !!document.querySelector(".botao-opcao-matematica:not([disabled])");
  }

  function haObjetoParaOrganizar() {
    return etapaEstaVisivel("#tela-organizacao")
      && !!document.querySelector(".draggable-item:not(.is-correct)");
  }

  /**
   * Aguarda o jogo chegar ao próximo estado em que o DEV tenha o que fazer —
   * ou em que a fase já tenha terminado.
   *
   * As pausas do jogo são respeitadas, não contornadas: entre uma conta e a
   * próxima, entre o adversário cair e a casa entrar em cena, e entre o último
   * objeto organizado e a troca de tela, o jogo fica alguns instantes sem nada
   * para o DEV fazer. O limite de tempo existe só para não esperar para
   * sempre — a prova de que algo aconteceu é sempre o estado real da tela,
   * nunca o fim da espera.
   */
  function aguardarProximoEstadoDoJogo(limiteMs = 5000) {
    const pronto = () => faseFoiConcluida() || haDesafioParaResponder() || haObjetoParaOrganizar();

    if (pronto()) {
      return Promise.resolve(true);
    }

    if (!document.body) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      let encerrado = false;

      const finalizar = (avancou) => {
        if (encerrado) {
          return;
        }
        encerrado = true;
        observador.disconnect();
        clearTimeout(prazo);
        resolve(avancou);
      };

      const observador = new MutationObserver(() => {
        if (pronto()) {
          finalizar(true);
        }
      });
      const prazo = setTimeout(() => finalizar(false), limiteMs);

      // As transições observadas mexem no DOM de formas diferentes: trocar de
      // tela mexe em "class", montar a conclusão ou uma conta nova insere
      // elementos, e responder uma conta desativa os botões.
      observador.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class", "disabled"],
      });
    });
  }

  /**
   * Completa a etapa visível na tela. Devolve true quando realmente agiu e
   * false quando não havia o que fazer — nesse caso o motivo já foi relatado no
   * painel, e quem chamou não deve sobrepor outra mensagem.
   */
  async function completarEtapa() {
    // Fase encerrada: nao ha etapa pendente, e a tela da ultima etapa continua
    // em cena. Sem isto o DEV anunciaria uma simulacao que nao aconteceu.
    if (faseFoiConcluida()) {
      notificarDev("A fase já foi concluída — não há etapa pendente para completar.");
      return false;
    }

    const telaOrganizacao = document.querySelector("#tela-organizacao");
    const telaMatematica = document.querySelector("#tela-matematica");

    // Etapa de organização dos objetos
    if (telaOrganizacao && !telaOrganizacao.classList.contains("escondido")) {
      if (typeof findCorrectDropZone !== "function") {
        notificarDev("game.js não está carregado nesta tela — simulação cancelada.");
        return false;
      }

      // Limite defensivo: o laço só avança enquanto o próprio jogo confirmar
      // que o objeto foi organizado. Qualquer condição inesperada interrompe.
      const maximoIteracoes = document.querySelectorAll(".draggable-item").length + 10;
      let organizados = 0;
      let iteracoes = 0;

      while (iteracoes++ < maximoIteracoes) {
        const item = document.querySelector(".draggable-item:not(.is-correct)");
        if (!item) {
          break;
        }

        const cesta = findCorrectDropZone(item);
        if (!cesta) {
          notificarDev(
            `Nenhuma cesta aceita "${item.dataset.category}". Simulação interrompida em ${organizados} objeto(s).`
          );
          return false;
        }

        simularInteracaoComCesta(cesta);

        // Quem decide se o objeto foi organizado é game.js, não o DEV.
        if (!item.classList.contains("is-correct")) {
          notificarDev(
            `O jogo não organizou "${item.id}". Simulação interrompida em ${organizados} objeto(s).`
          );
          return false;
        }

        organizados++;
      }

      if (organizados === 0) {
        notificarDev("Nenhum objeto pendente para organizar nesta tela.");
        return false;
      }

      notificarDev(`${organizados} objeto(s) organizados pelo fluxo do jogo.`);

      // O que vem DEPOIS da organização depende da fase, e o DEV não adivinha:
      // no fluxo tradicional abre o desafio matemático; no fluxo com adversário
      // esta é a etapa FINAL e o próprio jogo encerra a fase. Em vez de anunciar
      // uma espera que pode não existir, o DEV espera o jogo decidir e relata o
      // que de fato aconteceu.
      await aguardarProximoEstadoDoJogo();

      if (faseFoiConcluida()) {
        notificarDev(`${organizados} objeto(s) organizados. Era a etapa final: fase concluída.`);
      } else if (haDesafioParaResponder()) {
        notificarDev(`${organizados} objeto(s) organizados. O desafio matemático abriu.`);
      } else {
        notificarDev(
          `${organizados} objeto(s) organizados, mas o jogo não apresentou a etapa seguinte no tempo esperado.`
        );
      }
      return true;
    }

    // Etapa do desafio matemático — uma conta por vez. Numa fase com sequência
    // de contas, quem apresenta a próxima é o jogo, depois da sua pausa.
    if (telaMatematica && !telaMatematica.classList.contains("escondido")) {
      // Conta ja respondida: o jogo desativou os botoes e esta na pausa antes
      // de apresentar a proxima. Clicar num botao desativado nao faria nada, e
      // anunciar "simulando resposta" seria mentira.
      if (!haDesafioParaResponder()) {
        notificarDev("A conta atual já foi respondida — aguarde o jogo apresentar a próxima.");
        return false;
      }

      // O gabarito vem de math.js, que já resolveu a operação declarada pela
      // fase. O DEV não recalcula a conta — assumir soma daria resposta errada
      // em uma fase de subtração ou multiplicação.
      const desafio = typeof obterDesafioMatematicoAtivo === "function"
        ? obterDesafioMatematicoAtivo()
        : null;

      if (!desafio) {
        notificarDev("Desafio matemático indisponível (math.js não expôs a operação ativa) — simulação cancelada.");
        return false;
      }

      const resultadoCorreto = desafio.resultadoCorreto;

      const botoes = Array.from(document.querySelectorAll(".botao-opcao-matematica"));
      const botaoCorreto = botoes.find((b) => Number(b.textContent) === resultadoCorreto);

      if (botaoCorreto) {
        notificarDev(`Simulando resposta correta (${desafio.operacao.id}): ${botaoCorreto.textContent}`);
        botaoCorreto.click();
      } else {
        const { faseAtual, mundoAtual, totalFases } = obterMundoFaseAtivos();
        if (typeof desbloquearProximaFase === "function") {
          desbloquearProximaFase(faseAtual, mundoAtual, totalFases);
        }
        if (typeof exibirBotoesConclusao === "function") {
          exibirBotoesConclusao(faseAtual);
        }
        notificarDev("Etapa matemática concluída.");
      }
      return true;
    }

    notificarDev("Nenhuma etapa de jogo identificada para completar nesta tela.");
    return false;
  }

  // Trava contra laço infinito ao atravessar uma fase. Uma fase com adversário
  // gasta um passo por conta, mais os passos de espera e a organização final —
  // o limite é folgado de propósito: ele não é regra do jogo, só um freio.
  const LIMITE_PASSOS_POR_FASE = 40;

  async function completarFase() {
    const { faseAtual, mundoAtual, totalFases } = obterMundoFaseAtivos();

    const telaOrganizacao = document.querySelector("#tela-organizacao");
    const telaMatematica = document.querySelector("#tela-matematica");

    if (telaOrganizacao || telaMatematica) {
      // Atravessa a fase etapa por etapa SEM saber a ordem delas: a cada volta,
      // o DEV faz o que a tela atual permite e espera o próprio jogo apresentar
      // o estado seguinte. Isso vale igualmente para "organização → matemática"
      // e para "adversário → organização", porque em nenhum momento se supõe
      // qual é a próxima etapa.
      let passos = 0;

      while (passos++ < LIMITE_PASSOS_POR_FASE) {
        if (faseFoiConcluida()) {
          break;
        }

        // Nada a fazer neste instante: o jogo está em uma de suas pausas. Quem
        // espera é o DEV, não o jogo.
        if (!haDesafioParaResponder() && !haObjetoParaOrganizar()) {
          if (!(await aguardarProximoEstadoDoJogo())) {
            break;
          }
          continue;
        }

        if (!(await completarEtapa())) {
          return;
        }
      }

      // A conclusão é afirmada pelo estado real da fase, nunca pelo fim de uma
      // espera: quando o jogo não chegou lá, o DEV diz isso em vez de inventar
      // sucesso — e, quando chegou, não acusa falha só porque a etapa seguinte
      // que ele esperava não existia.
      if (faseFoiConcluida()) {
        notificarDev(`Fase ${faseAtual} do Mundo ${mundoAtual} concluída.`);
      } else {
        notificarDev(
          `A Fase ${faseAtual} do Mundo ${mundoAtual} não chegou à conclusão: o jogo parou em uma etapa que o DEV não conseguiu completar.`
        );
      }
      return;
    }

    // Fallback: tela sem as etapas do jogo (ex.: um menu). Mantém o
    // comportamento anterior de gravar o progresso e exibir a conclusão.
    if (typeof desbloquearProximaFase === "function") {
      desbloquearProximaFase(faseAtual, mundoAtual, totalFases);
    }
    if (typeof exibirBotoesConclusao === "function") {
      exibirBotoesConclusao(faseAtual);
    }
    notificarDev(`Fase ${faseAtual} do Mundo ${mundoAtual} concluída.`);
  }

  function proximaFase() {
    const btnProxima = document.querySelector(".acoes-conclusao .btn-conclusao:nth-child(2)");
    if (btnProxima && btnProxima.textContent.includes("Próxima")) {
      notificarDev("Avançando para a próxima fase via botão real...");
      btnProxima.click();
      return;
    }

    const { faseAtual, mundoAtual, totalFases } = obterMundoFaseAtivos();
    if (faseAtual < totalFases) {
      irPara(mundoAtual, faseAtual + 1);
    } else {
      notificarDev(`Mundo ${mundoAtual} já está na última fase (${faseAtual}/${totalFases}).`);
    }
  }

  function desativarModoDev() {
    storageSession.removeItem(CHAVE_SESSION_DEV);
    const params = new URLSearchParams(window.location.search);
    params.delete("dev");
    const query = params.toString() ? `?${params.toString()}` : "";
    window.location.href = `${window.location.pathname}${query}`;
  }

  function exibirAjudaDev() {
    console.log(
      "%c[MODO DEV — ARRUNA A BAGUNÇA]%c\n\n" +
      "Atalhos de teclado:\n" +
      "  Shift + C → Completar etapa atual / responder matemática\n" +
      "  Shift + N → Ir para a próxima fase\n" +
      "  Shift + R → Resetar progresso\n" +
      "  Shift + D → Desbloquear todas as fases e mundos\n\n" +
      "Funções no console:\n" +
      "  dev.irPara(mundo, fase)\n" +
      "  dev.irParaMenu('menu' | 'mundos')\n" +
      "  dev.completarEtapa()\n" +
      "  dev.completarFase()\n" +
      "  dev.proximaFase()\n" +
      "  dev.desbloquearTudo()\n" +
      "  dev.resetarProgresso()\n" +
      "  dev.desativar()",
      "color: #ffaa00; font-weight: bold; font-size: 14px;",
      "color: inherit;"
    );
  }

  // ==========================================================
  // 6. DEV 04 — ATALHOS DE TECLADO
  // ==========================================================
  window.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
      return;
    }

    if (e.shiftKey && (e.key === "C" || e.key === "c")) {
      e.preventDefault();
      completarEtapa();
    } else if (e.shiftKey && (e.key === "N" || e.key === "n")) {
      e.preventDefault();
      proximaFase();
    } else if (e.shiftKey && (e.key === "R" || e.key === "r")) {
      e.preventDefault();
      resetarProgresso();
    } else if (e.shiftKey && (e.key === "D" || e.key === "d")) {
      e.preventDefault();
      desbloquearTudo();
    }
  });

  // ==========================================================
  // 7. INTERCEPTAÇÃO AMIGÁVEL NO MENU (PRESERVAR PROGRESSO DEV)
  // ==========================================================
  function desbloquearMenuVisualSeNecessario() {
    // Delega ao menu.js a atualização visual e liberação de fases no Modo Dev
    if (typeof atualizarInterfaceProgresso === "function") {
      atualizarInterfaceProgresso();
    }
  }

  const botaoJogar = document.querySelector("#botao-jogar");
  if (botaoJogar) {
    // Ao clicar em JOGAR, menu.js chama removeItem. No modo DEV, preservamos o progresso.
    botaoJogar.addEventListener("click", () => {
      const backupProgresso = storageLocal.getItem(CHAVE_STORAGE_PROGRESSO);
      setTimeout(() => {
        if (backupProgresso && !storageLocal.getItem(CHAVE_STORAGE_PROGRESSO)) {
          storageLocal.setItem(CHAVE_STORAGE_PROGRESSO, backupProgresso);
          if (typeof atualizarInterfaceProgresso === "function") {
            atualizarInterfaceProgresso();
          }
        }
        desbloquearMenuVisualSeNecessario();
      }, 0);
    }, true);
  }

  // ==========================================================
  // 8. DEV 05 — INTERFACE DO PAINEL DEV
  // ==========================================================
  function injetarEstilosDev() {
    if (document.querySelector("#estilos-modo-dev")) {
      return;
    }
    const estilo = document.createElement("style");
    estilo.id = "estilos-modo-dev";
    estilo.textContent = `
      .dev-badge-flutuante {
        position: fixed;
        bottom: 12px;
        right: 12px;
        background: rgba(20, 20, 30, 0.92);
        color: #ffaa00;
        border: 1px solid #ffaa00;
        border-radius: 20px;
        padding: 6px 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        z-index: 100000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        gap: 6px;
        transition: transform 0.15s ease, background 0.15s ease;
        user-select: none;
      }
      .dev-badge-flutuante:hover {
        transform: scale(1.05);
        background: #1e1e2d;
      }
      .dev-painel-flutuante {
        position: fixed;
        bottom: 54px;
        right: 12px;
        width: 290px;
        background: rgba(18, 18, 28, 0.96);
        color: #f0f0f5;
        border: 1px solid #3e3e5e;
        border-radius: 12px;
        padding: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        z-index: 100000;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .dev-painel-flutuante.escondido {
        display: none !important;
      }
      .dev-painel-cabecalho {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #33334d;
        padding-bottom: 6px;
      }
      .dev-painel-titulo {
        font-weight: bold;
        color: #ffaa00;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dev-btn-fechar {
        background: none;
        border: none;
        color: #9999bb;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        padding: 2px 4px;
      }
      .dev-btn-fechar:hover {
        color: #ffffff;
      }
      .dev-grupo-campo {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .dev-select {
        flex: 1;
        background: #2a2a3e;
        color: #ffffff;
        border: 1px solid #444466;
        border-radius: 6px;
        padding: 5px 8px;
        font-size: 12px;
        outline: none;
      }
      .dev-select:focus {
        border-color: #ffaa00;
      }
      .dev-btn {
        background: #2d2d44;
        color: #ffffff;
        border: 1px solid #4e4e70;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s ease;
        text-align: center;
      }
      .dev-btn:hover {
        background: #3d3d5c;
      }
      .dev-btn-destaque {
        background: #ffaa00;
        color: #1a1a24;
        border: none;
        font-weight: bold;
      }
      .dev-btn-destaque:hover {
        background: #ffbb22;
      }
      .dev-btn-perigo {
        background: #4a2020;
        border-color: #7a3030;
        color: #ff9999;
      }
      .dev-btn-perigo:hover {
        background: #6a2a2a;
      }
      .dev-grid-acoes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .dev-lista-atalhos {
        background: #141420;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 11px;
        color: #aaaabb;
        line-height: 1.5;
        border: 1px solid #28283a;
      }
      .dev-lista-atalhos strong {
        color: #ffffff;
        font-family: monospace;
      }
      .dev-status {
        font-size: 11px;
        color: #70ff90;
        min-height: 16px;
        word-break: break-word;
      }
      @keyframes devPulse {
        0% { opacity: 0.4; }
        50% { opacity: 1; }
        100% { opacity: 0.9; }
      }
      .dev-status-anim {
        animation: devPulse 0.4s ease;
      }
    `;
    document.head.appendChild(estilo);
  }

  function atualizarOpcoesPainelDev() {
    const selectMundo = document.querySelector("#dev-select-mundo");
    const selectFase = document.querySelector("#dev-select-fase");
    if (!selectMundo || !selectFase) {
      return;
    }

    const mundos = obterMundosDisponiveis();
    const { mundoAtual, faseAtual } = obterMundoFaseAtivos();

    selectMundo.innerHTML = "";
    Object.values(mundos).forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `Mundo ${m.id}: ${m.nome || "Mundo " + m.id}`;
      if (Number(m.id) === Number(mundoAtual)) {
        opt.selected = true;
      }
      selectMundo.appendChild(opt);
    });

    function popularFases(mundoId) {
      selectFase.innerHTML = "";
      const mConfig = mundos[mundoId] || mundos[1];
      const total = Number(mConfig?.totalFases) || 3;
      for (let f = 1; f <= total; f++) {
        const opt = document.createElement("option");
        opt.value = f;
        opt.textContent = `Fase ${f}`;
        if (Number(f) === Number(faseAtual)) {
          opt.selected = true;
        }
        selectFase.appendChild(opt);
      }
    }

    popularFases(selectMundo.value);
    selectMundo.onchange = () => popularFases(selectMundo.value);
  }

  function criarPainelDevDOM() {
    if (document.querySelector("#dev-painel-container")) {
      return;
    }

    injetarEstilosDev();

    const container = document.createElement("div");
    container.id = "dev-painel-container";

    // Badge Indicador
    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = "dev-badge-flutuante";
    badge.id = "dev-badge-toggle";
    badge.innerHTML = "<span>🛠️</span><span>[MODO DEV]</span>";
    badge.setAttribute("aria-label", "Abrir ou fechar painel do Modo DEV");

    // Painel
    const painel = document.createElement("aside");
    painel.className = "dev-painel-flutuante escondido";
    painel.id = "dev-painel-janela";
    painel.setAttribute("aria-label", "Ferramentas do Modo DEV");

    painel.innerHTML = `
      <div class="dev-painel-cabecalho">
        <span class="dev-painel-titulo">🛠️ Modo DEV</span>
        <button type="button" class="dev-btn-fechar" id="dev-btn-fechar" aria-label="Fechar painel">✕</button>
      </div>

      <div class="dev-grupo-campo">
        <select class="dev-select" id="dev-select-mundo" aria-label="Selecionar mundo"></select>
        <select class="dev-select" id="dev-select-fase" aria-label="Selecionar fase"></select>
        <button type="button" class="dev-btn dev-btn-destaque" id="dev-btn-ir-fase">Ir</button>
      </div>

      <div class="dev-grid-acoes">
        <button type="button" class="dev-btn" id="dev-btn-ir-menu">Menu</button>
        <button type="button" class="dev-btn" id="dev-btn-ir-mundos">Menu de Mundos</button>
      </div>

      <div class="dev-grid-acoes">
        <button type="button" class="dev-btn" id="dev-btn-completar-etapa" title="Shift + C">Completar Etapa</button>
        <button type="button" class="dev-btn" id="dev-btn-proxima-fase" title="Shift + N">Próxima Fase</button>
        <button type="button" class="dev-btn" id="dev-btn-desbloquear-tudo" title="Shift + D">Desbloquear Tudo</button>
        <button type="button" class="dev-btn dev-btn-perigo" id="dev-btn-resetar" title="Shift + R">Resetar Progresso</button>
      </div>

      <div class="dev-lista-atalhos">
        <div><strong>Shift + C</strong> → Completar</div>
        <div><strong>Shift + N</strong> → Próxima fase</div>
        <div><strong>Shift + R</strong> → Resetar</div>
        <div><strong>Shift + D</strong> → Desbloquear tudo</div>
      </div>

      <div class="dev-status" id="dev-painel-status">Modo DEV ativo.</div>
    `;

    container.appendChild(badge);
    container.appendChild(painel);
    document.body.appendChild(container);

    // Eventos do Painel
    badge.addEventListener("click", () => {
      painel.classList.toggle("escondido");
    });

    const btnFechar = painel.querySelector("#dev-btn-fechar");
    if (btnFechar) {
      btnFechar.addEventListener("click", () => {
        painel.classList.add("escondido");
      });
    }

    const btnIr = painel.querySelector("#dev-btn-ir-fase");
    if (btnIr) {
      btnIr.addEventListener("click", () => {
        const selectMundo = document.querySelector("#dev-select-mundo");
        const selectFase = document.querySelector("#dev-select-fase");
        const m = Number(selectMundo?.value) || 1;
        const f = Number(selectFase?.value) || 1;
        irPara(m, f);
      });
    }

    const btnIrMenu = painel.querySelector("#dev-btn-ir-menu");
    if (btnIrMenu) {
      btnIrMenu.addEventListener("click", () => irParaMenu("menu"));
    }

    const btnIrMundos = painel.querySelector("#dev-btn-ir-mundos");
    if (btnIrMundos) {
      btnIrMundos.addEventListener("click", () => irParaMenu("mundos"));
    }

    const btnCompletarEtapa = painel.querySelector("#dev-btn-completar-etapa");
    if (btnCompletarEtapa) {
      btnCompletarEtapa.addEventListener("click", completarEtapa);
    }

    const btnProx = painel.querySelector("#dev-btn-proxima-fase");
    if (btnProx) {
      btnProx.addEventListener("click", proximaFase);
    }

    const btnDesbloquear = painel.querySelector("#dev-btn-desbloquear-tudo");
    if (btnDesbloquear) {
      btnDesbloquear.addEventListener("click", desbloquearTudo);
    }

    const btnResetar = painel.querySelector("#dev-btn-resetar");
    if (btnResetar) {
      btnResetar.addEventListener("click", resetarProgresso);
    }

    atualizarOpcoesPainelDev();
    desbloquearMenuVisualSeNecessario();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", criarPainelDevDOM);
  } else {
    criarPainelDevDOM();
  }

  // ==========================================================
  // 9. OBJETO PÚBLICO WINDOW.DEV
  // ==========================================================
  window.dev = {
    irPara,
    irParaMenu,
    desbloquearTudo,
    resetarProgresso,
    completarEtapa,
    completarFase,
    proximaFase,
    desativar: desativarModoDev,
    abrirPainel: () => {
      document.querySelector("#dev-painel-janela")?.classList.remove("escondido");
    },
    fecharPainel: () => {
      document.querySelector("#dev-painel-janela")?.classList.add("escondido");
    },
    ajuda: exibirAjudaDev,
  };

  exibirAjudaDev();
})();
