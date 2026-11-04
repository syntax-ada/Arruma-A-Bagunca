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
 * A sessão assinada pelo servidor (resposta de POST /api/jogadores) é
 * entregue a js/progresso.js, que carrega e salva o progresso deste jogador.
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

  const IMAGEM_AVATAR_PADRAO =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="%23d8e2ec"/><circle cx="32" cy="24" r="12" fill="%238a99ad"/><path d="M12 56c0-11 9-20 20-20s20 9 20 20" fill="%238a99ad"/></svg>';

  const MAPA_AVATARES_CATALOGO = {
    cachorro: "assets/images/Settings/Avatares/Cachorro.png",
    gato: "assets/images/Settings/Avatares/Gato.png",
    coala: "assets/images/Settings/Avatares/Coala.png",
    coelho: "assets/images/Settings/Avatares/Coelho.png",
    raposo: "assets/images/Settings/Avatares/raposo.png",
    golfinho: "assets/images/Settings/Avatares/Golfinho.png",
    "ave-maluca": "assets/images/Settings/Avatares/Ave maluca.png",
    galineo: "assets/images/Settings/Avatares/galineo.png",
    chifrudo: "assets/images/Settings/Avatares/chifrudo.png",
    monstro: "assets/images/Settings/Avatares/Monstro!.png",
  };

  function resolverSrcAvatar(valor) {
    if (!valor || typeof valor !== "string") {
      return null;
    }
    const valorLimpo = valor.trim();
    if (!valorLimpo || valorLimpo === "padrao" || valorLimpo === "👤") {
      return null;
    }
    if (MAPA_AVATARES_CATALOGO[valorLimpo.toLowerCase()]) {
      return MAPA_AVATARES_CATALOGO[valorLimpo.toLowerCase()];
    }
    return valorLimpo;
  }

  function obterAvatarDoUsuario(identificador) {
    if (!identificador) {
      return null;
    }
    let apelido = null;
    let id = null;
    let avatarProp = null;

    if (typeof identificador === "string") {
      apelido = identificador;
    } else if (typeof identificador === "object") {
      apelido = identificador.apelido || null;
      id = identificador.id || null;
      avatarProp = identificador.avatar || null;
    }

    try {
      if (apelido) {
        const salvoPorApelido = window.localStorage?.getItem("avatar_" + apelido);
        if (salvoPorApelido) {
          const resolvido = resolverSrcAvatar(salvoPorApelido);
          if (resolvido) {
            return resolvido;
          }
        }
      }
      if (id) {
        const salvoPorId = window.localStorage?.getItem("avatar_" + id);
        if (salvoPorId) {
          const resolvido = resolverSrcAvatar(salvoPorId);
          if (resolvido) {
            return resolvido;
          }
        }
      }
    } catch (_erro) {
      // Ignora erro de acesso ao localStorage.
    }

    if (avatarProp) {
      const resolvido = resolverSrcAvatar(avatarProp);
      if (resolvido) {
        return resolvido;
      }
    }

    return null;
  }

  function salvarAvatarDoUsuario(identificador, srcAvatar) {
    if (!identificador || !srcAvatar) {
      return;
    }
    let apelido = null;
    let id = null;

    if (typeof identificador === "string") {
      apelido = identificador;
    } else if (typeof identificador === "object") {
      apelido = identificador.apelido || null;
      id = identificador.id || null;
      identificador.avatar = srcAvatar;
      guardarJogadorIdentificado(identificador);
    }

    try {
      if (apelido) {
        window.localStorage?.setItem("avatar_" + apelido, srcAvatar);
      }
      if (id) {
        window.localStorage?.setItem("avatar_" + id, srcAvatar);
      }
    } catch (_erro) {
      // Ignora falha de armazenamento em modo restrito.
    }
  }

  function renderizarElementoAvatar(container, srcAvatar, altTexto) {
    if (!container) {
      return;
    }
    container.textContent = "";
    const img = document.createElement("img");
    img.src = srcAvatar || IMAGEM_AVATAR_PADRAO;
    img.alt = altTexto || "Avatar";
    img.draggable = false;
    container.appendChild(img);
  }
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
  const textoAvisoConexao = document.querySelector("#texto-aviso-conexao");
  // Texto padrão do aviso (o de index.html), usado quando o servidor não manda mensagem.
  const MENSAGEM_AVISO_PADRAO = textoAvisoConexao ? textoAvisoConexao.textContent : "";
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
      const avatarSrc = obterAvatarDoUsuario(jogador) || IMAGEM_AVATAR_PADRAO;
      renderizarElementoAvatar(avatarJogadorMenu, avatarSrc, "Avatar de " + (jogador?.apelido || "Jogador"));
    }
  }

  /**
   * Envia JSON para a API e classifica o resultado:
   *   "ok"          → resposta 2xx com JSON
   *   "validacao"   → 422 (apelido inválido ou não permitido), com a mensagem do servidor
   *   "espera"      → 429 (muitas tentativas), com a mensagem do servidor
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
      if (resposta.status === 429 && dados?.mensagem) {
        return { tipo: "espera", mensagem: dados.mensagem };
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

  // "mensagem" vem do servidor (ex.: 429, "Espere um pouco"); sem ela, vale o texto padrão.
  function mostrarAvisoConexao(acao, mensagem) {
    acaoParaRepetir = acao;
    if (textoAvisoConexao) {
      textoAvisoConexao.textContent = mensagem || MENSAGEM_AVISO_PADRAO;
    }
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
    const nomeConfirmado = existe ? jogador.apelido : perfilEmConfirmacao.apelido;
    const avatarSrc = obterAvatarDoUsuario(existe ? jogador : nomeConfirmado) || IMAGEM_AVATAR_PADRAO;
    renderizarElementoAvatar(avatarConfirmacao, avatarSrc, "Avatar de " + nomeConfirmado);

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
    if (resultado.tipo === "indisponivel" || resultado.tipo === "espera") {
      // O campo não é limpo: a criança só precisa tentar de novo.
      mostrarAvisoConexao(consultarApelido, resultado.mensagem);
      return;
    }

    perfilEmConfirmacao = resultado.dados;
    mostrarEtapaConfirmacao();
  }

  /**
   * Carrega o progresso DESTE jogador (navegador + banco) por js/progresso.js.
   * Falha de rede não impede a entrada: o progresso guardado no navegador
   * continua valendo e é enviado ao servidor depois.
   */
  async function carregarProgressoDoJogador(jogador, sessao) {
    const servico = window.ServicoProgresso;
    if (!servico || typeof servico.iniciarProgressoDoJogador !== "function") {
      return;
    }
    try {
      await servico.iniciarProgressoDoJogador(jogador, sessao || null);
    } catch (erro) {
      // Segue com o progresso do navegador.
    }
  }

  /**
   * Etapa 2: cria ou recupera o jogador, carrega o progresso dele e segue
   * para o menu de mundos.
   */
  async function confirmarPerfil() {
    if (btnConfirmarApelido.disabled || !perfilEmConfirmacao) {
      return;
    }

    esconderAvisoConexao();
    definirOcupado(btnConfirmarApelido, true, "Entrando…");
    const resultado = await chamarApi("/api/jogadores", { apelido: campoApelido.value });
    const jogador = resultado.tipo === "ok" ? resultado.dados?.jogador : null;
    if (jogador) {
      const avatarSalvo = obterAvatarDoUsuario(jogador);
      if (avatarSalvo) {
        jogador.avatar = avatarSalvo;
      }
      guardarJogadorIdentificado(jogador);
      atualizarPerfilNoMenu(jogador);
      await carregarProgressoDoJogador(jogador, resultado.dados.sessao);
    }
    definirOcupado(btnConfirmarApelido, false);

    if (resultado.tipo === "validacao") {
      mostrarEtapaApelido();
      mostrarErroApelido(resultado.mensagem);
      return;
    }
    if (!jogador) {
      mostrarAvisoConexao(confirmarPerfil, resultado.mensagem);
      return;
    }

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
    if (typeof window.tocarNarracao === "function") {
      window.tocarNarracao("apelido");
    }
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
  window.guardarJogadorIdentificado = guardarJogadorIdentificado;
  window.obterAvatarDoUsuario = obterAvatarDoUsuario;
  window.salvarAvatarDoUsuario = salvarAvatarDoUsuario;
  window.renderizarElementoAvatar = renderizarElementoAvatar;
  window.IMAGEM_AVATAR_PADRAO = IMAGEM_AVATAR_PADRAO;
})();
