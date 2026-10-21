/**
 * POST /api/admin/login
 *
 * Entrada:  { "codigo": "ADM01", "pin": "..." }  (JSON)
 * Resposta: 200 { "codigo": "ADM01", "expiraEm": "<data ISO>" }
 *           + cookie de sessão HttpOnly (o token nunca vai no corpo).
 * Erros:    400 REQUISICAO_INVALIDA · 401 CREDENCIAIS_INVALIDAS (genérico para
 *           código ou PIN errados) · 403 ORIGEM_NAO_PERMITIDA · 405 · 413 · 415
 *           503 SERVICO_INDISPONIVEL (configuração ausente)
 *
 * ⚠️ Sem limite de tentativas nesta versão (ver api/_lib/admin.js).
 */

const { ErroHttp, aceitarMetodo, lerJson, responderJson, tratarErro } = require("../_lib/http");
const { DURACAO_PADRAO_MS, criarTokenSessao, montarCookieSessao } = require("../_lib/sessao-admin");
const admin = require("../_lib/admin");

module.exports = async function loginAdmin(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    // Sem configuração completa, nada mais é avaliado.
    const segredo = admin.lerSegredoSessao();
    const hashPin = admin.lerHashPin();
    const origem = admin.exigirOrigemPermitida(req, admin.lerOrigensPermitidas());

    const corpo = await lerJson(req);
    const formatoValido =
      corpo &&
      typeof corpo.codigo === "string" &&
      typeof corpo.pin === "string" &&
      corpo.codigo.length <= 20 &&
      corpo.pin.length <= 32;
    if (!formatoValido) {
      throw new ErroHttp(400, "REQUISICAO_INVALIDA", "Envie o código e o PIN.");
    }

    if (!admin.credenciaisCorretas(corpo.codigo.trim(), corpo.pin.trim(), hashPin)) {
      throw new ErroHttp(401, "CREDENCIAIS_INVALIDAS", "Código ou PIN inválidos.");
    }

    const { token, expiraEm } = criarTokenSessao(admin.CODIGO_ADMIN, segredo);
    res.setHeader(
      "Set-Cookie",
      montarCookieSessao(token, DURACAO_PADRAO_MS / 1000, { seguro: admin.cookieDeveSerSeguro(origem) })
    );
    responderJson(res, 200, { codigo: admin.CODIGO_ADMIN, expiraEm: new Date(expiraEm).toISOString() });
  } catch (erro) {
    tratarErro(res, erro);
  }
};
