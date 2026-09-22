// Desafio em exibição. Guardado para que o DEV possa simular a resposta correta
// sem precisar recalcular a conta por conta própria.
let desafioMatematicoAtivo = null;

function navegarEntreTelasDoJogo(destino, url) {
    if (window.parent !== window) {
        window.parent.postMessage({
            tipo: "arruma-bagunca:navegacao",
            destino,
            url,
        }, "*");
        return;
    }

    window.location.href = url;
}

// Localiza a operação declarada pela fase. A fase é a dona dessa escolha: se o
// id vier ausente ou desconhecido, o erro é de configuração do mundo e precisa
// aparecer no console — a soma entra apenas para a tela não ficar quebrada
// na frente da criança.
function obterOperacaoMatematica(operacaoId) {
    const operacoes = (typeof window !== "undefined" && window.OPERACOES) || {};
    const operacao = operacoes[operacaoId];

    if (operacao) {
        return operacao;
    }

    console.error(
        `[math.js] Operação "${operacaoId}" não encontrada em window.OPERACOES. ` +
        `Verifique se a fase declara "operacao" e se js/operacoes.js foi carregado antes de math.js. ` +
        `Usando soma como fallback.`
    );

    return operacoes.soma || null;
}

function iniciarDesafioMatematico(dadosQuantidades, operacaoId) {
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
            animais: "🐶",
        };
        itensResumo = Object.entries(dadosQuantidades).map(([key, qtd]) => ({
            key,
            nome: key.charAt(0).toUpperCase() + key.slice(1),
            icone: iconesPadrao[key] || "",
            quantidade: Number(qtd) || 0,
        }));
    }

    const operacao = obterOperacaoMatematica(operacaoId);

    if (!operacao) {
        desafioMatematicoAtivo = null;
        mostrarFeedbackMatematica("Não foi possível montar o desafio desta fase.", "error");
        return;
    }

    const valores = itensResumo.map((item) => item.quantidade);
    const validacao = operacao.validar(valores);

    // Conta impossível só chega aqui por erro de autoria da fase (ex.: uma
    // subtração que ficaria negativa). Acusamos no console e não montamos
    // alternativas, em vez de exibir um resultado inválido na tela.
    if (!validacao.valido) {
        console.error(
            `[math.js] Conta inválida para a operação "${operacao.id}": ${validacao.motivo} ` +
            `Revise as quantidades/ordem das categorias desta fase.`
        );
        desafioMatematicoAtivo = null;
        renderizarResumoQuantidades(itensResumo, operacao.simbolo);
        const containerInvalido = document.querySelector("#opcoes-matematica");
        if (containerInvalido) {
            containerInvalido.innerHTML = "";
        }
        mostrarFeedbackMatematica("Não foi possível montar o desafio desta fase.", "error");
        return;
    }

    const resultadoCorreto = operacao.calcular(valores);

    const perguntaEl = document.querySelector("#pergunta-matematica");
    if (perguntaEl) {
        perguntaEl.textContent = operacao.pergunta;
    }

    renderizarResumoQuantidades(itensResumo, operacao.simbolo);

    desafioMatematicoAtivo = { operacao, valores, resultadoCorreto };

    const opcoes = embaralharAlternativas(operacao.gerarAlternativas(resultadoCorreto, valores));
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
                verificarRespostaMatematica(valor, resultadoCorreto, botao, itensResumo, operacao);
            });
            containerOpcoes.appendChild(botao);
        });
    }

    mostrarFeedbackMatematica("Escolha uma das opções acima.", "neutral");
}

// Exposto para o DEV simular a resposta certa respeitando a operação da fase.
function obterDesafioMatematicoAtivo() {
    return desafioMatematicoAtivo;
}

function renderizarResumoQuantidades(itensResumo, simbolo) {
    const container = document.querySelector("#resumo-quantidades");
    if (!container) {
        return;
    }

    container.innerHTML = "";

    itensResumo.forEach((item, index) => {
        if (index > 0) {
            const operador = document.createElement("span");
            operador.className = "operador-conta";
            operador.setAttribute("aria-hidden", "true");
            operador.textContent = simbolo;
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

// Embaralhar é comum às três operações; quem escolhe os distratores é a
// operação (js/operacoes.js).
function embaralharAlternativas(alternativas) {
    const lista = Array.from(alternativas);
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    return lista;
}

function verificarRespostaMatematica(valorEscolhido, resultadoCorreto, botaoClicado, dados, operacao) {
    const botoes = document.querySelectorAll(".botao-opcao-matematica");

    if (valorEscolhido === resultadoCorreto) {
        botoes.forEach((b) => {
            b.disabled = true;
            if (Number(b.textContent) === resultadoCorreto) {
                b.classList.add("is-correct");
            }
        });

        const separador = ` ${operacao.simbolo} `;
        let contaTexto = "";
        if (Array.isArray(dados)) {
            contaTexto = `${dados.map((d) => d.quantidade).join(separador)} = ${resultadoCorreto}`;
        } else if (dados && typeof dados === "object") {
            contaTexto = `${Object.values(dados).join(separador)} = ${resultadoCorreto}`;
        } else {
            contaTexto = `${resultadoCorreto}`;
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

        mostrarFeedbackMatematica(operacao.mensagemSucesso(contaTexto), "success");
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
        navegarEntreTelasDoJogo("menu", "index.html?view=mundos");
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
            navegarEntreTelasDoJogo("fase", `fase1.html?mundo=${mundoAtual}&fase=${proximaFase}`);
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
