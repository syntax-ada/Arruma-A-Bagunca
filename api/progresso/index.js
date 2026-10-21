/**
 * GET /api/progresso
 *
 * Devolve as fases concluídas do jogador da sessão.
 *
 * Cabeçalho: Authorization: Bearer <token>  (recebido em POST /api/jogadores)
 * Resposta:  200 { "fasesConcluidas": ["1-1", "1-2", ...] }  (na ordem oficial)
 * Erros:     401 NAO_AUTENTICADO (sem token, token adulterado, expirado ou
 *            sessão revogada) · 405 · 429 MUITAS_TENTATIVAS
 *            503 SERVICO_INDISPONIVEL (banco ou configuração)
 *
 * O jogador é SEMPRE o do token assinado com sessão ativa no banco
 * (api/_lib/sessao-jogador.js). Nenhum id enviado pelo navegador é usado.
 */

const { aceitarMetodo, responderJson, tratarErro } = require("../_lib/http");
const { exigirSessaoJogador } = require("../_lib/sessao-jogador");
const supabase = require("../_lib/supabase");
const regras = require("../../js/regras-progresso.js");

module.exports = async function consultarProgresso(req, res) {
  if (!aceitarMetodo(req, res, "GET")) {
    return;
  }

  try {
    const { jogadorId } = await exigirSessaoJogador(req, "progressoConsultar");
    const fasesConcluidas = regras.normalizarLista(await supabase.listarFasesConcluidas(jogadorId));

    responderJson(res, 200, { fasesConcluidas });
  } catch (erro) {
    tratarErro(res, erro);
  }
};
