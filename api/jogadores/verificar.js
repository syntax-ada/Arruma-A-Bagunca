/**
 * POST /api/jogadores/verificar
 *
 * Consulta um apelido SEM gravar nada, para a tela mostrar "Encontramos você!"
 * ou "Novo jogador!" antes da confirmação. Assim, um erro de digitação não
 * cria um perfil.
 *
 * Entrada:  { "apelido": "Ana Clara" }
 * Resposta: 200 { "existe": true,  "jogador": { "apelido", "avatar" } }
 *           200 { "existe": false, "apelido": "Ana Clara" }
 *           (o id do jogador não é devolvido aqui: a tela não precisa dele)
 * Erros:    400 REQUISICAO_INVALIDA · 415 TIPO_NAO_SUPORTADO · 422 APELIDO_INVALIDO
 *           422 APELIDO_NAO_PERMITIDO · 405 · 429 MUITAS_TENTATIVAS
 *           503 SERVICO_INDISPONIVEL
 *
 * Consulta o Supabase pelo apelido normalizado (api/_lib/supabase.js).
 * Falha de configuração ou de conexão com o banco → 503 SERVICO_INDISPONIVEL.
 * Limite de requisições por rede (api/_lib/limite.js), depois da validação.
 */

const { aceitarMetodo, responderJson, tratarErro } = require("../_lib/http");
const { lerApelidoValido } = require("../_lib/apelido");
const { aplicarLimite } = require("../_lib/limite");
const supabase = require("../_lib/supabase");

module.exports = async function verificarJogador(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    const { apelido, apelidoNormalizado } = await lerApelidoValido(req);
    await aplicarLimite(req, "jogadoresVerificar");
    const jogador = await supabase.buscarPorApelidoNormalizado(apelidoNormalizado);

    if (jogador) {
      responderJson(res, 200, { existe: true, jogador: { apelido: jogador.apelido, avatar: jogador.avatar } });
    } else {
      responderJson(res, 200, { existe: false, apelido });
    }
  } catch (erro) {
    tratarErro(res, erro);
  }
};
