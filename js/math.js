// Desafio em exibição. Guardado para que o DEV possa simular a resposta correta
// sem precisar recalcular a conta por conta própria.
let desafioMatematicoAtivo = null;

// Sequência de contas da fase, quando ela declara "desafios". O estado é só
// isto: a lista e o índice de onde paramos.
// Fase sem sequência mantém a lista nula e o fluxo anterior, intacto.
let sequenciaDeDesafios = null;
let indiceDoDesafioAtual = 0;

// Quantas contas da sequência já foram acertadas. É o que alimenta o indicador
// de progresso da fase — os corações do Boss, quando a fase declara um.
//
// Não é a mesma coisa que indiceDoDesafioAtual: depois do acerto da última
// conta o índice continua apontando para ela, enquanto os acertos chegam ao
// total. É justamente essa diferença que leva o indicador a zero.
let acertosNaSequencia = 0;

// Adversário declarado pela fase, quando existe. Guarda apenas apresentação
// (nome e figura): a quantidade de corações vem do tamanho da sequência.
let bossDaFase = null;

// Config da fase que esta etapa matemática está servindo. É o que permite
// reconhecer se uma chamada se refere à MESMA fase já em andamento ou a uma
// fase nova — sem isso, o estado de uma fase vazaria para a seguinte.
let faseEmAndamento = null;

// Pausa entre uma conta e a próxima, para a criança ler o "Muito bem!" antes de
// a tela trocar. É o mesmo tempo que game.js já usa entre a organização e a
// etapa matemática, para o ritmo do jogo não mudar de um lugar para o outro.
const PAUSA_ENTRE_DESAFIOS_MS = 1000;

// Durações sincronizadas com as animações GIF do Boss (Mundo 5):
// - "Monstro tomando dano.gif": 30 quadros (1200ms)
// - "monstro desintegrando.gif": 140 quadros (5600ms)
const DURACAO_ANIMACAO_DANO_BOSS_MS = 1200;
const DURACAO_ANIMACAO_DERROTA_BOSS_MS = 5600;

// Pausa na virada de etapa (adversário vencido → arrumar a casa): aguarda a
// conclusão completa da animação de desintegração antes de ocultar o monstro e o HUD.
const PAUSA_ANTES_DA_ORGANIZACAO_MS = DURACAO_ANIMACAO_DERROTA_BOSS_MS;

// Temporizador ativo para reverter a animação de dano de volta ao estado padrão (idle).
let timerEstadoBoss = null;
let tutorialMatematicaFase1Ativo = false;

function removerTutorialMatematicaFase1() {
    tutorialMatematicaFase1Ativo = false;
    document.body.classList.remove("tutorial-matematica-ativo");
    document.querySelector("#tutorial-matematica-overlay")?.remove();
    document.querySelector("#tutorial-balao-matematica")?.remove();
    document.querySelector("#tutorial-maozinha-matematica")?.remove();
    document.querySelector("#tutorial-banner-acerto")?.remove();
    document.querySelector("#tutorial-banner-incentivo")?.remove();
}

function iniciarTutorialMatematicaFase1() {
    removerTutorialMatematicaFase1();
    const telaMatematica = document.querySelector("#tela-matematica");
    const opcoesContainer = document.querySelector("#opcoes-matematica");
    if (!telaMatematica || !opcoesContainer) {
        return;
    }

    tutorialMatematicaFase1Ativo = true;
    document.body.classList.add("tutorial-matematica-ativo");

    const overlay = document.createElement("div");
    overlay.id = "tutorial-matematica-overlay";
    overlay.className = "tutorial-overlay-escuro tutorial-overlay-matematica";
    overlay.setAttribute("aria-hidden", "true");
    telaMatematica.appendChild(overlay);

    const balao = document.createElement("div");
    balao.id = "tutorial-balao-matematica";
    balao.className = "tutorial-balao-fase tutorial-balao-matematica";
    balao.setAttribute("role", "status");
    balao.setAttribute("aria-live", "polite");
    balao.textContent = "Conte todos os itens e clique na resposta correta!";
    opcoesContainer.appendChild(balao);

    const maozinha = document.createElement("img");
    maozinha.id = "tutorial-maozinha-matematica";
    maozinha.className = "tutorial-maozinha-matematica";
    maozinha.src = "assets/images/tela_fase1/maozinha.png";
    maozinha.alt = "";
    maozinha.setAttribute("aria-hidden", "true");
    opcoesContainer.appendChild(maozinha);
}

