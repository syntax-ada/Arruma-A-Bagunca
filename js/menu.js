const botaoJogar = document.querySelector("#botao-jogar");
const telaInicial = document.querySelector("#tela-inicial");
const menuFases = document.querySelector("#menu-fases");
const controlesIniciais = document.querySelector("#controles-iniciais");
const botaoVoltar = document.querySelector("#btn-voltar");
const botaoFase1 = document.querySelector("#botao-fase1");
const cardMundo2 = document.querySelector("#card-mundo-2");
const cardMundo3 = document.querySelector("#card-mundo-3");
const cardMundo4 = document.querySelector("#card-mundo-4");
const modalFases = document.querySelector("#modal-fases");
const btnFecharModal = document.querySelector("#btn-fechar-modal");
const botaoCreditos = document.querySelector("#botao-creditos");
const modalCreditos = document.querySelector("#modal-creditos");
const btnFecharCreditos = document.querySelector("#btn-fechar-creditos");
const btnIniciarFase1 = document.querySelector("#btn-iniciar-fase1");
const btnIniciarFase2 = document.querySelector("#btn-iniciar-fase2");
const btnIniciarFase3 = document.querySelector("#btn-iniciar-fase3");
const trilhoPreenchimento = document.querySelector(".preenchimento-progresso");
const textoProgresso = document.querySelector(".porcentagem-progresso");
const carrosselMundos = document.querySelector(".carrossel-mundos");
const btnSetaEsquerda = document.querySelector('.btn-seta[aria-label="Mundo anterior"]');
const btnSetaDireita = document.querySelector('.btn-seta[aria-label="Próximo mundo"]');
const conteudoFase = document.querySelector("#conteudo-fase");
const sidebarBoss = document.querySelector("#boss-sidebar-card, #sidebar-boss");
const btnFecharSidebarBoss = document.querySelector("#btn-fechar-sidebar-boss");
const btnJogarBoss = document.querySelector("#btn-jogar-boss");
const btnIconeBoss = document.querySelector("#btn-icone-boss");
let sidebarBossFechadaManualmente = false;
let novoMapaDesbloqueadoPendente = false;

function tocarSomBotao() {
  if (typeof window.tocarEfeito === "function") {
    window.tocarEfeito("botao");
  }
}

/**
 * Mantém o menu (e a trilha sonora) carregado enquanto a fase é trocada.
 * Assim, só o conteúdo da fase é recarregado e a música não sofre cortes.
 */
function abrirFase(url) {
  if (!conteudoFase) {
    window.location.href = url;
    return;
  }

  conteudoFase.src = url;
  conteudoFase.classList.remove("escondido");
}

function obterFonteVideoCutsceneBoss() {
  const isMobile = window.innerWidth <= 768 || (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 768px)").matches);
  if (isMobile) {
    return "assets/images/nova_tela_menu de_fases/cena_boss_celular.mp4";
  }
  return "assets/images/nova_tela_menu de_fases/cena_boss_final.mp4";
}

let cutsceneBossAutorizada = false;

function reproduzirCutsceneBoss(aoFinalizar, opcoes = {}) {
  const acionamentoIntencional = Boolean(opcoes && opcoes.acionamentoIntencional);
  const autorizada =
    acionamentoIntencional ||
    cutsceneBossAutorizada ||
    Boolean(typeof window !== "undefined" && window.playBossCutscene);

  if (!autorizada) {
    console.warn("[menu.js] Cutscene do Boss bloqueada: acionamento passivo sem clique intencional.");
    if (typeof aoFinalizar === "function") {
      aoFinalizar();
    }
    return;
  }

  // Consumo imediato das variáveis de estado antes ou assim que o vídeo começa
  cutsceneBossAutorizada = false;
  if (typeof window !== "undefined") {
    window.playBossCutscene = false;
  }
  try {
    if (localStorage.getItem("playBossCutscene") !== null) {
      localStorage.removeItem("playBossCutscene");
    }
    if (sessionStorage.getItem("playBossCutscene") !== null) {
      sessionStorage.removeItem("playBossCutscene");
    }
    if (localStorage.getItem("arruma_bagunca_cutscene_boss") !== null) {
      localStorage.removeItem("arruma_bagunca_cutscene_boss");
    }
    if (sessionStorage.getItem("arruma_bagunca_cutscene_boss") !== null) {
      sessionStorage.removeItem("arruma_bagunca_cutscene_boss");
    }
    if (sessionStorage.getItem("arruma_bagunca_mundo_concluido") !== null) {
      sessionStorage.removeItem("arruma_bagunca_mundo_concluido");
    }
  } catch (_erro) {}

  const modalVideo = document.querySelector("#modal-cutscene-boss");
  const video = document.querySelector("#video-cutscene-boss");
  const btnPular = document.querySelector("#btn-pular-cutscene");
  if (!modalVideo || !video) {
    if (typeof aoFinalizar === "function") aoFinalizar();
    return;
  }

  const fonteVideo = obterFonteVideoCutsceneBoss();
  const sourceEl = video.querySelector("source");
  if (sourceEl) {
    sourceEl.src = fonteVideo;
  }
  video.src = fonteVideo;
  video.load();

  video.onplay = function () {
    try {
      if (localStorage.getItem("playBossCutscene") !== null) {
        localStorage.removeItem("playBossCutscene");
      }
      if (sessionStorage.getItem("playBossCutscene") !== null) {
        sessionStorage.removeItem("playBossCutscene");
      }
      if (localStorage.getItem("arruma_bagunca_cutscene_boss") !== null) {
        localStorage.removeItem("arruma_bagunca_cutscene_boss");
      }
      if (sessionStorage.getItem("arruma_bagunca_cutscene_boss") !== null) {
        sessionStorage.removeItem("arruma_bagunca_cutscene_boss");
      }
      if (sessionStorage.getItem("arruma_bagunca_mundo_concluido") !== null) {
        sessionStorage.removeItem("arruma_bagunca_mundo_concluido");
      }
    } catch (_erro) {}
    cutsceneBossAutorizada = false;
    if (typeof window !== "undefined") {
      window.playBossCutscene = false;
    }
  };

  modalVideo.classList.remove("escondido");

  if (typeof window.pausarTrilhaFundo === "function") {
    window.pausarTrilhaFundo();
  }

  let finalizado = false;
  function finalizar() {
    if (finalizado) return;
    finalizado = true;
    if (btnPular) btnPular.onclick = null;
    video.onended = null;
    video.onerror = null;
    video.onclick = null;
    try {
      video.pause();
      video.currentTime = 0;
    } catch (e) {}
    modalVideo.classList.add("escondido");

    if (typeof window.trocarTrilhaFundo === "function") {
      window.trocarTrilhaFundo("menu");
    }

    if (typeof aoFinalizar === "function") {
      aoFinalizar();
    }
  }

  if (btnPular) {
    btnPular.onclick = finalizar;
  }
  video.onended = finalizar;
  video.onerror = function () {
    console.warn("[menu.js] Falha ao reproduzir cutscene do Boss. Avançando.");
    finalizar();
  };

  video.onclick = function () {
    if (video.muted) {
      video.muted = false;
    }
  };

  video.muted = false;
  const promessaPlay = video.play();
  if (promessaPlay !== undefined) {
    promessaPlay.catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }
}

let mundoPendenteAnimacao = null;

