/**
 * Trilha sonora e efeitos sonoros compartilhados entre as telas do jogo.
 *
 * Na navegação normal, o menu permanece aberto como tela-base e mantém o
 * mesmo elemento de áudio enquanto as fases são trocadas. A sessão também
 * registra o ponto atual para acessos diretos a uma fase.
 */
(function configurarAudioDoJogo() {
  const ARQUIVOS_EFEITOS = {
    botao: "assets/audio/Efeitos/Efeitos - Botão.wav",
    certo: "assets/audio/Efeitos/Efeitos - Certo.wav",
    errado: "assets/audio/Efeitos/Efeitos - Errado.wav",
    conclusao: "assets/audio/Efeitos/Efeitos - FaseConcluida.wav",
    faseConcluida: "assets/audio/Efeitos/Efeitos - FaseConcluida.wav",
  };

  const TRILHAS_MUNDOS = {
    menu: "assets/audio/Mundos/Menu Principal.mp3",
    principal: "assets/audio/Mundos/Menu Principal.mp3",
    1: "assets/audio/Mundos/Mundo 1 - Casa.mp3",
    casa: "assets/audio/Mundos/Mundo 1 - Casa.mp3",
    2: "assets/audio/Mundos/Mundo 2 - Parque.mp3",
    parque: "assets/audio/Mundos/Mundo 2 - Parque.mp3",
    3: "assets/audio/Mundos/Mundo 3 - Praia.mp3",
    praia: "assets/audio/Mundos/Mundo 3 - Praia.mp3",
    4: "assets/audio/Mundos/Mundo 4 - Acampamento.mp3",
    acampamento: "assets/audio/Mundos/Mundo 4 - Acampamento.mp3",
    5: "assets/audio/Mundos/Fase Bonus - ChefãoFinal.mp3",
    boss: "assets/audio/Mundos/Fase Bonus - ChefãoFinal.mp3",
    bonus: "assets/audio/Mundos/Fase Bonus - ChefãoFinal.mp3",
  };

  const CHAVE_SESSAO = "arruma_bagunca_trilha";
  const VOLUME_TRILHA_PADRAO = 0.25; // Volume entre 20% e 30% para não sobrepor efeitos
  const VOLUME_EFEITO_PADRAO = 1.0;  // Efeitos sonoros em volume normal

  let silenciadoIframe = false;

  function lerEstadoSessao() {
    try {
      const salvo = window.sessionStorage.getItem(CHAVE_SESSAO);
      if (salvo) {
        return {
          tocando: false,
          silenciado: false,
          tempo: 0,
          trilha: TRILHAS_MUNDOS.menu,
          ...JSON.parse(salvo),
        };
      }
    } catch (erro) {
      // O jogo continua funcionando se o armazenamento estiver bloqueado.
    }

    return {
      tocando: false,
      silenciado: false,
      tempo: 0,
      trilha: TRILHAS_MUNDOS.menu,
    };
  }

  function estaSilenciado() {
    if (window.parent !== window) {
      return silenciadoIframe;
    }
    if (typeof audio !== "undefined" && audio) {
      return Boolean(audio.muted);
    }
    return Boolean(lerEstadoSessao().silenciado);
  }

  function resolverCaminhoEfeito(tipoOuCaminho) {
    if (!tipoOuCaminho) {
      return null;
    }
    if (ARQUIVOS_EFEITOS[tipoOuCaminho]) {
      return ARQUIVOS_EFEITOS[tipoOuCaminho];
    }
    if (tipoOuCaminho === "FaseConcluida.wav" || tipoOuCaminho === "assets/audio/Efeitos/FaseConcluida.wav") {
      return ARQUIVOS_EFEITOS.conclusao;
    }
    if (typeof tipoOuCaminho === "string") {
      if (!tipoOuCaminho.includes("/")) {
        return `assets/audio/Efeitos/${tipoOuCaminho}`;
      }
      return tipoOuCaminho;
    }
    return null;
  }

  function tocarEfeito(tipoOuCaminho) {
    if (estaSilenciado()) {
      return;
    }

    const caminho = resolverCaminhoEfeito(tipoOuCaminho);
    if (!caminho) {
      return;
    }

    try {
      const audioEfeito = new Audio(caminho);
      audioEfeito.volume = VOLUME_EFEITO_PADRAO;
      audioEfeito.play().catch(() => {
        // Evita exceção se o navegador suspender reprodução automática antes de interação
      });
    } catch (erro) {
      // Tratamento defensivo
    }
  }

  function resolverCaminhoTrilha(origem) {
    if (origem === null || origem === undefined || origem === "") {
      return TRILHAS_MUNDOS.menu;
    }
    const chave = String(origem).trim().toLowerCase();
    if (TRILHAS_MUNDOS[chave]) {
      return TRILHAS_MUNDOS[chave];
    }
    if (TRILHAS_MUNDOS[origem]) {
      return TRILHAS_MUNDOS[origem];
    }
    if (typeof origem === "string") {
      if (origem.startsWith("assets/audio/Mundos/")) {
        return origem;
      }
      if (!origem.includes("/")) {
        return `assets/audio/Mundos/${origem}`;
      }
    }
    return String(origem);
  }

  function trocarTrilhaFundo(origem) {
    const caminho = resolverCaminhoTrilha(origem);

    // Se estiver em um iframe (fase incorporada), repassa a solicitação para a janela principal
    if (window.parent !== window) {
      window.parent.postMessage({
        tipo: "arruma-bagunca:trocar-trilha",
        trilha: caminho,
      }, "*");
      return;
    }

    trocarTrilhaFundoNoTopo(caminho);
  }

  window.tocarEfeito = tocarEfeito;
  window.tocarEfeitoSonoro = tocarEfeito;
  window.trocarTrilhaFundo = trocarTrilhaFundo;
  window.trocarTrilha = trocarTrilhaFundo;

  // Quando a fase é exibida dentro do menu, o áudio pertence somente à tela
  // principal. A fase apenas encaminha seus controles e mensagens para ela.
  if (window.parent !== window) {
    silenciadoIframe = Boolean(lerEstadoSessao().silenciado);

    document.querySelectorAll("[data-controle-som]").forEach((botao) => {
      botao.addEventListener("click", () => {
        window.parent.postMessage({ tipo: "arruma-bagunca:alternar-som" }, "*");
      });
    });

    window.addEventListener("message", (evento) => {
      const silenciado = evento.data?.tipo === "arruma-bagunca:estado-som"
        ? evento.data.silenciado
        : null;

      if (typeof silenciado !== "boolean") {
        return;
      }

      silenciadoIframe = silenciado;

      document.querySelectorAll("[data-controle-som]").forEach((botao) => {
        botao.setAttribute("aria-pressed", String(silenciado));
        botao.setAttribute("aria-label", silenciado ? "Ativar música de fundo" : "Desativar música de fundo");
        const texto = botao.querySelector("[data-texto-som]");
        if (texto) {
          texto.textContent = silenciado ? "Som desligado" : "Som ligado";
        }
      });
    });

    window.parent.postMessage({ tipo: "arruma-bagunca:solicitar-estado-som" }, "*");
    return;
  }

  let audio;
  let estado = lerEstadoSessao();
  let trilhaAtual = resolverCaminhoTrilha(estado.trilha || TRILHAS_MUNDOS.menu);
  let metadadosCarregados = false;
  let reproducaoPendente = false;
  let interacaoOcorreu = false;

  function salvarEstado() {
    if (!audio) {
      return;
    }

    estado = {
      tocando: !audio.paused,
      silenciado: audio.muted,
      tempo: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      trilha: trilhaAtual,
    };

    try {
      window.sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(estado));
    } catch (erro) {
      // A reprodução não depende da persistência para funcionar nesta página.
    }
  }

  function atualizarControles() {
    const estaSilenciado = audio.muted;
    document.querySelectorAll("[data-controle-som]").forEach((botao) => {
      botao.setAttribute("aria-pressed", String(estaSilenciado));
      botao.setAttribute(
        "aria-label",
        estaSilenciado ? "Ativar música de fundo" : "Desativar música de fundo"
      );

      const texto = botao.querySelector("[data-texto-som]");
      if (texto) {
        texto.textContent = estaSilenciado ? "Som desligado" : "Som ligado";
      }
    });
  }

  function tocar() {
    if (audio.muted) {
      return;
    }

    if (!metadadosCarregados && audio.readyState < 1) {
      reproducaoPendente = true;
      return;
    }

    audio.play()
      .then(() => {
        reproducaoPendente = false;
        salvarEstado();
      })
      .catch(() => {
        // Navegadores só permitem iniciar áudio após uma interação da criança.
        reproducaoPendente = true;
      });
  }

  function alternarSom() {
    audio.muted = !audio.muted;
    atualizarControles();

    if (!audio.muted) {
      tocar();
    }

    salvarEstado();
  }

  function restaurarTempo() {
    metadadosCarregados = true;
    if (estado.tempo > 0 && estado.tempo < audio.duration && estado.trilha === trilhaAtual) {
      audio.currentTime = estado.tempo;
    }

    if ((estado.tocando || reproducaoPendente) && !audio.muted) {
      reproducaoPendente = false;
      tocar();
    }
  }

  function registrarInteracao() {
    interacaoOcorreu = true;
    if (!audio.muted && (reproducaoPendente || audio.paused)) {
      tocar();
    }
  }

  function trocarTrilhaFundoNoTopo(caminho) {
    if (!audio) {
      trilhaAtual = caminho;
      return;
    }

    const caminhoNormalizado = decodeURIComponent(caminho);
    const audioSrcNormalizado = decodeURIComponent(audio.src || "");
    const mesmaTrilha = trilhaAtual === caminho || audioSrcNormalizado.endsWith(caminhoNormalizado);

    if (mesmaTrilha) {
      trilhaAtual = caminho;
      if (!audio.muted && audio.paused && (interacaoOcorreu || !reproducaoPendente)) {
        tocar();
      }
      return;
    }

    trilhaAtual = caminho;
    metadadosCarregados = false;
    audio.src = caminho;
    audio.currentTime = 0;
    salvarEstado();

    if (!audio.muted) {
      if (interacaoOcorreu) {
        tocar();
      } else {
        reproducaoPendente = true;
      }
    }
  }

  function iniciar() {
    audio = new Audio(trilhaAtual);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VOLUME_TRILHA_PADRAO;
    audio.muted = estado.silenciado;

    audio.addEventListener("loadedmetadata", restaurarTempo);
    audio.addEventListener("timeupdate", salvarEstado);
    audio.addEventListener("pause", salvarEstado);
    audio.addEventListener("ended", salvarEstado);

    document.querySelectorAll("[data-controle-som]").forEach((botao) => {
      botao.addEventListener("click", alternarSom);
    });

    // Atende às políticas de reprodução automática: a música começa na
    // primeira interação, inclusive quando a criança entra diretamente em uma fase.
    document.addEventListener("pointerdown", registrarInteracao, { capture: true });
    document.addEventListener("keydown", registrarInteracao, { capture: true });
    window.addEventListener("pagehide", salvarEstado);

    window.addEventListener("message", (evento) => {
      const tipo = evento.data?.tipo;
      const faseIncorporada = document.querySelector("#conteudo-fase");
      if (faseIncorporada && evento.source !== faseIncorporada?.contentWindow) {
        return;
      }

      interacaoOcorreu = true;

      if (tipo === "arruma-bagunca:alternar-som") {
        alternarSom();
      }

      if (tipo === "arruma-bagunca:trocar-trilha") {
        trocarTrilhaFundoNoTopo(evento.data.trilha);
      }

      if (tipo === "arruma-bagunca:alternar-som" || tipo === "arruma-bagunca:solicitar-estado-som") {
        evento.source?.postMessage({
          tipo: "arruma-bagunca:estado-som",
          silenciado: audio.muted,
        }, "*");
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        salvarEstado();
      }
    });

    atualizarControles();
  }

  iniciar();
})();