function exibirComemoracaoTutorialMatematica(aoConcluir) {
    document.querySelector("#tutorial-balao-matematica")?.remove();
    document.querySelector("#tutorial-maozinha-matematica")?.remove();

    const telaMatematica = document.querySelector("#tela-matematica");
    if (!telaMatematica) {
        removerTutorialMatematicaFase1();
        if (typeof aoConcluir === "function") aoConcluir();
        return;
    }

    const banner = document.createElement("div");
    banner.id = "tutorial-banner-acerto";
    banner.className = "tutorial-banner-comemoracao";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.textContent = "Isso!!!! Você acertou!!";
    telaMatematica.appendChild(banner);

    setTimeout(() => {
        banner.remove();

        const bannerIncentivo = document.createElement("div");
        bannerIncentivo.id = "tutorial-banner-incentivo";
        bannerIncentivo.className = "tutorial-banner-incentivo";
        bannerIncentivo.setAttribute("role", "status");
        bannerIncentivo.setAttribute("aria-live", "polite");
        bannerIncentivo.innerHTML =
            "Finalize as próximas fases para liberar um mundo novo!!!" +
            '<span class="tutorial-subtexto-incentivo">(Clique para continuar)</span>';
        telaMatematica.appendChild(bannerIncentivo);

        let finalizado = false;
        const finalizarIncentivo = () => {
            if (finalizado) return;
            finalizado = true;
            removerTutorialMatematicaFase1();
            if (typeof aoConcluir === "function") {
                aoConcluir();
            }
        };

        const timerLeitura = setTimeout(finalizarIncentivo, 3800);
        const aoClicarFechar = () => {
            clearTimeout(timerLeitura);
            finalizarIncentivo();
        };

        bannerIncentivo.addEventListener("click", aoClicarFechar, { once: true });
        document.querySelector("#tutorial-matematica-overlay")?.addEventListener("click", aoClicarFechar, { once: true });
    }, 1600);
}

function limparTimerEstadoBoss() {
    if (timerEstadoBoss !== null) {
        clearTimeout(timerEstadoBoss);
        timerEstadoBoss = null;
    }
}

function obterSrcAnimacaoBoss(estado) {
    if (!bossDaFase) {
        return "";
    }
    const animacoes = bossDaFase.animacoes || {};
    if (estado === "dano") {
        return animacoes.dano || "assets/images/mundo_5/Monstro tomando dano.gif";
    }
    if (estado === "derrota") {
        return animacoes.derrota || "assets/images/mundo_5/monstro desintegrando.gif";
    }
    return animacoes.idle || bossDaFase.imgSrc || "assets/images/mundo_5/animação padrao.gif";
}

function precarregarAnimacoesBoss() {
    if (!bossDaFase || typeof Image === "undefined") {
        return;
    }
    ["idle", "dano", "derrota"].forEach((estado) => {
        const src = obterSrcAnimacaoBoss(estado);
        if (src) {
            const img = new Image();
            img.src = src;
        }
    });
}

function definirEstadoVisualBoss(estado) {
    const imagem = document.querySelector("#boss-imagem");
    const area = document.querySelector("#area-boss");
    if (!imagem || !bossDaFase) {
        return;
    }

    const novoSrc = obterSrcAnimacaoBoss(estado);
    if (!novoSrc) {
        return;
    }

    imagem.dataset.estadoBoss = estado;
    imagem.classList.remove("estado-idle", "estado-dano", "estado-derrota", "boss-levou-dano");
    imagem.classList.add(`estado-${estado}`);

    if (area) {
        area.classList.toggle("boss-em-dano", estado === "dano");
        area.classList.toggle("boss-desintegrando", estado === "derrota");
    }

    if (imagem.getAttribute("src") !== novoSrc) {
        imagem.src = novoSrc;
    }
    imagem.alt = bossDaFase.imgAlt || bossDaFase.nome || "Adversário da fase";
}

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

