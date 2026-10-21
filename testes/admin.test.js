// Testes da autenticação administrativa (api/admin/* e api/_lib/admin.js).
// O PIN e o segredo abaixo são fictícios, usados só nos testes. Cada arquivo
// de teste roda em um processo separado no node --test, então estas variáveis
// de ambiente não vazam para outros testes.

const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { criarServidor } = require("../scripts/servidor-local");
const { gerarHashPin } = require("../api/_lib/pin");
const { criarTokenSessao } = require("../api/_lib/sessao-admin");
const { exigirSessaoAdmin } = require("../api/_lib/admin");

const PIN = "4829137056";
const SEGREDO = "segredo-de-teste-com-mais-de-32-caracteres-abc";
const OUTRO_SEGREDO = "outro-segredo-de-teste-com-mais-de-32-caracteres";
const ORIGEM_HTTPS = "https://jogo.exemplo.app";
let HASH;
let servidor;
let porta;
let origemLocal;
let logs;
const consoleErrorReal = console.error;

before(async () => {
  HASH = gerarHashPin(PIN);
  servidor = criarServidor();
  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  porta = servidor.address().port;
  origemLocal = `http://127.0.0.1:${porta}`;
  console.error = (...argumentos) => logs.push(argumentos.map(String).join(" "));
});

after(() => {
  servidor.close();
  console.error = consoleErrorReal;
});

beforeEach(() => {
  logs = [];
  process.env.ADMIN_PIN_HASH = HASH;
  process.env.ADMIN_SESSION_SECRET = SEGREDO;
  process.env.ADMIN_ALLOWED_ORIGINS = `${origemLocal}, ${ORIGEM_HTTPS}`;
});

// Pedido HTTP com controle total dos cabeçalhos (Origin, Sec-Fetch-Site, Cookie).
function pedir({ metodo = "GET", caminho, cabecalhos = {}, corpo }) {
  return new Promise((resolve, reject) => {
    const texto = corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo);
    const opcoes = { host: "127.0.0.1", port: porta, path: caminho, method: metodo, headers: { ...cabecalhos } };
    if (texto !== undefined) {
      opcoes.headers["Content-Length"] = Buffer.byteLength(texto);
    }
    const pedido = http.request(opcoes, (resposta) => {
      const partes = [];
      resposta.on("data", (parte) => partes.push(parte));
      resposta.on("end", () => {
        const corpoTexto = Buffer.concat(partes).toString("utf8");
        let json = null;
        try {
          json = JSON.parse(corpoTexto);
        } catch {}
        resolve({ status: resposta.statusCode, cabecalhos: resposta.headers, texto: corpoTexto, json });
      });
    });
    pedido.on("error", reject);
    if (texto !== undefined) {
      pedido.write(texto);
    }
    pedido.end();
  });
}

function login(corpo, { origem = origemLocal, extras = {} } = {}) {
  const cabecalhos = { "Content-Type": "application/json", ...extras };
  if (origem !== null) {
    cabecalhos.Origin = origem;
  }
  return pedir({ metodo: "POST", caminho: "/api/admin/login", cabecalhos, corpo });
}

function cookieDaResposta(resposta) {
  const valor = resposta.cabecalhos["set-cookie"];
  return Array.isArray(valor) ? valor[0] : valor;
}

// "ab_admin=TOKEN; HttpOnly; ..." → "ab_admin=TOKEN"
function paresCookie(setCookie) {
  return setCookie.split(";")[0];
}

function sessao(cookie) {
  return pedir({ caminho: "/api/admin/sessao", cabecalhos: cookie ? { Cookie: cookie } : {} });
}

function nadaSensivel(texto) {
  return !texto.includes(PIN) && !texto.includes(HASH) && !texto.includes(SEGREDO);
}

// ---------------- Login ----------------

