const botaoJogar = document.querySelector("#botao-jogar");

const telaInicial = document.querySelector("#tela-inicial");

const menuFases = document.querySelector("#menu-fases");

const controlesIniciais = document.querySelector("#controles-iniciais");

const botaoVoltar = document.querySelector("#btn-voltar");

const botaoFase1 = document.querySelector("#botao-fase1");

botaoJogar.addEventListener("click", function () {
  telaInicial.classList.add("escondido");
  controlesIniciais.classList.add("escondido");
  menuFases.classList.remove("escondido");
});

botaoVoltar.addEventListener("click", function () {
  menuFases.classList.add("escondido");
  telaInicial.classList.remove("escondido");
  controlesIniciais.classList.remove("escondido");
});

botaoFase1.addEventListener("click", function () {
  window.location.href = "fase1.html";
});
