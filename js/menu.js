const botaoJogar = document.querySelector("#botao-jogar");

const telaInicial = document.querySelector("#tela-inicial");

const telaFases = document.querySelector("#tela-fases");

const botaoFase1 = document.querySelector("#botao-fase1");

botaoJogar.addEventListener("click", function () {
  telaInicial.classList.add("escondido");

  telaFases.classList.remove("escondido");
});

botaoFase1.addEventListener("click", function () {
  window.location.href = "fase1.html";
});