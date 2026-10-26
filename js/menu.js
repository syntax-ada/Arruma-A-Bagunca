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
const sidebarBoss = document.querySelector("#sidebar-boss");
const btnFecharSidebarBoss = document.querySelector("#btn-fechar-sidebar-boss");
const btnJogarBoss = document.querySelector("#btn-jogar-boss");
const btnIconeBoss = document.querySelector("#btn-icone-boss");
let sidebarBossFechadaManualmente = false;

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

function mostrarMenuMundos() {
  if (!conteudoFase) {
    return;
  }

  conteudoFase.classList.add("escondido");
  conteudoFase.src = "about:blank";
  telaInicial?.classList.add("escondido");
  controlesIniciais?.classList.add("escondido");
  menuFases?.classList.remove("escondido");
  atualizarInterfaceProgresso();
  if (typeof window.trocarTrilhaFundo === "function") {
    window.trocarTrilhaFundo("menu");
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
  return window.modoDevLiberado === true;
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
    const overlay = card.querySelector(".overlay-bloqueado");

    if (liberado) {
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
  aplicarAvatarSelecionadoNaUI(indiceAvatarEscolhido);
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
function abrirIdentificacaoDoJogador() {
  if (typeof window.iniciarIdentificacao !== "function") {
    console.error("[menu.js] js/jogador.js não foi carregado antes de menu.js.");
    return;
  }

  telaInicial?.classList.add("escondido");
  controlesIniciais?.classList.add("escondido");
  window.iniciarIdentificacao({
    aoConcluir: entrarNoMenuDeMundos,
    aoVoltar: function () {
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
    abrirFase(`fase1.html?mundo=5&fase=1${sufixoDev}`);
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

function carregarAvatarSalvo() {
  try {
    const idSalvo = localStorage.getItem(CHAVE_AVATAR_STORAGE);
    const indiceEncontrado = CATALOGO_AVATARES.findIndex(function (item) {
      return item.id === idSalvo;
    });
    aplicarAvatarSelecionadoNaUI(indiceEncontrado >= 0 ? indiceEncontrado : 0);
  } catch (_erro) {
    aplicarAvatarSelecionadoNaUI(0);
  }
}

function salvarAvatarEscolhido(indice) {
  aplicarAvatarSelecionadoNaUI(indice);
  try {
    localStorage.setItem(CHAVE_AVATAR_STORAGE, CATALOGO_AVATARES[indiceAvatarEscolhido].id);
  } catch (_erro) {
    // Ignora falha de armazenamento em modo restrito.
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
const toggleAltoContraste = document.getElementById("toggle-alto-contraste");
const labelAltoContraste = document.getElementById("label-alto-contraste");
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

carregarModoAltoContrasteSalvo();

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

if (modalConfiguracoes) {
  modalConfiguracoes.addEventListener("click", function (evento) {
    if (evento.target === modalConfiguracoes) {
      fecharModalConfiguracoes();
    }
  });

  modalConfiguracoes.querySelectorAll(".config-toggle").forEach(function (botaoToggle) {
    if (botaoToggle.id === "toggle-alto-contraste") {
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
  if (!mensagem || mensagem.tipo !== "arruma-bagunca:navegacao") {
    return;
  }

  if (mensagem.destino === "menu") {
    mostrarMenuMundos();
  } else if (typeof mensagem.url === "string" && mensagem.url.startsWith("fase1.html?")) {
    abrirFase(mensagem.url);
  }
});

/**
 * Verifica se a URL contém o parâmetro ?view=mundos para exibir diretamente a seleção de mundos.
 * Se ainda não há jogador identificado nesta aba, pede o apelido antes.
 * Assim como o botão JOGAR, não apaga progresso.
 */
function verificarParametroView() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("view") === "mundos") {
    if (telaInicial && controlesIniciais && menuFases) {
      const jogador = typeof window.obterJogadorIdentificado === "function"
        ? window.obterJogadorIdentificado()
        : null;

      if (jogador) {
        entrarNoMenuDeMundos();
      } else {
        abrirIdentificacaoDoJogador();
      }
    }
  }
}

// js/progresso.js avisa quando o progresso muda (ex.: o progresso do jogador
// chegou do servidor depois da identificação) para o menu se redesenhar.
window.addEventListener("arruma-bagunca:progresso-atualizado", function () {
  atualizarInterfaceProgresso();
});

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
