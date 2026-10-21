/**
 * @file jogador.js
 * @description Tela de identificação do jogador: apelido → confirmação → menu.
 *
 * ============================================================================
 * RESPONSABILIDADES
 * ============================================================================
 * - Mostrar as etapas da tela (#tela-identificacao em index.html).
 * - Enviar o apelido para o servidor e exibir a resposta.
 * - Mostrar o apelido e o avatar no topo do menu de mundos.
 *
 * Quem decide se um apelido é válido é o SERVIDOR (api/jogadores/*). Este
 * arquivo não repete as regras: só evita enviar um campo vazio.
 *
 * Sem servidor não há como entrar: a criança vê o aviso e pode tentar de
 * novo, com o apelido preservado. Não existe modo convidado.
 *
 * O jogador confirmado fica em sessionStorage (só nesta aba) apenas para
 * EXIBIÇÃO e para o caminho index.html?view=mundos. Não é prova de nada.
 *
 * Expõe: window.iniciarIdentificacao({ aoConcluir, aoVoltar })
 *        window.obterJogadorIdentificado()
 * ============================================================================
 */

(function configurarIdentificacaoDoJogador() {
  const CHAVE_JOGADOR = "arruma_bagunca_jogador";
  const TEMPO_LIMITE_MS = 8000;
  // Única opção de avatar aprovada pela equipe nesta versão.
  const AVATARES = { padrao: "👤" };
  const MENSAGEM_VAZIO = "Escreva um apelido para continuar.";
  const MENSAGEM_NAO_PERMITIDO = "Esse apelido não pode ser usado. Escolha outro!";

  const telaIdentificacao = document.querySelector("#tela-identificacao");
  const etapaApelido = document.querySelector("#etapa-apelido");
  const etapaConfirmacao = document.querySelector("#etapa-confirmacao");
  const formApelido = document.querySelector("#form-apelido");
  const campoApelido = document.querySelector("#campo-apelido");
  const erroApelido = document.querySelector("#erro-apelido");
  const btnVoltarIdentificacao = document.querySelector("#btn-voltar-identificacao");
  const btnContinuarApelido = document.querySelector("#btn-continuar-apelido");
  const tituloConfirmacao = document.querySelector("#titulo-confirmacao");
  const avatarConfirmacao = document.querySelector("#avatar-confirmacao");
  const apelidoConfirmacao = document.querySelector("#apelido-confirmacao");
  const textoConfirmacao = document.querySelector("#texto-confirmacao");
  const btnCorrigirApelido = document.querySelector("#btn-corrigir-apelido");
  const btnConfirmarApelido = document.querySelector("#btn-confirmar-apelido");
  const avisoConexao = document.querySelector("#aviso-conexao");
  const btnTentarNovamente = document.querySelector("#btn-tentar-novamente");
  const nomeJogadorMenu = document.querySelector("#nome-jogador");
  const avatarJogadorMenu = document.querySelector("#avatar-jogador");

  let aoConcluirIdentificacao = null;
  let aoVoltarIdentificacao = null;
  // Resposta de /api/jogadores/verificar mostrada na confirmação.
  let perfilEmConfirmacao = null;
  // Ação que o botão "Tentar de novo" repete (consultar ou confirmar).
  let acaoParaRepetir = null;

  function tocarSomBotao() {
    if (typeof window.tocarEfeito === "function") {
      window.tocarEfeito("botao");
    }
  }

  function obterJogadorIdentificado() {
    try {
      const dados = window.sessionStorage.getItem(CHAVE_JOGADOR);
      return dados ? JSON.parse(dados) : null;
    } catch (erro) {
      return null;
    }
  }

  function guardarJogadorIdentificado(jogador) {
    try {
      window.sessionStorage.setItem(CHAVE_JOGADOR, JSON.stringify(jogador));
    } catch (erro) {
      // Sem sessionStorage o jogo continua; só o caminho ?view=mundos pedirá o apelido de novo.
    }
  }

  function obterAvatar(idAvatar) {
    return AVATARES[idAvatar] || AVATARES.padrao;
  }

  /**
   * Atualiza o topo do menu de mundos. Usa textContent: o apelido nunca é
   * interpretado como HTML.
   */
  function atualizarPerfilNoMenu(jogador) {
    if (nomeJogadorMenu) {
      nomeJogadorMenu.textContent = jogador?.apelido || "Jogador";
    }
    if (avatarJogadorMenu) {
      avatarJogadorMenu.textContent = obterAvatar(jogador?.avatar);
    }
  }

  /**
   * Envia JSON para a API e classifica o resultado:
   *   "ok"          → resposta 2xx com JSON
   *   "validacao"   → 422 (apelido inválido ou não permitido), com a mensagem do servidor
   *   "indisponivel"→ sem conexão, demora, 5xx, 404 ou resposta inesperada
   */
  async function chamarApi(url, corpo) {
    const controle = new AbortController();
    const prazo = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

    try {
      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        signal: controle.signal,
      });

      let dados = null;
      try {
        dados = await resposta.json();
      } catch (erro) {
        dados = null;
      }

      if (resposta.status === 422 && dados?.erro) {
        return { tipo: "validacao", mensagem: dados.mensagem || MENSAGEM_NAO_PERMITIDO };
      }
      if (resposta.ok && dados) {
        return { tipo: "ok", dados };
      }
      return { tipo: "indisponivel" };
    } catch (erro) {
      return { tipo: "indisponivel" };
    } finally {
      clearTimeout(prazo);
    }
  }

  function definirOcupado(botao, ocupado, textoOcupado) {
    if (!botao) {
      return;
    }
    if (ocupado) {
      botao.dataset.textoOriginal = botao.textContent;
      botao.textContent = textoOcupado;
      botao.disabled = true;
      botao.setAttribute("aria-busy", "true");
    } else {
      botao.textContent = botao.dataset.textoOriginal || botao.textContent;
      botao.disabled = false;
      botao.removeAttribute("aria-busy");
    }
  }

  function mostrarErroApelido(mensagem) {
    erroApelido.textContent = mensagem;
    erroApelido.classList.remove("escondido");
    campoApelido.setAttribute("aria-invalid", "true");
    campoApelido.focus();
  }

  function limparErroApelido() {
    erroApelido.textContent = "";
    erroApelido.classList.add("escondido");
    campoApelido.removeAttribute("aria-invalid");
  }

  function mostrarAvisoConexao(acao) {
    acaoParaRepetir = acao;
    avisoConexao.classList.remove("escondido");
    btnTentarNovamente.focus();
  }

  function esconderAvisoConexao() {
    acaoParaRepetir = null;
    avisoConexao.classList.add("escondido");
  }

  function mostrarEtapaApelido() {
    perfilEmConfirmacao = null;
    esconderAvisoConexao();
    etapaConfirmacao.classList.add("escondido");
    etapaApelido.classList.remove("escondido");
    campoApelido.focus();
  }

  function mostrarEtapaConfirmacao() {
    const existe = perfilEmConfirmacao.existe === true;
    const jogador = perfilEmConfirmacao.jogador;

    tituloConfirmacao.textContent = existe ? "Encontramos você!" : "Novo jogador!";
    textoConfirmacao.textContent = existe
      ? "Esse é o seu perfil?"
      : "Vamos criar o seu perfil com este apelido?";
    apelidoConfirmacao.textContent = existe ? jogador.apelido : perfilEmConfirmacao.apelido;
    avatarConfirmacao.textContent = obterAvatar(existe ? jogador.avatar : "padrao");

    esconderAvisoConexao();
    etapaApelido.classList.add("escondido");
    etapaConfirmacao.classList.remove("escondido");
    tituloConfirmacao.focus();
  }

  /**
   * Etapa 1: consulta o apelido no servidor, sem gravar nada.
   */
  async function consultarApelido() {
    if (btnContinuarApelido.disabled) {
      return;
    }

    const apelido = campoApelido.value;
    if (apelido.trim() === "") {
      mostrarErroApelido(MENSAGEM_VAZIO);
      return;
    }

    limparErroApelido();
    esconderAvisoConexao();
    definirOcupado(btnContinuarApelido, true, "Procurando…");
    const resultado = await chamarApi("/api/jogadores/verificar", { apelido });
    definirOcupado(btnContinuarApelido, false);

    if (resultado.tipo === "validacao") {
      mostrarErroApelido(resultado.mensagem);
      return;
    }
    if (resultado.tipo === "indisponivel") {
      // O campo não é limpo: a criança só precisa tentar de novo.
      mostrarAvisoConexao(consultarApelido);
      return;
    }

    perfilEmConfirmacao = resultado.dados;
    mostrarEtapaConfirmacao();
  }

  /**
   * Etapa 2: cria ou recupera o jogador e segue para o menu de mundos.
   */
  async function confirmarPerfil() {
    if (btnConfirmarApelido.disabled || !perfilEmConfirmacao) {
      return;
    }

    esconderAvisoConexao();
    definirOcupado(btnConfirmarApelido, true, "Entrando…");
    const resultado = await chamarApi("/api/jogadores", { apelido: campoApelido.value });
    definirOcupado(btnConfirmarApelido, false);

    if (resultado.tipo === "validacao") {
      mostrarEtapaApelido();
      mostrarErroApelido(resultado.mensagem);
      return;
    }
    if (resultado.tipo === "indisponivel" || !resultado.dados?.jogador) {
      mostrarAvisoConexao(confirmarPerfil);
      return;
    }

    const jogador = resultado.dados.jogador;
    guardarJogadorIdentificado(jogador);
    atualizarPerfilNoMenu(jogador);

    telaIdentificacao.classList.add("escondido");
    if (typeof aoConcluirIdentificacao === "function") {
      aoConcluirIdentificacao(jogador);
    }
  }

  /**
   * Abre a tela na etapa do apelido. O texto já digitado é mantido.
   */
  function iniciarIdentificacao(opcoes = {}) {
    aoConcluirIdentificacao = opcoes.aoConcluir || null;
    aoVoltarIdentificacao = opcoes.aoVoltar || null;

    limparErroApelido();
    telaIdentificacao.classList.remove("escondido");
    mostrarEtapaApelido();
  }

  if (!telaIdentificacao || !formApelido || !campoApelido) {
    console.error("[jogador.js] Tela de identificação não encontrada em index.html.");
    return;
  }

  formApelido.addEventListener("submit", function (evento) {
    evento.preventDefault();
    tocarSomBotao();
    consultarApelido();
  });

  campoApelido.addEventListener("input", limparErroApelido);

  btnVoltarIdentificacao.addEventListener("click", function () {
    tocarSomBotao();
    esconderAvisoConexao();
    telaIdentificacao.classList.add("escondido");
    if (typeof aoVoltarIdentificacao === "function") {
      aoVoltarIdentificacao();
    }
  });

  btnCorrigirApelido.addEventListener("click", function () {
    tocarSomBotao();
    mostrarEtapaApelido();
  });

  btnConfirmarApelido.addEventListener("click", function () {
    tocarSomBotao();
    confirmarPerfil();
  });

  btnTentarNovamente.addEventListener("click", function () {
    tocarSomBotao();
    if (typeof acaoParaRepetir === "function") {
      acaoParaRepetir();
    }
  });

  // Ao recarregar a página (ex.: ?view=mundos), mostra o jogador desta aba.
  atualizarPerfilNoMenu(obterJogadorIdentificado());

  window.iniciarIdentificacao = iniciarIdentificacao;
  window.obterJogadorIdentificado = obterJogadorIdentificado;
})();