// Uma conta COMPOSTA traz, além dos valores, o operador de cada lacuna entre
// eles — { valores: [9, 8, 2], operadores: ["+", "-"] } é 9 + 8 − 2.
//
// Exige os DOIS arrays justamente para não confundir com o formato legado de
// objeto ({ brinquedos: 3, comidas: 2 }), que também é um objeto.
function ehContaComposta(dados) {
    return !!dados
        && !Array.isArray(dados)
        && typeof dados === "object"
        && Array.isArray(dados.valores)
        && Array.isArray(dados.operadores);
}

// Ponto de entrada da etapa matemática de uma fase — é o que game.js chama
// quando a organização termina.
//
// Uma fase pode declarar uma SEQUÊNCIA de contas em "desafios". A detecção é
// pelo DADO, nunca pelo número do mundo: qualquer fase, de qualquer mundo, pode
// declarar a lista e passa a rodar as contas em ordem. Fase que não declara
// segue montando uma única conta a partir das quantidades organizadas.
function iniciarEtapaMatematica(dadosQuantidades, configDaFase) {
    // Numa fase com adversário a ordem é invertida: o desafio vem ANTES da
    // arrumação. Então, se o adversário DESTA fase já caiu, esta chamada não
    // significa "abrir a matemática" — significa que a organização FINAL acabou
    // de ser concluída, e é ela que encerra a fase.
    //
    // Quem detecta a conclusão continua sendo game.js, pelo estado real dos
    // objetos (isOrganizationComplete); aqui só se decide o que fazer com ela.
    //
    // A comparação com a fase em andamento é o que impede o estado de uma fase
    // de atrapalhar a seguinte: uma fase nova traz outra config e segue o
    // caminho normal.
    if (configDaFase && configDaFase === faseEmAndamento && bossFoiVencido()) {
        concluirEtapaFinal();
        return;
    }

    limparTimerEstadoBoss();
    faseEmAndamento = configDaFase || null;

    const desafios = configDaFase && Array.isArray(configDaFase.desafios)
        ? configDaFase.desafios
        : null;

    if (desafios && desafios.length > 0) {
        sequenciaDeDesafios = desafios;
        indiceDoDesafioAtual = 0;
        acertosNaSequencia = 0;
        bossDaFase = configDaFase.boss || null;
        if (bossDaFase) {
            precarregarAnimacoesBoss();
            definirEstadoVisualBoss("idle");
        }
        renderizarBoss();
        iniciarDesafioMatematico(desafios[0]);
        return;
    }

    // Sem sequência: zera o estado para que nada de uma fase anterior continue
    // valendo, e segue o caminho de sempre.
    sequenciaDeDesafios = null;
    indiceDoDesafioAtual = 0;
    acertosNaSequencia = 0;
    bossDaFase = null;
    renderizarBoss();
    iniciarDesafioMatematico(dadosQuantidades, configDaFase ? configDaFase.operacao : undefined);
}

