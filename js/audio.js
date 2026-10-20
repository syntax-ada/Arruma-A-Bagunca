/**
 * Trilha sonora e efeitos sonoros compartilhados entre as telas do jogo.
 *
 * O sistema de controle de volume inclui barra deslizante (slider) interativa,
 * troca dinâmica de ícones conforme o nível e persistência via localStorage.
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

  const ICONES_VOLUME = {
    cheio: "assets/images/tela_inicial/volume_full.png",
    medio: "assets/images/tela_inicial/volume_antes_mute.png",
    mudo: "assets/images/tela_inicial/volume_mute.png",
  };

  const CHAVE_SESSAO = "arruma_bagunca_trilha";
  const CHAVE_VOLUME_LOCAL = "arruma_bagunca_volume";
  const VOLUME_TRILHA_PADRAO = 0.25; // Volume entre 20% e 30% para não sobrepor efeitos
  const VOLUME_EFEITO_PADRAO = 1.0;  // Efeitos sonoros em volume normal

  let silenciadoIframe = false;
  let audio;
  let interacaoOcorreu = false;
  let metadadosCarregados = false;
  let reproducaoPendente = false;
  let interagindoComSlider = false;

  function lerVolumeSalvo() {
    try {
      const salvo = window.localStorage.getItem(CHAVE_VOLUME_LOCAL);
      if (salvo !== null) {
        const num = Number(salvo);
        if (Number.isFinite(num) && num >= 0 && num <= 100) {
          return Math.round(num);
        }
      }
    } catch (erro) {
      // Ignora erro de acesso ao localStorage
    }
    return 100;
  }

  function salvarVolume(valor) {
    try {
      window.localStorage.setItem(CHAVE_VOLUME_LOCAL, String(valor));
    } catch (erro) {
      // Ignora erro de acesso ao localStorage
    }
  }

  function resolverIconeVolume(valor) {
    const v = Number(valor);
    if (v >= 50) {
      return ICONES_VOLUME.cheio;
    }
    if (v > 0) {
      return ICONES_VOLUME.medio;
    }
    return ICONES_VOLUME.mudo;
  }

  let volumeAtual = lerVolumeSalvo();
  let volumeAnterior = volumeAtual > 0 ? volumeAtual : 100;

  function lerEstadoSessao() {
    try {
      const salvo = window.sessionStorage.getItem(CHAVE_SESSAO);
      if (salvo) {
        return {
          tocando: false,
          silenciado: volumeAtual === 0,
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
      silenciado: volumeAtual === 0,
      tempo: 0,
      trilha: TRILHAS_MUNDOS.menu,
    };
  }

  function estaSilenciado() {
    if (volumeAtual <= 0) {
      return true;
    }
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
    if (estaSilenciado() || volumeAtual <= 0) {
      return;
    }

    const caminho = resolverCaminhoEfeito(tipoOuCaminho);
    if (!caminho) {
      return;
    }

    try {
      const audioEfeito = new Audio(caminho);
      audioEfeito.volume = (volumeAtual / 100) * VOLUME_EFEITO_PADRAO;
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

  function atualizarVisualElementos(v) {
    const iconeSrc = resolverIconeVolume(v);

    document.querySelectorAll(".volume-slider").forEach((slider) => {
      if (!interagindoComSlider && Number(slider.value) !== v) {
        slider.value = v;
      }
      slider.setAttribute("aria-valuenow", String(v));
      slider.style.setProperty("--progresso", `${v}%`);
    });

    document.querySelectorAll(".volume-icone").forEach((icone) => {
      icone.src = iconeSrc;
      icone.alt = v === 0 ? "Volume mutado" : `Volume em ${v}%`;
    });

    document.querySelectorAll("[data-texto-som]").forEach((texto) => {
      texto.textContent = v === 0 ? "Som desligado" : `Volume ${v}%`;
    });

    document.querySelectorAll("[data-controle-som]").forEach((elem) => {
      elem.setAttribute("aria-pressed", String(v === 0));
    });
  }

  function aplicarVolume(novoValor, salvar = true, notificarIframe = true) {
    const v = Math.max(0, Math.min(100, Math.round(Number(novoValor) || 0)));
    volumeAtual = v;
    if (v > 0) {
      volumeAnterior = v;
    }

    if (salvar) {
      salvarVolume(v);
    }

    atualizarVisualElementos(v);

    if (window.parent !== window) {
      silenciadoIframe = (v === 0);
      window.parent.postMessage({
        tipo: "arruma-bagunca:definir-volume",
        volume: v,
      }, "*");
      return;
    }

    // Janela principal (topo): ajusta o objeto de áudio
    if (audio) {
      if (v === 0) {
        audio.muted = true;
        audio.volume = 0;
      } else {
        audio.muted = false;
        audio.volume = (v / 100) * VOLUME_TRILHA_PADRAO;
        if (audio.paused && (interacaoOcorreu || !reproducaoPendente)) {
          tocar();
        }
      }
      salvarEstado();
    }

    // Notifica iframe filho se estiver ativo (apenas quando notificarIframe for true)
    if (notificarIframe) {
      const faseIncorporada = document.querySelector("#conteudo-fase");
      if (faseIncorporada && faseIncorporada.contentWindow) {
        faseIncorporada.contentWindow.postMessage({
          tipo: "arruma-bagunca:estado-volume",
          volume: v,
        }, "*");
      }
    }
  }

  function alternarSom() {
    if (volumeAtual > 0) {
      volumeAnterior = volumeAtual;
      aplicarVolume(0, true);
    } else {
      aplicarVolume(volumeAnterior > 0 ? volumeAnterior : 100, true);
    }
  }

  function configurarControlesVolume() {
    document.querySelectorAll(".volume-container").forEach((container) => {
      if (container.dataset.configuradoVolume === "true") {
        return;
      }
      container.dataset.configuradoVolume = "true";

      const slider = container.querySelector(".volume-slider");

      // Clicar no container ou no ícone abre/fecha a barra deslizante
      container.addEventListener("click", (evento) => {
        if (evento.target.closest(".volume-slider")) {
          return;
        }
        evento.stopPropagation();

        // Fecha outros containers abertos
        document.querySelectorAll(".volume-container.ativo").forEach((outro) => {
          if (outro !== container) {
            outro.classList.remove("ativo");
            outro.setAttribute("aria-expanded", "false");
          }
        });

        const abrindo = !container.classList.contains("ativo");
        container.classList.toggle("ativo", abrindo);
        container.setAttribute("aria-expanded", String(abrindo));
      });

      // Suporte a teclado no container / ícone
      container.addEventListener("keydown", (evento) => {
        if (evento.target.closest(".volume-slider")) {
          return;
        }
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          evento.stopPropagation();
          const abrindo = !container.classList.contains("ativo");
          container.classList.toggle("ativo", abrindo);
          container.setAttribute("aria-expanded", String(abrindo));
        }
      });

      if (slider) {
        const isVertical = Boolean(
          container.classList.contains("btn-som-fase") ||
          slider.closest(".btn-som-fase")
        );

        function atualizarPorCoordenadaVertical(e) {
          const rect = slider.getBoundingClientRect();
          if (rect.height <= 0) return;
          const pct = 1 - ((e.clientY - rect.top) / rect.height);
          const val = Math.max(0, Math.min(100, Math.round(pct * 100)));
          slider.value = val;
          aplicarVolume(val, true);
        }

        if (isVertical) {
          let pointerAtivo = false;

          slider.addEventListener("pointerdown", (evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            pointerAtivo = true;
            interagindoComSlider = true;
            try {
              slider.setPointerCapture(evento.pointerId);
            } catch (_) {}
            atualizarPorCoordenadaVertical(evento);
          });

          slider.addEventListener("pointermove", (evento) => {
            if (!pointerAtivo) return;
            evento.preventDefault();
            evento.stopPropagation();
            atualizarPorCoordenadaVertical(evento);
          });

          const finalizarArrastoVertical = (evento) => {
            if (!pointerAtivo) return;
            evento.preventDefault();
            evento.stopPropagation();
            pointerAtivo = false;
            interagindoComSlider = false;
            try {
              if (slider.hasPointerCapture(evento.pointerId)) {
                slider.releasePointerCapture(evento.pointerId);
              }
            } catch (_) {}
          };

          slider.addEventListener("pointerup", finalizarArrastoVertical);
          slider.addEventListener("pointercancel", finalizarArrastoVertical);
        } else {
          slider.addEventListener("pointerdown", (evento) => {
            evento.stopPropagation();
            interagindoComSlider = true;
          });
          slider.addEventListener("pointerup", (evento) => {
            evento.stopPropagation();
            interagindoComSlider = false;
          });
          slider.addEventListener("pointercancel", (evento) => {
            evento.stopPropagation();
            interagindoComSlider = false;
          });
        }

        // Isola todos os eventos de mouse/touch do slider para evitar interferência com o motor de jogo
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
        eventosIsolamento.forEach((evtNome) => {
          slider.addEventListener(evtNome, (evento) => {
            evento.stopPropagation();
          });
        });

        slider.addEventListener("click", (evento) => {
          evento.stopPropagation();
        });

        slider.addEventListener("input", (evento) => {
          interagindoComSlider = true;
          const val = Number(evento.target.value);
          aplicarVolume(val, true);
        });

        slider.addEventListener("change", () => {
          interagindoComSlider = false;
        });

        slider.addEventListener("keydown", (evento) => {
          evento.stopPropagation();
          interagindoComSlider = true;
        });

        slider.addEventListener("keyup", (evento) => {
          evento.stopPropagation();
          interagindoComSlider = false;
        });
      }
    });

    // Compatibilidade com botões com atributo [data-controle-som]
    document.querySelectorAll("[data-controle-som]:not(.volume-container)").forEach((botao) => {
      if (botao.dataset.configuradoSomClick === "true") {
        return;
      }
      botao.dataset.configuradoSomClick = "true";
      botao.addEventListener("click", () => {
        alternarSom();
      });
    });

    // Fecha a barra deslizante ao clicar fora
    document.addEventListener("click", (evento) => {
      if (!evento.target.closest(".volume-container")) {
        document.querySelectorAll(".volume-container.ativo").forEach((c) => {
          c.classList.remove("ativo");
          c.setAttribute("aria-expanded", "false");
        });
      }
    });

    // Fecha a barra deslizante com Escape
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") {
        document.querySelectorAll(".volume-container.ativo").forEach((c) => {
          c.classList.remove("ativo");
          c.setAttribute("aria-expanded", "false");
        });
      }
    });
  }

  // Liberação global de interação caso o ponteiro seja solto fora dos limites
  window.addEventListener("pointerup", () => {
    interagindoComSlider = false;
  });
  window.addEventListener("pointercancel", () => {
    interagindoComSlider = false;
  });

  // Sincronização entre abas/janelas via StorageEvent
  window.addEventListener("storage", (evento) => {
    if (evento.key === CHAVE_VOLUME_LOCAL && evento.newValue !== null) {
      const num = Number(evento.newValue);
      if (Number.isFinite(num) && !interagindoComSlider) {
        aplicarVolume(num, false);
      }
    }
  });

  // Quando a fase é exibida dentro do menu (iframe), o áudio principal
  // pertence à janela-mãe. A fase controla e sincroniza mensagens com ela.
  if (window.parent !== window) {
    silenciadoIframe = (volumeAtual === 0);

    const inicializarIframe = () => {
      configurarControlesVolume();
      aplicarVolume(volumeAtual, false);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", inicializarIframe);
    } else {
      inicializarIframe();
    }

    window.addEventListener("message", (evento) => {
      const tipo = evento.data?.tipo;
      if (tipo === "arruma-bagunca:estado-volume" && typeof evento.data.volume === "number") {
        if (!interagindoComSlider) {
          aplicarVolume(evento.data.volume, false);
        }
      } else if (tipo === "arruma-bagunca:estado-som") {
        const silenciado = evento.data.silenciado;
        silenciadoIframe = Boolean(silenciado);
        if (!interagindoComSlider) {
          if (silenciado && volumeAtual > 0) {
            aplicarVolume(0, false);
          } else if (!silenciado && volumeAtual === 0) {
            aplicarVolume(volumeAnterior > 0 ? volumeAnterior : 100, false);
          }
        }
      }
    });

    window.parent.postMessage({ tipo: "arruma-bagunca:solicitar-estado-volume" }, "*");
    window.parent.postMessage({ tipo: "arruma-bagunca:solicitar-estado-som" }, "*");
    return;
  }

  // --- Execução na Janela Principal (Topo) ---
  let estado = lerEstadoSessao();
  let trilhaAtual = resolverCaminhoTrilha(estado.trilha || TRILHAS_MUNDOS.menu);

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
    audio.volume = (volumeAtual / 100) * VOLUME_TRILHA_PADRAO;
    audio.muted = (volumeAtual === 0);

    audio.addEventListener("loadedmetadata", restaurarTempo);
    audio.addEventListener("timeupdate", salvarEstado);
    audio.addEventListener("pause", salvarEstado);
    audio.addEventListener("ended", salvarEstado);

    configurarControlesVolume();
    aplicarVolume(volumeAtual, false);

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

      if (tipo === "arruma-bagunca:definir-volume" && typeof evento.data.volume === "number") {
        aplicarVolume(evento.data.volume, true, false);
      }

      if (tipo === "arruma-bagunca:solicitar-estado-volume") {
        evento.source?.postMessage({
          tipo: "arruma-bagunca:estado-volume",
          volume: volumeAtual,
        }, "*");
      }

      if (tipo === "arruma-bagunca:alternar-som") {
        alternarSom();
      }

      if (tipo === "arruma-bagunca:trocar-trilha") {
        trocarTrilhaFundoNoTopo(evento.data.trilha);
      }

      if (tipo === "arruma-bagunca:solicitar-estado-som") {
        evento.source?.postMessage({
          tipo: "arruma-bagunca:estado-som",
          silenciado: (volumeAtual === 0 || audio.muted),
          volume: volumeAtual,
        }, "*");
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        salvarEstado();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