function exibirTransicaoCadeado(mundoConcluido, aoFinalizar) {
  const proximoMundo = Number(mundoConcluido) + 1;
  const modal = document.querySelector("#modal-transicao-cadeado");
  const imgMundo = document.querySelector("#img-mundo-desbloqueado");
  const iconeCadeado = document.querySelector("#icone-cadeado-transicao");
  const subtitulo = document.querySelector("#subtitulo-transicao-cadeado");
  const btnContinuar = document.querySelector("#btn-continuar-transicao");
  const arena = document.querySelector("#arena-cadeado");

  // Consome a flag imediatamente ao abrir o modal para garantir execução única
  consumirFlagTransicaoCadeado();

  if (!modal || proximoMundo > 4) {
    if (typeof aoFinalizar === "function") aoFinalizar();
    return;
  }

  const DADOS_MUNDOS = {
    2: { nome: "Mundo 2: O Parque", img: "assets/images/nova_tela_menu de_fases/mundo_2.png" },
    3: { nome: "Mundo 3: A Praia", img: "assets/images/nova_tela_menu de_fases/mundo_3.png" },
    4: { nome: "Mundo 4: O Acampamento", img: "assets/images/nova_tela_menu de_fases/mundo_4.png" },
  };

  const info = DADOS_MUNDOS[proximoMundo] || DADOS_MUNDOS[2];

  if (imgMundo) {
    imgMundo.src = info.img;
    imgMundo.alt = info.nome;
    imgMundo.classList.remove("mundo-desbloqueado-brilho");
  }

  if (subtitulo) {
    subtitulo.textContent = `Você desbloqueou o ${info.nome}!`;
  }

  if (iconeCadeado) {
    iconeCadeado.textContent = "🔒";
    iconeCadeado.className = "icone-cadeado-transicao cadeado-tremendo";
  }
  arena?.classList.remove("efeito-explosao-ativo");

  modal.classList.remove("escondido");

  if (typeof window.tocarEfeito === "function") {
    window.tocarEfeito("conclusao");
  }

  const timerQuebra = setTimeout(() => {
    if (iconeCadeado) {
      iconeCadeado.textContent = "🔓";
      iconeCadeado.classList.remove("cadeado-tremendo");
      iconeCadeado.classList.add("cadeado-quebrado");
    }
    if (imgMundo) {
      imgMundo.classList.add("mundo-desbloqueado-brilho");
    }
    arena?.classList.add("efeito-explosao-ativo");
    if (typeof window.tocarEfeito === "function") {
      window.tocarEfeito("certo");
    }
  }, 950);

  let fechado = false;
  function fechar() {
    if (fechado) return;
    fechado = true;
    clearTimeout(timerQuebra);
    modal.classList.add("escondido");
    if (btnContinuar) btnContinuar.onclick = null;

    if (typeof aoFinalizar === "function") {
      aoFinalizar();
    }
  }

  if (btnContinuar) {
    btnContinuar.onclick = fechar;
  }
}

const CHAVE_TRANSICOES_VISTAS = "arruma_bagunca_transicoes_vistas";

function obterTransicoesVistas() {
  try {
    const salvas = localStorage.getItem(CHAVE_TRANSICOES_VISTAS);
    if (!salvas) return [];
    const lista = JSON.parse(salvas);
    return Array.isArray(lista) ? lista.map(Number) : [];
  } catch (e) {
    return [];
  }
}

function transicaoJaFoiVista(mundoConcluido) {
  const num = Number(mundoConcluido);
  if (!num) return true;
  const vistas = obterTransicoesVistas();
  return vistas.includes(num);
}

function marcarTransicaoComoVista(mundoConcluido) {
  const num = Number(mundoConcluido);
  if (!num) return;
  const vistas = obterTransicoesVistas();
  if (!vistas.includes(num)) {
    vistas.push(num);
    try {
      localStorage.setItem(CHAVE_TRANSICOES_VISTAS, JSON.stringify(vistas));
    } catch (e) {}
  }
}

function limparTransicoesVistas() {
  try {
    localStorage.removeItem(CHAVE_TRANSICOES_VISTAS);
  } catch (e) {}
}

function lerFlagTransicaoCadeado() {
  const urlParams = new URLSearchParams(window.location.search);

  // 1. Verifica parâmetro da URL
  let mundoDesbloqueado = parseInt(urlParams.get("mundoDesbloqueadoAnimacao"), 10) || null;
  let playLock = urlParams.get("playLockAnimation") === "true";
  let mundoConcluido = parseInt(urlParams.get("mundoConcluido"), 10) || null;

  // 2. Se não estiver na URL, verifica sessionStorage
  if (!mundoDesbloqueado) {
    try {
      mundoDesbloqueado = parseInt(sessionStorage.getItem("mundoDesbloqueadoAnimacao"), 10)
        || parseInt(sessionStorage.getItem("arruma_bagunca_mundo_desbloqueado_animacao"), 10)
        || null;
    } catch (_) {}
  }
  if (!playLock) {
    try {
      playLock = sessionStorage.getItem("playLockAnimation") === "true";
    } catch (_) {}
  }
  if (!mundoConcluido) {
    try {
      mundoConcluido = parseInt(sessionStorage.getItem("arruma_bagunca_mundo_concluido"), 10) || null;
    } catch (_) {}
  }

  // 3. Se ainda não achou, verifica localStorage
  if (!mundoDesbloqueado) {
    try {
      mundoDesbloqueado = parseInt(localStorage.getItem("mundoDesbloqueadoAnimacao"), 10)
        || parseInt(localStorage.getItem("arruma_bagunca_mundo_desbloqueado_animacao"), 10)
        || null;
    } catch (_) {}
  }
  if (!playLock) {
    try {
      playLock = localStorage.getItem("playLockAnimation") === "true";
    } catch (_) {}
  }
  if (!mundoConcluido) {
    try {
      mundoConcluido = parseInt(localStorage.getItem("arruma_bagunca_mundo_concluido"), 10) || null;
    } catch (_) {}
  }

  if (!mundoDesbloqueado && mundoConcluido && mundoConcluido >= 1 && mundoConcluido <= 3) {
    mundoDesbloqueado = mundoConcluido + 1;
    playLock = true;
  }
  if (mundoDesbloqueado && !mundoConcluido) {
    mundoConcluido = mundoDesbloqueado - 1;
    playLock = true;
  }

  return {
    mundoDesbloqueado,
    playLockAnimation: playLock || Boolean(mundoDesbloqueado),
    mundoConcluido
  };
}

function consumirFlagTransicaoCadeado() {
  try {
    sessionStorage.removeItem("mundoDesbloqueadoAnimacao");
    sessionStorage.removeItem("arruma_bagunca_mundo_desbloqueado_animacao");
    sessionStorage.removeItem("playLockAnimation");
    sessionStorage.removeItem("arruma_bagunca_mundo_concluido");
  } catch (_) {}
  try {
    localStorage.removeItem("mundoDesbloqueadoAnimacao");
    localStorage.removeItem("arruma_bagunca_mundo_desbloqueado_animacao");
    localStorage.removeItem("playLockAnimation");
    localStorage.removeItem("arruma_bagunca_mundo_concluido");
  } catch (_) {}
}