// Mostra o adversário da fase e um coração por conta que ainda falta acertar.
//
// Quem decide se a área aparece é a própria fase, ao declarar (ou não) o campo
// "boss" — nenhuma checagem por número de mundo. Sem a declaração, a área fica
// escondida e os Mundos 1–4 seguem exatamente como antes.
//
// Os corações não são contados à parte: restam tantos quantas contas faltam.
// Além dos símbolos, a contagem aparece em texto, porque uma criança não deve
// precisar distinguir a cor dos emojis para saber quantos sobraram.
function renderizarBoss() {
    const area = document.querySelector("#area-boss");
    const hudVidas = document.querySelector("#boss-hud-vidas");

    if (!area) {
        return;
    }

    if (!bossDaFase || !sequenciaDeDesafios) {
        area.classList.add("escondido");
        area.classList.remove("is-derrotado", "boss-em-dano", "boss-desintegrando", "boss-derrotado-animando");
        if (hudVidas) {
            hudVidas.classList.add("escondido");
        }
        return;
    }

    area.classList.remove("escondido");

    const total = sequenciaDeDesafios.length;
    const restantes = Math.max(0, total - acertosNaSequencia);

    const imagem = document.querySelector("#boss-imagem");
    if (imagem && !imagem.getAttribute("src")) {
        definirEstadoVisualBoss("idle");
    }

    const nome = document.querySelector("#boss-nome");
    if (nome) {
        nome.textContent = bossDaFase.nome || "";
    }

    // Renderização dos corações de vida dinâmicos no HUD superior esquerdo
    if (hudVidas) {
        hudVidas.classList.remove("escondido");
        hudVidas.innerHTML = "";
        for (let i = 0; i < total; i++) {
            const coracao = document.createElement("span");
            coracao.className = `coracao-vida ${i < restantes ? "ativo" : "perdido"}`;
            coracao.setAttribute("aria-hidden", "true");
            coracao.textContent = "❤️";
            hudVidas.appendChild(coracao);
        }
        hudVidas.setAttribute("aria-label", `${restantes} de ${total} corações de vida do monstro`);
    }

    // Um símbolo por conta: cheio para o que falta, vazio para o que já caiu.
    const coracoes = document.querySelector("#boss-coracoes");
    if (coracoes) {
        coracoes.textContent = "❤️".repeat(restantes) + "🤍".repeat(total - restantes);
    }

    const contagem = document.querySelector("#boss-contagem");
    if (contagem) {
        contagem.textContent = `${restantes} de ${total} corações`;
    }

    area.classList.toggle("is-derrotado", restantes === 0);
}

// Há mais alguma conta depois da atual? Só o acerto da última encerra a etapa
// matemática. O total vem do tamanho da lista declarada — nenhum número fixo.
function haProximoDesafio() {
    return !!sequenciaDeDesafios && indiceDoDesafioAtual < sequenciaDeDesafios.length - 1;
}

// Marco que separa as duas etapas de uma fase com adversário. É derivado do
// estado que já existe — todas as contas acertadas —, sem nenhuma bandeira nova
// e sem olhar para o número do mundo.
function bossFoiVencido() {
    return !!bossDaFase
        && !!sequenciaDeDesafios
        && acertosNaSequencia >= sequenciaDeDesafios.length;
}

// Encerra a etapa do adversário e devolve a cena para a organização, que já
// está montada e com os eventos ligados desde o início da fase (game.js →
// startGame). Nenhuma mecânica nova: só a troca de etapa e o aviso à criança.
function abrirEtapaDeOrganizacao() {
    limparTimerEstadoBoss();

    const telaMatematica = document.querySelector("#tela-matematica");
    if (telaMatematica) {
        telaMatematica.classList.add("escondido");
    }

    const hudVidas = document.querySelector("#boss-hud-vidas");
    if (hudVidas) {
        hudVidas.classList.add("escondido");
    }

    const areaBoss = document.querySelector("#area-boss");
    if (areaBoss) {
        areaBoss.classList.add("escondido");
        areaBoss.classList.remove("boss-derrotado-animando", "boss-desintegrando", "boss-em-dano");
    }

    const painelMat = document.querySelector(".painel-matematica");
    if (painelMat) {
        painelMat.classList.remove("painel-matematica-sumindo");
    }

    const telaOrganizacao = document.querySelector("#tela-organizacao");
    if (telaOrganizacao) {
        telaOrganizacao.classList.remove("escondido");
        telaOrganizacao.classList.add("fade-in-organizacao");
    }

    // No Mundo 5: atualiza o balão de instruções para hud_branco2.png ("Coloque cada item em sua respectiva cesta.")
    if (bossDaFase) {
        const hudOrgImg = document.querySelector("#tela-organizacao .caixa-instrucoes");
        if (hudOrgImg) {
            hudOrgImg.src = "assets/images/mundo_5/hud_branco2.png";
            hudOrgImg.alt = "Coloque cada item em sua respectiva cesta.";
        }
        const feedbackMsg = document.querySelector("#feedback-message");
        if (feedbackMsg) {
            feedbackMsg.classList.remove("hud-texto-oculto-boss");
        }
        if (faseEmAndamento?.fundoBaguncado || faseEmAndamento?.fundo) {
            document.body.classList.remove("cenario-arrumado");
            document.body.style.backgroundImage = `url("${faseEmAndamento.fundoBaguncado || faseEmAndamento.fundo}")`;
        }
    }

    const aviso = document.querySelector("#aviso-organizacao");
    if (aviso) {
        aviso.classList.remove("escondido");
    }

    // O texto do HUD já é uma região "live": trocá-lo é o que anuncia a etapa
    // nova para quem usa leitor de tela.
    const hud = document.querySelector("#feedback-message");
    if (hud) {
        hud.textContent = "Agora arraste cada objeto até a cesta certa!";
    }
}

