/**
 * Trilha sonora compartilhada entre as telas do jogo.
 *
 * Na navegação normal, o menu permanece aberto como tela-base e mantém o
 * mesmo elemento de áudio enquanto as fases são trocadas. A sessão também
 * registra o ponto atual para acessos diretos a uma fase.
 */
(function configurarTrilhaSonora() {
  // Quando a fase é exibida dentro do menu, o áudio pertence somente à tela
  // principal. A fase apenas encaminha seu botão de som para ela.
  if (window.parent !== window) {
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

  const ARQUIVO_TRILHA = "assets/audio/everything-in-place.mp3";
  const CHAVE_SESSAO = "arruma_bagunca_trilha";
  const VOLUME_PADRAO = 0.28;

  let audio;
  let estado = lerEstado();
  let metadadosCarregados = false;
  let reproducaoPendente = false;

  function lerEstado() {
    try {
      const salvo = window.sessionStorage.getItem(CHAVE_SESSAO);
      if (salvo) {
        return { tocando: false, silenciado: false, tempo: 0, ...JSON.parse(salvo) };
      }
    } catch (erro) {
      // O jogo continua funcionando se o navegador bloquear o armazenamento.
    }

    return { tocando: false, silenciado: false, tempo: 0 };
  }

  function salvarEstado() {
    if (!audio) {
      return;
    }

    estado = {
      tocando: !audio.paused,
      silenciado: audio.muted,
      tempo: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
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

    if (!metadadosCarregados) {
      reproducaoPendente = true;
      return;
    }

    audio.play()
      .then(() => {
        salvarEstado();
      })
      .catch(() => {
        // Navegadores só permitem iniciar áudio após uma interação da criança.
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
    if (estado.tempo > 0 && estado.tempo < audio.duration) {
      audio.currentTime = estado.tempo;
    }

    if ((estado.tocando || reproducaoPendente) && !audio.muted) {
      reproducaoPendente = false;
      tocar();
    }
  }

  function iniciarAposInteracao() {
    if (!audio.muted) {
      tocar();
    }
  }

  function iniciar() {
    audio = new Audio(ARQUIVO_TRILHA);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VOLUME_PADRAO;
    audio.muted = estado.silenciado;

    audio.addEventListener("loadedmetadata", restaurarTempo, { once: true });
    audio.addEventListener("timeupdate", salvarEstado);
    audio.addEventListener("pause", salvarEstado);
    audio.addEventListener("ended", salvarEstado);

    document.querySelectorAll("[data-controle-som]").forEach((botao) => {
      botao.addEventListener("click", alternarSom);
    });

    // Atende às políticas de reprodução automática: a música começa na
    // primeira interação, inclusive quando a criança entra diretamente em uma fase.
    document.addEventListener("pointerdown", iniciarAposInteracao, { once: true, capture: true });
    document.addEventListener("keydown", iniciarAposInteracao, { once: true, capture: true });
    window.addEventListener("pagehide", salvarEstado);
    window.addEventListener("message", (evento) => {
      const tipo = evento.data?.tipo;
      const faseIncorporada = document.querySelector("#conteudo-fase");
      if (evento.source !== faseIncorporada?.contentWindow) {
        return;
      }

      if (tipo === "arruma-bagunca:alternar-som") {
        alternarSom();
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