function rolarCarrosselParaMundo(mundoId) {
  if (!carrosselMundos) return;
  const card = carrosselMundos.querySelector(`[data-mundo="${mundoId}"]`);
  if (card && typeof card.scrollIntoView === "function") {
    card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
}

function mostrarMenuMundos(mundoConcluido, forcarAnimacao = false) {
  if (!conteudoFase) {
    return;
  }

  conteudoFase.classList.add("escondido");
  conteudoFase.src = "about:blank";
  telaInicial?.classList.add("escondido");
  controlesIniciais?.classList.add("escondido");
  menuFases?.classList.remove("escondido");

  const numMundo = Number(mundoConcluido);
  const devAtivo = isModoDevAtivo();
  const proximoMundo = numMundo + 1;

  // Conclusão do Mundo 4 (Fase 3): destaca a sidebar do Boss no menu sem acionamento passivo de vídeo
  if (numMundo === 4) {
    sidebarBossFechadaManualmente = false;
    atualizarInterfaceProgresso();
    const sidebar = document.querySelector("#sidebar-boss");
    if (sidebar) {
      sidebar.classList.remove("escondido");
      sidebar.classList.add("animacao-destaque-boss");
      setTimeout(() => sidebar.classList.remove("animacao-destaque-boss"), 1400);
    }
  } else if (numMundo >= 1 && numMundo <= 3) {
    // Quebra de cadeado: exibida no primeiro desbloqueio, se forçada pela transição ou no Modo Dev
    const deveAnimar = forcarAnimacao || devAtivo || !transicaoJaFoiVista(numMundo);
    if (deveAnimar) {
      mundoPendenteAnimacao = proximoMundo;
      mundoSelecionado = proximoMundo;
      atualizarInterfaceProgresso();
      setTimeout(() => rolarCarrosselParaMundo(proximoMundo), 50);

      marcarTransicaoComoVista(numMundo);
      exibirTransicaoCadeado(numMundo, () => {
        mundoPendenteAnimacao = null;
        mundoSelecionado = proximoMundo;
        atualizarInterfaceProgresso();
        rolarCarrosselParaMundo(proximoMundo);
        if (typeof window.trocarTrilhaFundo === "function") {
          window.trocarTrilhaFundo("menu");
        }
      });
    } else {
      mundoPendenteAnimacao = null;
      mundoSelecionado = proximoMundo;
      atualizarInterfaceProgresso();
      rolarCarrosselParaMundo(proximoMundo);
      if (typeof window.trocarTrilhaFundo === "function") {
        window.trocarTrilhaFundo("menu");
      }
    }
  } else {
    mundoPendenteAnimacao = null;
    atualizarInterfaceProgresso();
    if (typeof window.trocarTrilhaFundo === "function") {
      window.trocarTrilhaFundo("menu");
    }
  }
  if (novoMapaDesbloqueadoPendente && typeof window.tocarNarracao === "function") {
    novoMapaDesbloqueadoPendente = false;
    window.tocarNarracao("novoMapa");
  }
}

/**
 * Obtém a largura de um card incluindo o gap do carrossel para o passo de rolagem.
 */
function obterLarguraPassoCarrossel() {
  if (!carrosselMundos) {
    return 300;
  }
  const primeiroCard = carrosselMundos.querySelector(".card-mundo");
  if (!primeiroCard) {
    return 300;
  }

  const cardRect = primeiroCard.getBoundingClientRect();
  const estiloCarrossel = window.getComputedStyle(carrosselMundos);
  const gap = parseFloat(estiloCarrossel.gap) || parseFloat(estiloCarrossel.columnGap) || 0;

  return cardRect.width + gap;
}

if (btnSetaEsquerda && carrosselMundos) {
  btnSetaEsquerda.addEventListener("click", function () {
    tocarSomBotao();
    const larguraDoCard = obterLarguraPassoCarrossel();
    carrosselMundos.scrollBy({ left: -larguraDoCard, behavior: "smooth" });
  });
}

if (btnSetaDireita && carrosselMundos) {
  btnSetaDireita.addEventListener("click", function () {
    tocarSomBotao();
    const larguraDoCard = obterLarguraPassoCarrossel();
    carrosselMundos.scrollBy({ left: larguraDoCard, behavior: "smooth" });
  });
}

let mundoSelecionado = 1;

/**
 * O Modo Dev é decidido só por js/dev.js: em ambiente local, por ?dev=true; no
 * site publicado, depois de conferir a sessão administrativa no servidor.
 * Aqui apenas se lê o resultado (menu.js carrega antes; quando dev.js liga o
 * modo, ele chama atualizarInterfaceProgresso() de novo).
 */
function isModoDevAtivo() {
  if (window.modoDevLiberado === true) {
    return true;
  }
  if (window.modoDevLiberado === false) {
    return false;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const devParam = params.get("dev");
    if (devParam === "true" || devParam === "1") {
      const { protocol, hostname } = window.location;
      const isLocal = protocol === "file:" || ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
      if (isLocal) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

/**
 * Atualiza as ações dos botões de fase dentro do modal com base no mundo ativo.
 */
function atualizarBotoesModalFases(mundoId) {
  const devAtivo = isModoDevAtivo();
  const progresso = typeof obterProgresso === "function"
    ? obterProgresso()
    : { mundosDesbloqueados: [1], faseMaximaPorMundo: { 1: 1 }, fasesConcluidas: [] };

  const faseMaximaMundo = devAtivo ? 999 : (progresso.faseMaximaPorMundo?.[mundoId] || 1);
  const mundos = window.MUNDOS || {};
  const configMundo = mundos[mundoId];
  const totalFasesMundo = configMundo?.totalFases || 3;

  // Atualização contextual do título do modal com o nome do mundo
  const tituloModal = document.querySelector("#titulo-modal-fases");
  if (tituloModal && configMundo?.nome) {
    tituloModal.textContent = `Mundo ${mundoId} — ${configMundo.nome}`;
  } else if (tituloModal) {
    tituloModal.textContent = "Escolha uma fase para jogar!";
  }

  // Fase 1
  if (btnIniciarFase1) {
    const liberada = devAtivo || (faseMaximaMundo >= 1 && totalFasesMundo >= 1);
    if (liberada) {
      btnIniciarFase1.disabled = false;
      btnIniciarFase1.classList.remove("fase-bloqueada");
      btnIniciarFase1.classList.add("fase-ativa");
      btnIniciarFase1.innerHTML = `<img src="assets/images/mundo_1/fase_1_botao.png" alt="Fase 1" />`;
      btnIniciarFase1.setAttribute("aria-label", `Jogar Fase 1 do Mundo ${mundoId}`);
      btnIniciarFase1.onclick = function () {
        tocarSomBotao();
        const sufixoDev = devAtivo ? "&dev=true" : "";
        abrirFase(`fase1.html?mundo=${mundoId}&fase=1${sufixoDev}`);
        ocultarTutorialModalFases();
      };
    } else {
      btnIniciarFase1.disabled = true;
      btnIniciarFase1.classList.add("fase-bloqueada");
      btnIniciarFase1.classList.remove("fase-ativa");
      btnIniciarFase1.innerHTML = `<img src="assets/images/mundo_1/fase_1_botao.png" alt="Fase 1" /><span class="overlay-fase-bloqueada" aria-hidden="true">🔒</span>`;
      btnIniciarFase1.setAttribute("aria-label", `Fase 1 do Mundo ${mundoId}, bloqueada`);
      btnIniciarFase1.onclick = null;
    }
  }

  // Fase 2
  if (btnIniciarFase2) {
    const liberada = devAtivo || (faseMaximaMundo >= 2 && totalFasesMundo >= 2);
    if (liberada) {
      btnIniciarFase2.disabled = false;
      btnIniciarFase2.classList.remove("fase-bloqueada");
      btnIniciarFase2.classList.add("fase-ativa");
      btnIniciarFase2.innerHTML = `<img src="assets/images/mundo_1/fase_2_botao.png" alt="Fase 2" />`;
      btnIniciarFase2.setAttribute("aria-label", `Jogar Fase 2 do Mundo ${mundoId}`);
      btnIniciarFase2.onclick = function () {
        tocarSomBotao();
        const sufixoDev = devAtivo ? "&dev=true" : "";
        abrirFase(`fase1.html?mundo=${mundoId}&fase=2${sufixoDev}`);
      };
    } else {
      btnIniciarFase2.disabled = true;
      btnIniciarFase2.classList.add("fase-bloqueada");
      btnIniciarFase2.classList.remove("fase-ativa");
      btnIniciarFase2.innerHTML = `<img src="assets/images/mundo_1/fase_2_botao.png" alt="Fase 2" /><span class="overlay-fase-bloqueada" aria-hidden="true">🔒</span>`;
      btnIniciarFase2.setAttribute("aria-label", `Fase 2 do Mundo ${mundoId}, bloqueada`);
      btnIniciarFase2.onclick = null;
    }
  }

  // Fase 3
  if (btnIniciarFase3) {
    const liberada = devAtivo || (faseMaximaMundo >= 3 && totalFasesMundo >= 3);
    if (liberada) {
      btnIniciarFase3.disabled = false;
      btnIniciarFase3.classList.remove("fase-bloqueada");
      btnIniciarFase3.classList.add("fase-ativa");
      btnIniciarFase3.innerHTML = `<img src="assets/images/mundo_1/fase_3_botao.png" alt="Fase 3" />`;
      btnIniciarFase3.setAttribute("aria-label", `Jogar Fase 3 do Mundo ${mundoId}`);
      btnIniciarFase3.onclick = function () {
        tocarSomBotao();
        const sufixoDev = devAtivo ? "&dev=true" : "";
        abrirFase(`fase1.html?mundo=${mundoId}&fase=3${sufixoDev}`);
      };
    } else {
      btnIniciarFase3.disabled = true;
      btnIniciarFase3.classList.add("fase-bloqueada");
      btnIniciarFase3.classList.remove("fase-ativa");
      btnIniciarFase3.innerHTML = `<img src="assets/images/mundo_1/fase_3_botao.png" alt="Fase 3" /><span class="overlay-fase-bloqueada" aria-hidden="true">🔒</span>`;
      btnIniciarFase3.setAttribute("aria-label", `Fase 3 do Mundo ${mundoId}, bloqueada`);
      btnIniciarFase3.onclick = null;
    }
  }
}

/**
 * Abre o modal de seleção de fases se o mundo estiver desbloqueado (ou via bypass do Modo Dev).
 */
function ocultarTutorialModalFases() {
  document.querySelector("#tutorial-modal-fases-overlay")?.classList.add("escondido");
  document.querySelector("#tutorial-modal-fase1")?.classList.add("escondido");
  document.querySelector("#tutorial-backdrop-modal")?.classList.add("escondido");
  btnIniciarFase1?.classList.remove("tutorial-destaque-btn-fase");
  menuFases?.classList.remove("tutorial-menu-ativo");
}

function atualizarTutorialModalFases(mundoId, progresso, devAtivo) {
  const fasesConcluidas = Array.isArray(progresso?.fasesConcluidas) ? progresso.fasesConcluidas : [];
  const faseMaximaMundo1 = progresso?.faseMaximaPorMundo?.[1] || 1;
  const mundosLiberados = Array.isArray(progresso?.mundosDesbloqueados) ? progresso.mundosDesbloqueados : [1];
  const deveExibir = !devAtivo && Number(mundoId) === 1 && fasesConcluidas.length === 0 && faseMaximaMundo1 <= 1 && mundosLiberados.length <= 1;

  document.querySelector("#tutorial-modal-fases-overlay")?.classList.toggle("escondido", !deveExibir);
  document.querySelector("#tutorial-modal-fase1")?.classList.toggle("escondido", !deveExibir);
  document.querySelector("#tutorial-backdrop-modal")?.classList.toggle("escondido", !deveExibir);
  btnIniciarFase1?.classList.toggle("tutorial-destaque-btn-fase", deveExibir);
  menuFases?.classList.toggle("tutorial-menu-ativo", deveExibir);
}

function abrirModalFases(mundoId) {
  const devAtivo = isModoDevAtivo();
  const progresso = typeof obterProgresso === "function"
    ? obterProgresso()
    : { mundosDesbloqueados: [1], faseMaximaPorMundo: { 1: 1 }, fasesConcluidas: [] };

  const mundosLiberados = progresso.mundosDesbloqueados || [1];
  const id = Number(mundoId) || 1;

  // Trava de progressão com bypass do Modo Dev
  if (!devAtivo && !mundosLiberados.includes(id)) {
    return;
  }

  mundoSelecionado = id;
  atualizarBotoesModalFases(mundoSelecionado);

  if (modalFases) {
    modalFases.classList.remove("escondido");
    if (typeof window.tocarNarracao === "function") {
      window.tocarNarracao("telaDeFases");
    }
    const tutorialMenuMundo1 = document.querySelector("#tutorial-menu-mundo1");
    if (tutorialMenuMundo1) {
      tutorialMenuMundo1.classList.add("escondido");
    }
    atualizarTutorialModalFases(mundoSelecionado, progresso, devAtivo);
  }
}

/**
 * Atualiza a interface do menu de acordo com os dados de progresso salvos.
 */
function atualizarInterfaceProgresso() {
  const devAtivo = isModoDevAtivo();
  const progresso = typeof obterProgresso === "function"
    ? obterProgresso()
    : { mundosDesbloqueados: [1], faseMaximaPorMundo: { 1: 1 }, fasesConcluidas: [] };

  const faseMaximaMundo1 = progresso.faseMaximaPorMundo?.[1] || 1;
  const mundosLiberados = progresso.mundosDesbloqueados || [1];

  // 1. Atualização dos botões do modal para o mundo selecionado
  atualizarBotoesModalFases(mundoSelecionado);

  // 2. Atualização visual dos cards dos Mundos no carrossel
  const cardsMundo = document.querySelectorAll(".card-mundo");
  cardsMundo.forEach((card) => {
    const rawMundo = card.dataset.mundo;
    const id = rawMundo ? parseInt(rawMundo, 10) : 1;
    const liberado = devAtivo || mundosLiberados.includes(id);
    const emAnimacao = Boolean(mundoPendenteAnimacao && id === mundoPendenteAnimacao);
    const liberadoVisual = liberado && !emAnimacao;
    const overlay = card.querySelector(".overlay-bloqueado");

    if (liberadoVisual) {
      card.classList.remove("mundo-bloqueado");
      card.classList.add("mundo-disponivel");
      if (overlay) {
        overlay.classList.add("escondido");
      }
    } else {
      card.classList.add("mundo-bloqueado");
      card.classList.remove("mundo-disponivel");
      if (overlay) {
        overlay.classList.remove("escondido");
      }
    }
  });

  // 3. Atualização visual da barra de progresso
  // Escala recalibrada para 4 mundos: os degraus do Mundo 1 (10/25/45) e o
  // desbloqueio do Mundo 2 (66) ficam como estavam; o antigo teto do Mundo 3
  // (100) passa a 83, e o Mundo 4 desbloqueado assume o teto de 100%.
  let porcentagem = 10;
  if (mundosLiberados.includes(4)) {
    porcentagem = 100;
  } else if (mundosLiberados.includes(3)) {
    porcentagem = 83;
  } else if (mundosLiberados.includes(2)) {
    porcentagem = 66;
  } else if (faseMaximaMundo1 >= 3) {
    porcentagem = 45;
  } else if (faseMaximaMundo1 >= 2) {
    porcentagem = 25;
  }

  if (trilhoPreenchimento) {
    trilhoPreenchimento.style.width = `${porcentagem}%`;
  }
  if (textoProgresso) {
    textoProgresso.textContent = `${porcentagem}%`;
  }

  // Tutorial do Menu Inicial (exibido no card do Mundo 1 quando o jogador ainda não tem progresso)
  const tutorialMenuMundo1 = document.querySelector("#tutorial-menu-mundo1");
  if (tutorialMenuMundo1) {
    const fasesConcluidas = Array.isArray(progresso.fasesConcluidas) ? progresso.fasesConcluidas : [];
    const modalAberto = modalFases && !modalFases.classList.contains("escondido");
    const semProgresso = !devAtivo && !modalAberto && fasesConcluidas.length === 0 && faseMaximaMundo1 <= 1 && mundosLiberados.length <= 1;
    tutorialMenuMundo1.classList.toggle("escondido", !semProgresso);
    menuFases?.classList.toggle("tutorial-menu-ativo", semProgresso);
  }
  if (false) {
  }

  // 4. Controle de exibição da Sidebar do Boss (Mundo 5) e Ícone Flutuante
  const bossDesbloqueado = devAtivo || mundosLiberados.includes(5);
  if (bossDesbloqueado) {
    if (!sidebarBossFechadaManualmente) {
      sidebarBoss?.classList.remove("escondido");
      btnIconeBoss?.classList.add("escondido");
    } else {
      sidebarBoss?.classList.add("escondido");
      btnIconeBoss?.classList.remove("escondido");
    }
  } else {
    sidebarBoss?.classList.add("escondido");
    btnIconeBoss?.classList.add("escondido");
  }
}

/**
 * Mostra o menu de mundos. Usado depois da identificação do jogador e pelo
 * caminho ?view=mundos.
 */
function entrarNoMenuDeMundos() {
  const jogadorAtual = typeof window.obterJogadorIdentificado === "function"
    ? window.obterJogadorIdentificado()
    : null;
  carregarAvatarSalvo(jogadorAtual);
  telaInicial?.classList.add("escondido");
  controlesIniciais?.classList.add("escondido");
  menuFases?.classList.remove("escondido");
  atualizarInterfaceProgresso();
}

/**
 * Abre a tela de identificação (js/jogador.js). Ao confirmar o apelido, segue
 * para o menu de mundos; ao voltar, retorna à tela inicial.
 * Não mexe no progresso salvo.
 */
function abrirIdentificacaoDoJogador(opcoes = {}) {
  if (typeof window.iniciarIdentificacao !== "function") {
    console.error("[menu.js] js/jogador.js não foi carregado antes de menu.js.");
    return;
  }

  telaInicial?.classList.add("escondido");
  controlesIniciais?.classList.add("escondido");
  window.iniciarIdentificacao({
    aoConcluir: typeof opcoes.aoConcluir === "function" ? opcoes.aoConcluir : entrarNoMenuDeMundos,
    aoVoltar: typeof opcoes.aoVoltar === "function" ? opcoes.aoVoltar : function () {
      telaInicial?.classList.remove("escondido");
      controlesIniciais?.classList.remove("escondido");
    },
  });
}

// Navegação básica da tela inicial e menus
if (botaoJogar && telaInicial && menuFases && controlesIniciais) {
  botaoJogar.addEventListener("click", function () {
    tocarSomBotao();
    // JOGAR não apaga progresso (nem no navegador, nem no banco): depois da
    // identificação, js/progresso.js carrega o progresso DESTE jogador.
    abrirIdentificacaoDoJogador();
  });
}

if (botaoVoltar && telaInicial && menuFases && controlesIniciais) {
  botaoVoltar.addEventListener("click", function () {
    tocarSomBotao();
    if (typeof window.trocarTrilhaFundo === "function") {
      window.trocarTrilhaFundo("menu");
    }
    if (modalFases) {
      modalFases.classList.add("escondido");
    ocultarTutorialModalFases();
    atualizarInterfaceProgresso();
    }
    menuFases.classList.add("escondido");
    telaInicial.classList.remove("escondido");
    controlesIniciais.classList.remove("escondido");
  });
}

// Controle da Sidebar do Boss (Mundo 5)
if (btnFecharSidebarBoss) {
  btnFecharSidebarBoss.addEventListener("click", function () {
    tocarSomBotao();
    sidebarBossFechadaManualmente = true;
    sidebarBoss?.classList.add("escondido");
    btnIconeBoss?.classList.remove("escondido");
  });
}

if (btnIconeBoss) {
  btnIconeBoss.addEventListener("click", function () {
    tocarSomBotao();
    sidebarBossFechadaManualmente = false;
    btnIconeBoss?.classList.add("escondido");
    sidebarBoss?.classList.remove("escondido");
  });
}

if (btnJogarBoss) {
  btnJogarBoss.addEventListener("click", function () {
    tocarSomBotao();
    const devAtivo = isModoDevAtivo();
    const sufixoDev = devAtivo ? "&dev=true" : "";
    cutsceneBossAutorizada = true;
    reproduzirCutsceneBoss(() => {
      abrirFase(`fase1.html?mundo=5&fase=1${sufixoDev}`);
    }, { acionamentoIntencional: true });
  });
}

// Abertura do modal de seleção de fases em todos os cards do carrossel
const cardsCarrossel = document.querySelectorAll(".card-mundo");
cardsCarrossel.forEach((card) => {
  card.onclick = null;
  card.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    tocarSomBotao();
    const rawMundo = card.dataset.mundo;
    const mundoId = rawMundo ? parseInt(rawMundo, 10) : 1;
    abrirModalFases(mundoId);
  });
});

if (btnFecharModal && modalFases) {
  btnFecharModal.addEventListener("click", function () {
    tocarSomBotao();
    modalFases.classList.add("escondido");
    ocultarTutorialModalFases();
    atualizarInterfaceProgresso();
  });
}

// Controle do Modal de Créditos
if (botaoCreditos && modalCreditos) {
  botaoCreditos.addEventListener("click", function () {
    tocarSomBotao();
    modalCreditos.classList.remove("escondido");
  });
}

// Controle do Modal de Configurações
const modalConfiguracoes = document.querySelector("#modal-configuracoes");
const btnConfigInicial = document.querySelector("#btn-config");
const btnConfigMundos = document.querySelector("#btn-config-mundos");
const btnFecharConfig = document.querySelector("#btn-fechar-config");
const configNickname = document.querySelector("#config-nickname");
const btnConfigSair = document.querySelector("#btn-config-sair");
const btnConfigEditarAvatar = document.querySelector("#btn-config-editar-avatar");
const configAvatarImg = document.querySelector("#config-avatar-img");
const avatarJogadorTopo = document.querySelector("#avatar-jogador");
const modalAvatares = document.querySelector("#modal-avatares");
const btnFecharAvatares = document.querySelector("#btn-fechar-avatares");
const carrosselAvataresViewport = document.querySelector("#carrossel-avatares-viewport");
const carrosselAvataresTrilha = document.querySelector("#carrossel-avatares-trilha");
const btnAvataresAnterior = document.querySelector("#btn-avatares-anterior");
const btnAvataresProximo = document.querySelector("#btn-avatares-proximo");
const nomeAvatarFoco = document.querySelector("#nome-avatar-foco");
const btnConfirmarAvatar = document.querySelector("#btn-confirmar-avatar");

const CHAVE_AVATAR_STORAGE = "arruma_bagunca_avatar_escolhido";
const CATALOGO_AVATARES = [
  { id: "cachorro", nome: "Cachorro", src: "assets/images/Settings/Avatares/Cachorro.png" },
  { id: "gato", nome: "Gato", src: "assets/images/Settings/Avatares/Gato.png" },
  { id: "coala", nome: "Coala", src: "assets/images/Settings/Avatares/Coala.png" },
  { id: "coelho", nome: "Coelho", src: "assets/images/Settings/Avatares/Coelho.png" },
  { id: "raposo", nome: "Raposo", src: "assets/images/Settings/Avatares/raposo.png" },
  { id: "golfinho", nome: "Golfinho", src: "assets/images/Settings/Avatares/Golfinho.png" },
  { id: "ave-maluca", nome: "Ave Maluca", src: "assets/images/Settings/Avatares/Ave maluca.png" },
  { id: "galineo", nome: "Galineo", src: "assets/images/Settings/Avatares/galineo.png" },
  { id: "chifrudo", nome: "Chifrudo", src: "assets/images/Settings/Avatares/chifrudo.png" },
  { id: "monstro", nome: "Monstro!", src: "assets/images/Settings/Avatares/Monstro!.png" },
];
window.CATALOGO_AVATARES = CATALOGO_AVATARES;

let indiceAvatarEscolhido = 0;
let posicaoCarrosselAvatares = 0;
let elementosOpcaoAvatar = [];
let suprimirCliquePosArraste = false;

function moduloPositivo(valor, total) {
  return ((valor % total) + total) % total;
}

function aplicarAvatarSelecionadoNaUI(indice) {
  const total = CATALOGO_AVATARES.length;
  indiceAvatarEscolhido = moduloPositivo(indice, total);
  const avatar = CATALOGO_AVATARES[indiceAvatarEscolhido];

  if (configAvatarImg) {
    configAvatarImg.src = avatar.src;
    configAvatarImg.alt = "Avatar: " + avatar.nome;
  }

  if (avatarJogadorTopo) {
    avatarJogadorTopo.textContent = "";
    const imgTopo = document.createElement("img");
    imgTopo.src = avatar.src;
    imgTopo.alt = avatar.nome;
    imgTopo.draggable = false;
    avatarJogadorTopo.appendChild(imgTopo);
  }
}

function aplicarAvatarFallbackNaUI(srcFallback) {
  indiceAvatarEscolhido = 0;
  const src =
    srcFallback ||
    window.IMAGEM_AVATAR_PADRAO ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="%23d8e2ec"/><circle cx="32" cy="24" r="12" fill="%238a99ad"/><path d="M12 56c0-11 9-20 20-20s20 9 20 20" fill="%238a99ad"/></svg>';

  if (configAvatarImg) {
    configAvatarImg.src = src;
    configAvatarImg.alt = "Avatar padrão";
  }

  if (avatarJogadorTopo) {
    avatarJogadorTopo.textContent = "";
    const imgTopo = document.createElement("img");
    imgTopo.src = src;
    imgTopo.alt = "Avatar";
    imgTopo.draggable = false;
    avatarJogadorTopo.appendChild(imgTopo);
  }
}

function carregarAvatarSalvo(jogador) {
  const jogadorAlvo =
    jogador !== undefined
      ? jogador
      : typeof window.obterJogadorIdentificado === "function"
      ? window.obterJogadorIdentificado()
      : null;

  const avatarSrc =
    typeof window.obterAvatarDoUsuario === "function"
      ? window.obterAvatarDoUsuario(jogadorAlvo)
      : null;

  if (avatarSrc) {
    const indiceEncontrado = CATALOGO_AVATARES.findIndex(function (item) {
      return item.src === avatarSrc || item.id === avatarSrc;
    });
    if (indiceEncontrado >= 0) {
      aplicarAvatarSelecionadoNaUI(indiceEncontrado);
      return;
    }
    aplicarAvatarFallbackNaUI(avatarSrc);
    return;
  }

  aplicarAvatarFallbackNaUI();
}

function salvarAvatarEscolhido(indice) {
  aplicarAvatarSelecionadoNaUI(indice);
  const avatarEscolhido = CATALOGO_AVATARES[indiceAvatarEscolhido];
  const jogadorAtual =
    typeof window.obterJogadorIdentificado === "function"
      ? window.obterJogadorIdentificado()
      : null;

  if (typeof window.salvarAvatarDoUsuario === "function") {
    if (jogadorAtual) {
      window.salvarAvatarDoUsuario(jogadorAtual, avatarEscolhido.src);
    } else {
      try {
        localStorage.setItem(CHAVE_AVATAR_STORAGE, avatarEscolhido.id);
      } catch (_erro) {
        // Ignora falha de armazenamento em modo restrito.
      }
    }
  } else if (jogadorAtual?.apelido) {
    try {
      localStorage.setItem("avatar_" + jogadorAtual.apelido, avatarEscolhido.src);
      if (jogadorAtual.id) {
        localStorage.setItem("avatar_" + jogadorAtual.id, avatarEscolhido.src);
      }
    } catch (_erro) {
      // Ignora falha de armazenamento em modo restrito.
    }
  }
}

function calcularDeltaCircular(indiceItem, posicaoCentro, total) {
  let delta = moduloPositivo(indiceItem - posicaoCentro, total);
  if (delta >= total / 2) {
    delta -= total;
  }
  return delta;
}

function renderizarPosicoesCarrosselAvatares() {
  const total = CATALOGO_AVATARES.length;
  if (!elementosOpcaoAvatar.length) {
    return;
  }

  const indiceFoco = moduloPositivo(Math.round(posicaoCarrosselAvatares), total);
  if (nomeAvatarFoco && CATALOGO_AVATARES[indiceFoco]) {
    nomeAvatarFoco.textContent = CATALOGO_AVATARES[indiceFoco].nome;
  }

  elementosOpcaoAvatar.forEach(function (botao, indice) {
    const delta = calcularDeltaCircular(indice, posicaoCarrosselAvatares, total);
    const distancia = Math.abs(delta);

    botao.classList.remove(
      "avatar-slot-central",
      "avatar-slot-foco",
      "selecionado",
      "avatar-slot-borda",
      "avatar-slot-oculto"
    );

    let escala = 1;
    if (distancia <= 0.45) {
      botao.classList.add("avatar-slot-central", "avatar-slot-foco", "selecionado");
      botao.setAttribute("aria-selected", "true");
      escala = 1.06;
    } else if (distancia <= 1.35) {
      botao.classList.add("avatar-slot-central");
      botao.setAttribute("aria-selected", "false");
      escala = 1;
    } else if (distancia <= 2.45) {
      botao.classList.add("avatar-slot-borda");
      botao.setAttribute("aria-selected", "false");
      escala = 0.9;
    } else {
      botao.classList.add("avatar-slot-oculto");
      botao.setAttribute("aria-selected", "false");
      escala = 0.82;
    }

    botao.style.transform =
      "translate(calc(-50% + " +
      delta.toFixed(3) +
      " * var(--avatar-step)), -50%) scale(" +
      escala +
      ")";
  });
}

function centralizarAvatarNoCarrossel(indiceAlvo) {
  const total = CATALOGO_AVATARES.length;
  const delta = calcularDeltaCircular(indiceAlvo, posicaoCarrosselAvatares, total);
  if (carrosselAvataresViewport) {
    carrosselAvataresViewport.classList.remove("arrastando");
  }
  posicaoCarrosselAvatares = Math.round(posicaoCarrosselAvatares + delta);
  renderizarPosicoesCarrosselAvatares();
}

function construirItensCarrosselAvatares() {
  if (!carrosselAvataresTrilha || elementosOpcaoAvatar.length) {
    return;
  }

  CATALOGO_AVATARES.forEach(function (avatar, indice) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "avatar-opcao-item";
    botao.setAttribute("role", "option");
    botao.setAttribute("aria-label", avatar.nome);
    botao.dataset.indiceAvatar = String(indice);

    const img = document.createElement("img");
    img.src = avatar.src;
    img.alt = avatar.nome;
    img.draggable = false;
    botao.appendChild(img);

    carrosselAvataresTrilha.appendChild(botao);
    botao.addEventListener("click", function () {
      if (suprimirCliquePosArraste) {
        return;
      }
      const delta = calcularDeltaCircular(
        indice,
        posicaoCarrosselAvatares,
        CATALOGO_AVATARES.length
      );
      tocarSomBotao();
      if (Math.abs(delta) > 0.1) {
        centralizarAvatarNoCarrossel(indice);
      }
    });
    elementosOpcaoAvatar.push(botao);
  });
}

function obterPassoPxCarrossel() {
  if (!elementosOpcaoAvatar.length) {
    return 156;
  }
  const larguraItem = elementosOpcaoAvatar[0].getBoundingClientRect().width || 132;
  return larguraItem + 24;
}

function abrirModalAvatares() {
  if (!modalAvatares) {
    return;
  }
  construirItensCarrosselAvatares();
  posicaoCarrosselAvatares = indiceAvatarEscolhido;
  renderizarPosicoesCarrosselAvatares();
  modalAvatares.classList.remove("escondido");
  if (carrosselAvataresViewport) {
    carrosselAvataresViewport.focus();
  }
}

function fecharModalAvatares() {
  if (!modalAvatares) {
    return;
  }
  modalAvatares.classList.add("escondido");
}

carregarAvatarSalvo();

function abrirModalConfiguracoes() {
  if (!modalConfiguracoes) {
    return;
  }
  tocarSomBotao();
  const jogadorAtual = typeof window.obterJogadorIdentificado === "function"
    ? window.obterJogadorIdentificado()
    : null;
  if (configNickname) {
    configNickname.textContent = jogadorAtual?.apelido || "Nickname";
  }
  carregarAvatarSalvo(jogadorAtual);
  sincronizarControlesAudioConfig();
  modalConfiguracoes.classList.remove("escondido");
}

function fecharModalConfiguracoes() {
  if (!modalConfiguracoes) {
    return;
  }
  modalConfiguracoes.classList.add("escondido");
}

if (btnConfigInicial) {
  btnConfigInicial.addEventListener("click", abrirModalConfiguracoes);
}

if (btnConfigMundos) {
  btnConfigMundos.addEventListener("click", abrirModalConfiguracoes);
}

if (btnFecharConfig) {
  btnFecharConfig.addEventListener("click", function () {
    tocarSomBotao();
    fecharModalConfiguracoes();
  });
}

const CHAVE_ALTO_CONTRASTE_STORAGE = "arruma_bagunca_alto_contraste";
const CHAVE_AUDIO_DESCRICAO_STORAGE = "arruma_bagunca_audio_descricao";
const toggleAltoContraste = document.getElementById("toggle-alto-contraste");
const labelAltoContraste = document.getElementById("label-alto-contraste");
const toggleAudioDescricao = document.getElementById("toggle-audio-descricao");
const labelAudioDescricao = document.getElementById("label-audio-descricao");
const toggleSomJogo = document.getElementById("toggle-som-jogo");
const labelSomJogo = document.getElementById("label-som-jogo");
const toggleMusica = document.getElementById("toggle-musica");
const labelMusica = document.getElementById("label-musica");
const imgCreditosModal = document.querySelector("#img-creditos, .img-creditos");

function aplicarModoAltoContraste(ativo) {
  const estadoAtivo = Boolean(ativo);
  document.body.classList.toggle("alto-contraste", estadoAtivo);
  document.documentElement.classList.toggle("alto-contraste", estadoAtivo);

  if (toggleAltoContraste) {
    toggleAltoContraste.classList.toggle("ativo", estadoAtivo);
    toggleAltoContraste.classList.toggle("alto-contraste-ativo", estadoAtivo);
    toggleAltoContraste.setAttribute("aria-checked", String(estadoAtivo));
  }

  if (imgCreditosModal) {
    imgCreditosModal.src = estadoAtivo
      ? "assets/images/tela_inicial/Acessibilidade/creditos.png"
      : "assets/images/tela_inicial/creditos.png";
  }

  const botoesFechar = [
    { seletor: "#btn-fechar-creditos img", padrao: "assets/images/tela_inicial/botão_fechar.png" },
    { seletor: "#btn-fechar-config img", padrao: "assets/images/Settings/botton_fechar.png" },
    { seletor: "#btn-fechar-avatares img", padrao: "assets/images/Settings/botton_fechar.png" },
    { seletor: "#btn-fechar-modal img", padrao: "assets/images/mundo_1/botão_fechar.png" },
    { seletor: "#btn-fechar-sidebar-boss img", padrao: "assets/images/mundo_1/botão_fechar.png" },
  ];

  botoesFechar.forEach(function (item) {
    const img = document.querySelector(item.seletor);
    if (img) {
      img.src = estadoAtivo
        ? "assets/images/tela_inicial/Acessibilidade/botão_fechar.png"
        : item.padrao;
    }
  });

  const iconesConfig = document.querySelectorAll("#btn-config img, #btn-config-mundos img");
  iconesConfig.forEach(function (img) {
    img.src = estadoAtivo
      ? "assets/images/nova_tela_menu de_fases/Acessibilidade/botton_config.png"
      : "assets/images/tela_inicial/engrenagem.png";
  });

  const imagensMundos = [
    {
      seletor: "#botao-fase1 > img",
      padrao: "assets/images/nova_tela_menu de_fases/mundo_1.png",
      altoContraste: "assets/images/nova_tela_menu de_fases/Acessibilidade/mundo1.png",
    },
    {
      seletor: "#card-mundo-2 > img",
      padrao: "assets/images/nova_tela_menu de_fases/mundo_2.png",
      altoContraste: "assets/images/nova_tela_menu de_fases/Acessibilidade/mundo2.png",
    },
    {
      seletor: "#card-mundo-3 > img",
      padrao: "assets/images/nova_tela_menu de_fases/mundo_3.png",
      altoContraste: "assets/images/nova_tela_menu de_fases/Acessibilidade/mundo3.png",
    },
    {
      seletor: "#card-mundo-4 > img",
      padrao: "assets/images/nova_tela_menu de_fases/mundo_4.png",
      altoContraste: "assets/images/nova_tela_menu de_fases/Acessibilidade/mundo4.png",
    },
    {
      seletor: ".fundo-boss-sidebar, #boss-sidebar-card .fundo-boss-sidebar",
      padrao: "assets/images/nova_tela_menu de_fases/fundo_boss.png",
      altoContraste: "assets/images/nova_tela_menu de_fases/Acessibilidade/Fundo_boss.png",
    },
    {
      seletor: ".img-boss-sidebar, #boss-sidebar-card .img-boss-sidebar",
      padrao: "assets/images/nova_tela_menu de_fases/boss_mundo.png",
      altoContraste: "assets/images/nova_tela_menu de_fases/Acessibilidade/boss_mundo.png",
    },
  ];

  imagensMundos.forEach(function (mundo) {
    const img = document.querySelector(mundo.seletor);
    if (img) {
      img.src = estadoAtivo ? mundo.altoContraste : mundo.padrao;
    }
  });
}

function alternarModoAltoContraste() {
  const novoEstado = document.body.classList.toggle("alto-contraste");
  aplicarModoAltoContraste(novoEstado);
  try {
    localStorage.setItem(CHAVE_ALTO_CONTRASTE_STORAGE, String(novoEstado));
  } catch (_erro) {
    // Ignora falha de armazenamento em modo restrito.
  }
  tocarSomBotao();
}

function carregarModoAltoContrasteSalvo() {
  try {
    const salvo = localStorage.getItem(CHAVE_ALTO_CONTRASTE_STORAGE);
    aplicarModoAltoContraste(salvo === "true");
  } catch (_erro) {
    aplicarModoAltoContraste(false);
  }
}

function aplicarAudioDescricao(ativo) {
  const estadoAtivo = Boolean(ativo);
  if (toggleAudioDescricao) {
    toggleAudioDescricao.classList.toggle("ativo", estadoAtivo);
    toggleAudioDescricao.setAttribute("aria-checked", String(estadoAtivo));
  }
  if (typeof window.definirNarracoesAtivas === "function") {
    window.definirNarracoesAtivas(estadoAtivo);
  }
}

function alternarAudioDescricao() {
  const novoEstado = !toggleAudioDescricao?.classList.contains("ativo");
  aplicarAudioDescricao(novoEstado);
  try {
    localStorage.setItem(CHAVE_AUDIO_DESCRICAO_STORAGE, String(novoEstado));
  } catch (_erro) {
    // O áudio continua valendo nesta página se o armazenamento estiver bloqueado.
  }
  tocarSomBotao();
}

function carregarAudioDescricaoSalva() {
  try {
    const salvo = localStorage.getItem(CHAVE_AUDIO_DESCRICAO_STORAGE);
    aplicarAudioDescricao(salvo === null ? true : salvo === "true");
  } catch (_erro) {
    aplicarAudioDescricao(true);
  }
}

function sincronizarControlesAudioConfig() {
  if (toggleSomJogo && typeof window.obterSomJogoAtivo === "function") {
    const somAtivo = window.obterSomJogoAtivo();
    toggleSomJogo.classList.toggle("ativo", somAtivo);
    toggleSomJogo.setAttribute("aria-checked", String(somAtivo));
  }
  if (toggleMusica && typeof window.obterMusicaAtiva === "function") {
    const musicaAtiva = window.obterMusicaAtiva();
    toggleMusica.classList.toggle("ativo", musicaAtiva);
    toggleMusica.setAttribute("aria-checked", String(musicaAtiva));
  }
}

function alternarSomJogoConfig() {
  const novoEstado = !toggleSomJogo?.classList.contains("ativo");
  if (toggleSomJogo) {
    toggleSomJogo.classList.toggle("ativo", novoEstado);
    toggleSomJogo.setAttribute("aria-checked", String(novoEstado));
  }
  if (typeof window.definirSomJogoAtivo === "function") {
    window.definirSomJogoAtivo(novoEstado);
  }
  tocarSomBotao();
}

function alternarMusicaConfig() {
  const novoEstado = !toggleMusica?.classList.contains("ativo");
  if (toggleMusica) {
    toggleMusica.classList.toggle("ativo", novoEstado);
    toggleMusica.setAttribute("aria-checked", String(novoEstado));
  }
  if (typeof window.definirMusicaAtiva === "function") {
    window.definirMusicaAtiva(novoEstado);
  }
  tocarSomBotao();
}

carregarModoAltoContrasteSalvo();
carregarAudioDescricaoSalva();
sincronizarControlesAudioConfig();

if (toggleAltoContraste) {
  toggleAltoContraste.addEventListener("click", function (evento) {
    evento.stopPropagation();
    alternarModoAltoContraste();
  });
}

if (labelAltoContraste) {
  labelAltoContraste.addEventListener("click", function () {
    alternarModoAltoContraste();
  });
}

if (toggleAudioDescricao) {
  toggleAudioDescricao.addEventListener("click", function (evento) {
    evento.stopPropagation();
    alternarAudioDescricao();
  });
}

if (labelAudioDescricao) {
  labelAudioDescricao.addEventListener("click", function () {
    alternarAudioDescricao();
  });
}

if (toggleSomJogo) {
  toggleSomJogo.addEventListener("click", function (evento) {
    evento.stopPropagation();
    alternarSomJogoConfig();
  });
}

if (labelSomJogo) {
  labelSomJogo.addEventListener("click", function () {
    alternarSomJogoConfig();
  });
}

if (toggleMusica) {
  toggleMusica.addEventListener("click", function (evento) {
    evento.stopPropagation();
    alternarMusicaConfig();
  });
}

if (labelMusica) {
  labelMusica.addEventListener("click", function () {
    alternarMusicaConfig();
  });
}

if (modalConfiguracoes) {
  modalConfiguracoes.addEventListener("click", function (evento) {
    if (evento.target === modalConfiguracoes) {
      fecharModalConfiguracoes();
    }
  });

  modalConfiguracoes.querySelectorAll(".config-toggle").forEach(function (botaoToggle) {
    if (
      botaoToggle.id === "toggle-alto-contraste" ||
      botaoToggle.id === "toggle-audio-descricao" ||
      botaoToggle.id === "toggle-som-jogo" ||
      botaoToggle.id === "toggle-musica"
    ) {
      return;
    }
    botaoToggle.addEventListener("click", function () {
      const novoEstado = !botaoToggle.classList.contains("ativo");
      botaoToggle.classList.toggle("ativo", novoEstado);
      botaoToggle.setAttribute("aria-checked", String(novoEstado));
      tocarSomBotao();
    });
  });
}

if (btnConfigEditarAvatar) {
  btnConfigEditarAvatar.addEventListener("click", function () {
    tocarSomBotao();
    abrirModalAvatares();
  });
}

if (btnFecharAvatares) {
  btnFecharAvatares.addEventListener("click", function () {
    tocarSomBotao();
    fecharModalAvatares();
  });
}

if (modalAvatares) {
  modalAvatares.addEventListener("click", function (evento) {
    if (evento.target === modalAvatares) {
      fecharModalAvatares();
    }
  });
}

if (btnAvataresAnterior) {
  btnAvataresAnterior.addEventListener("click", function () {
    tocarSomBotao();
    posicaoCarrosselAvatares = Math.round(posicaoCarrosselAvatares) - 1;
    renderizarPosicoesCarrosselAvatares();
  });
}

if (btnAvataresProximo) {
  btnAvataresProximo.addEventListener("click", function () {
    tocarSomBotao();
    posicaoCarrosselAvatares = Math.round(posicaoCarrosselAvatares) + 1;
    renderizarPosicoesCarrosselAvatares();
  });
}

if (btnConfirmarAvatar) {
  btnConfirmarAvatar.addEventListener("click", function () {
    tocarSomBotao();
    const indiceFoco = moduloPositivo(
      Math.round(posicaoCarrosselAvatares),
      CATALOGO_AVATARES.length
    );
    salvarAvatarEscolhido(indiceFoco);
    fecharModalAvatares();
  });
}

if (carrosselAvataresViewport) {
  let ponteiroAtivo = false;
  let idPonteiroAtivo = null;
  let inicioX = 0;
  let posicaoInicialArraste = 0;
  let moveuArraste = false;

  carrosselAvataresViewport.addEventListener("pointerdown", function (evento) {
    if (evento.button !== undefined && evento.button !== 0) {
      return;
    }
    ponteiroAtivo = true;
    idPonteiroAtivo = evento.pointerId;
    inicioX = evento.clientX;
    posicaoInicialArraste = posicaoCarrosselAvatares;
    moveuArraste = false;
    suprimirCliquePosArraste = false;
  });

  carrosselAvataresViewport.addEventListener("pointermove", function (evento) {
    if (!ponteiroAtivo || evento.pointerId !== idPonteiroAtivo) {
      return;
    }
    const deltaPx = evento.clientX - inicioX;
    if (!moveuArraste && Math.abs(deltaPx) > 6) {
      moveuArraste = true;
      suprimirCliquePosArraste = true;
      carrosselAvataresViewport.classList.add("arrastando");
      if (typeof carrosselAvataresViewport.setPointerCapture === "function") {
        try {
          carrosselAvataresViewport.setPointerCapture(evento.pointerId);
        } catch (_erro) {
          // Ignora caso o ponteiro não suporte captura.
        }
      }
    }
    if (!moveuArraste) {
      return;
    }
    const passoPx = obterPassoPxCarrossel();
    posicaoCarrosselAvatares = posicaoInicialArraste - deltaPx / passoPx;
    renderizarPosicoesCarrosselAvatares();
  });

  function finalizarArrasteAvatares(evento) {
    if (!ponteiroAtivo || evento.pointerId !== idPonteiroAtivo) {
      return;
    }
    ponteiroAtivo = false;
    idPonteiroAtivo = null;
    carrosselAvataresViewport.classList.remove("arrastando");

    if (moveuArraste) {
      posicaoCarrosselAvatares = Math.round(posicaoCarrosselAvatares);
      renderizarPosicoesCarrosselAvatares();
      setTimeout(function () {
        suprimirCliquePosArraste = false;
      }, 0);
    }
  }

  carrosselAvataresViewport.addEventListener("pointerup", finalizarArrasteAvatares);
  carrosselAvataresViewport.addEventListener("pointercancel", finalizarArrasteAvatares);

  carrosselAvataresViewport.addEventListener("keydown", function (evento) {
    if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      tocarSomBotao();
      posicaoCarrosselAvatares = Math.round(posicaoCarrosselAvatares) - 1;
      renderizarPosicoesCarrosselAvatares();
    } else if (evento.key === "ArrowRight") {
      evento.preventDefault();
      tocarSomBotao();
      posicaoCarrosselAvatares = Math.round(posicaoCarrosselAvatares) + 1;
      renderizarPosicoesCarrosselAvatares();
    } else if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      if (btnConfirmarAvatar) {
        btnConfirmarAvatar.click();
      }
    }
  });
}

