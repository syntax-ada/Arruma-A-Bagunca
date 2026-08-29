function iniciarDesafioMatematico(dadosQuantidades) {
  const telaOrganizacao = document.querySelector("#tela-organizacao");
  const telaMatematica = document.querySelector("#tela-matematica");

  if (telaOrganizacao) {
    telaOrganizacao.classList.add("escondido");
  }

  if (telaMatematica) {
    telaMatematica.classList.remove("escondido");
  }

  const qtdBrinquedos = dadosQuantidades?.brinquedos ?? 0;
  const qtdComidas = dadosQuantidades?.comidas ?? 0;
  const qtdMateriais = dadosQuantidades?.materiais ?? 0;
  const totalCorreto = qtdBrinquedos + qtdComidas + qtdMateriais;

  const elBrinquedos = document.querySelector("#resumo-brinquedos");
  const elComidas = document.querySelector("#resumo-comidas");
  const elMateriais = document.querySelector("#resumo-materiais");

  if (elBrinquedos) elBrinquedos.textContent = qtdBrinquedos;
  if (elComidas) elComidas.textContent = qtdComidas;
  if (elMateriais) elMateriais.textContent = qtdMateriais;

  const opcoes = gerarAlternativasMatematica(totalCorreto);
  const containerOpcoes = document.querySelector("#opcoes-matematica");

  if (containerOpcoes) {
    containerOpcoes.innerHTML = "";
    opcoes.forEach((valor) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "botao-opcao-matematica";
      botao.textContent = valor;
      botao.setAttribute("aria-label", `Opção ${valor}`);
      botao.addEventListener("click", () => {
        verificarRespostaMatematica(valor, totalCorreto, botao, {
          brinquedos: qtdBrinquedos,
          comidas: qtdComidas,
          materiais: qtdMateriais,
        });
      });
      containerOpcoes.appendChild(botao);
    });
  }

  mostrarFeedbackMatematica("Escolha uma das opções acima.", "neutral");
}

function gerarAlternativasMatematica(totalCorreto) {
  const opcoes = new Set();
  opcoes.add(totalCorreto);

  const distrator1 = Math.max(1, totalCorreto - 2);
  const distrator2 = totalCorreto + 2;

  opcoes.add(distrator1);
  opcoes.add(distrator2);

  let offset = 1;
  while (opcoes.size < 3) {
    opcoes.add(totalCorreto + offset);
    offset++;
  }

  return Array.from(opcoes).sort((a, b) => a - b);
}

function verificarRespostaMatematica(valorEscolhido, totalCorreto, botaoClicado, dados) {
  const botoes = document.querySelectorAll(".botao-opcao-matematica");

  if (valorEscolhido === totalCorreto) {
    botoes.forEach((b) => {
      b.disabled = true;
      if (Number(b.textContent) === totalCorreto) {
        b.classList.add("is-correct");
      }
    });

    const somaTexto = `${dados.brinquedos} + ${dados.comidas} + ${dados.materiais} = ${totalCorreto}`;
    mostrarFeedbackMatematica(`Muito bem! Você acertou! ${somaTexto} objetos organizados ao todo!`, "success");
  } else {
    botaoClicado.classList.add("is-wrong");
    mostrarFeedbackMatematica("Quase lá! Vamos contar de novo? Tente outra resposta.", "error");
  }
}

function mostrarFeedbackMatematica(mensagem, tipo) {
  const feedbackEl = document.querySelector("#feedback-matematica");
  if (!feedbackEl) {
    return;
  }

  feedbackEl.textContent = mensagem;
  feedbackEl.classList.remove("is-success", "is-error");

  if (tipo === "success") {
    feedbackEl.classList.add("is-success");
  } else if (tipo === "error") {
    feedbackEl.classList.add("is-error");
  }
}
