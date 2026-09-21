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

/**
 * Atualiza a interface do menu de acordo com os dados de progresso salvos.
 */
function atualizarInterfaceProgresso() {
  // Leitura da persistência de dados do progresso do jogador
  const progresso = typeof obterProgresso === "function"
    ? obterProgresso()
    : { mundosDesbloqueados: [1], faseMaximaPorMundo: { 1: 1 }, fasesConcluidas: [] };

  const faseMaximaMundo1 = progresso.faseMaximaPorMundo?.[1] || 1;
  const mundosLiberados = progresso.mundosDesbloqueados || [1];

  // 1. Atualização dos botões da trilha de fases do Mundo 1
  if (btnIniciarFase1) {
    btnIniciarFase1.onclick = function () {
      window.location.href = "fase1.html?mundo=1&fase=1";
    };
  }

  if (btnIniciarFase2) {
    if (faseMaximaMundo1 >= 2) {
      btnIniciarFase2.disabled = false;
      btnIniciarFase2.classList.remove("fase-bloqueada");
      btnIniciarFase2.classList.add("fase-ativa");
      btnIniciarFase2.setAttribute("aria-label", "Jogar Fase 2");
      btnIniciarFase2.onclick = function () {
        window.location.href = "fase1.html?mundo=1&fase=2";
      };
    } else {
      btnIniciarFase2.disabled = true;
      btnIniciarFase2.classList.add("fase-bloqueada");
      btnIniciarFase2.classList.remove("fase-ativa");
      btnIniciarFase2.setAttribute("aria-label", "Fase 2, bloqueada");
      btnIniciarFase2.onclick = null;
    }
  }

  if (btnIniciarFase3) {
    if (faseMaximaMundo1 >= 3) {
      btnIniciarFase3.disabled = false;
      btnIniciarFase3.classList.remove("fase-bloqueada");
      btnIniciarFase3.classList.add("fase-ativa");
      btnIniciarFase3.setAttribute("aria-label", "Jogar Fase 3");
      btnIniciarFase3.onclick = function () {
        window.location.href = "fase1.html?mundo=1&fase=3";
      };
    } else {
      btnIniciarFase3.disabled = true;
      btnIniciarFase3.classList.add("fase-bloqueada");
      btnIniciarFase3.classList.remove("fase-ativa");
      btnIniciarFase3.setAttribute("aria-label", "Fase 3, bloqueada");
      btnIniciarFase3.onclick = null;
    }
  }

  // 2. Atualização dos cards dos Mundos
  if (cardMundo2) {
    const mundo2Liberado = mundosLiberados.includes(2);
    const overlay2 = cardMundo2.querySelector(".overlay-bloqueado");

    if (mundo2Liberado) {
      cardMundo2.classList.remove("mundo-bloqueado");
      cardMundo2.classList.add("mundo-disponivel");
      cardMundo2.setAttribute("aria-label", "Mundo 2, Parque, liberado");
      if (overlay2) {
        overlay2.classList.add("escondido");
      }
      cardMundo2.onclick = function () {
        window.location.href = "fase1.html?mundo=2&fase=1";
      };
    } else {
      cardMundo2.classList.add("mundo-bloqueado");
      cardMundo2.classList.remove("mundo-disponivel");
      cardMundo2.setAttribute("aria-label", "Mundo 2, Parque, bloqueado");
      if (overlay2) {
        overlay2.classList.remove("escondido");
      }
      cardMundo2.onclick = null;
    }
  }

  if (cardMundo3) {
    const mundo3Liberado = mundosLiberados.includes(3);
    const overlay3 = cardMundo3.querySelector(".overlay-bloqueado");

    if (mundo3Liberado) {
      cardMundo3.classList.remove("mundo-bloqueado");
      cardMundo3.classList.add("mundo-disponivel");
      cardMundo3.setAttribute("aria-label", "Mundo 3, Praia, liberado");
      if (overlay3) {
        overlay3.classList.add("escondido");
      }
      cardMundo3.onclick = function () {
        window.location.href = "fase1.html?mundo=3&fase=1";
      };
    } else {
      cardMundo3.classList.add("mundo-bloqueado");
      cardMundo3.classList.remove("mundo-disponivel");
      cardMundo3.setAttribute("aria-label", "Mundo 3, Praia, bloqueado");
      if (overlay3) {
        overlay3.classList.remove("escondido");
      }
      cardMundo3.onclick = null;
    }
  }

  if (cardMundo4) {
    const mundo4Liberado = mundosLiberados.includes(4);
    const overlay4 = cardMundo4.querySelector(".overlay-bloqueado");

    if (mundo4Liberado) {
      cardMundo4.classList.remove("mundo-bloqueado");
      cardMundo4.classList.add("mundo-disponivel");
      cardMundo4.setAttribute("aria-label", "Mundo 4, liberado");
      if (overlay4) {
        overlay4.classList.add("escondido");
      }
      cardMundo4.onclick = function () {
        window.location.href = "fase1.html?mundo=4&fase=1";
      };
    } else {
      cardMundo4.classList.add("mundo-bloqueado");
      cardMundo4.classList.remove("mundo-disponivel");
      cardMundo4.setAttribute("aria-label", "Mundo 4, bloqueado");
      if (overlay4) {
        overlay4.classList.remove("escondido");
      }
      cardMundo4.onclick = null;
    }
  }

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

if (botaoFase1 && modalFases) {
  botaoFase1.addEventListener("click", function () {
    atualizarInterfaceProgresso();
    modalFases.classList.remove("escondido");
  });
}

if (btnFecharModal && modalFases) {
  btnFecharModal.addEventListener("click", function () {
    modalFases.classList.add("escondido");
  });
}

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