if (btnConfigSair) {
  btnConfigSair.addEventListener("click", function () {
    tocarSomBotao();
    fecharModalConfiguracoes();
    if (menuFases && !menuFases.classList.contains("escondido") && botaoVoltar) {
      botaoVoltar.click();
    }
  });
}

if (btnFecharCreditos && modalCreditos) {
  btnFecharCreditos.addEventListener("click", function () {
    tocarSomBotao();
    modalCreditos.classList.add("escondido");
  });
}

if (modalCreditos) {
  modalCreditos.addEventListener("click", function (evento) {
    if (evento.target === modalCreditos) {
      modalCreditos.classList.add("escondido");
    }
  });
}

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") {
    if (modalAvatares && !modalAvatares.classList.contains("escondido")) {
      fecharModalAvatares();
      return;
    }
    if (modalConfiguracoes && !modalConfiguracoes.classList.contains("escondido")) {
      fecharModalConfiguracoes();
    }
    if (modalCreditos && !modalCreditos.classList.contains("escondido")) {
      modalCreditos.classList.add("escondido");
    }
    if (modalFases && !modalFases.classList.contains("escondido")) {
      modalFases.classList.add("escondido");
    ocultarTutorialModalFases();
    atualizarInterfaceProgresso();
    }
  }
});