function iniciarDesafioMatematico(dadosQuantidades, operacaoId) {
    // A cena "arrumada" NÃO é marcada aqui: quem arruma a casa é a organização,
    // e game.js já aplica a classe e o fundo arrumado assim que ela termina,
    // antes de chamar esta etapa. Fazer isso aqui também era redundante — e
    // deixava a casa arrumada antes da hora numa fase que enfrenta o
    // adversário primeiro e arruma depois.
    const telaOrganizacao = document.querySelector("#tela-organizacao");
    const telaMatematica = document.querySelector("#tela-matematica");

    if (telaOrganizacao) {
        telaOrganizacao.classList.add("escondido");
    }

    if (telaMatematica) {
        telaMatematica.classList.remove("escondido");
    }

    // No Mundo 5 com Boss: configura o balão de instruções da matemática para hud_branco.png
    if (bossDaFase) {
        document.body.classList.add("fase-com-boss");
        const hudMatematicaImg = document.querySelector("#tela-matematica .caixa-instrucoes");
        if (hudMatematicaImg) {
            hudMatematicaImg.src = "assets/images/mundo_5/hud_branco.png";
            hudMatematicaImg.alt = "Arrume a Bagunça! Derrote o boss da bagunça para ganhar!";
        }
        const tituloMatematica = document.querySelector("#titulo-matematica");
        if (tituloMatematica) {
            tituloMatematica.classList.remove("hud-texto-oculto-boss");
            tituloMatematica.textContent = "Derrote o Monstro da Bagunça para ganhar!";
        }
    }

    // Três formatos são aceitos aqui:
    //
    //   1. array de { key, nome, icone, quantidade } — as quantidades reais
    //      organizadas pela criança (game.js → getCategorySummary);
    //   2. objeto legado ({ brinquedos: X, comidas: Y, materiais: Z });
    //   3. conta composta ({ valores, operadores }).
    //
    // O formato 3 é verificado PRIMEIRO porque também é um objeto e cairia no
    // formato 2 por engano.
    const contaComposta = ehContaComposta(dadosQuantidades) ? dadosQuantidades : null;

    let itensResumo = [];

    if (contaComposta) {
        // Conta puramente numérica: sem nome e sem ícone. A renderização omite
        // os dois quando não vêm, então basta não declará-los — e uma conta que
        // um dia queira rótulo ou ícone só precisa informá-los aqui.
        itensResumo = contaComposta.valores.map((valor) => ({
            quantidade: Number(valor) || 0,
        }));
    } else if (Array.isArray(dadosQuantidades)) {
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

    // Numa conta composta a operação vem da própria conta: por padrão a
    // "composta" de operacoes.js, que é quem sabe resolver uma lista de
    // operadores. A conta pode declarar outra, se algum dia fizer sentido.
    const operacao = obterOperacaoMatematica(
        contaComposta ? (contaComposta.operacao || "composta") : operacaoId
    );

    if (!operacao) {
        desafioMatematicoAtivo = null;
        mostrarFeedbackMatematica("Não foi possível montar o desafio desta fase.", "error");
        return;
    }

    const valores = itensResumo.map((item) => item.quantidade);

    // Operador de CADA lacuna entre os valores — sempre valores.length - 1.
    //
    // Conta simples: todas as lacunas repetem o símbolo único da operação, que
    // é exatamente o que os Mundos 1–4 já exibiam.
    // Conta composta: cada lacuna usa o operador declarado pela conta.
    //
    // Este é o único ponto que decide os operadores; daqui para baixo, quem
    // exibe a conta apenas consome a lista, sem perguntar de onde ela veio.
    const operadores = contaComposta
        ? contaComposta.operadores.map(String)
        : valores.slice(1).map(() => operacao.simbolo);

    // O segundo argumento só é usado pela operação "composta". As quatro
    // operações simples recebem um argumento extra e o ignoram — em
    // JavaScript isso é inofensivo —, então nada muda para elas.
    const validacao = operacao.validar(valores, operadores);

    // Conta impossível só chega aqui por erro de autoria da fase (ex.: uma
    // subtração que ficaria negativa). Acusamos no console e não montamos
    // alternativas, em vez de exibir um resultado inválido na tela.
    if (!validacao.valido) {
        console.error(
            `[math.js] Conta inválida para a operação "${operacao.id}": ${validacao.motivo} ` +
            `Revise as quantidades/ordem das categorias desta fase.`
        );
        desafioMatematicoAtivo = null;
        renderizarResumoQuantidades(itensResumo, operadores);
        const containerInvalido = document.querySelector("#opcoes-matematica");
        if (containerInvalido) {
            containerInvalido.innerHTML = "";
        }
        mostrarFeedbackMatematica("Não foi possível montar o desafio desta fase.", "error");
        return;
    }

    const resultadoCorreto = operacao.calcular(valores, operadores);

    const perguntaEl = document.querySelector("#pergunta-matematica");
    if (perguntaEl) {
        perguntaEl.textContent = operacao.pergunta;
    }

    renderizarResumoQuantidades(itensResumo, operadores);

    // "operacao", "valores" e "resultadoCorreto" são os campos que o DEV já lê
    // (dev.js → obterDesafioMatematicoAtivo). "operadores" é acrescentado sem
    // alterar nenhum deles.
    desafioMatematicoAtivo = { operacao, valores, resultadoCorreto, operadores };

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
                verificarRespostaMatematica(valor, resultadoCorreto, botao, itensResumo, operacao, operadores);
            });
            containerOpcoes.appendChild(botao);
        });
    }

    mostrarFeedbackMatematica("Escolha uma das opções acima.", "neutral");

    const mundoAtual = typeof window.obterMundoAtivo === "function" ? window.obterMundoAtivo() : 1;
    const faseAtual = typeof window.obterFaseAtiva === "function" ? window.obterFaseAtiva() : 1;
    if (Number(mundoAtual) === 1 && Number(faseAtual) === 1 && !bossDaFase) {
        iniciarTutorialMatematicaFase1();
    } else {
        removerTutorialMatematicaFase1();
    }
}

