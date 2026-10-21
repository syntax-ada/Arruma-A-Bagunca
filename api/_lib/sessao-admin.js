/**
 * @file sessao-admin.js
 * @description Token da sessão administrativa e montagem do cookie.
 *
 * O token é "CODIGO.EXPIRA_EM.ASSINATURA", assinado com HMAC-SHA256 usando a
 * variável de ambiente ADMIN_SESSION_SECRET (só no servidor). Sem o segredo,
 * ninguém consegue criar nem alterar um token válido.
 *
 * Não há tabela de sessões: o token vale até expirar (60 min por padrão).
 * Trocar ADMIN_SESSION_SECRET derruba todas as sessões de uma vez.
 *
 * ⚠️ Funções puras: recebem o segredo e o horário por parâmetro, para poderem
 * ser testadas sem servidor nem banco. Quem lê o ambiente e usa estas funções
 * nos endpoints é api/_lib/admin.js. "?dev=true" e sessionStorage NUNCA
 * substituem a verificação deste token.
 */

const crypto = require("node:crypto");

const NOME_COOKIE = "ab_admin";
const DURACAO_PADRAO_MS = 60 * 60 * 1000;
const TAMANHO_MINIMO_SEGREDO = 32;
const FORMATO_CODIGO = /^ADM[0-9]{2}$/;

function exigirSegredo(segredo) {
  if (typeof segredo !== "string" || segredo.length < TAMANHO_MINIMO_SEGREDO) {
    throw new Error(
      `ADMIN_SESSION_SECRET ausente ou curto demais (mínimo de ${TAMANHO_MINIMO_SEGREDO} caracteres).`
    );
  }
}

function assinar(conteudo, segredo) {
  return crypto.createHmac("sha256", segredo).update(conteudo).digest("base64url");
}

function criarTokenSessao(codigo, segredo, { agora = Date.now(), duracaoMs = DURACAO_PADRAO_MS } = {}) {
  exigirSegredo(segredo);
  if (typeof codigo !== "string" || !FORMATO_CODIGO.test(codigo)) {
    throw new Error("Código de administrador inválido.");
  }
  if (!Number.isInteger(duracaoMs) || duracaoMs <= 0) {
    throw new Error("Duração da sessão inválida.");
  }

  const expiraEm = agora + duracaoMs;
  const conteudo = `${codigo}.${expiraEm}`;
  return { token: `${conteudo}.${assinar(conteudo, segredo)}`, expiraEm };
}

/**
 * Sucesso: { valido: true, codigo, expiraEm }
 * Falha:   { valido: false, motivo: "AUSENTE" | "MALFORMADO" | "ASSINATURA_INVALIDA" | "EXPIRADO" }
 */
function verificarTokenSessao(token, segredo, { agora = Date.now() } = {}) {
  exigirSegredo(segredo);

  if (typeof token !== "string" || token === "") {
    return { valido: false, motivo: "AUSENTE" };
  }

  const partes = token.split(".");
  if (partes.length !== 3) {
    return { valido: false, motivo: "MALFORMADO" };
  }

  const [codigo, textoExpiracao, assinatura] = partes;
  if (!FORMATO_CODIGO.test(codigo) || !/^[0-9]{1,15}$/.test(textoExpiracao)) {
    return { valido: false, motivo: "MALFORMADO" };
  }

  // Comparação em tempo constante da assinatura.
  const esperada = Buffer.from(assinar(`${codigo}.${textoExpiracao}`, segredo));
  const recebida = Buffer.from(assinatura);
  if (recebida.length !== esperada.length || !crypto.timingSafeEqual(recebida, esperada)) {
    return { valido: false, motivo: "ASSINATURA_INVALIDA" };
  }

  const expiraEm = Number(textoExpiracao);
  if (agora >= expiraEm) {
    return { valido: false, motivo: "EXPIRADO" };
  }

  return { valido: true, codigo, expiraEm };
}

/**
 * Lê um cookie do cabeçalho "Cookie". Devolve null se não existir.
 */
function lerCookie(cabecalho, nome = NOME_COOKIE) {
  if (typeof cabecalho !== "string") {
    return null;
  }
  for (const parte of cabecalho.split(";")) {
    const posicao = parte.indexOf("=");
    if (posicao > 0 && parte.slice(0, posicao).trim() === nome) {
      return parte.slice(posicao + 1).trim();
    }
  }
  return null;
}

/**
 * HttpOnly: o JavaScript da página não lê o cookie.
 * Secure + SameSite=Strict: só vai por HTTPS e só em pedidos do próprio site.
 * Path=/api: o cookie só é enviado para a API, não para as páginas do jogo.
 *
 * "seguro: false" só deve ser usado quando a origem confiável é http (servidor
 * local): alguns navegadores recusam cookies Secure em http://localhost.
 */
function montarCookieSessao(token, maxAgeSegundos = DURACAO_PADRAO_MS / 1000, { seguro = true } = {}) {
  const atributoSecure = seguro ? " Secure;" : "";
  return `${NOME_COOKIE}=${token}; HttpOnly;${atributoSecure} SameSite=Strict; Path=/api; Max-Age=${Math.floor(maxAgeSegundos)}`;
}

function montarCookieLimpeza({ seguro = true } = {}) {
  const atributoSecure = seguro ? " Secure;" : "";
  return `${NOME_COOKIE}=; HttpOnly;${atributoSecure} SameSite=Strict; Path=/api; Max-Age=0`;
}

module.exports = {
  DURACAO_PADRAO_MS,
  NOME_COOKIE,
  criarTokenSessao,
  lerCookie,
  montarCookieLimpeza,
  montarCookieSessao,
  verificarTokenSessao,
};