// Mensagens enviadas pela fase incorporada para avançar ou retornar ao menu.
window.addEventListener("message", function (evento) {
  if (!conteudoFase || evento.source !== conteudoFase.contentWindow) {
    return;
  }

  const mensagem = evento.data;
  if (!mensagem) {
    return;
  }

  if (mensagem.tipo === "arruma-bagunca:novo-mapa-desbloqueado") {
    novoMapaDesbloqueadoPendente = true;
    return;
  }

  if (mensagem.tipo !== "arruma-bagunca:navegacao") {
    return;
  }

  if (mensagem.destino === "menu") {
    let mundoConcluido = mensagem.mundoConcluido;
    let forcarAnimacao = Boolean(mensagem.playLockAnimation || mensagem.mundoDesbloqueadoAnimacao);
    if (!mundoConcluido) {
      const flag = lerFlagTransicaoCadeado();
      mundoConcluido = flag.mundoConcluido || (flag.mundoDesbloqueado ? flag.mundoDesbloqueado - 1 : null);
      if (flag.playLockAnimation) {
        forcarAnimacao = true;
      }
    }
    mostrarMenuMundos(mundoConcluido, forcarAnimacao);
  } else if (typeof mensagem.url === "string" && mensagem.url.startsWith("fase1.html?")) {
    abrirFase(mensagem.url);
  }
});

