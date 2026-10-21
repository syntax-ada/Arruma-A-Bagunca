/**
 * @file admin.js
 * @description Autenticação administrativa no servidor: leitura da
 * configuração, conferência da origem do pedido e exigência de sessão.
 *
 * Variáveis de ambiente (só no servidor; nomes em .env.example):
 *   ADMIN_PIN_HASH         hash do PIN, gerado por scripts/gerar-hash-pin.js
 *   ADMIN_SESSION_SECRET   segredo que assina a sessão (32+ caracteres)
 *   ADMIN_ALLOWED_ORIGINS  origens confiáveis do login, separadas por vírgula
 *                          (ex.: https://jogo.exemplo.com,http://localhost:3000)
 *
 * Configuração ausente ou inválida → 503, com o NOME da variável no log do
 * servidor (nunca o valor). Credencial errada → 401 genérico. Origem que não
 * está na lista → 403.
 *
 * Tentativas de PIN: limitadas por rede e no total (api/_lib/limite.js,
 * regra "adminLogin"), com contadores no banco compartilhados entre
 * instâncias. Ainda assim, use um PIN longo (10 a 12 dígitos).
 *
 * ⚠️ Limite conhecido: a sessão ADMINISTRATIVA não é revogável no servidor:
 * o logout apaga o cookie do navegador, mas um token copiado antes continua
 * válido até expirar (60 min). (As sessões de JOGADOR são revogáveis.)
 */

const { ErroHttp } = require("./http");
const { hashTemFormatoValido, verificarPin } = require("./pin");
const { lerCookie, verificarTokenSessao } = require("./sessao-admin");

// Decisão da equipe: um único administrador nesta etapa.
const CODIGO_ADMIN = "ADM01";
const TAMANHO_MINIMO_SEGREDO = 32;

function configuracaoAusente(nomeVariavel) {
  // Só o nome da variável; nunca o valor.
  console.error(`[admin] Configuração ausente ou inválida: ${nomeVariavel}.`);
  return new ErroHttp(503, "SERVICO_INDISPONIVEL", "Acesso administrativo indisponível no momento.");
}

function lerSegredoSessao() {
  const segredo = (process.env.ADMIN_SESSION_SECRET || "").trim();
  if (segredo.length < TAMANHO_MINIMO_SEGREDO) {
    throw configuracaoAusente("ADMIN_SESSION_SECRET");
  }
  return segredo;
}

function lerHashPin() {
  const hash = (process.env.ADMIN_PIN_HASH || "").trim();
  // Hash incompleto (ex.: colado pela metade) vira erro de configuração
  // visível, em vez de um login que falha — ou aceita PIN errado — em silêncio.
  if (!hashTemFormatoValido(hash)) {
    throw configuracaoAusente("ADMIN_PIN_HASH");
  }
  return hash;
}

/**
 * Lista de origens confiáveis, já normalizadas (ex.: "https://jogo.exemplo.com").
 */
function lerOrigensPermitidas() {
  const origens = [];
  for (const item of String(process.env.ADMIN_ALLOWED_ORIGINS || "").split(",")) {
    const valor = item.trim();
    if (!valor) {
      continue;
    }
    let origem;
    try {
      origem = new URL(valor).origin;
    } catch {
      throw configuracaoAusente("ADMIN_ALLOWED_ORIGINS");
    }
    if (!origem.startsWith("https://") && !origem.startsWith("http://")) {
      throw configuracaoAusente("ADMIN_ALLOWED_ORIGINS");
    }
    origens.push(origem);
  }
  if (origens.length === 0) {
    throw configuracaoAusente("ADMIN_ALLOWED_ORIGINS");
  }
  return origens;
}

/**
 * Confere de onde veio um pedido que muda o estado da sessão (login e logout).
 *
 * O cabeçalho Origin só é aceito se for EXATAMENTE uma das origens
 * configuradas; ausente ou "null" é recusado. Se o navegador também informar
 * Sec-Fetch-Site, ele precisa dizer "same-origin". Isso barra páginas de
 * outros sites; não é autenticação — quem autentica é o PIN.
 *
 * Devolve a origem aceita.
 */
function exigirOrigemPermitida(req, origensPermitidas) {
  const origem = req.headers.origin;
  const site = req.headers["sec-fetch-site"];
  const origemConfiavel = typeof origem === "string" && origensPermitidas.includes(origem);
  const siteConfiavel = site === undefined || site === "same-origin";

  if (!origemConfiavel || !siteConfiavel) {
    throw new ErroHttp(403, "ORIGEM_NAO_PERMITIDA", "Pedido recusado.");
  }
  return origem;
}

/**
 * O cookie leva Secure quando a origem confiável é https (site publicado).
 * Em http://localhost alguns navegadores recusariam um cookie Secure.
 */
function cookieDeveSerSeguro(origem) {
  return origem.startsWith("https://");
}

/**
 * Confere código e PIN. O PIN é sempre conferido, mesmo com o código errado,
 * para o tempo de resposta não indicar qual dos dois estava errado.
 */
function credenciaisCorretas(codigo, pin, hashPin) {
  const pinCorreto = verificarPin(pin, hashPin);
  return pinCorreto && codigo === CODIGO_ADMIN;
}

/**
 * Exige uma sessão administrativa válida no cookie. Use no início de TODO
 * endpoint administrativo. Devolve { codigo, expiraEm }.
 * Sem sessão, com assinatura inválida ou expirada → 401 NAO_AUTENTICADO.
 */
function exigirSessaoAdmin(req) {
  const segredo = lerSegredoSessao();
  const token = lerCookie(req.headers.cookie);
  const resultado = verificarTokenSessao(token, segredo);

  if (!resultado.valido || resultado.codigo !== CODIGO_ADMIN) {
    throw new ErroHttp(401, "NAO_AUTENTICADO", "Sessão administrativa ausente ou expirada.");
  }
  return { codigo: resultado.codigo, expiraEm: resultado.expiraEm };
}

module.exports = {
  CODIGO_ADMIN,
  cookieDeveSerSeguro,
  credenciaisCorretas,
  exigirOrigemPermitida,
  exigirSessaoAdmin,
  lerHashPin,
  lerOrigensPermitidas,
  lerSegredoSessao,
};
