/**
 * POST /api/jogadores
 *
 * Cria o jogador ou recupera o que já existe com o mesmo apelido normalizado
 * ("Ana Clara", "ana clara" e "ANACLARA" são o mesmo jogador).
 *
 * Entrada:  { "apelido": "Ana Clara" }
 *           Qualquer "avatar" enviado é ignorado: nesta versão o único avatar
 *           aprovado pela equipe é o padrão (👤).
 * Resposta: 201 { "criado": true,  "jogador": { "id", "apelido", "avatar" }, "sessao": { "token", "expiraEm" } }
 *           200 { "criado": false, "jogador": { "id", "apelido", "avatar" }, "sessao": { "token", "expiraEm" } }
 *           "sessao" é a sessão do jogador (api/_lib/sessao-jogador.js), usada
 *           para ler e gravar o progresso em /api/progresso. Se o servidor não
 *           tiver PLAYER_SESSION_SECRET (ou não conseguir registrar a sessão
 *           no banco), vem "sessao": null e o jogo segue guardando o
 *           progresso só no navegador.
 * Erros:    os mesmos de /api/jogadores/verificar (inclusive 429).
 *
 * Grava no Supabase (api/_lib/supabase.js). A unicidade vem da restrição
 * UNIQUE de normalized_nickname: pedidos simultâneos do mesmo apelido criam
 * um único jogador, e os demais recebem 200 com o registro existente.
 */

const { aceitarMetodo, responderJson, tratarErro } = require("../_lib/http");
const { lerApelidoValido } = require("../_lib/apelido");
const { aplicarLimite } = require("../_lib/limite");
const supabase = require("../_lib/supabase");
const { criarSessaoJogador } = require("../_lib/sessao-jogador");

module.exports = async function criarOuRecuperarJogador(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    const { apelido, apelidoNormalizado } = await lerApelidoValido(req);
    await aplicarLimite(req, "jogadoresEntrar");
    const { criado, jogador } = await supabase.criarOuRecuperar(apelido, apelidoNormalizado);

    const sessao = await criarSessaoJogador(jogador.id);

    responderJson(res, criado ? 201 : 200, { criado, jogador, sessao });
  } catch (erro) {
    tratarErro(res, erro);
  }
};
