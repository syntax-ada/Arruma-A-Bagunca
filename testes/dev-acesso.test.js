// Testes de QUEM consegue ligar o painel DEV (js/dev.js).
//
// O dev.js real roda numa sandbox (node:vm) com um navegador mínimo simulado:
// endereço, sessionStorage, fetch e um DOM de mentira. Nada de rede real.
// Regras verificadas:
// - ambiente local (localhost, 127.0.0.1, file://): ?dev=true liga o painel;
// - site publicado: ?dev=true sozinho NÃO liga; editar o sessionStorage não
//   basta; só com GET /api/admin/sessao = 200 o painel aparece.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const CODIGO_DEV = fs.readFileSync(path.join(__dirname, "..", "js", "dev.js"), "utf8");
const CHAVE_DEV = "arruma_bagunca_dev";

function criarElemento(tag) {
  const classes = new Set();
  return {
    tagName: tag.toUpperCase(),
    id: "",
    className: "",
    innerHTML: "",
    textContent: "",
    style: {},
    filhos: [],
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      toggle: (c) => (classes.has(c) ? classes.delete(c) : classes.add(c)),
      contains: (c) => classes.has(c),
    },
    setAttribute() {},
    addEventListener() {},
    appendChild(filho) {
      this.filhos.push(filho);
      return filho;
    },
    querySelector() {
      return null;
    },
  };
}

function criarArmazenamento(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => dados.set(k, String(v)),
    removeItem: (k) => dados.delete(k),
  };
}

/**
 * Executa o dev.js real como se a página estivesse em `url`.
 * respostaSessao: status devolvido por GET /api/admin/sessao, ou "rede" para falha de conexão.
 */
async function abrirPagina(url, { sessao = {}, respostaSessao = 401 } = {}) {
  const endereco = new URL(url);
  const criados = [];
  const chamadas = [];

  const document = {
    readyState: "complete",
    head: criarElemento("head"),
    body: criarElemento("body"),
    createElement(tag) {
      const elemento = criarElemento(tag);
      criados.push(elemento);
      return elemento;
    },
    querySelector(seletor) {
      if (seletor === "#dev-painel-container") {
        return criados.find((e) => e.id === "dev-painel-container") || null;
      }
      return null;
    },
    addEventListener() {},
  };

  const window = {
    location: {
      href: endereco.href,
      protocol: endereco.protocol,
      hostname: endereco.hostname,
      pathname: endereco.pathname,
      search: endereco.search,
    },
    sessionStorage: criarArmazenamento(sessao),
    localStorage: criarArmazenamento(),
    addEventListener() {},
  };

  async function fetchFalso(rota, opcoes = {}) {
    chamadas.push({ rota, metodo: opcoes.method || "GET" });
    if (respostaSessao === "rede") {
      throw new TypeError("fetch failed");
    }
    const status = rota === "/api/admin/sessao" ? respostaSessao : 204;
    return { status, ok: status >= 200 && status < 300 };
  }

  const contexto = vm.createContext({
    window,
    document,
    fetch: fetchFalso,
    URLSearchParams,
    setTimeout,
    console: { log() {}, info() {}, error() {} },
  });
  vm.runInContext(CODIGO_DEV, contexto);

  // A conferência no servidor é assíncrona: espera as promessas terminarem.
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  return {
    window,
    chamadas,
    painelCriado: () => criados.some((e) => e.id === "dev-painel-container"),
    indicador: () => window.sessionStorage.getItem(CHAVE_DEV),
  };
}

function painelLigado(pagina) {
  return pagina.painelCriado() && pagina.window.modoDevLiberado === true && typeof pagina.window.dev === "object";
}

function painelDesligado(pagina) {
  return !pagina.painelCriado() && pagina.window.modoDevLiberado !== true && pagina.window.dev === undefined;
}

// ---------------- Ambiente local: fluxo de sempre ----------------

