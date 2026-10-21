/**
 * GET /api/admin/sessao
 *
 * Resposta: 200 { "codigo": "ADM01", "expiraEm": "<data ISO>" } com sessão válida.
 * Erros:    401 NAO_AUTENTICADO (sem sessão, assinatura inválida ou expirada)
 *           405 · 503 SERVICO_INDISPONIVEL (ADMIN_SESSION_SECRET ausente)
 *
 * É também o modelo de endpoint administrativo: exigirSessaoAdmin(req) no início.
 */

const { aceitarMetodo, responderJson, tratarErro } = require("../_lib/http");
const { exigirSessaoAdmin } = require("../_lib/admin");

module.exports = async function sessaoAdmin(req, res) {
  if (!aceitarMetodo(req, res, "GET")) {
    return;
  }

  try {
    const sessao = exigirSessaoAdmin(req);
    responderJson(res, 200, { codigo: sessao.codigo, expiraEm: new Date(sessao.expiraEm).toISOString() });
  } catch (erro) {
    tratarErro(res, erro);
  }
};
