const botaoJogar = document.querySelector("#botao-jogar");
const telaInicial = document.querySelector("#tela-inicial");
const menuFases = document.querySelector("#menu-fases");
const controlesIniciais = document.querySelector("#controles-iniciais");
const botaoVoltar = document.querySelector("#btn-voltar");
const botaoFase1 = document.querySelector("#botao-fase1");
const cardMundo2 = document.querySelector("#card-mundo-2");
const cardMundo3 = document.querySelector("#card-mundo-3");
const modalFases = document.querySelector("#modal-fases");
const btnFecharModal = document.querySelector("#btn-fechar-modal");
const btnIniciarFase1 = document.querySelector("#btn-iniciar-fase1");
const btnIniciarFase2 = document.querySelector("#btn-iniciar-fase2");
const btnIniciarFase3 = document.querySelector("#btn-iniciar-fase3");
const trilhoPreenchimento = document.querySelector(".preenchimento-progresso");
const textoProgresso = document.querySelector(".porcentagem-progresso");

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
      window.location.href = "fase1.html?fase=1";
    };
  }

  if (btnIniciarFase2) {
    if (faseMaximaMundo1 >= 2) {
      btnIniciarFase2.disabled = false;
      btnIniciarFase2.classList.remove("fase-bloqueada");
      btnIniciarFase2.classList.add("fase-ativa");
      btnIniciarFase2.setAttribute("aria-label", "Jogar Fase 2");
      btnIniciarFase2.onclick = function () {
        window.location.href = "fase1.html?fase=2";
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
        window.location.href = "fase1.html?fase=3";
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
      cardMundo2.setAttribute("aria-label", "Mundo 2, Escola, liberado");
      if (overlay2) {
        overlay2.classList.add("escondido");
      }
      cardMundo2.onclick = function () {
        alert("Mundo 2 (Escola) em breve!");
      };
    } else {
      cardMundo2.classList.add("mundo-bloqueado");
      cardMundo2.classList.remove("mundo-disponivel");
      cardMundo2.setAttribute("aria-label", "Mundo 2, Escola, bloqueado");
      if (overlay2) {
        overlay2.classList.remove("escondido");
      }
      cardMundo2.onclick = null;
    }
  }

  // 3. Atualização visual da barra de progresso
  let porcentagem = 10;
  if (mundosLiberados.includes(2)) {
    porcentagem = 100;
  } else if (faseMaximaMundo1 >= 3) {
    porcentagem = 66;
  } else if (faseMaximaMundo1 >= 2) {
    porcentagem = 33;
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
