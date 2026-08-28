// Encontra o botão Jogar da tela inicial.
const botaoJogar = document.querySelector("#botao-jogar");

// Encontra a tela inicial.
const telaInicial = document.querySelector("#tela-inicial");

// Encontra a tela de seleção de fases.
const telaFases = document.querySelector("#tela-fases");

// Espera o clique no botão Jogar.
botaoJogar.addEventListener("click", function () {
  // Esconde a tela inicial.
  telaInicial.classList.add("escondido");

  // Mostra a tela de seleção de fases.
  telaFases.classList.remove("escondido");
});