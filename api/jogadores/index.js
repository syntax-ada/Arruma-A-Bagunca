/**
 * POST /api/jogadores
 *
 * Cria o jogador ou recupera o que já existe com o mesmo apelido normalizado
 * ("Ana Clara", "ana clara" e "ANACLARA" são o mesmo jogador).
 *
 * Entrada:  { "apelido": "Ana Clara" }
 *           Qualquer "avatar" enviado é ignorado: nesta versão o único avatar
 *           aprovado pela equipe é o padrão (👤).
 * Resposta: 201 { "criado": true,  "jogador": { "id", "apelido", "avatar" } }
 *           200 { "criado": false, "jogador": { "id", "apelido", "avatar" } }
 * Erros:    os mesmos de /api/jogadores/verificar.
 *
 * Grava no Supabase (api/_lib/supabase.js). A unicidade vem da restrição
 * UNIQUE de normalized_nickname: pedidos simultâneos do mesmo apelido criam
 * um único jogador, e os demais recebem 200 com o registro existente.
 */

const { aceitarMetodo, responderJson, tratarErro } = require("../_lib/http");
const { lerApelidoValido } = require("../_lib/apelido");
const supabase = require("../_lib/supabase");

module.exports = async function criarOuRecuperarJogador(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    const { apelido, apelidoNormalizado } = await lerApelidoValido(req);
    const { criado, jogador } = await supabase.criarOuRecuperar(apelido, apelidoNormalizado);

    responderJson(res, criado ? 201 : 200, { criado, jogador });
  } catch (erro) {
    tratarErro(res, erro);
  }
};
