/**
 * POST /api/jogadores
 *
 * Cria o jogador ou recupera o que já existe com o mesmo apelido normalizado
 * ("Ana Clara", "ana clara" e "ANACLARA" são o mesmo jogador).
 *
 * Entrada:  { "apelido": "Ana Clara" }
 *           Qualquer "avatar" enviado é ignorado: nesta versão o único avatar
 *           aprovado pela equipe é o padrão (👤).
 * Resposta: 201 { "criado": true,  "jogador": {...}, "temporario": true }
 *           200 { "criado": false, "jogador": {...}, "temporario": true }
 * Erros:    os mesmos de /api/jogadores/verificar.
 *
 * ⚠️ "temporario: true" indica que o jogador está só na memória do servidor
 * local (api/_lib/jogadores-temporario.js). Não é cadastro definitivo.
 */

const { aceitarMetodo, responderJson, tratarErro } = require("../_lib/http");
const { lerApelidoValido } = require("../_lib/apelido");
const armazenamento = require("../_lib/jogadores-temporario");

module.exports = async function criarOuRecuperarJogador(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    const { apelido, apelidoNormalizado } = await lerApelidoValido(req);
    const { criado, jogador } = armazenamento.criarOuRecuperar(apelido, apelidoNormalizado);

    responderJson(res, criado ? 201 : 200, { criado, jogador, temporario: true });
  } catch (erro) {
    tratarErro(res, erro);
  }
};
