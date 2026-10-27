// Testes do botão JOGAR e da identificação com o progresso do jogador.
//
// Os scripts reais de index.html (regras-progresso.js, progresso.js,
// jogador.js, menu.js e, quando pedido, dev.js) rodam numa sandbox (node:vm)
// com um DOM de mentira e um fetch de mentira. Nada de rede real.
//
// Regras verificadas:
// - JOGAR não apaga progresso (nem do navegador, nem do banco);
// - depois da identificação, o progresso DESTE jogador é carregado (navegador
//   + banco) antes de o menu de mundos aparecer;
// - falha de rede não impede a entrada.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ler = (arquivo) => fs.readFileSync(path.join(__dirname, "..", "js", arquivo), "utf8");
const SCRIPTS = {
  regras: ler("regras-progresso.js"),
  progresso: ler("progresso.js"),
  jogador: ler("jogador.js"),
  menu: ler("menu.js"),
  dev: ler("dev.js"),
};

const ID_ANA = "11111111-1111-4111-8111-111111111111";
const CHAVE_ANA = `arruma_bagunca_progresso_jogador:${ID_ANA}`;
const CHAVE_DEV = "arruma_bagunca_progresso_dev";
const CHAVE_ANTIGA = "arruma_bagunca_progresso";
const JOGADOR_ANA = { id: ID_ANA, apelido: "Ana Clara", avatar: "padrao" };

function criarElemento(nome) {
  const classes = new Set();
  const ouvintes = {};
  const elemento = {
    nome,
    id: "",
    textContent: "",
    innerHTML: "",
    value: "",
    disabled: false,
    dataset: {},
    style: {},
    atributos: {},
    ouvintes,
    classList: {
      add: (...nomes) => nomes.forEach((c) => classes.add(c)),
      remove: (...nomes) => nomes.forEach((c) => classes.delete(c)),
      contains: (c) => classes.has(c),
      toggle(c, forcar) {
        const ligar = forcar === undefined ? !classes.has(c) : !!forcar;
        if (ligar) {
          classes.add(c);
        } else {
          classes.delete(c);
        }
        return ligar;
      },
    },
    setAttribute(nomeAtributo, valor) {
      this.atributos[nomeAtributo] = String(valor);
    },
    removeAttribute(nomeAtributo) {
      delete this.atributos[nomeAtributo];
    },
    addEventListener(tipo, funcao, opcoes) {
      (ouvintes[tipo] ||= []).push({ funcao, captura: opcoes === true || opcoes?.capture === true });
    },
    disparar(tipo) {
      const evento = { type: tipo, target: elemento, preventDefault() {}, stopPropagation() {} };
      for (const { funcao } of ouvintes[tipo] || []) {
        funcao.call(elemento, evento);
      }
    },
    focus() {},
    appendChild: (filho) => filho,
    querySelector: () => null,
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ width: 100 }),
    scrollBy() {},
  };
  return elemento;
}

function criarArmazenamento(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  const remocoes = [];
  return {
    dados,
    remocoes,
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => void dados.set(k, String(v)),
    removeItem: (k) => {
      remocoes.push(k);
      dados.delete(k);
    },
    clear: () => {
      remocoes.push("*");
      dados.clear();
    },
  };
}

/**
 * Abre index.html de mentira. "rotas" responde a cada URL da API; uma rota
 * pode devolver "rede" (falha de conexão) ou uma Promise (para segurar a resposta).
 */
