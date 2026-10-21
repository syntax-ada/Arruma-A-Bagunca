/**
 * @file sessao-jogador.js
 * @description Sessão do jogador: token assinado pelo servidor que prova
 * "este navegador foi identificado como o jogador X", com registro no banco
 * para poder ser REVOGADA individualmente.
 *
 * O token é "SESSAO_ID.PLAYER_ID.EXPIRA_EM.ASSINATURA", assinado com
 * HMAC-SHA256 usando PLAYER_SESSION_SECRET (só no servidor, diferente do
 * ADMIN_SESSION_SECRET). O texto assinado começa com "jogador:", então um
 * token administrativo nunca vale como token de jogador, e vice-versa.
 *
 * Cada sessão é uma linha da tabela player_sessions. Em todo pedido de
 * progresso o servidor confere, nesta ordem:
 *   1. a assinatura e a validade do token (sem banco; token falso para aqui);
 *   2. o limite de requisições (api/_lib/limite.js);
 *   3. no banco: a sessão existe, é do mesmo jogador, não foi revogada e não
 *      expirou. Revogar uma sessão (api/admin/revogar-sessao-jogador.js) vale
 *      na hora para todas as instâncias da Vercel, sem derrubar as outras.
 *
 * Por que não confiar no player_id que vem do navegador: qualquer pessoa pode
 * editar o sessionStorage ou montar um pedido à mão. Os endpoints de progresso
 * usam SÓ o id que está dentro de um token com assinatura válida e sessão
 * ativa no banco.
 *
 * Por que token no cabeçalho (Authorization: Bearer) e não cookie: no futuro o
 * jogo deve rodar dentro do iframe do Cruzeiro HUB, em outro site. Navegadores
 * bloqueiam ou separam cookies de terceiros em iframes; um cabeçalho enviado
 * pelo próprio JavaScript do jogo funciona igual dentro e fora do iframe.
 *
 * ⚠️ Limite conhecido: o login é só pelo apelido (decisão da equipe). Quem
 * souber o apelido consegue uma sessão nova daquele jogador; revogar encerra
 * as sessões existentes, mas não impede um novo login com o apelido.
 */

const crypto = require("node:crypto");
const { ErroHttp } = require("./http");
const supabase = require("./supabase");
const { aplicarLimite } = require("./limite");

const DURACAO_PADRAO_MS = 12 * 60 * 60 * 1000;
const TAMANHO_MINIMO_SEGREDO = 32;
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function exigirSegredo(segredo) {
  if (typeof segredo !== "string" || segredo.length < TAMANHO_MINIMO_SEGREDO) {
    throw new Error(
      `PLAYER_SESSION_SECRET ausente ou curto demais (mínimo de ${TAMANHO_MINIMO_SEGREDO} caracteres).`
    );
  }
}

function assinar(conteudo, segredo) {
  return crypto.createHmac("sha256", segredo).update(`jogador:${conteudo}`).digest("base64url");
}

function ehUuid(valor) {
  return typeof valor === "string" && FORMATO_UUID.test(valor);
}

/** Monta o token de uma sessão já registrada no banco. */
function criarTokenJogador({ sessaoId, jogadorId, expiraEm }, segredo) {
  exigirSegredo(segredo);
  if (!ehUuid(sessaoId) || !ehUuid(jogadorId)) {
    throw new Error("Id de sessão ou de jogador inválido.");
  }
  if (!Number.isInteger(expiraEm) || expiraEm <= 0) {
    throw new Error("Expiração da sessão inválida.");
  }

  const conteudo = `${sessaoId}.${jogadorId}.${expiraEm}`;
  return { token: `${conteudo}.${assinar(conteudo, segredo)}`, expiraEm };
}

/**
 * Confere só a assinatura e a validade (sem banco).
 * Sucesso: { valido: true, sessaoId, jogadorId, expiraEm }
 * Falha:   { valido: false, motivo: "AUSENTE" | "MALFORMADO" | "ASSINATURA_INVALIDA" | "EXPIRADO" }
 */