// Exposto para o DEV simular a resposta certa respeitando a operação da fase.
function obterDesafioMatematicoAtivo() {
    return desafioMatematicoAtivo;
}

// "operadores" traz um símbolo por lacuna, na ordem em que aparecem entre os
// itens. Numa conta simples a lista é uniforme (o mesmo símbolo repetido), o
// que reproduz o comportamento anterior; numa conta composta cada lacuna tem o
// seu próprio operador.
function renderizarResumoQuantidades(itensResumo, operadores) {
    const container = document.querySelector("#resumo-quantidades");
    if (!container) {
        return;
    }

    container.innerHTML = "";

    const listaOperadores = Array.isArray(operadores) ? operadores : [];

    itensResumo.forEach((item, index) => {
        if (index > 0) {
            const operador = document.createElement("span");
            operador.className = "operador-conta";
            operador.setAttribute("aria-hidden", "true");
            operador.textContent = listaOperadores[index - 1] || "";
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

        // Nome e chave são opcionais: uma conta puramente numérica não tem
        // rótulo de categoria, e sem a guarda apareceria um ":" solto na tela.
        if (item.nome) {
            const spanNome = document.createElement("span");
            spanNome.className = "nome-resumo";
            spanNome.textContent = `${item.nome}:`;
            divItem.appendChild(spanNome);
        }

        const strongValor = document.createElement("strong");
        strongValor.className = "valor-resumo";
        if (item.key) {
            strongValor.id = `resumo-${item.key}`;
        }
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

function verificarRespostaMatematica(valorEscolhido, resultadoCorreto, botaoClicado, dados, operacao, operadores) {
    const botoes = document.querySelectorAll(".botao-opcao-matematica");

    if (valorEscolhido === resultadoCorreto) {
        if (typeof window.tocarEfeito === "function") {
            window.tocarEfeito("certo");
        }

        botoes.forEach((b) => {
            b.disabled = true;
            if (Number(b.textContent) === resultadoCorreto) {
                b.classList.add("is-correct");
            }
        });

        const separador = ` ${operacao.simbolo} `;
        let contaTexto = "";
        if (Array.isArray(dados)) {
            // Intercala cada valor com o operador da sua lacuna. Numa conta
            // simples a lista é uniforme e o texto sai idêntico ao de antes
            // ("3 + 2 = 5"); numa conta composta sai "9 + 8 - 2 = 15".
            const listaOperadores = Array.isArray(operadores) ? operadores : [];
            const parcelas = dados.map((d) => d.quantidade);
            let conta = parcelas.length > 0 ? String(parcelas[0]) : "";
            for (let i = 1; i < parcelas.length; i++) {
                conta += ` ${listaOperadores[i - 1] || operacao.simbolo} ${parcelas[i]}`;
            }
            contaTexto = `${conta} = ${resultadoCorreto}`;
        } else if (dados && typeof dados === "object") {
            contaTexto = `${Object.values(dados).join(separador)} = ${resultadoCorreto}`;
        } else {
            contaTexto = `${resultadoCorreto}`;
        }

        // Uma conta vencida. Quando a fase declara um Boss, é isto que tira um
        // coração dele — inclusive no acerto da última conta, que o deixa em
        // zero. O erro não passa por aqui, então nunca custa um coração.
        if (sequenciaDeDesafios) {
            acertosNaSequencia++;
            renderizarBoss();

            if (bossDaFase) {
                limparTimerEstadoBoss();

                if (bossFoiVencido()) {
                    definirEstadoVisualBoss("derrota");
                } else {
                    const duracaoDano = Number(bossDaFase.duracaoDanoMs) || DURACAO_ANIMACAO_DANO_BOSS_MS;
                    definirEstadoVisualBoss("dano");
                    timerEstadoBoss = setTimeout(() => {
                        timerEstadoBoss = null;
                        if (!bossFoiVencido()) {
                            definirEstadoVisualBoss("idle");
                        }
                    }, duracaoDano);
                }
            }
        }

        // Fase com sequência: este acerto NÃO conclui a fase enquanto houver
        // conta pela frente — mostra o feedback e, depois da pausa, entra a
        // próxima. A conclusão e a gravação de progresso abaixo ficam para o
        // acerto da última conta.
        if (haProximoDesafio()) {
            mostrarFeedbackMatematica(operacao.mensagemSucesso(contaTexto), "success");
            const pausaEntreDesafios = bossDaFase
                ? (Number(bossDaFase.duracaoDanoMs) || DURACAO_ANIMACAO_DANO_BOSS_MS)
                : PAUSA_ENTRE_DESAFIOS_MS;
            setTimeout(() => {
                indiceDoDesafioAtual++;
                iniciarDesafioMatematico(sequenciaDeDesafios[indiceDoDesafioAtual]);
            }, pausaEntreDesafios);
            return;
        }

        // Adversário sem corações: a fase NÃO termina aqui. A casa continua
        // bagunçada e arrumá-la é a etapa seguinte, então a conclusão e a
        // gravação de progresso abaixo não valem para este caminho — elas
        // passam a pertencer ao fim da organização.
        if (bossFoiVencido()) {
            mostrarFeedbackMatematica(operacao.mensagemSucesso(contaTexto), "success");
            const areaBoss = document.querySelector("#area-boss");
            if (areaBoss) {
                areaBoss.classList.add("boss-derrotado-animando");
            }
            const painelMat = document.querySelector(".painel-matematica");
            if (painelMat) {
                painelMat.classList.add("painel-matematica-sumindo");
            }
            const duracaoDerrota = (bossDaFase && Number(bossDaFase.duracaoDerrotaMs)) || PAUSA_ANTES_DA_ORGANIZACAO_MS;
            setTimeout(abrirEtapaDeOrganizacao, duracaoDerrota);
            return;
        }

        const faseAtual = registrarConclusaoDaFase();
        mostrarFeedbackMatematica(operacao.mensagemSucesso(contaTexto), "success");
        if (tutorialMatematicaFase1Ativo) {
            exibirComemoracaoTutorialMatematica(() => {
                exibirBotoesConclusao(faseAtual);
            });
        } else {
            exibirBotoesConclusao(faseAtual);
        }
    } else {
        if (typeof window.tocarEfeito === "function") {
            window.tocarEfeito("errado");
        }
        botaoClicado.classList.add("is-wrong");
        mostrarFeedbackMatematica("Quase lá! Vamos contar de novo? Tente outra resposta.", "error");
    }
}

// Grava a conclusão da fase e devolve o número dela, para quem precisar montar
// os botões. É o ÚNICO lugar que fala com o progresso: todas as fases passam
// por aqui, então não há caminho de persistência paralelo.
function registrarConclusaoDaFase() {
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

    return faseAtual;
}

// Revela o encerramento da etapa final e devolve o elemento, para os botões de
// conclusão serem anexados dentro dele.
function exibirMensagemDeVitoria() {
    // O aviso da etapa de arrumação já cumpriu o seu papel.
    const aviso = document.querySelector("#aviso-organizacao");
    if (aviso) {
        aviso.classList.add("escondido");
    }

    const painelVitoria = document.querySelector("#painel-vitoria");
    if (painelVitoria) {
        if (bossDaFase) {
            const tituloVitoria = painelVitoria.querySelector(".titulo-vitoria");
            if (tituloVitoria) {
                tituloVitoria.innerHTML = `<span aria-hidden="true">🎉</span> MONSTRO DERROTADO!`;
            }
            const subtituloVitoria = painelVitoria.querySelector(".subtitulo-vitoria");
            if (subtituloVitoria) {
                subtituloVitoria.innerHTML = `<span aria-hidden="true">⭐</span> VOCÊ ARRUMOU A BAGUNÇA!`;
            }
        }
        painelVitoria.classList.remove("escondido");
    }

    return painelVitoria;
}

// Fim da etapa final de uma fase que enfrentou o adversário antes de arrumar a
// casa: a casa ficou organizada, então agora sim a fase termina. Daqui para
// frente é o mesmo caminho de conclusão e de progresso das outras fases.
function concluirEtapaFinal() {
    document.body.classList.add("cenario-arrumado");
    if (faseEmAndamento?.fundoArrumado) {
        document.body.style.backgroundImage = `url("${faseEmAndamento.fundoArrumado}")`;
    }
    const painelVitoria = exibirMensagemDeVitoria();
    const faseAtual = registrarConclusaoDaFase();
    exibirBotoesConclusao(faseAtual, painelVitoria);
}

// "hospedeiro" permite montar os botões fora do painel matemático — na etapa
// final, ele está escondido, e quem recebe os botões é o painel de vitória.
function exibirBotoesConclusao(faseAtual, hospedeiro) {
    const painel = hospedeiro || document.querySelector(".painel-matematica");
    if (!painel || document.querySelector(".acoes-conclusao")) {
        return;
    }

    if (typeof window.tocarEfeito === "function") {
        setTimeout(() => {
            window.tocarEfeito("conclusao");
        }, 350);
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
        if (typeof window.tocarEfeito === "function") {
            window.tocarEfeito("botao");
        }
        if (typeof window.trocarTrilhaFundo === "function") {
            window.trocarTrilhaFundo("menu");
        }
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
            if (typeof window.tocarEfeito === "function") {
                window.tocarEfeito("botao");
            }
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