test("login válido: 200, cookie HttpOnly/SameSite=Strict/Path=/api e nenhum segredo no corpo", async () => {
  const resposta = await login({ codigo: "ADM01", pin: PIN });
  assert.equal(resposta.status, 200);
  assert.equal(resposta.json.codigo, "ADM01");
  assert.ok(!Number.isNaN(Date.parse(resposta.json.expiraEm)));
  assert.deepEqual(Object.keys(resposta.json).sort(), ["codigo", "expiraEm"]);
  assert.equal(resposta.cabecalhos["cache-control"], "no-store");

  const cookie = cookieDaResposta(resposta);
  assert.match(cookie, /^ab_admin=ADM01\.\d+\.[A-Za-z0-9_-]+; /);
  assert.match(cookie, /; HttpOnly;/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\/api/);
  assert.match(cookie, /Max-Age=3600$/);
  // Origem http (servidor local): sem Secure, senão o navegador recusaria o cookie.
  assert.ok(!cookie.includes("Secure"));

  const token = paresCookie(cookie).split("=")[1];
  assert.ok(!resposta.texto.includes(token), "o token não pode ir no corpo");
  assert.ok(nadaSensivel(resposta.texto));
});

test("login a partir de origem https: cookie com Secure", async () => {
  const resposta = await login({ codigo: "ADM01", pin: PIN }, { origem: ORIGEM_HTTPS });
  assert.equal(resposta.status, 200);
  assert.match(cookieDaResposta(resposta), /; HttpOnly; Secure; SameSite=Strict; Path=\/api; Max-Age=3600$/);
});

test("PIN incorreto e código incorreto: 401 com a MESMA resposta genérica e sem cookie", async () => {
  const pinErrado = await login({ codigo: "ADM01", pin: "1111111111" });
  const codigoErrado = await login({ codigo: "ADM02", pin: PIN });
  const pinForaDoFormato = await login({ codigo: "ADM01", pin: "abc" });
  const ambosErrados = await login({ codigo: "xyz", pin: "000000" });

  for (const resposta of [pinErrado, codigoErrado, pinForaDoFormato, ambosErrados]) {
    assert.equal(resposta.status, 401);
    assert.deepEqual(resposta.json, { erro: "CREDENCIAIS_INVALIDAS", mensagem: "Código ou PIN inválidos." });
    assert.equal(resposta.cabecalhos["set-cookie"], undefined);
    assert.ok(nadaSensivel(resposta.texto));
  }
});

test("login: método, tipo de conteúdo e formato do corpo", async () => {
  const metodo = await pedir({ caminho: "/api/admin/login", cabecalhos: { Origin: origemLocal } });
  assert.equal(metodo.status, 405);
  assert.equal(metodo.cabecalhos.allow, "POST");

  const semJson = await pedir({
    metodo: "POST", caminho: "/api/admin/login",
    cabecalhos: { Origin: origemLocal, "Content-Type": "text/plain" }, corpo: "codigo=ADM01",
  });
  assert.equal(semJson.status, 415);

  assert.equal((await login("{quebrado")).status, 400);
  assert.equal((await login({ codigo: "ADM01" })).status, 400);
  assert.equal((await login({ codigo: "ADM01", pin: 4829137056 })).status, 400);
  assert.equal((await login({ codigo: "ADM01", pin: "1".repeat(40) })).status, 400);
  assert.equal((await login({ codigo: "ADM01", pin: "1".repeat(20000) })).status, 413);
});

// ---------------- Sessão ----------------

test("sessão válida: GET /api/admin/sessao responde 200 com o código e a expiração", async () => {
  const cookie = paresCookie(cookieDaResposta(await login({ codigo: "ADM01", pin: PIN })));
  const resposta = await sessao(cookie);
  assert.equal(resposta.status, 200);
  assert.equal(resposta.json.codigo, "ADM01");
  assert.ok(Date.parse(resposta.json.expiraEm) > Date.now());
  assert.ok(!resposta.texto.includes(cookie.split("=")[1]));
});

test("ausência de sessão: 401 NAO_AUTENTICADO", async () => {
  const semCookie = await sessao(null);
  assert.equal(semCookie.status, 401);
  assert.equal(semCookie.json.erro, "NAO_AUTENTICADO");

  const outroCookie = await sessao("outro=1");
  assert.equal(outroCookie.status, 401);
});

test("assinatura inválida: token adulterado, assinado com outro segredo ou de outro código → 401", async () => {
  const cookie = paresCookie(cookieDaResposta(await login({ codigo: "ADM01", pin: PIN })));
  const [codigo, expira, assinatura] = cookie.split("=")[1].split(".");

  const adulterado = `ab_admin=${codigo}.${expira}.${(assinatura[0] === "A" ? "B" : "A") + assinatura.slice(1)}`;
  const maisTempo = `ab_admin=${codigo}.${Number(expira) + 999999}.${assinatura}`;
  const outroSegredo = `ab_admin=${criarTokenSessao("ADM01", OUTRO_SEGREDO).token}`;
  const outroCodigo = `ab_admin=${criarTokenSessao("ADM02", SEGREDO).token}`;
  const lixo = "ab_admin=qualquer-coisa";

  for (const tentativa of [adulterado, maisTempo, outroSegredo, outroCodigo, lixo]) {
    const resposta = await sessao(tentativa);
    assert.equal(resposta.status, 401, tentativa);
    assert.equal(resposta.json.erro, "NAO_AUTENTICADO");
  }
});

