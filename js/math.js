function iniciarDesafioMatematico(dadosQuantidades) {
    document.body.classList.add("cenario-arrumado");

    const telaOrganizacao = document.querySelector("#tela-organizacao");
    const telaMatematica = document.querySelector("#tela-matematica");

    if (telaOrganizacao) {
        telaOrganizacao.classList.add("escondido");
    }

    if (telaMatematica) {
        telaMatematica.classList.remove("escondido");
    }

    // Suporta tanto o formato estruturado (array de { key, nome, icone, quantidade })
    // quanto o formato legado de objeto ({ brinquedos: X, comidas: Y, materiais: Z })
    let itensResumo = [];

    if (Array.isArray(dadosQuantidades)) {
        itensResumo = dadosQuantidades;
    } else if (dadosQuantidades && typeof dadosQuantidades === "object") {
        const iconesPadrao = {
            brinquedos: "🧸",
            comidas: "🍎",
            materiais: "✏️",
        };
        itensResumo = Object.entries(dadosQuantidades).map(([key, qtd]) => ({
            key,
            nome: key.charAt(0).toUpperCase() + key.slice(1),
            icone: iconesPadrao[key] || "",
            quantidade: Number(qtd) || 0,
        }));
    }

    const totalCorreto = itensResumo.reduce((acc, item) => acc + item.quantidade, 0);

    renderizarResumoQuantidades(itensResumo);

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
                verificarRespostaMatematica(valor, totalCorreto, botao, itensResumo);
            });
            containerOpcoes.appendChild(botao);
        });
    }

    mostrarFeedbackMatematica("Escolha uma das opções acima.", "neutral");
}

function renderizarResumoQuantidades(itensResumo) {
    const container = document.querySelector("#resumo-quantidades");
    if (!container) {
        return;
    }

    container.innerHTML = "";

    itensResumo.forEach((item, index) => {
        if (index > 0) {
            const operador = document.createElement("span");
            operador.className = "operador-soma";
            operador.setAttribute("aria-hidden", "true");
            operador.textContent = "+";
            container.appendChild(operador);
        }

        const divItem = document.createElement("div");
        divItem.className = "item-resumo";

        if (item.icone) {
            const spanIcone = document.createElement("span");
            spanIcone.className = "icone-resumo";
            spanIcone.setAttribute("aria-hidden", "true");
            spanIcone.textContent = item.icone;
            divItem.appendChild(spanIcone);
        }

        const spanNome = document.createElement("span");
        spanNome.className = "nome-resumo";
        spanNome.textContent = `${item.nome}:`;
        divItem.appendChild(spanNome);

        const strongValor = document.createElement("strong");
        strongValor.className = "valor-resumo";
        strongValor.id = `resumo-${item.key}`;
        strongValor.textContent = item.quantidade;
        divItem.appendChild(strongValor);

        container.appendChild(divItem);
    });
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

    const lista = Array.from(opcoes);
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    return lista;
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

        let somaTexto = "";
        if (Array.isArray(dados)) {
            somaTexto = `${dados.map((d) => d.quantidade).join(" + ")} = ${totalCorreto}`;
        } else if (dados && typeof dados === "object") {
            somaTexto = `${Object.values(dados).join(" + ")} = ${totalCorreto}`;
        } else {
            somaTexto = `${totalCorreto}`;
        }

        // Gravação da persistência de dados do progresso
        const faseAtual = typeof window.obterFaseAtiva === "function"
            ? window.obterFaseAtiva()
            : (new URLSearchParams(window.location.search).get("fase") || 1);

        const mundoAtual = typeof window.obterMundoAtivo === "function"
            ? window.obterMundoAtivo()
            : 1;

        const totalFases = typeof window.obterTotalFasesMundoAtivo === "function"
            ? window.obterTotalFasesMundoAtivo()
            : 3;

        if (typeof desbloquearProximaFase === "function") {
            desbloquearProximaFase(faseAtual, mundoAtual, totalFases);
        }

        mostrarFeedbackMatematica(`Muito bem! Você acertou! ${somaTexto} objetos organizados ao todo!`, "success");
        exibirBotoesConclusao(faseAtual);
    } else {
        botaoClicado.classList.add("is-wrong");
        mostrarFeedbackMatematica("Quase lá! Vamos contar de novo? Tente outra resposta.", "error");
    }
}

function exibirBotoesConclusao(faseAtual) {
    const painel = document.querySelector(".painel-matematica");
    if (!painel || document.querySelector(".acoes-conclusao")) {
        return;
    }

    let numeroFase = 1;
    if (typeof faseAtual === "number") {
        numeroFase = faseAtual;
    } else if (typeof faseAtual === "string") {
        const match = faseAtual.match(/\d+/);
        numeroFase = match ? parseInt(match[0], 10) : 1;
    }

    const containerAcoes = document.createElement("div");
    containerAcoes.className = "acoes-conclusao";

    // Botão Voltar para o Menu
    const btnMenu = document.createElement("button");
    btnMenu.type = "button";
    btnMenu.className = "btn-conclusao";
    btnMenu.textContent = "Voltar para o Menu";
    btnMenu.setAttribute("aria-label", "Voltar para a seleção de mundos");
    btnMenu.addEventListener("click", () => {
        window.location.href = "index.html?view=mundos";
    });
    containerAcoes.appendChild(btnMenu);

    // Obtenção da configuração do mundo ativo para determinar se existe próxima fase
    const mundoAtual = typeof window.obterMundoAtivo === "function"
        ? window.obterMundoAtivo()
        : (Number(new URLSearchParams(window.location.search).get("mundo")) || 1);

    const mundos = window.MUNDOS || {};
    const configMundo = mundos[mundoAtual];
    const totalFases = configMundo && typeof configMundo.totalFases === "number"
        ? configMundo.totalFases
        : (typeof window.obterTotalFasesMundoAtivo === "function" ? window.obterTotalFasesMundoAtivo() : 3);

    // Se houver próxima fase configurada no mundo, renderiza o botão Próxima Fase
    if (numeroFase < totalFases) {
        const proximaFase = numeroFase + 1;
        const btnProxima = document.createElement("button");
        btnProxima.type = "button";
        btnProxima.className = "btn-conclusao";
        btnProxima.textContent = "Próxima Fase";
        btnProxima.setAttribute("aria-label", `Avançar para a Fase ${proximaFase}`);
        btnProxima.addEventListener("click", () => {
            window.location.href = `fase1.html?mundo=${mundoAtual}&fase=${proximaFase}`;
        });
        containerAcoes.appendChild(btnProxima);
    }

    painel.appendChild(containerAcoes);
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