function verificarTokenJogador(token, segredo, { agora = Date.now() } = {}) {
  exigirSegredo(segredo);

  if (typeof token !== "string" || token === "") {
    return { valido: false, motivo: "AUSENTE" };
  }

  const partes = token.split(".");
  if (partes.length !== 4) {
    return { valido: false, motivo: "MALFORMADO" };
  }

  const [sessaoId, jogadorId, textoExpiracao, assinatura] = partes;
  if (!ehUuid(sessaoId) || !ehUuid(jogadorId) || !/^[0-9]{1,15}$/.test(textoExpiracao)) {
    return { valido: false, motivo: "MALFORMADO" };
  }

  // Comparação em tempo constante da assinatura.
  const esperada = Buffer.from(assinar(`${sessaoId}.${jogadorId}.${textoExpiracao}`, segredo));
  const recebida = Buffer.from(assinatura);
  if (recebida.length !== esperada.length || !crypto.timingSafeEqual(recebida, esperada)) {
    return { valido: false, motivo: "ASSINATURA_INVALIDA" };
  }

  const expiraEm = Number(textoExpiracao);
  if (agora >= expiraEm) {
    return { valido: false, motivo: "EXPIRADO" };
  }

  return { valido: true, sessaoId, jogadorId, expiraEm };
}

function configuracaoAusente() {
  // Só o nome da variável; nunca o valor.
  console.error("[sessao-jogador] Configuração ausente ou inválida: PLAYER_SESSION_SECRET.");
  return new ErroHttp(503, "SERVICO_INDISPONIVEL", "Não conseguimos salvar agora. Tente de novo!");
}

/**
 * Lê PLAYER_SESSION_SECRET. Precisa ter 32+ caracteres e ser diferente de
 * ADMIN_SESSION_SECRET (cada sessão com o seu segredo).
 */
function lerSegredoSessaoJogador() {
  const segredo = (process.env.PLAYER_SESSION_SECRET || "").trim();
  const segredoAdmin = (process.env.ADMIN_SESSION_SECRET || "").trim();
  if (segredo.length < TAMANHO_MINIMO_SEGREDO || segredo === segredoAdmin) {
    throw configuracaoAusente();
  }
  return segredo;
}

/**
 * Cria a sessão entregue em POST /api/jogadores: registra no banco e assina o
 * token. Se o segredo não estiver configurado ou o banco não aceitar o
 * registro (ex.: migração ainda não aplicada), devolve null — o jogo segue
 * com o progresso só no navegador — e registra o motivo no log do servidor.
 */
async function criarSessaoJogador(jogadorId) {
  let segredo;
  try {
    segredo = lerSegredoSessaoJogador();
  } catch {
    return null;
  }

  const expiraEm = Date.now() + DURACAO_PADRAO_MS;
  try {
    const sessaoId = await supabase.registrarSessaoJogador(jogadorId, expiraEm);
    return criarTokenJogador({ sessaoId, jogadorId, expiraEm }, segredo);
  } catch {
    console.error("[sessao-jogador] Não foi possível registrar a sessão; o progresso fica só no navegador.");
    return null;
  }
}

function lerTokenDoCabecalho(cabecalho) {
  if (typeof cabecalho !== "string") {
    return null;
  }
  const partes = /^Bearer ([A-Za-z0-9._-]{1,300})$/.exec(cabecalho.trim());
  return partes ? partes[1] : null;
}

function naoAutenticado() {
  return new ErroHttp(401, "NAO_AUTENTICADO", "Entre de novo com o seu apelido para salvar o progresso.");
}

/**
 * Exige uma sessão de jogador válida no cabeçalho Authorization e aplica o
 * limite de requisições "nomeDaRegra" (api/_lib/limite.js). Use no início de
 * todo endpoint de progresso. Devolve { sessaoId, jogadorId, expiraEm }.
 *
 * Sem token, token adulterado, expirado ou sessão revogada → 401.
 * Passou do limite → 429. Banco fora do ar → 503 (nunca libera sem conferir).
 */
async function exigirSessaoJogador(req, nomeDaRegra) {
  const segredo = lerSegredoSessaoJogador();
  const resultado = verificarTokenJogador(lerTokenDoCabecalho(req.headers.authorization), segredo);
  if (!resultado.valido) {
    // Token falso é recusado sem consultar o banco (nem o limite): custa só um HMAC.
    throw naoAutenticado();
  }

  if (nomeDaRegra) {
    await aplicarLimite(req, nomeDaRegra, { jogadorId: resultado.jogadorId });
  }

  if (!(await supabase.sessaoJogadorEstaAtiva(resultado.sessaoId, resultado.jogadorId))) {
    throw naoAutenticado();
  }
  return { sessaoId: resultado.sessaoId, jogadorId: resultado.jogadorId, expiraEm: resultado.expiraEm };
}

module.exports = {
  DURACAO_PADRAO_MS,
  criarSessaoJogador,
  criarTokenJogador,
  exigirSessaoJogador,
  lerSegredoSessaoJogador,
  lerTokenDoCabecalho,
  verificarTokenJogador,
};
