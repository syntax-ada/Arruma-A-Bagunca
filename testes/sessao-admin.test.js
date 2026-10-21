// Testes do token e do cookie da sessão administrativa (api/_lib/sessao-admin.js).
// O segredo abaixo é fictício, usado só nos testes.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  DURACAO_PADRAO_MS,
  criarTokenSessao,
  lerCookie,
  montarCookieLimpeza,
  montarCookieSessao,
  verificarTokenSessao,
} = require("../api/_lib/sessao-admin");

const SEGREDO = "segredo-de-teste-com-mais-de-32-caracteres";
const OUTRO_SEGREDO = "outro-segredo-de-teste-com-32-caracteres!";
const AGORA = 1_700_000_000_000;

test("segredo ausente ou curto é erro de configuração", () => {
  assert.throws(() => criarTokenSessao("ADM01", undefined, { agora: AGORA }));
  assert.throws(() => criarTokenSessao("ADM01", "curto", { agora: AGORA }));
  assert.throws(() => verificarTokenSessao("x", "", { agora: AGORA }));
});

test("código de administrador precisa seguir o formato ADMnn", () => {
  assert.throws(() => criarTokenSessao("ADM1", SEGREDO, { agora: AGORA }));
  assert.throws(() => criarTokenSessao("adm01", SEGREDO, { agora: AGORA }));
  assert.throws(() => criarTokenSessao("ADM01.x", SEGREDO, { agora: AGORA }));
  assert.throws(() => criarTokenSessao(undefined, SEGREDO, { agora: AGORA }));
});

test("token válido é aceito e expira em 60 minutos por padrão", () => {
  const { token, expiraEm } = criarTokenSessao("ADM01", SEGREDO, { agora: AGORA });
  assert.equal(expiraEm, AGORA + DURACAO_PADRAO_MS);
  assert.equal(DURACAO_PADRAO_MS, 60 * 60 * 1000);
  assert.deepEqual(verificarTokenSessao(token, SEGREDO, { agora: AGORA + 1000 }), {
    valido: true,
    codigo: "ADM01",
    expiraEm,
  });
});

test("token expirado é recusado", () => {
  const { token, expiraEm } = criarTokenSessao("ADM01", SEGREDO, { agora: AGORA });
  assert.equal(verificarTokenSessao(token, SEGREDO, { agora: expiraEm - 1 }).valido, true);
  assert.deepEqual(verificarTokenSessao(token, SEGREDO, { agora: expiraEm }), { valido: false, motivo: "EXPIRADO" });
});

test("token assinado com outro segredo é recusado", () => {
  const { token } = criarTokenSessao("ADM01", OUTRO_SEGREDO, { agora: AGORA });
  assert.equal(verificarTokenSessao(token, SEGREDO, { agora: AGORA }).motivo, "ASSINATURA_INVALIDA");
});

test("token adulterado é recusado", () => {
  const { token } = criarTokenSessao("ADM01", SEGREDO, { agora: AGORA });
  const [codigo, expiraEm, assinatura] = token.split(".");

  // Tentar estender a validade sem o segredo
  const maisTempo = `${codigo}.${Number(expiraEm) + 999999}.${assinatura}`;
  assert.equal(verificarTokenSessao(maisTempo, SEGREDO, { agora: AGORA }).motivo, "ASSINATURA_INVALIDA");

  // Trocar o código do administrador
  const outroCodigo = `ADM02.${expiraEm}.${assinatura}`;
  assert.equal(verificarTokenSessao(outroCodigo, SEGREDO, { agora: AGORA }).motivo, "ASSINATURA_INVALIDA");

  // Assinatura cortada
  const cortado = `${codigo}.${expiraEm}.${assinatura.slice(0, -2)}`;
  assert.equal(verificarTokenSessao(cortado, SEGREDO, { agora: AGORA }).motivo, "ASSINATURA_INVALIDA");
});

test("entradas ausentes ou malformadas", () => {
  assert.equal(verificarTokenSessao(undefined, SEGREDO).motivo, "AUSENTE");
  assert.equal(verificarTokenSessao("", SEGREDO).motivo, "AUSENTE");
  assert.equal(verificarTokenSessao("abc", SEGREDO).motivo, "MALFORMADO");
  assert.equal(verificarTokenSessao("a.b.c.d", SEGREDO).motivo, "MALFORMADO");
  assert.equal(verificarTokenSessao("ADM01.abc.xyz", SEGREDO).motivo, "MALFORMADO");
  assert.equal(verificarTokenSessao("USER1.123.xyz", SEGREDO).motivo, "MALFORMADO");
});

test("a sessão não aceita valores controlados pelo navegador como prova", () => {
  assert.equal(verificarTokenSessao("true", SEGREDO).valido, false);
  assert.equal(verificarTokenSessao("dev=true", SEGREDO).valido, false);
});

test("leitura do cookie", () => {
  assert.equal(lerCookie("ab_admin=ABC.1.xyz", "ab_admin"), "ABC.1.xyz");
  assert.equal(lerCookie("outro=1; ab_admin=ABC.1.xyz; mais=2"), "ABC.1.xyz");
  assert.equal(lerCookie("xab_admin=errado; ab_admin=certo"), "certo");
  assert.equal(lerCookie("outro=1"), null);
  assert.equal(lerCookie(undefined), null);
});

test("cookie com as proteções previstas no planejamento", () => {
  const cookie = montarCookieSessao("ADM01.1.xyz");
  assert.equal(cookie, "ab_admin=ADM01.1.xyz; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=3600");
  assert.match(montarCookieLimpeza(), /^ab_admin=; HttpOnly; Secure; SameSite=Strict; Path=\/api; Max-Age=0$/);
});
