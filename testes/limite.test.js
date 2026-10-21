// Testes das partes do limite de requisições que não dependem do banco
// (api/_lib/limite.js). O comportamento com o banco simulado (429, janela,
// falha aberta/fechada) está em progresso-api.test.js e admin.test.js.

const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { REGRAS, aplicarLimite, grupoDoIp, obterIpDoCliente } = require("../api/_lib/limite");

const vercelOriginal = process.env.VERCEL;
afterEach(() => {
  if (vercelOriginal === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = vercelOriginal;
  }
});

test("IPv4 é usado inteiro; IPv6 é agrupado pelo prefixo /64", () => {
  assert.equal(grupoDoIp("203.0.113.7"), "203.0.113.7");
  assert.equal(grupoDoIp("::ffff:203.0.113.7"), "203.0.113.7");
  assert.equal(grupoDoIp("2001:db8:abcd:12:1:2:3:4"), "2001:db8:abcd:12::/64");
  // Dois endereços do mesmo aparelho/rede IPv6 caem no mesmo grupo...
  assert.equal(grupoDoIp("2001:db8:abcd:12::99"), grupoDoIp("2001:0DB8:ABCD:0012:ffff::1"));
  // ...e outra rede, não.
  assert.notEqual(grupoDoIp("2001:db8:abcd:13::1"), grupoDoIp("2001:db8:abcd:12::1"));
  assert.equal(grupoDoIp("::1"), "0:0:0:0::/64");
  assert.equal(grupoDoIp("[fe80::1%eth0]"), "fe80:0:0:0::/64");
  assert.equal(grupoDoIp("64:ff9b::192.0.2.33"), "64:ff9b:0:0::/64");
  for (const lixo of ["", undefined, "abc", "999.1.1.1", "1.2.3", "::g"]) {
    assert.equal(grupoDoIp(lixo), "desconhecido", String(lixo));
  }
});

test("fora da Vercel, X-Forwarded-For é ignorado; na Vercel, vale o primeiro endereço dele", () => {
  const pedido = { headers: { "x-forwarded-for": "198.51.100.9, 10.0.0.1" }, socket: { remoteAddress: "127.0.0.1" } };

  delete process.env.VERCEL;
  assert.equal(obterIpDoCliente(pedido), "127.0.0.1");

  process.env.VERCEL = "1";
  assert.equal(obterIpDoCliente(pedido), "198.51.100.9");
  assert.equal(obterIpDoCliente({ headers: {}, socket: { remoteAddress: "10.1.1.1" } }), "10.1.1.1");
});

test("as regras cabem no que a função SQL aceita (até 5 chaves, janela de até 1 dia)", () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "20261021190000_sessoes_e_limites.sql"), "utf8");
  assert.match(sql, /v_total > 5/);
  assert.match(sql, /p_janelas\[i\] > 86400/);

  for (const [nome, regras] of Object.entries(REGRAS)) {
    assert.ok(regras.length >= 1 && regras.length <= 5, nome);
    for (const regra of regras) {
      assert.ok(["ip", "jogador", "global"].includes(regra.escopo), nome);
      assert.ok(Number.isInteger(regra.limite) && regra.limite >= 1, nome);
      assert.ok(Number.isInteger(regra.janelaSegundos) && regra.janelaSegundos >= 1 && regra.janelaSegundos <= 86400, nome);
    }
  }
  // O login administrativo é o mais restrito e tem teto geral.
  assert.ok(REGRAS.adminLogin.some((regra) => regra.escopo === "global"));
  assert.ok(REGRAS.adminLogin.find((regra) => regra.escopo === "ip").limite <= 10);
});

test("regra desconhecida é erro de programação", async () => {
  await assert.rejects(() => aplicarLimite({ headers: {}, socket: {} }, "naoExiste"));
});