test("sessão expirada: 401", async () => {
  const duasHorasAtras = Date.now() - 2 * 60 * 60 * 1000;
  const { token } = criarTokenSessao("ADM01", SEGREDO, { agora: duasHorasAtras });
  const resposta = await sessao(`ab_admin=${token}`);
  assert.equal(resposta.status, 401);
});

// ---------------- Logout ----------------

test("logout: 204 e cookie apagado; o navegador fica sem sessão", async () => {
  const cookie = paresCookie(cookieDaResposta(await login({ codigo: "ADM01", pin: PIN })));
  const resposta = await pedir({ metodo: "POST", caminho: "/api/admin/logout", cabecalhos: { Origin: origemLocal, Cookie: cookie } });
  assert.equal(resposta.status, 204);
  const limpeza = cookieDaResposta(resposta);
  assert.match(limpeza, /^ab_admin=; HttpOnly; SameSite=Strict; Path=\/api; Max-Age=0$/);

  // Um navegador que obedece ao cookie apagado não manda mais nada:
  assert.equal((await sessao(null)).status, 401);

  // Logout sem sessão também responde 204 (pode ser chamado mais de uma vez).
  assert.equal((await pedir({ metodo: "POST", caminho: "/api/admin/logout", cabecalhos: { Origin: origemLocal } })).status, 204);
});

test("LIMITAÇÃO CONHECIDA: um token copiado antes do logout continua aceito até expirar", async () => {
  // Não há revogação no servidor nesta versão (sem banco para isso). Este
  // teste documenta o comportamento atual; se a revogação for implementada,
  // ele deve passar a esperar 401.
  const cookie = paresCookie(cookieDaResposta(await login({ codigo: "ADM01", pin: PIN })));
  await pedir({ metodo: "POST", caminho: "/api/admin/logout", cabecalhos: { Origin: origemLocal, Cookie: cookie } });
  const reutilizado = await sessao(cookie);
  assert.equal(reutilizado.status, 200);
});

// ---------------- Origem ----------------

test("origem não autorizada: login e logout recusados com 403, mesmo com credenciais certas", async () => {
  const casos = [
    { origem: "https://site-malicioso.exemplo", extras: {} },
    { origem: null, extras: {} }, // sem Origin
    { origem: "null", extras: {} },
    { origem: `${origemLocal}/`, extras: {} }, // não é exatamente a origem
    { origem: "http://127.0.0.1", extras: {} }, // porta diferente
    { origem: origemLocal, extras: { "Sec-Fetch-Site": "cross-site" } },
    { origem: origemLocal, extras: { "Sec-Fetch-Site": "same-site" } },
  ];
  for (const { origem, extras } of casos) {
    const resposta = await login({ codigo: "ADM01", pin: PIN }, { origem, extras });
    assert.equal(resposta.status, 403, JSON.stringify({ origem, extras }));
    assert.equal(resposta.json.erro, "ORIGEM_NAO_PERMITIDA");
    assert.equal(resposta.cabecalhos["set-cookie"], undefined);
  }

  const aceita = await login({ codigo: "ADM01", pin: PIN }, { extras: { "Sec-Fetch-Site": "same-origin" } });
  assert.equal(aceita.status, 200);

  const logoutDeFora = await pedir({ metodo: "POST", caminho: "/api/admin/logout", cabecalhos: { Origin: "https://site-malicioso.exemplo" } });
  assert.equal(logoutDeFora.status, 403);
  assert.equal(logoutDeFora.cabecalhos["set-cookie"], undefined);
});

// ---------------- Configuração ----------------

