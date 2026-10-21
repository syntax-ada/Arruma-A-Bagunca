/**
 * @file apelido.js
 * @description Regras do apelido do jogador: exibição, normalização,
 * validação e filtro de conteúdo.
 *
 * Roda SÓ no servidor. O navegador nunca decide se um apelido é permitido —
 * ele apenas mostra a mensagem que o servidor devolver.
 *
 * Exemplos:
 *   "  Ana   Clara " → exibição "Ana Clara"  → normalizado "anaclara"
 *   "ÂNA CLARA"     → exibição "ÂNA CLARA"  → normalizado "anaclara" (mesmo jogador)
 */

const { ErroHttp, lerJson } = require("./http");
const { CONTEM, IGUAL, RESERVADOS } = require("./palavras-bloqueadas");

const TAMANHO_MINIMO = 3;
const TAMANHO_MAXIMO = 20;
// Evita telefone ou número de documento escondido no apelido.
const MAXIMO_DIGITOS_SEGUIDOS = 4;
// Corta entradas absurdas antes de qualquer outra verificação.
const LIMITE_ENTRADA = 100;

const MENSAGENS = {
  VAZIO: "Escreva um apelido para continuar.",
  TAMANHO: "Use de 3 a 20 letras ou números.",
  CARACTERES: "Use só letras, números e espaços.",
  NUMEROS: "Use no máximo 4 números seguidos.",
  NAO_PERMITIDO: "Esse apelido não pode ser usado. Escolha outro!",
};

/**
 * Grafia que será exibida e guardada: sem espaços nas pontas e sem espaços
 * repetidos. Maiúsculas e acentos são mantidos como a criança digitou.
 */
function prepararApelidoExibicao(texto) {
  return String(texto ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
}

/**
 * Forma usada para comparar apelidos e evitar duplicidade: sem acentos
 * ("ç" vira "c"), em minúsculas e sem nenhum espaço.
 */
function normalizarApelido(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

// Trocas comuns para disfarçar palavras ("p0rr4" → "porra").
const TROCAS_DE_NUMEROS = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t" };

/**
 * Gera as formas do apelido que o filtro compara com a lista: o próprio
 * apelido, com números trocados por letras, sem números e com letras
 * repetidas reduzidas ("merrrda" → "merda", "porrrra" → "porra").
 */
function variantesParaFiltro(normalizado) {
  const comLetras = normalizado.replace(/[013457]/g, (digito) => TROCAS_DE_NUMEROS[digito]);
  const variantes = new Set();

  [normalizado, comLetras].forEach((forma) => {
    [forma, forma.replace(/[0-9]/g, "")].forEach((semNumeros) => {
      variantes.add(semNumeros);
      variantes.add(semNumeros.replace(/(.)\1{2,}/g, "$1"));
      variantes.add(semNumeros.replace(/(.)\1{2,}/g, "$1$1"));
    });
  });

  variantes.delete("");
  return [...variantes];
}

/**
 * Devolve "RESERVADO", "BLOQUEADO" ou null. Ver limitações em
 * palavras-bloqueadas.js: o filtro reduz o problema, mas não é perfeito.
 */
function motivoDeBloqueio(normalizado) {
  const variantes = variantesParaFiltro(normalizado);

  if (variantes.some((forma) => RESERVADOS.includes(forma))) {
    return "RESERVADO";
  }

  const bloqueado = variantes.some(
    (forma) => IGUAL.includes(forma) || CONTEM.some((termo) => forma.includes(termo))
  );
  return bloqueado ? "BLOQUEADO" : null;
}

function falha(erro, motivo) {
  const mensagem = erro === "APELIDO_NAO_PERMITIDO" ? MENSAGENS.NAO_PERMITIDO : MENSAGENS[motivo];
  return { valido: false, erro, motivo, mensagem };
}

/**
 * Valida um apelido digitado.
 *
 * Sucesso: { valido: true, apelido, apelidoNormalizado }
 * Falha:   { valido: false, erro, motivo, mensagem }
 *   erro "APELIDO_INVALIDO"      → motivo VAZIO | TAMANHO | CARACTERES | NUMEROS
 *   erro "APELIDO_NAO_PERMITIDO" → motivo RESERVADO | BLOQUEADO (não é enviado ao navegador)
 */
function validarApelido(entrada) {
  const texto = typeof entrada === "string" ? entrada : "";

  if (texto.length > LIMITE_ENTRADA) {
    return falha("APELIDO_INVALIDO", "TAMANHO");
  }

  const apelido = prepararApelidoExibicao(texto);
  if (apelido === "") {
    return falha("APELIDO_INVALIDO", "VAZIO");
  }

  // Letras (com ou sem acento), algarismos e espaço. Emojis e símbolos ficam de fora.
  if (!/^[\p{L}\p{M}\p{Nd} ]+$/u.test(apelido)) {
    return falha("APELIDO_INVALIDO", "CARACTERES");
  }

  // Depois de tirar os acentos, só pode sobrar a-z e 0-9. Isso recusa letras
  // de outros alfabetos, inclusive as que imitam letras latinas.
  const apelidoNormalizado = normalizarApelido(apelido);
  if (!/^[a-z0-9]*$/.test(apelidoNormalizado)) {
    return falha("APELIDO_INVALIDO", "CARACTERES");
  }

  const tamanho = [...apelido].length;
  if (
    tamanho < TAMANHO_MINIMO ||
    tamanho > TAMANHO_MAXIMO ||
    apelidoNormalizado.length < TAMANHO_MINIMO
  ) {
    return falha("APELIDO_INVALIDO", "TAMANHO");
  }

  if (new RegExp(`[0-9]{${MAXIMO_DIGITOS_SEGUIDOS + 1},}`).test(apelidoNormalizado)) {
    return falha("APELIDO_INVALIDO", "NUMEROS");
  }

  const motivo = motivoDeBloqueio(apelidoNormalizado);
  if (motivo) {
    return falha("APELIDO_NAO_PERMITIDO", motivo);
  }

  return { valido: true, apelido, apelidoNormalizado };
}

/**
 * Uso pelos endpoints: lê o corpo, valida o campo "apelido" e lança ErroHttp
 * quando algo está errado. O motivo de um bloqueio de conteúdo não é enviado
 * ao navegador, para não ensinar a contornar o filtro.
 */
async function lerApelidoValido(req) {
  const corpo = await lerJson(req);
  if (!corpo || typeof corpo.apelido !== "string") {
    throw new ErroHttp(400, "REQUISICAO_INVALIDA", "Envie o campo apelido.");
  }

  const validacao = validarApelido(corpo.apelido);
  if (!validacao.valido) {
    const extras = validacao.erro === "APELIDO_INVALIDO" ? { motivo: validacao.motivo } : undefined;
    throw new ErroHttp(422, validacao.erro, validacao.mensagem, extras);
  }

  return validacao;
}

module.exports = {
  MENSAGENS,
  TAMANHO_MAXIMO,
  TAMANHO_MINIMO,
  lerApelidoValido,
  normalizarApelido,
  prepararApelidoExibicao,
  validarApelido,
};