test("ambiente local: ?dev=true liga o painel sem consultar o servidor", async () => {
  for (const url of [
    "http://localhost:3000/?dev=true",
    "http://127.0.0.1:3000/index.html?view=mundos&dev=true",
    "http://localhost:3000/fase1.html?mundo=1&fase=1&dev=1",
    "file:///C:/jogo/index.html?dev=true",
  ]) {
    const pagina = await abrirPagina(url);
    assert.ok(painelLigado(pagina), url);
    assert.equal(pagina.indicador(), "true", url);
    assert.equal(pagina.chamadas.length, 0, url);
  }
});

test("ambiente local: indicador já gravado na aba mantém o painel; ?dev=false desliga", async () => {
  const lembrado = await abrirPagina("http://localhost:3000/", { sessao: { [CHAVE_DEV]: "true" } });
  assert.ok(painelLigado(lembrado));

  const desligado = await abrirPagina("http://localhost:3000/?dev=false", { sessao: { [CHAVE_DEV]: "true" } });
  assert.ok(painelDesligado(desligado));
  assert.equal(desligado.indicador(), null);

  const semNada = await abrirPagina("http://localhost:3000/");
  assert.ok(painelDesligado(semNada));
});

// ---------------- Site publicado ----------------

test("site publicado: acessar ?dev=true direto NÃO liga o painel nem grava nada", async () => {
  for (const url of [
    "https://jogo.exemplo.app/?dev=true",
    "https://jogo.exemplo.app/index.html?view=mundos&dev=true",
    "https://jogo.exemplo.app/fase1.html?mundo=5&fase=1&dev=1",
    "https://localhost.exemplo.app/?dev=true", // só o nome exato "localhost" é local
  ]) {
    const pagina = await abrirPagina(url, { respostaSessao: 200 });
    assert.ok(painelDesligado(pagina), url);
    assert.equal(pagina.indicador(), null, url);
    assert.equal(pagina.chamadas.length, 0, url);
  }
});

test("site publicado: editar o sessionStorage sem sessão no servidor não liga o painel", async () => {
  const pagina = await abrirPagina("https://jogo.exemplo.app/?dev=true", {
    sessao: { [CHAVE_DEV]: "true" },
    respostaSessao: 401,
  });
  assert.ok(painelDesligado(pagina));
  assert.deepEqual(pagina.chamadas, [{ rota: "/api/admin/sessao", metodo: "GET" }]);
  // O indicador inválido é apagado.
  assert.equal(pagina.indicador(), null);
});

test("site publicado: servidor indisponível também não liga o painel (falha fechada)", async () => {
  for (const respostaSessao of ["rede", 503, 500]) {
    const pagina = await abrirPagina("https://jogo.exemplo.app/", {
      sessao: { [CHAVE_DEV]: "true" },
      respostaSessao,
    });
    assert.ok(painelDesligado(pagina), String(respostaSessao));
  }
});

test("site publicado: com sessão administrativa válida no servidor, o painel aparece", async () => {
  for (const url of ["https://jogo.exemplo.app/", "https://jogo.exemplo.app/fase1.html?mundo=1&fase=1&dev=true"]) {
    const pagina = await abrirPagina(url, { sessao: { [CHAVE_DEV]: "true" }, respostaSessao: 200 });
    assert.ok(painelLigado(pagina), url);
    assert.deepEqual(pagina.chamadas, [{ rota: "/api/admin/sessao", metodo: "GET" }]);
  }
});

test("site publicado: desativar o modo DEV também encerra a sessão no servidor", async () => {
  const pagina = await abrirPagina("https://jogo.exemplo.app/?view=mundos", {
    sessao: { [CHAVE_DEV]: "true" },
    respostaSessao: 200,
  });
  pagina.window.dev.desativar();
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.ok(pagina.chamadas.some((c) => c.rota === "/api/admin/logout" && c.metodo === "POST"));
  assert.equal(pagina.indicador(), null);
  assert.equal(pagina.window.modoDevLiberado, false);
  assert.equal(pagina.window.location.href, "/?view=mundos");
});

test("ambiente local: desativar não chama o servidor", async () => {
  const pagina = await abrirPagina("http://localhost:3000/?dev=true");
  pagina.window.dev.desativar();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(pagina.chamadas.length, 0);
  assert.equal(pagina.indicador(), null);
});
