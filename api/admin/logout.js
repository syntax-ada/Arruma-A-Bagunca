/**
 * POST /api/admin/logout
 *
 * Apaga o cookie da sessão no navegador. Responde 204 mesmo sem sessão.
 * Erros: 403 ORIGEM_NAO_PERMITIDA · 405 · 503 SERVICO_INDISPONIVEL
 *
 * ⚠️ Não revoga o token no servidor: um token copiado antes do logout continua
 * válido até expirar (não há onde guardar revogações nesta versão).
 */

const { aceitarMetodo, tratarErro } = require("../_lib/http");
const { montarCookieLimpeza } = require("../_lib/sessao-admin");
const admin = require("../_lib/admin");

module.exports = async function logoutAdmin(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    const origem = admin.exigirOrigemPermitida(req, admin.lerOrigensPermitidas());
    res.statusCode = 204;
    res.setHeader("Set-Cookie", montarCookieLimpeza({ seguro: admin.cookieDeveSerSeguro(origem) }));
    res.setHeader("Cache-Control", "no-store");
    res.end();
  } catch (erro) {
    tratarErro(res, erro);
  }
};
