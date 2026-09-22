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
    const larguraDoCard = obterLarguraPassoCarrossel();
    carrosselMundos.scrollBy({ left: -larguraDoCard, behavior: "smooth" });
  });
}

if (btnSetaDireita && carrosselMundos) {
  btnSetaDireita.addEventListener("click", function () {
    const larguraDoCard = obterLarguraPassoCarrossel();
    carrosselMundos.scrollBy({ left: larguraDoCard, behavior: "smooth" });
  });
}

let mundoSelecionado = 1;

/**
 * Detecta se o Modo Dev está ativo via query string (?dev=true) ou sessionStorage.
 */
function isModoDevAtivo() {
  try {
    const params = new URLSearchParams(window.location.search);
    const devParam = params.get("dev");
    if (devParam === "false" || devParam === "0") {
      return false;
    }
    if (devParam === "true" || devParam === "1" || params.has("dev")) {
      return true;
    }
    if (typeof window !== "undefined" && window.sessionStorage) {
      return window.sessionStorage.getItem("arruma_bagunca_dev") === "true";
    }
  } catch (e) {
    // Tratamento defensivo caso o acesso a storage falhe
  }
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
    btnIniciarFase1.disabled = false;
    btnIniciarFase1.classList.remove("fase-bloqueada");
    btnIniciarFase1.classList.add("fase-ativa");
    btnIniciarFase1.setAttribute("aria-label", `Jogar Fase 1 do Mundo ${mundoId}`);
    btnIniciarFase1.onclick = function () {
      const sufixoDev = devAtivo ? "&dev=true" : "";
      window.location.href = `fase1.html?mundo=${mundoId}&fase=1${sufixoDev}`;
    };
  }

  // Fase 2
  if (btnIniciarFase2) {
    const liberada = devAtivo || (faseMaximaMundo >= 2 && totalFasesMundo >= 2);
    if (liberada) {
      btnIniciarFase2.disabled = false;
      btnIniciarFase2.classList.remove("fase-bloqueada");
      btnIniciarFase2.classList.add("fase-ativa");
      btnIniciarFase2.setAttribute("aria-label", `Jogar Fase 2 do Mundo ${mundoId}`);
      btnIniciarFase2.onclick = function () {
        const sufixoDev = devAtivo ? "&dev=true" : "";
        window.location.href = `fase1.html?mundo=${mundoId}&fase=2${sufixoDev}`;
      };
    } else {
      btnIniciarFase2.disabled = true;
      btnIniciarFase2.classList.add("fase-bloqueada");
      btnIniciarFase2.classList.remove("fase-ativa");
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
      btnIniciarFase3.setAttribute("aria-label", `Jogar Fase 3 do Mundo ${mundoId}`);
      btnIniciarFase3.onclick = function () {
        const sufixoDev = devAtivo ? "&dev=true" : "";
        window.location.href = `fase1.html?mundo=${mundoId}&fase=3${sufixoDev}`;
      };
    } else {
      btnIniciarFase3.disabled = true;
      btnIniciarFase3.classList.add("fase-bloqueada");
      btnIniciarFase3.classList.remove("fase-ativa");
      btnIniciarFase3.setAttribute("aria-label", `Fase 3 do Mundo ${mundoId}, bloqueada`);
      btnIniciarFase3.onclick = null;
    }
  }
}

/**
 * Abre o modal de seleção de fases se o mundo estiver desbloqueado (ou via bypass do Modo Dev).
 */
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
}

// Navegação básica da tela inicial e menus
if (botaoJogar && telaInicial && menuFases && controlesIniciais) {
  botaoJogar.addEventListener("click", function () {

    localStorage.removeItem("arruma_bagunca_progresso");

    telaInicial.classList.add("escondido");
    controlesIniciais.classList.add("escondido");
    menuFases.classList.remove("escondido");
    atualizarInterfaceProgresso();
  });
}

if (botaoVoltar && telaInicial && menuFases && controlesIniciais) {
  botaoVoltar.addEventListener("click", function () {
    if (modalFases) {
      modalFases.classList.add("escondido");
    }
    menuFases.classList.add("escondido");
    telaInicial.classList.remove("escondido");
    controlesIniciais.classList.remove("escondido");
  });
}

// Abertura do modal de seleção de fases em todos os cards do carrossel
const cardsCarrossel = document.querySelectorAll(".card-mundo");
cardsCarrossel.forEach((card) => {
  card.onclick = null;
  card.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    const rawMundo = card.dataset.mundo;
    const mundoId = rawMundo ? parseInt(rawMundo, 10) : 1;
    abrirModalFases(mundoId);
  });
});

if (btnFecharModal && modalFases) {
  btnFecharModal.addEventListener("click", function () {
    modalFases.classList.add("escondido");
  });
}

// Controle do Modal de Créditos
if (botaoCreditos && modalCreditos) {
  botaoCreditos.addEventListener("click", function () {
    modalCreditos.classList.remove("escondido");
  });
}

if (btnFecharCreditos && modalCreditos) {
  btnFecharCreditos.addEventListener("click", function () {
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
    if (modalCreditos && !modalCreditos.classList.contains("escondido")) {
      modalCreditos.classList.add("escondido");
    }
    if (modalFases && !modalFases.classList.contains("escondido")) {
      modalFases.classList.add("escondido");
    }
  }
});

/**
 * Verifica se a URL contém o parâmetro ?view=mundos para exibir diretamente a seleção de mundos.
 */
function verificarParametroView() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("view") === "mundos") {
    if (telaInicial && controlesIniciais && menuFases) {
      telaInicial.classList.add("escondido");
      controlesIniciais.classList.add("escondido");
      menuFases.classList.remove("escondido");
      atualizarInterfaceProgresso();
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  atualizarInterfaceProgresso();
  verificarParametroView();
});

// Executa imediatamente para garantir transição instantânea
atualizarInterfaceProgresso();
verificarParametroView();
