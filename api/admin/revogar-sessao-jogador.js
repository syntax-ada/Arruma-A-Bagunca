/**
 * POST /api/admin/revogar-sessao-jogador
 *
 * Encerra sessões de jogador no servidor, sem afetar as dos outros jogadores.
 * Só para a equipe: exige a sessão administrativa (cookie) e a origem oficial.
 *
 * Entrada (uma das duas):
 *   { "sessao": "<id da sessão>" }   → revoga só aquela sessão
 *   { "apelido": "Ana Clara" }       → revoga todas as sessões ativas daquele jogador
 * Resposta: 200 { "revogadas": <número> }
 * Erros:    400 REQUISICAO_INVALIDA · 401 NAO_AUTENTICADO · 403 ORIGEM_NAO_PERMITIDA
 *           404 JOGADOR_NAO_ENCONTRADO · 405 · 413 · 415 · 429 MUITAS_TENTATIVAS
 *           503 SERVICO_INDISPONIVEL
 *
 * A revogação fica gravada no banco (player_sessions.revoked_at) e vale na
 * hora para todas as instâncias: o próximo pedido de progresso com aquele
 * token recebe 401, e o jogo continua guardando o progresso no navegador até
 * a criança entrar de novo com o apelido.
 */

const { ErroHttp, aceitarMetodo, lerJson, responderJson, tratarErro } = require("../_lib/http");
const { validarApelido } = require("../_lib/apelido");
const { aplicarLimite } = require("../_lib/limite");
const admin = require("../_lib/admin");
const supabase = require("../_lib/supabase");

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

module.exports = async function revogarSessaoJogador(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    // Muda estado com cookie: exige a origem oficial (como login e logout).
    admin.exigirOrigemPermitida(req, admin.lerOrigensPermitidas());
    admin.exigirSessaoAdmin(req);
    await aplicarLimite(req, "adminRevogarSessao", { falharFechado: true });

    const corpo = await lerJson(req);
    const sessao = typeof corpo?.sessao === "string" ? corpo.sessao.trim().toLowerCase() : null;
    const apelido = typeof corpo?.apelido === "string" ? corpo.apelido : null;

    let revogadas;
    if (sessao !== null && apelido === null) {
      if (!FORMATO_UUID.test(sessao)) {
        throw new ErroHttp(400, "REQUISICAO_INVALIDA", "Id de sessão inválido.");
      }
      revogadas = await supabase.revogarSessoesJogador({ sessaoId: sessao });
    } else if (apelido !== null && sessao === null) {
      const validacao = validarApelido(apelido);
      if (!validacao.valido) {
        throw new ErroHttp(400, "REQUISICAO_INVALIDA", "Apelido inválido.");
      }
      const jogador = await supabase.buscarPorApelidoNormalizado(validacao.apelidoNormalizado);
      if (!jogador) {
        throw new ErroHttp(404, "JOGADOR_NAO_ENCONTRADO", "Nenhum jogador com esse apelido.");
      }
      revogadas = await supabase.revogarSessoesJogador({ jogadorId: jogador.id });
    } else {
      throw new ErroHttp(400, "REQUISICAO_INVALIDA", 'Envie "sessao" ou "apelido" (só um dos dois).');
    }

    responderJson(res, 200, { revogadas });
  } catch (erro) {
    tratarErro(res, erro);
  }
};
