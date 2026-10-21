// Testes do hash e da conferência do PIN administrativo (api/_lib/pin.js).
// Os PINs abaixo são fictícios, usados só nos testes.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { gerarHashPin, hashTemFormatoValido, pinTemFormatoValido, verificarPin } = require("../api/_lib/pin");

test("formato do PIN: de 6 a 12 dígitos", () => {
  assert.equal(pinTemFormatoValido("123456"), true);
  assert.equal(pinTemFormatoValido("123456789012"), true);
  assert.equal(pinTemFormatoValido("12345"), false);
  assert.equal(pinTemFormatoValido("1234567890123"), false);
  assert.equal(pinTemFormatoValido("12a456"), false);
  assert.equal(pinTemFormatoValido(" 123456"), false);
  assert.equal(pinTemFormatoValido(123456), false);
  assert.equal(pinTemFormatoValido(undefined), false);
});

test("gerarHashPin recusa PIN fora do formato", () => {
  assert.throws(() => gerarHashPin("123"));
  assert.throws(() => gerarHashPin(null));
});

test("o hash não contém o PIN e muda a cada geração (sal aleatório)", () => {
  const hash1 = gerarHashPin("482913");
  const hash2 = gerarHashPin("482913");
  assert.match(hash1, /^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
  assert.ok(!hash1.includes("482913"));
  assert.notEqual(hash1, hash2);
});

test("PIN correto confere; PIN errado não", () => {
  const hash = gerarHashPin("482913");
  assert.equal(verificarPin("482913", hash), true);
  assert.equal(verificarPin("482914", hash), false);
  assert.equal(verificarPin("4829130", hash), false);
});

test("entradas inválidas devolvem false sem lançar erro", () => {
  const hash = gerarHashPin("482913");
  assert.equal(verificarPin(undefined, hash), false);
  assert.equal(verificarPin(482913, hash), false);
  assert.equal(verificarPin("482913", undefined), false);
  assert.equal(verificarPin("482913", ""), false);
  assert.equal(verificarPin("482913", "texto-qualquer"), false);
  assert.equal(verificarPin("482913", "bcrypt$1$2$3$4$5"), false);
  assert.equal(verificarPin("482913", "scrypt$abc$8$1$c2Fs$aGFzaA"), false);
  // N que não é potência de 2
  assert.equal(verificarPin("482913", "scrypt$1000$8$1$c2Fs$aGFzaA"), false);
  // Parâmetros adulterados para exigir memória demais
  assert.equal(verificarPin("482913", "scrypt$1073741824$8$1$c2Fs$aGFzaA"), false);
  // Sal ou hash vazios
  assert.equal(verificarPin("482913", "scrypt$16384$8$1$$aGFzaA"), false);
});

test("hash adulterado não confere", () => {
  const hash = gerarHashPin("482913");
  const partes = hash.split("$");
  const ultimo = partes[5];
  partes[5] = (ultimo[0] === "A" ? "B" : "A") + ultimo.slice(1);
  assert.equal(verificarPin("482913", partes.join("$")), false);
});

test("hash truncado, com tamanho diferente ou com caracteres estranhos é recusado, mesmo com o PIN certo", () => {
  // Um hash colado pela metade seria conferido só nos primeiros bytes: com 1
  // byte, cerca de 1 em cada 256 PINs errados passaria. Agora é recusado.
  const hash = gerarHashPin("482913");
  const partes = hash.split("$");
  assert.equal(hashTemFormatoValido(hash), true);

  for (const caracteres of [2, 3, 11, 42]) {
    const truncado = [...partes.slice(0, 5), partes[5].slice(0, caracteres)].join("$");
    assert.equal(verificarPin("482913", truncado), false, `hash com ${caracteres} caracteres`);
    assert.equal(hashTemFormatoValido(truncado), false);
  }

  const salCurto = [...partes.slice(0, 4), partes[4].slice(0, 10), partes[5]].join("$");
  assert.equal(verificarPin("482913", salCurto), false);
  assert.equal(verificarPin("482913", hash + "!"), false);
  assert.equal(verificarPin("482913", `"${hash}"`), false); // colado com aspas
  assert.equal(hashTemFormatoValido(undefined), false);
});