function abrirIndex({ url = "http://localhost:3000/", localStorage = criarArmazenamento(), sessionStorage = criarArmazenamento(), rotas = {}, comDev = false } = {}) {
  const endereco = new URL(url);
  const elementos = new Map();
  const pedidos = [];
  const document = {
    readyState: "complete",
    documentElement: criarElemento("html"),
    head: criarElemento("head"),
    body: criarElemento("body"),
    querySelector(seletor) {
      if (!elementos.has(seletor)) {
        elementos.set(seletor, criarElemento(seletor));
      }
      return elementos.get(seletor);
    },
    // Como no navegador: o mesmo elemento de querySelector("#id").
    getElementById(id) {
      return this.querySelector(`#${id}`);
    },
    querySelectorAll: () => [],
    createElement: (tag) => criarElemento(tag),
    addEventListener() {},
  };
  // Estado inicial de index.html: só a tela inicial aparece.
  for (const seletor of ["#tela-identificacao", "#menu-fases", "#etapa-confirmacao", "#aviso-conexao", "#erro-apelido"]) {
    document.querySelector(seletor).classList.add("escondido");
  }

  async function fetchFalso(rota, opcoes = {}) {
    const metodo = opcoes.method || "GET";
    pedidos.push({ rota, metodo, corpo: opcoes.body ? JSON.parse(opcoes.body) : undefined, autorizacao: opcoes.headers?.Authorization });
    let resposta = rotas[`${metodo} ${rota}`];
    if (typeof resposta === "function") {
      resposta = await resposta(opcoes.body ? JSON.parse(opcoes.body) : undefined);
    }
    if (resposta === "rede" || resposta === undefined) {
      throw new TypeError("Failed to fetch");
    }
    const { status = 200, corpo } = resposta;
    return { status, ok: status >= 200 && status < 300, json: async () => corpo };
  }

  const ouvintes = {};
  const sandbox = {
    console: { log() {}, info() {}, warn() {}, error() {} },
    document,
    localStorage,
    sessionStorage,
    fetch: fetchFalso,
    setTimeout,
    clearTimeout,
    AbortController,
    URLSearchParams,
    CustomEvent: class {
      constructor(tipo) {
        this.type = tipo;
      }
    },
    location: { href: endereco.href, protocol: endereco.protocol, hostname: endereco.hostname, pathname: endereco.pathname, search: endereco.search },
    addEventListener(tipo, funcao) {
      (ouvintes[tipo] ||= []).push(funcao);
    },
    dispatchEvent(evento) {
      (ouvintes[evento.type] || []).forEach((funcao) => funcao(evento));
    },
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.parent = sandbox;
  vm.createContext(sandbox);
  for (const nome of ["regras", "progresso", "jogador", "menu", ...(comDev ? ["dev"] : [])]) {
    vm.runInContext(SCRIPTS[nome], sandbox);
  }

  const $ = (seletor) => document.querySelector(seletor);
  return { pagina: sandbox, $, pedidos, localStorage, sessionStorage };
}

async function esperar(vezes = 10) {
  for (let i = 0; i < vezes; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const visivel = (elemento) => !elemento.classList.contains("escondido");
const copia = (valor) => JSON.parse(JSON.stringify(valor));

async function identificarComoAna(ambiente) {
  ambiente.$("#botao-jogar").disparar("click");
  ambiente.$("#campo-apelido").value = "Ana Clara";
  ambiente.$("#form-apelido").disparar("submit");
  await esperar();
  ambiente.$("#btn-confirmar-apelido").disparar("click");
}

function rotasDaAna({ remoto = [], progresso } = {}) {
  return {
    "POST /api/jogadores/verificar": { corpo: { existe: true, jogador: JOGADOR_ANA } },
    "POST /api/jogadores": { corpo: { criado: false, jogador: JOGADOR_ANA, sessao: { token: "token-da-ana", expiraEm: Date.now() + 3600000 } } },
    "GET /api/progresso": progresso || { corpo: { fasesConcluidas: remoto } },
    "POST /api/progresso/registrar": (corpo) => ({ corpo: { fasesConcluidas: [...new Set([...remoto, ...corpo.fasesConcluidas])], registradas: [], repetidas: [], recusadas: [] } }),
  };
}

test("JOGAR não apaga nenhum progresso e abre a identificação", async () => {
  const progressoAna = JSON.stringify({ fasesConcluidas: ["1-1", "1-2"], sincronizadas: ["1-1", "1-2"] });
  const localStorage = criarArmazenamento({
    [CHAVE_ANA]: progressoAna,
    [CHAVE_DEV]: JSON.stringify({ fasesConcluidas: ["1-1"] }),
    [CHAVE_ANTIGA]: "antigo",
  });
  const ambiente = abrirIndex({ localStorage });

  ambiente.$("#botao-jogar").disparar("click");
  ambiente.$("#botao-jogar").disparar("click");
  await esperar();

  assert.deepEqual(localStorage.remocoes, [], "nenhuma chave foi apagada");
  assert.equal(localStorage.dados.get(CHAVE_ANA), progressoAna);
  assert.equal(localStorage.dados.get(CHAVE_ANTIGA), "antigo");
  assert.ok(visivel(ambiente.$("#tela-identificacao")), "a identificação abre como antes");
  assert.ok(!visivel(ambiente.$("#tela-inicial")));
  assert.equal(ambiente.pedidos.length, 0, "o JOGAR em si não chama o servidor");
});

test("com o modo DEV local ligado, o JOGAR continua sem mexer no progresso (sem o antigo backup do dev.js)", async () => {
  const localStorage = criarArmazenamento({ [CHAVE_DEV]: JSON.stringify({ fasesConcluidas: ["1-1"] }) });
  const ambiente = abrirIndex({ url: "http://localhost:3000/?dev=true", localStorage, comDev: true });
  assert.equal(ambiente.pagina.modoDevLiberado, true);
  assert.equal(ambiente.$("#botao-jogar").ouvintes.click.length, 1, "só o menu escuta o JOGAR");

  ambiente.$("#botao-jogar").disparar("click");
  await esperar();
  assert.deepEqual(localStorage.remocoes, []);
  assert.deepEqual(JSON.parse(localStorage.dados.get(CHAVE_DEV)).fasesConcluidas, ["1-1"]);
});

test("identificação carrega o progresso DESTE jogador (navegador + banco) antes de abrir o menu", async () => {
  // Navegador com 1-1 ainda não enviada; banco com 1-1, 1-2 e 1-3 (outro aparelho).
  const localStorage = criarArmazenamento({ [CHAVE_ANA]: JSON.stringify({ fasesConcluidas: ["1-1"], sincronizadas: [] }) });
  let liberar;
  const segurar = new Promise((resolve) => {
    liberar = resolve;
  });
  const rotas = rotasDaAna({ remoto: ["1-1", "1-2", "1-3"] });
  const registrarOriginal = rotas["POST /api/progresso/registrar"];
  rotas["POST /api/progresso/registrar"] = async (corpo) => {
    await segurar;
    return registrarOriginal(corpo);
  };
  const ambiente = abrirIndex({ localStorage, rotas });

  await identificarComoAna(ambiente);
  await esperar();
  // Enquanto o progresso não chega, a criança continua na confirmação.
  assert.ok(!visivel(ambiente.$("#menu-fases")));
  assert.equal(ambiente.$("#btn-confirmar-apelido").disabled, true);

  liberar();
  await esperar();

  assert.ok(visivel(ambiente.$("#menu-fases")), "depois, o menu de mundos aparece");
  assert.ok(!visivel(ambiente.$("#tela-identificacao")));
  assert.equal(ambiente.$("#btn-confirmar-apelido").disabled, false);

  const envio = ambiente.pedidos.find((p) => p.rota === "/api/progresso/registrar");
  assert.equal(envio.autorizacao, "Bearer token-da-ana");
  assert.deepEqual(envio.corpo, { fasesConcluidas: ["1-1"] });

  const progresso = copia(ambiente.pagina.obterProgresso());
  assert.deepEqual(progresso.fasesConcluidas, ["1-1", "1-2", "1-3"]);
  assert.deepEqual(progresso.mundosDesbloqueados, [1, 2]);
  assert.equal(ambiente.$(".porcentagem-progresso").textContent, "66%", "a barra do menu já mostra o progresso somado");
  assert.deepEqual(localStorage.remocoes, []);
});

test("falha de rede ao carregar o progresso não impede a entrada; vale o progresso do navegador", async () => {
  const localStorage = criarArmazenamento({ [CHAVE_ANA]: JSON.stringify({ fasesConcluidas: ["1-1", "1-2"], sincronizadas: [] }) });
  const rotas = rotasDaAna({ progresso: "rede" });
  rotas["POST /api/progresso/registrar"] = "rede";
  const ambiente = abrirIndex({ localStorage, rotas });

  await identificarComoAna(ambiente);
  await esperar();

  assert.ok(visivel(ambiente.$("#menu-fases")));
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).faseMaximaPorMundo, { 1: 3 });
  assert.deepEqual(JSON.parse(localStorage.dados.get(CHAVE_ANA)).fasesConcluidas, ["1-1", "1-2"], "nada foi apagado");
  assert.equal(ambiente.$(".porcentagem-progresso").textContent, "45%");
});

test("falha ao criar ou recuperar o jogador continua mostrando o aviso de conexão (sem entrar)", async () => {
  const rotas = rotasDaAna();
  rotas["POST /api/jogadores"] = "rede";
  const ambiente = abrirIndex({ rotas });

  await identificarComoAna(ambiente);
  await esperar();

  assert.ok(visivel(ambiente.$("#aviso-conexao")));
  assert.ok(!visivel(ambiente.$("#menu-fases")));
  assert.equal(ambiente.pedidos.filter((p) => p.rota.startsWith("/api/progresso")).length, 0);
});
