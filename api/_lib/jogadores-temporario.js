/**
 * @file jogadores-temporario.js
 * @description ⚠️ ARMAZENAMENTO TEMPORÁRIO — SÓ PARA O SERVIDOR LOCAL.
 *
 * ============================================================================
 * ISTO NÃO É O CADASTRO DEFINITIVO
 * ============================================================================
 * Os jogadores ficam apenas na memória do processo do servidor local
 * (scripts/servidor-local.js). Ao reiniciar o servidor, tudo é apagado.
 *
 * Existe só para testar o fluxo da tela de identificação antes de haver um
 * banco de dados. Será substituído pelo Supabase nas etapas 3 e 4 do
 * planejamento, mantendo as mesmas funções usadas pelos endpoints.
 *
 * Fora do servidor local (por exemplo, se a pasta api/ for publicada na
 * Vercel antes do banco existir) ele se recusa a funcionar e os endpoints
 * respondem 503. Assim nunca aparece um "cadastro" que some sozinho.
 * ============================================================================
 */

const crypto = require("node:crypto");
const { ErroHttp } = require("./http");

const AVATAR_PADRAO = "padrao";

// apelidoNormalizado → { id, apelido, avatar, criadoEm }
const jogadores = new Map();

function garantirDisponivel() {
  if (process.env.ARRUMA_SERVIDOR_LOCAL !== "1") {
    throw new ErroHttp(503, "SERVICO_INDISPONIVEL", "Não conseguimos conectar agora. Tente de novo!");
  }
}

function paraResposta(registro) {
  return { id: registro.id, apelido: registro.apelido, avatar: registro.avatar };
}

function buscarPorApelidoNormalizado(apelidoNormalizado) {
  garantirDisponivel();
  const registro = jogadores.get(apelidoNormalizado);
  return registro ? paraResposta(registro) : null;
}

/**
 * Cria o jogador ou devolve o que já existe com o mesmo apelido normalizado.
 * Quando já existe, vale a grafia e o avatar do primeiro cadastro.
 *
 * O Node executa este trecho sem interrupção, então dois pedidos simultâneos
 * nunca criam o mesmo apelido duas vezes. No banco, quem vai garantir isso é
 * a restrição UNIQUE da coluna apelido_normalizado.
 */
function criarOuRecuperar(apelido, apelidoNormalizado) {
  garantirDisponivel();
  const existente = jogadores.get(apelidoNormalizado);
  if (existente) {
    return { criado: false, jogador: paraResposta(existente) };
  }

  const registro = {
    id: crypto.randomUUID(),
    apelido,
    avatar: AVATAR_PADRAO,
    criadoEm: new Date().toISOString(),
  };
  jogadores.set(apelidoNormalizado, registro);
  return { criado: true, jogador: paraResposta(registro) };
}

module.exports = {
  AVATAR_PADRAO,
  buscarPorApelidoNormalizado,
  criarOuRecuperar,
};
