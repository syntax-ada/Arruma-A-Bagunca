// Testes das regras de apelido (api/_lib/apelido.js).
// Rodar na raiz do projeto: node --test

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizarApelido,
  prepararApelidoExibicao,
  validarApelido,
} = require("../api/_lib/apelido");

function motivoDe(apelido) {
  const resultado = validarApelido(apelido);
  return resultado.valido ? "VALIDO" : `${resultado.erro}:${resultado.motivo}`;
}

test("exibição: tira espaços das pontas e repetidos, mantém maiúsculas e acentos", () => {
  assert.equal(prepararApelidoExibicao("  Leão   Azul  "), "Leão Azul");
  assert.equal(prepararApelidoExibicao("Ana\tClara"), "Ana Clara");
  // "a" + acento combinante vira o caractere composto "á"
  assert.equal(prepararApelidoExibicao("Aná"), "Aná");
});

test("normalização: ignora maiúsculas, acentos e espaços", () => {
  assert.equal(normalizarApelido("Leão Azul"), "leaoazul");
  assert.equal(normalizarApelido("LEÃO  AZUL"), "leaoazul");
  assert.equal(normalizarApelido("leaoazul"), "leaoazul");
  assert.equal(normalizarApelido(" Çéu Ñandú "), "ceunandu");
});

test("apelidos equivalentes têm a mesma forma normalizada", () => {
  const variacoes = ["Ana Clara", "ana clara", "ANACLARA", "  Âna   Clára ", "anaclara"];
  const formas = new Set(variacoes.map((v) => validarApelido(v).apelidoNormalizado));
  assert.deepEqual([...formas], ["anaclara"]);
});

test("apelidos válidos", () => {
  for (const apelido of ["Leão Azul", "ana", "Gato 123", "Super Coruja 2026", "abcdefghijklmnopqrst"]) {
    assert.equal(motivoDe(apelido), "VALIDO", apelido);
  }
  const resultado = validarApelido("  Leão   Azul ");
  assert.equal(resultado.apelido, "Leão Azul");
  assert.equal(resultado.apelidoNormalizado, "leaoazul");
});

test("apelido vazio", () => {
  assert.equal(motivoDe(""), "APELIDO_INVALIDO:VAZIO");
  assert.equal(motivoDe("    "), "APELIDO_INVALIDO:VAZIO");
  assert.equal(motivoDe(undefined), "APELIDO_INVALIDO:VAZIO");
  assert.equal(motivoDe(123), "APELIDO_INVALIDO:VAZIO");
});

test("tamanho: de 3 a 20 caracteres", () => {
  assert.equal(motivoDe("ab"), "APELIDO_INVALIDO:TAMANHO");
  assert.equal(motivoDe("a b"), "APELIDO_INVALIDO:TAMANHO"); // sem espaço sobram só 2
  assert.equal(motivoDe("abcdefghijklmnopqrstu"), "APELIDO_INVALIDO:TAMANHO"); // 21
  assert.equal(motivoDe("a".repeat(500)), "APELIDO_INVALIDO:TAMANHO");
});

test("caracteres: só letras, números e espaço", () => {
  assert.equal(motivoDe("😀😀😀"), "APELIDO_INVALIDO:CARACTERES");
  assert.equal(motivoDe("ana_clara"), "APELIDO_INVALIDO:CARACTERES");
  assert.equal(motivoDe("ana.clara"), "APELIDO_INVALIDO:CARACTERES");
  assert.equal(motivoDe("<b>ana</b>"), "APELIDO_INVALIDO:CARACTERES");
  // Letras cirílicas que imitam latinas
  assert.equal(motivoDe("Ана"), "APELIDO_INVALIDO:CARACTERES");
  // Algarismos de outro sistema de escrita
  assert.equal(motivoDe("ana٣"), "APELIDO_INVALIDO:CARACTERES");
});

test("números: no máximo 4 algarismos seguidos, mesmo com espaços no meio", () => {
  assert.equal(motivoDe("Gato 1234"), "VALIDO");
  assert.equal(motivoDe("12345678"), "APELIDO_INVALIDO:NUMEROS");
  assert.equal(motivoDe("ana 11 98765"), "APELIDO_INVALIDO:NUMEROS");
  assert.equal(motivoDe("ana 12 34 5"), "APELIDO_INVALIDO:NUMEROS");
});

test("palavras bloqueadas, inclusive disfarçadas", () => {
  for (const apelido of ["Merda", "caralho legal", "P0rr4", "merrrrda", "porrrrra", "Puta", "puta 123", "cu 123", "V1ado"]) {
    assert.equal(motivoDe(apelido), "APELIDO_NAO_PERMITIDO:BLOQUEADO", apelido);
  }
});

test("apelidos reservados", () => {
  for (const apelido of ["ADM01", "Admin", "adm", "Professora", "moderador 1"]) {
    assert.equal(motivoDe(apelido), "APELIDO_NAO_PERMITIDO:RESERVADO", apelido);
  }
});

test("palavras inocentes que contêm termos curtos da lista não são bloqueadas", () => {
  for (const apelido of ["Computador", "Enviado", "Bichano", "Escuro", "Cubo", "Shitzu", "Temporada"]) {
    assert.equal(motivoDe(apelido), "VALIDO", apelido);
  }
});

test("a mensagem de bloqueio não revela qual regra foi aplicada", () => {
  const bloqueado = validarApelido("merda");
  const reservado = validarApelido("admin");
  assert.equal(bloqueado.mensagem, reservado.mensagem);
});
