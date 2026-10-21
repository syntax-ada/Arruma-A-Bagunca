/**
 * @file admin.js
 * @description Tela de login administrativo (admin.html).
 *
 * Quem decide é o SERVIDOR (api/admin/*): esta página só envia o código e o
 * PIN, mostra o resultado e grava na aba o indicador que pede ao js/dev.js
 * para conferir a sessão. O indicador sozinho não libera nada: no site
 * publicado, o dev.js sempre consulta GET /api/admin/sessao antes de abrir o
 * painel. O token fica num cookie HttpOnly, que este código não consegue ler.
 */

(function configurarLoginAdmin() {
  const CHAVE_DEV = "arruma_bagunca_dev";

  const formLogin = document.querySelector("#form-login");
  const campoCodigo = document.querySelector("#campo-codigo");
  const campoPin = document.querySelector("#campo-pin");
  const btnEntrar = document.querySelector("#btn-entrar");
  const secaoSessao = document.querySelector("#secao-sessao");
  const textoSessao = document.querySelector("#texto-sessao");
  const btnSair = document.querySelector("#btn-sair");
  const formRevogar = document.querySelector("#form-revogar");
  const campoApelidoRevogar = document.querySelector("#campo-apelido-revogar");
  const btnRevogar = document.querySelector("#btn-revogar");
  const mensagem = document.querySelector("#mensagem");

  const MENSAGENS = {
    401: "Código ou PIN inválidos.",
    403: "Abra esta página pelo endereço oficial do jogo.",
    429: "Muitas tentativas. Espere alguns minutos e tente de novo.",
    503: "Acesso administrativo indisponível no momento (configuração do servidor).",
    rede: "Não foi possível falar com o servidor. Tente de novo.",
    outro: "Não foi possível entrar. Tente de novo.",
  };

  function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = tipo || "";
  }

  function marcarIndicadorDev(ligado) {
    try {
      if (ligado) {
        window.sessionStorage.setItem(CHAVE_DEV, "true");
      } else {
        window.sessionStorage.removeItem(CHAVE_DEV);
      }
    } catch (erro) {
      // Sem sessionStorage, o painel não abre; o login continua válido.
    }
  }

  function mostrarSessao(expiraEm) {
    const horario = new Date(expiraEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    textoSessao.textContent = `Sessão ativa até ${horario}.`;
    formLogin.hidden = true;
    secaoSessao.hidden = false;
    marcarIndicadorDev(true);
  }

  function mostrarLogin() {
    secaoSessao.hidden = true;
    formLogin.hidden = false;
    marcarIndicadorDev(false);
  }

  async function verificarSessao() {
    try {
      const resposta = await fetch("/api/admin/sessao", { cache: "no-store", credentials: "same-origin" });
      if (resposta.status === 200) {
        const dados = await resposta.json();
        mostrarSessao(dados.expiraEm);
        return;
      }
    } catch (erro) {
      // Sem servidor: fica na tela de login.
    }
    mostrarLogin();
  }

  formLogin.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    if (btnEntrar.disabled) {
      return;
    }
    btnEntrar.disabled = true;
    mostrarMensagem("Conferindo…");

    let resposta;
    try {
      resposta = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: campoCodigo.value, pin: campoPin.value }),
      });
    } catch (erro) {
      resposta = null;
    } finally {
      // O PIN não fica no campo depois da tentativa.
      campoPin.value = "";
      btnEntrar.disabled = false;
    }

    if (!resposta) {
      mostrarMensagem(MENSAGENS.rede, "erro");
      return;
    }
    if (resposta.status === 200) {
      const dados = await resposta.json();
      mostrarMensagem("Sessão iniciada.", "ok");
      mostrarSessao(dados.expiraEm);
      return;
    }
    mostrarMensagem(MENSAGENS[resposta.status] || MENSAGENS.outro, "erro");
    campoPin.focus();
  });

  // Encerra no servidor as sessões de um jogador (ex.: apelido usado por
  // outra pessoa). Não apaga o progresso: a criança só precisa entrar de novo.
  formRevogar.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    if (btnRevogar.disabled) {
      return;
    }
    const apelido = campoApelidoRevogar.value.trim();
    if (!apelido) {
      mostrarMensagem("Escreva o apelido do jogador.", "erro");
      return;
    }
    btnRevogar.disabled = true;
    mostrarMensagem("Encerrando…");

    let resposta;
    try {
      resposta = await fetch("/api/admin/revogar-sessao-jogador", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apelido }),
      });
    } catch (erro) {
      resposta = null;
    } finally {
      btnRevogar.disabled = false;
    }

    if (!resposta) {
      mostrarMensagem(MENSAGENS.rede, "erro");
      return;
    }
    if (resposta.status === 200) {
      const { revogadas } = await resposta.json();
      mostrarMensagem(`${revogadas} sessão(ões) encerrada(s).`, "ok");
      campoApelidoRevogar.value = "";
      return;
    }
    if (resposta.status === 401) {
      mostrarLogin();
      mostrarMensagem("A sessão administrativa expirou. Entre de novo.", "erro");
      return;
    }
    const textos = {
      400: "Apelido inválido.",
      404: "Nenhum jogador com esse apelido.",
      429: MENSAGENS[429],
      403: MENSAGENS[403],
    };
    mostrarMensagem(textos[resposta.status] || "Não foi possível encerrar as sessões. Tente de novo.", "erro");
  });

  btnSair.addEventListener("click", async function () {
    btnSair.disabled = true;
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    } catch (erro) {
      // Mesmo sem resposta, a aba deixa de pedir o painel.
    }
    btnSair.disabled = false;
    mostrarLogin();
    mostrarMensagem("Sessão encerrada.", "ok");
  });

  verificarSessao();
})();
