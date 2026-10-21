/**
 * POST /api/jogadores/verificar
 *
 * Consulta um apelido SEM gravar nada, para a tela mostrar "Encontramos você!"
 * ou "Novo jogador!" antes da confirmação. Assim, um erro de digitação não
 * cria um perfil.
 *
 * Entrada:  { "apelido": "Ana Clara" }
 * Resposta: 200 { "existe": true,  "jogador": { "id", "apelido", "avatar" } }
 *           200 { "existe": false, "apelido": "Ana Clara" }
 * Erros:    400 REQUISICAO_INVALIDA · 415 TIPO_NAO_SUPORTADO · 422 APELIDO_INVALIDO
 *           422 APELIDO_NAO_PERMITIDO · 405 · 503 SERVICO_INDISPONIVEL
 *
 * Consulta o Supabase pelo apelido normalizado (api/_lib/supabase.js).
 * Falha de configuração ou de conexão com o banco → 503 SERVICO_INDISPONIVEL.
 */

const { aceitarMetodo, responderJson, tratarErro } = require("../_lib/http");
const { lerApelidoValido } = require("../_lib/apelido");
const supabase = require("../_lib/supabase");

module.exports = async function verificarJogador(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    const { apelido, apelidoNormalizado } = await lerApelidoValido(req);
    const jogador = await supabase.buscarPorApelidoNormalizado(apelidoNormalizado);

    if (jogador) {
      responderJson(res, 200, { existe: true, jogador });
    } else {
      responderJson(res, 200, { existe: false, apelido });
    }
  } catch (erro) {
    tratarErro(res, erro);
  }
};