test("variáveis ausentes ou inválidas: 503, log com o nome da variável e sem valores", async () => {
  const casos = [
    ["ADMIN_PIN_HASH", () => delete process.env.ADMIN_PIN_HASH],
    ["ADMIN_PIN_HASH", () => { process.env.ADMIN_PIN_HASH = "texto-qualquer"; }],
    ["ADMIN_PIN_HASH", () => { process.env.ADMIN_PIN_HASH = HASH.slice(0, -40); }], // hash truncado
    ["ADMIN_SESSION_SECRET", () => delete process.env.ADMIN_SESSION_SECRET],
    ["ADMIN_SESSION_SECRET", () => { process.env.ADMIN_SESSION_SECRET = "curto"; }],
    ["ADMIN_ALLOWED_ORIGINS", () => delete process.env.ADMIN_ALLOWED_ORIGINS],
    ["ADMIN_ALLOWED_ORIGINS", () => { process.env.ADMIN_ALLOWED_ORIGINS = "  ,  "; }],
    ["ADMIN_ALLOWED_ORIGINS", () => { process.env.ADMIN_ALLOWED_ORIGINS = "nao-e-um-endereco"; }],
  ];

  for (const [variavel, quebrar] of casos) {
    process.env.ADMIN_PIN_HASH = HASH;
    process.env.ADMIN_SESSION_SECRET = SEGREDO;
    process.env.ADMIN_ALLOWED_ORIGINS = origemLocal;
    quebrar();
    logs = [];

    const resposta = await login({ codigo: "ADM01", pin: PIN });
    assert.equal(resposta.status, 503, variavel);
    assert.deepEqual(resposta.json, { erro: "SERVICO_INDISPONIVEL", mensagem: "Acesso administrativo indisponível no momento." });
    assert.equal(resposta.cabecalhos["set-cookie"], undefined);
    assert.ok(logs.some((linha) => linha.includes(variavel)), `o log deve citar ${variavel}`);
    assert.ok(logs.every(nadaSensivel), "o log não pode conter PIN, hash ou segredo");
  }

  // Sem o segredo, a verificação de sessão também falha fechada (503, nunca 200).
  process.env.ADMIN_PIN_HASH = HASH;
  process.env.ADMIN_SESSION_SECRET = SEGREDO;
  process.env.ADMIN_ALLOWED_ORIGINS = origemLocal;
  const cookie = paresCookie(cookieDaResposta(await login({ codigo: "ADM01", pin: PIN })));
  delete process.env.ADMIN_SESSION_SECRET;
  assert.equal((await sessao(cookie)).status, 503);

  // Sem as origens, o logout também falha fechado.
  process.env.ADMIN_SESSION_SECRET = SEGREDO;
  delete process.env.ADMIN_ALLOWED_ORIGINS;
  assert.equal((await pedir({ metodo: "POST", caminho: "/api/admin/logout", cabecalhos: { Origin: origemLocal } })).status, 503);
});

// ---------------- Proteção de endpoints administrativos ----------------

test("exigirSessaoAdmin protege qualquer endpoint: sem sessão 401, com sessão devolve o código", () => {
  const { token, expiraEm } = criarTokenSessao("ADM01", SEGREDO);
  assert.deepEqual(exigirSessaoAdmin({ headers: { cookie: `x=1; ab_admin=${token}` } }), { codigo: "ADM01", expiraEm });

  for (const cabecalhos of [{}, { cookie: "" }, { cookie: "ab_admin=" }, { cookie: "ab_admin=ADM01.1.abc" }]) {
    assert.throws(() => exigirSessaoAdmin({ headers: cabecalhos }), (erro) => erro.status === 401 && erro.codigo === "NAO_AUTENTICADO");
  }

  delete process.env.ADMIN_SESSION_SECRET;
  assert.throws(() => exigirSessaoAdmin({ headers: { cookie: `ab_admin=${token}` } }), (erro) => erro.status === 503);
});

test("endpoints administrativos: métodos não permitidos e nenhuma resposta vaza segredos", async () => {
  const postSessao = await pedir({ metodo: "POST", caminho: "/api/admin/sessao", cabecalhos: { Origin: origemLocal } });
  assert.equal(postSessao.status, 405);
  const getLogout = await pedir({ caminho: "/api/admin/logout" });
  assert.equal(getLogout.status, 405);
  // api/_lib/admin.js não vira rota.
  assert.equal((await pedir({ caminho: "/api/_lib/admin" })).status, 404);

  for (const resposta of [postSessao, getLogout, await sessao(null)]) {
    assert.ok(nadaSensivel(resposta.texto));
  }
});