/**
 * Verifica se a URL contém o parâmetro ?view=mundos ou se há flag de transição pendente
 * para exibir diretamente a seleção de mundos e executar a animação do cadeado.
 * Se ainda não há jogador identificado nesta aba, pede o apelido antes.
 * Assim como o botão JOGAR, não apaga progresso.
 */
let viewVerificado = false;
function verificarParametroView() {
  if (viewVerificado) {
    return;
  }

  // Validação de segurança no lobby: limpa qualquer flag residual de cutscene do boss
  try {
    if (localStorage.getItem("playBossCutscene") !== null) {
      localStorage.removeItem("playBossCutscene");
    }
    if (sessionStorage.getItem("playBossCutscene") !== null) {
      sessionStorage.removeItem("playBossCutscene");
    }
    if (localStorage.getItem("arruma_bagunca_cutscene_boss") !== null) {
      localStorage.removeItem("arruma_bagunca_cutscene_boss");
    }
    if (sessionStorage.getItem("arruma_bagunca_cutscene_boss") !== null) {
      sessionStorage.removeItem("arruma_bagunca_cutscene_boss");
    }
  } catch (_e) {}
  cutsceneBossAutorizada = false;
  if (typeof window !== "undefined") {
    window.playBossCutscene = false;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const flagTransicao = lerFlagTransicaoCadeado();
  const temViewMundos = urlParams.get("view") === "mundos";
  const deveEntrarNoMenu = temViewMundos || Boolean(flagTransicao.playLockAnimation);

  if (deveEntrarNoMenu) {
    let mundoConcluido = parseInt(urlParams.get("mundoConcluido"), 10)
      || flagTransicao.mundoConcluido
      || (flagTransicao.mundoDesbloqueado ? flagTransicao.mundoDesbloqueado - 1 : null);

    if (telaInicial && controlesIniciais && menuFases) {
      viewVerificado = true;
      const jogador = typeof window.obterJogadorIdentificado === "function"
        ? window.obterJogadorIdentificado()
        : null;

      if (jogador || isModoDevAtivo()) {
        entrarNoMenuDeMundos();
        if (mundoConcluido) {
          mostrarMenuMundos(mundoConcluido, true);
        }
      } else {
        abrirIdentificacaoDoJogador({
          aoConcluir: function () {
            entrarNoMenuDeMundos();
            if (mundoConcluido) {
              mostrarMenuMundos(mundoConcluido, true);
            }
          },
        });
      }
    }
  }
}

// js/progresso.js avisa quando o progresso muda (ex.: o progresso do jogador
// chegou do servidor depois da identificação) para o menu se redesenhar.
window.addEventListener("arruma-bagunca:progresso-atualizado", function () {
  atualizarInterfaceProgresso();
});

if (typeof window !== "undefined") {
  window.exibirTransicaoCadeado = exibirTransicaoCadeado;
  window.reproduzirCutsceneBoss = reproduzirCutsceneBoss;
  window.limparTransicoesVistas = limparTransicoesVistas;
  window.lerFlagTransicaoCadeado = lerFlagTransicaoCadeado;
  window.consumirFlagTransicaoCadeado = consumirFlagTransicaoCadeado;
  window.mostrarMenuMundos = mostrarMenuMundos;
}

document.addEventListener("DOMContentLoaded", function () {
  atualizarInterfaceProgresso();
  verificarParametroView();
  if (typeof window.trocarTrilhaFundo === "function") {
    window.trocarTrilhaFundo("menu");
  }
});

// Executa imediatamente para garantir transição instantânea
atualizarInterfaceProgresso();
verificarParametroView();
if (typeof window.trocarTrilhaFundo === "function") {
  window.trocarTrilhaFundo("menu");
}
