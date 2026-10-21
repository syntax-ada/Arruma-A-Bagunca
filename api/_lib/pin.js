/**
 * @file pin.js
 * @description Hash e conferência do PIN administrativo (ADM01).
 *
 * O PIN nunca é guardado: no banco vai só o hash gerado aqui. O PIN real não
 * pode aparecer em código, em .env.example, em commits ou no navegador.
 *
 * Formato do hash: "scrypt$N$r$p$<sal>$<hash>" (sal e hash em base64url).
 * Os parâmetros ficam no próprio texto para poderem mudar no futuro sem
 * invalidar hashes antigos.
 *
 * Usado por POST /api/admin/login, que confere o PIN contra ADMIN_PIN_HASH.
 * Para gerar o hash: node scripts/gerar-hash-pin.js
 */

const crypto = require("node:crypto");

// Recomendação do planejamento: pelo menos 6 dígitos.
const PIN_MINIMO = 6;
const PIN_MAXIMO = 12;

const PARAMETROS_SCRYPT = { N: 16384, r: 8, p: 1 };
const TAMANHO_SAL_BYTES = 16;
const TAMANHO_HASH_BYTES = 32;
// Teto de memória para os parâmetros lidos de um hash, para um valor
// adulterado não travar o servidor com um cálculo gigante.
const MEMORIA_MAXIMA_BYTES = 64 * 1024 * 1024;

function pinTemFormatoValido(pin) {
  return typeof pin === "string" && new RegExp(`^[0-9]{${PIN_MINIMO},${PIN_MAXIMO}}$`).test(pin);
}

function gerarHashPin(pin) {
  if (!pinTemFormatoValido(pin)) {
    throw new Error(`O PIN precisa ter de ${PIN_MINIMO} a ${PIN_MAXIMO} dígitos.`);
  }

  const { N, r, p } = PARAMETROS_SCRYPT;
  const sal = crypto.randomBytes(TAMANHO_SAL_BYTES);
  const hash = crypto.scryptSync(pin, sal, TAMANHO_HASH_BYTES, { N, r, p });

  return ["scrypt", N, r, p, sal.toString("base64url"), hash.toString("base64url")].join("$");
}

/**
 * Separa e confere as partes de um hash guardado. Devolve null se o texto não
 * estiver EXATAMENTE no formato gerado por gerarHashPin. Isso inclui o tamanho:
 * um hash truncado (por exemplo, colado pela metade numa variável de ambiente)
 * seria conferido só nos primeiros bytes e passaria a aceitar PINs errados.
 */
function lerPartesDoHash(hashGuardado) {
  if (typeof hashGuardado !== "string") {
    return null;
  }

  const partes = hashGuardado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") {
    return null;
  }

  const [, textoN, textoR, textoP, salTexto, hashTexto] = partes;
  const N = Number(textoN);
  const r = Number(textoR);
  const p = Number(textoP);
  // O scrypt usa cerca de 128 * N * r bytes; N precisa ser potência de 2.
  const parametrosValidos =
    Number.isInteger(N) && N > 1 && (N & (N - 1)) === 0 &&
    Number.isInteger(r) && r >= 1 &&
    Number.isInteger(p) && p >= 1 && p <= 16 &&
    128 * N * r <= MEMORIA_MAXIMA_BYTES;
  if (!parametrosValidos) {
    return null;
  }

  const base64url = /^[A-Za-z0-9_-]+$/;
  if (!base64url.test(salTexto) || !base64url.test(hashTexto)) {
    return null;
  }
  const sal = Buffer.from(salTexto, "base64url");
  const esperado = Buffer.from(hashTexto, "base64url");
  if (sal.length !== TAMANHO_SAL_BYTES || esperado.length !== TAMANHO_HASH_BYTES) {
    return null;
  }

  return { N, r, p, sal, esperado };
}

function hashTemFormatoValido(hashGuardado) {
  return lerPartesDoHash(hashGuardado) !== null;
}

/**
 * Confere um PIN contra o hash guardado. Nunca lança erro: qualquer entrada
 * inválida (PIN fora do formato, hash malformado ou truncado) devolve false.
 */
function verificarPin(pin, hashGuardado) {
  if (!pinTemFormatoValido(pin)) {
    return false;
  }

  const partesDoHash = lerPartesDoHash(hashGuardado);
  if (!partesDoHash) {
    return false;
  }
  const { N, r, p, sal, esperado } = partesDoHash;

  try {
    const calculado = crypto.scryptSync(pin, sal, esperado.length, {
      N,
      r,
      p,
      maxmem: MEMORIA_MAXIMA_BYTES * 2,
    });
    // Comparação em tempo constante: não revela quantos bytes coincidiram.
    return crypto.timingSafeEqual(calculado, esperado);
  } catch (erro) {
    return false;
  }
}

module.exports = {
  PIN_MAXIMO,
  PIN_MINIMO,
  gerarHashPin,
  hashTemFormatoValido,
  pinTemFormatoValido,
  verificarPin,
};
