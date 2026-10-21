/**
 * POST /api/progresso/registrar
 *
 * Registra fases concluídas do jogador da sessão. Pode receber várias de uma
 * vez: é assim que o navegador envia o progresso feito enquanto estava sem
 * conexão.
 *
 * Cabeçalho: Authorization: Bearer <token>  (recebido em POST /api/jogadores)
 * Entrada:   { "fasesConcluidas": ["1-1", "1-2"] }   (de 1 a 13 itens)
 * Resposta:  200 {
 *              "fasesConcluidas": [...],   tudo o que o jogador tem agora no banco
 *              "registradas": [...],       gravadas neste pedido
 *              "repetidas": [...],         já estavam gravadas (nada muda)
 *              "recusadas": [{ "fase", "motivo" }]
 *                motivo "FASE_INEXISTENTE": não é uma das 13 fases
 *                motivo "FORA_DE_ORDEM":    falta concluir uma fase anterior
 *            }
 * Erros:     400 REQUISICAO_INVALIDA · 401 NAO_AUTENTICADO (inclusive sessão
 *            revogada) · 405 · 413 · 415 · 429 MUITAS_TENTATIVAS
 *            503 SERVICO_INDISPONIVEL
 *
 * Regras (js/regras-progresso.js, as mesmas do navegador):
 * - só existem as fases 1-1 a 4-3 e a fase bônus 5-1;
 * - uma fase só é aceita se todas as anteriores já estiverem concluídas
 *   (no banco ou neste mesmo pedido);
 * - registrar de novo a mesma fase não cria outra linha nem dá erro.
 * O jogador é SEMPRE o do token assinado; nada aqui apaga progresso.
 */

const { ErroHttp, aceitarMetodo, lerJson, responderJson, tratarErro } = require("../_lib/http");
const { exigirSessaoJogador } = require("../_lib/sessao-jogador");
const supabase = require("../_lib/supabase");
const regras = require("../../js/regras-progresso.js");

const LIMITE_FASES_POR_PEDIDO = regras.ORDEM_DAS_FASES.length;

function lerFasesPedidas(corpo) {
  const lista = corpo && typeof corpo === "object" && !Array.isArray(corpo) ? corpo.fasesConcluidas : undefined;
  if (!Array.isArray(lista) || lista.length === 0 || lista.length > LIMITE_FASES_POR_PEDIDO) {
    throw new ErroHttp(
      400,
      "REQUISICAO_INVALIDA",
      `Envie "fasesConcluidas" com 1 a ${LIMITE_FASES_POR_PEDIDO} fases.`
    );
  }
  return lista;
}

module.exports = async function registrarProgresso(req, res) {
  if (!aceitarMetodo(req, res, "POST")) {
    return;
  }

  try {
    // A sessão (e o limite) é conferida antes de ler o corpo: sem token
    // válido, nada é processado.
    const { jogadorId } = await exigirSessaoJogador(req, "progressoRegistrar");
    const pedidas = lerFasesPedidas(await lerJson(req));

    const registradasAntes = await supabase.listarFasesConcluidas(jogadorId);
    const { aceitas, repetidas, recusadas } = regras.avaliarNovasConclusoes(registradasAntes, pedidas);
    const inseridas = await supabase.registrarFasesConcluidas(jogadorId, aceitas);

    // Se outro pedido gravou a mesma fase no meio do caminho, o banco a
    // ignorou (chave primária): para este pedido, ela conta como repetida.
    const registradas = aceitas.filter((id) => inseridas.includes(id));
    const repetidasNoBanco = aceitas.filter((id) => !inseridas.includes(id));

    responderJson(res, 200, {
      fasesConcluidas: regras.normalizarLista([...registradasAntes, ...aceitas]),
      registradas,
      repetidas: [...repetidas, ...repetidasNoBanco],
      recusadas,
    });
  } catch (erro) {
    tratarErro(res, erro);
  }
};
