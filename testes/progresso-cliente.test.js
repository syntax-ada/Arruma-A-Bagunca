// Testes do serviço de progresso no NAVEGADOR (js/progresso.js).
//
// O js/regras-progresso.js e o js/progresso.js reais rodam numa sandbox
// (node:vm) com um navegador mínimo: localStorage, sessionStorage, eventos e
// um fetch de mentira que imita /api/progresso. Nada de rede real.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Regras = require("../js/regras-progresso.js");

const CODIGO_REGRAS = fs.readFileSync(path.join(__dirname, "..", "js", "regras-progresso.js"), "utf8");
const CODIGO_PROGRESSO = fs.readFileSync(path.join(__dirname, "..", "js", "progresso.js"), "utf8");

const ID_ANA = "11111111-1111-4111-8111-111111111111";
const ID_BETO = "22222222-2222-4222-8222-222222222222";
const CHAVE_ANA = `arruma_bagunca_progresso_jogador:${ID_ANA}`;
const CHAVE_BETO = `arruma_bagunca_progresso_jogador:${ID_BETO}`;
const CHAVE_DEV = "arruma_bagunca_progresso_dev";
const CHAVE_SESSAO = "arruma_bagunca_sessao_jogador";
const CHAVE_ANTIGA = "arruma_bagunca_progresso";
const TODAS = [...Regras.ORDEM_DAS_FASES];
const UMA_HORA = 60 * 60 * 1000;

function criarArmazenamento(inicial = {}, { bloqueado = false } = {}) {
  const dados = new Map(Object.entries(inicial));
  const falhar = () => {
    throw new Error("SecurityError: armazenamento bloqueado");
  };
  return {
    dados,
    getItem: (k) => (bloqueado ? falhar() : dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => (bloqueado ? falhar() : void dados.set(k, String(v))),
    removeItem: (k) => (bloqueado ? falhar() : void dados.delete(k)),
    clear: () => (bloqueado ? falhar() : dados.clear()),
  };
}

/**
 * Servidor de mentira: tokens válidos → id do jogador; progresso por jogador.
 * Usa as mesmas regras do servidor real (avaliarNovasConclusoes).
 */
function criarServidorFalso() {
  const servidor = {
    tokens: new Map(),
    progresso: new Map(),
    pedidos: [],
    falha: null, // null | "rede" | 503
    pausa: null, // Promise que segura as respostas
  };

  servidor.fetch = async (url, opcoes = {}) => {
    const metodo = opcoes.method || "GET";
    const autorizacao = opcoes.headers?.Authorization || "";
    servidor.pedidos.push({
      url,
      metodo,
      autorizacao,
      corpo: opcoes.body ? JSON.parse(opcoes.body) : undefined,
      keepalive: opcoes.keepalive === true,
    });
    if (servidor.pausa) {
      await servidor.pausa;
    }
    if (servidor.falha === "rede") {
      throw new TypeError("Failed to fetch");
    }
    const responder = (status, dados) => ({ status, ok: status >= 200 && status < 300, json: async () => dados });
    if (servidor.falha === 503) {
      return responder(503, { erro: "SERVICO_INDISPONIVEL" });
    }

    const jogadorId = servidor.tokens.get(autorizacao.replace(/^Bearer /, ""));
    if (!jogadorId) {
      return responder(401, { erro: "NAO_AUTENTICADO" });
    }
    const atual = servidor.progresso.get(jogadorId) || [];
    if (url === "/api/progresso" && metodo === "GET") {
      return responder(200, { fasesConcluidas: atual });
    }
    if (url === "/api/progresso/registrar" && metodo === "POST") {
      const corpo = JSON.parse(opcoes.body);
      const { aceitas, repetidas, recusadas } = Regras.avaliarNovasConclusoes(atual, corpo.fasesConcluidas);
      const novo = Regras.normalizarLista([...atual, ...aceitas]);
      servidor.progresso.set(jogadorId, novo);
      return responder(200, { fasesConcluidas: novo, registradas: aceitas, repetidas, recusadas });
    }
    return responder(404, {});
  };

  servidor.sessao = (jogadorId, { expiraEm = Date.now() + UMA_HORA } = {}) => {
    const token = `token-${jogadorId.slice(0, 4)}-${servidor.tokens.size + 1}`;
    servidor.tokens.set(token, jogadorId);
    return { token, expiraEm };
  };

  return servidor;
}

/** Abre uma "página" com regras-progresso.js + progresso.js carregados. */
function abrirPagina({
  localStorage = criarArmazenamento(),
  sessionStorage = criarArmazenamento(),
  servidor = criarServidorFalso(),
  pai,
  avisos = [],
} = {}) {
  const ouvintes = {};
  const eventos = [];
  const sandbox = {
    console: { log() {}, info() {}, warn: (...p) => avisos.push(p.join(" ")), error: (...p) => avisos.push(p.join(" ")) },
    setTimeout,
    clearTimeout,
    AbortController,
    localStorage,
    sessionStorage,
    fetch: servidor.fetch,
    CustomEvent: class {
      constructor(tipo) {
        this.type = tipo;
      }
    },
    addEventListener(tipo, funcao) {
      (ouvintes[tipo] ||= []).push(funcao);
    },
    dispatchEvent(evento) {
      eventos.push(evento.type);
      (ouvintes[evento.type] || []).forEach((funcao) => funcao(evento));
    },
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.parent = pai || sandbox;
  vm.createContext(sandbox);
  vm.runInContext(CODIGO_REGRAS, sandbox);
  vm.runInContext(CODIGO_PROGRESSO, sandbox);
  return { pagina: sandbox, servidor, localStorage, sessionStorage, eventos, ouvintes, avisos };
}

// Objetos da sandbox vêm de outro "realm": copiar antes de comparar.
const copia = (valor) => JSON.parse(JSON.stringify(valor));

async function esperar(vezes = 10) {
  for (let i = 0; i < vezes; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function progressoGuardado(armazenamento, chave) {
  const texto = armazenamento.dados.get(chave);
  return texto ? JSON.parse(texto) : null;
}

async function identificar(ambiente, jogadorId, sessao) {
  const jogador = { id: jogadorId, apelido: "Teste", avatar: "padrao" };
  const resultado = await ambiente.pagina.ServicoProgresso.iniciarProgressoDoJogador(
    jogador,
    sessao === undefined ? ambiente.servidor.sessao(jogadorId) : sessao
  );
  await esperar();
  return copia(resultado);
}

function concluir(ambiente, mundo, fase) {
  ambiente.pagina.desbloquearProximaFase(fase, mundo, mundo === 5 ? 1 : 3);
}

function pedidosDeGravacao(servidor) {
  return servidor.pedidos.filter((p) => p.metodo === "POST");
}

// ---------------- Sem jogador / contrato público ----------------

test("sem jogador: começa no Mundo 1, Fase 1 e nada é gravado no navegador nem enviado", async () => {
  const ambiente = abrirPagina();
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()), {
    mundosDesbloqueados: [1],
    faseMaximaPorMundo: { 1: 1 },
    fasesConcluidas: [],
  });

  concluir(ambiente, 1, 1);
  await esperar();
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).faseMaximaPorMundo, { 1: 2 });
  assert.equal(ambiente.localStorage.dados.size, 0);
  assert.equal(ambiente.servidor.pedidos.length, 0);
});

test("assinaturas preservadas: desbloquearProximaFase aceita só a fase, 'fase2' e totalFases antigo", async () => {
  const ambiente = abrirPagina();
  await identificar(ambiente, ID_ANA);
  ambiente.pagina.desbloquearProximaFase(1);
  ambiente.pagina.desbloquearProximaFase("fase2");
  ambiente.pagina.desbloquearProximaFase(3, 1, 99);
  ambiente.pagina.desbloquearProximaFase(undefined); // sem número: ignorado
  await esperar();
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1", "1-2", "1-3"]);
  assert.equal(typeof ambiente.pagina.obterProgresso, "function");
});

// ---------------- Jogador identificado e sincronização ----------------

test("conclusão é gravada na chave do jogador e enviada com o token — nunca com o id", async () => {
  const ambiente = abrirPagina();
  const sessao = ambiente.servidor.sessao(ID_ANA);
  await identificar(ambiente, ID_ANA, sessao);

  concluir(ambiente, 1, 1);
  await esperar();

  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA), { fasesConcluidas: ["1-1"], sincronizadas: ["1-1"] });
  const [envio] = pedidosDeGravacao(ambiente.servidor);
  assert.equal(envio.url, "/api/progresso/registrar");
  assert.equal(envio.autorizacao, `Bearer ${sessao.token}`);
  assert.deepEqual(envio.corpo, { fasesConcluidas: ["1-1"] });
  assert.equal(envio.keepalive, true);
  for (const pedido of ambiente.servidor.pedidos) {
    assert.ok(!JSON.stringify(pedido.corpo || "").includes(ID_ANA) && !pedido.url.includes(ID_ANA));
  }
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1"]);
  assert.ok(ambiente.eventos.includes("arruma-bagunca:progresso-atualizado"), "o menu é avisado para se redesenhar");
});

test("ao identificar, progresso local e remoto são SOMADOS, sem duplicar e sem apagar nada", async () => {
  // Navegador com 1-1 e 1-2 ainda não enviadas; banco com mais fases (outro aparelho).
  const ambiente = abrirPagina({
    localStorage: criarArmazenamento({ [CHAVE_ANA]: JSON.stringify({ fasesConcluidas: ["1-1", "1-2"], sincronizadas: [] }) }),
  });
  ambiente.servidor.progresso.set(ID_ANA, ["1-1", "1-2", "1-3", "2-1"]);

  const resultado = await identificar(ambiente, ID_ANA);
  assert.equal(resultado.estado, "sincronizado");
  assert.deepEqual(pedidosDeGravacao(ambiente.servidor)[0].corpo, { fasesConcluidas: ["1-1", "1-2"] });
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1", "1-2", "1-3", "2-1"], "o banco não perde nem duplica nada");

  const progresso = copia(ambiente.pagina.obterProgresso());
  assert.deepEqual(progresso.fasesConcluidas, ["1-1", "1-2", "1-3", "2-1"]);
  assert.deepEqual(progresso.mundosDesbloqueados, [1, 2]);
  assert.deepEqual(progresso.faseMaximaPorMundo, { 1: 3, 2: 2 });
});

test("ao identificar com mais progresso no navegador que no banco, o banco recebe o que falta", async () => {
  const ambiente = abrirPagina({
    localStorage: criarArmazenamento({ [CHAVE_ANA]: JSON.stringify({ fasesConcluidas: ["1-1", "1-2", "1-3"], sincronizadas: ["1-1"] }) }),
  });
  ambiente.servidor.progresso.set(ID_ANA, ["1-1"]);
  await identificar(ambiente, ID_ANA);
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1", "1-2", "1-3"]);
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).sincronizadas, ["1-1", "1-2", "1-3"]);
});

test("sem nada pendente, a identificação só consulta o banco (GET)", async () => {
  const ambiente = abrirPagina();
  ambiente.servidor.progresso.set(ID_ANA, ["1-1"]);
  await identificar(ambiente, ID_ANA);
  assert.deepEqual(ambiente.servidor.pedidos.map((p) => `${p.metodo} ${p.url}`), ["GET /api/progresso"]);
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).fasesConcluidas, ["1-1"]);
});

test("troca de jogador na mesma aba não mistura o progresso", async () => {
  const ambiente = abrirPagina();
  await identificar(ambiente, ID_ANA);
  concluir(ambiente, 1, 1);
  concluir(ambiente, 1, 2);
  await esperar();

  await identificar(ambiente, ID_BETO);
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).fasesConcluidas, [], "Beto começa do zero");
  concluir(ambiente, 1, 1);
  await esperar();

  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1", "1-2"]);
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_BETO).fasesConcluidas, ["1-1"]);
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1", "1-2"]);
  assert.deepEqual(ambiente.servidor.progresso.get(ID_BETO), ["1-1"]);

  await identificar(ambiente, ID_ANA);
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).fasesConcluidas, ["1-1", "1-2"], "Ana volta com o progresso dela");
});

test("resposta atrasada do jogador anterior não cai no progresso do novo jogador", async () => {
  const ambiente = abrirPagina();
  ambiente.servidor.progresso.set(ID_ANA, ["1-1", "1-2", "1-3"]);

  let liberar;
  ambiente.servidor.pausa = new Promise((resolve) => {
    liberar = resolve;
  });
  const carregandoAna = ambiente.pagina.ServicoProgresso.iniciarProgressoDoJogador({ id: ID_ANA }, ambiente.servidor.sessao(ID_ANA));
  await esperar();

  // Beto entra antes de a resposta da Ana chegar.
  ambiente.servidor.pausa = null;
  await identificar(ambiente, ID_BETO);
  liberar();
  await carregandoAna;
  await esperar();

  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).fasesConcluidas, []);
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_BETO).fasesConcluidas, []);
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1", "1-2", "1-3"]);
});

// ---------------- Falhas de conexão e de sessão ----------------

test("sem conexão: o jogo segue, a conclusão fica guardada e é enviada depois", async () => {
  const ambiente = abrirPagina();
  ambiente.servidor.falha = "rede";

  assert.equal((await identificar(ambiente, ID_ANA)).estado, "falha");
  concluir(ambiente, 1, 1);
  concluir(ambiente, 1, 2);
  await esperar();
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).faseMaximaPorMundo, { 1: 3 });
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA), { fasesConcluidas: ["1-1", "1-2"], sincronizadas: [] });

  // Servidor com erro 503: continua pendente, nada é apagado.
  ambiente.servidor.falha = 503;
  concluir(ambiente, 1, 3);
  await esperar();
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1", "1-2", "1-3"]);
  assert.equal(ambiente.servidor.progresso.get(ID_ANA), undefined);

  // A conexão volta: o evento "online" reenvia tudo de uma vez.
  ambiente.servidor.falha = null;
  ambiente.ouvintes.online.forEach((funcao) => funcao());
  await esperar();
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1", "1-2", "1-3"]);
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).sincronizadas, ["1-1", "1-2", "1-3"]);
});

test("pendências guardadas são enviadas ao abrir a página de novo", async () => {
  const localStorage = criarArmazenamento({ [CHAVE_ANA]: JSON.stringify({ fasesConcluidas: ["1-1"], sincronizadas: [] }) });
  const servidor = criarServidorFalso();
  const sessao = servidor.sessao(ID_ANA);
  const sessionStorage = criarArmazenamento({ [CHAVE_SESSAO]: JSON.stringify({ jogadorId: ID_ANA, ...sessao }) });

  abrirPagina({ localStorage, sessionStorage, servidor });
  await esperar();
  assert.deepEqual(servidor.progresso.get(ID_ANA), ["1-1"]);
});

test("sessão recusada (401) ou expirada: o progresso local fica e volta a sincronizar ao entrar de novo", async () => {
  const ambiente = abrirPagina();
  await identificar(ambiente, ID_ANA, { token: "token-que-o-servidor-nao-conhece", expiraEm: Date.now() + UMA_HORA });
  concluir(ambiente, 1, 1);
  await esperar();

  const sessaoGuardada = JSON.parse(ambiente.sessionStorage.dados.get(CHAVE_SESSAO));
  assert.equal(sessaoGuardada.jogadorId, ID_ANA);
  assert.equal(sessaoGuardada.token, null, "o token recusado deixa de ser usado");
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1"]);

  // Com o token descartado, novas conclusões não chamam o servidor.
  const antes = ambiente.servidor.pedidos.length;
  concluir(ambiente, 1, 2);
  await esperar();
  assert.equal(ambiente.servidor.pedidos.length, antes);

  // Token expirado: nem tenta.
  await identificar(ambiente, ID_ANA, { token: "qualquer", expiraEm: Date.now() - 1000 });
  assert.equal(ambiente.servidor.pedidos.length, antes);

  // Nova identificação válida envia o que estava pendente.
  await identificar(ambiente, ID_ANA);
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1", "1-2"]);
});

test("servidor sem sessão de jogador (sessao null): o progresso fica só no navegador", async () => {
  const ambiente = abrirPagina();
  assert.equal((await identificar(ambiente, ID_ANA, null)).estado, "sem-sessao");
  concluir(ambiente, 1, 1);
  await esperar();
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1"]);
  assert.equal(ambiente.servidor.pedidos.length, 0);
});

// ---------------- Dados inválidos e progressão inválida ----------------

test("dados locais inválidos não travam o jogo e não apagam o que é válido", async () => {
  const ambiente = abrirPagina({
    localStorage: criarArmazenamento({
      [CHAVE_ANA]: "{quebrado",
      [CHAVE_DEV]: "[1,2",
      [CHAVE_ANTIGA]: "lixo-de-versao-antiga",
    }),
    sessionStorage: criarArmazenamento({ [CHAVE_SESSAO]: "nao-e-json" }),
  });
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).fasesConcluidas, []);

  await identificar(ambiente, ID_ANA);
  concluir(ambiente, 1, 1);
  await esperar();
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1"]);
  assert.equal(ambiente.localStorage.dados.get(CHAVE_ANTIGA), "lixo-de-versao-antiga", "a chave antiga não é lida nem apagada");

  // Lista com valores estranhos: só as fases válidas contam.
  const outro = abrirPagina({
    localStorage: criarArmazenamento({
      [CHAVE_BETO]: JSON.stringify({ fasesConcluidas: ["1-1", "1-99", "6-1", 5, null, "1-1", "1-2"], sincronizadas: "lixo" }),
    }),
  });
  await identificar(outro, ID_BETO);
  assert.deepEqual(copia(outro.pagina.obterProgresso()).fasesConcluidas, ["1-1", "1-2"]);
  assert.deepEqual(outro.servidor.progresso.get(ID_BETO), ["1-1", "1-2"]);
});

test("fase concluída fora de ordem (aberta pela URL) ou inexistente não libera nada", async () => {
  const ambiente = abrirPagina();
  await identificar(ambiente, ID_ANA);
  concluir(ambiente, 4, 3);
  ambiente.pagina.desbloquearProximaFase(99, 1, 3);
  ambiente.pagina.desbloquearProximaFase(1, 6, 1);
  await esperar();

  const progresso = copia(ambiente.pagina.obterProgresso());
  assert.deepEqual(progresso.mundosDesbloqueados, [1]);
  assert.deepEqual(progresso.fasesConcluidas, []);
  assert.equal(pedidosDeGravacao(ambiente.servidor).length, 0);
});

test("as 13 fases em ordem liberam até o Mundo 5 e não existe Mundo 6", async () => {
  const ambiente = abrirPagina();
  await identificar(ambiente, ID_ANA);
  for (const id of TODAS) {
    const { mundo, fase } = Regras.lerIdDaFase(id);
    concluir(ambiente, mundo, fase);
  }
  await esperar(20);
  const progresso = copia(ambiente.pagina.obterProgresso());
  assert.deepEqual(progresso.mundosDesbloqueados, [1, 2, 3, 4, 5]);
  assert.deepEqual(progresso.faseMaximaPorMundo, { 1: 3, 2: 3, 3: 3, 4: 3, 5: 1 });
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), TODAS);
});

test("conclusões rápidas: um envio por vez e nada se perde", async () => {
  const ambiente = abrirPagina();
  await identificar(ambiente, ID_ANA);

  let liberar;
  ambiente.servidor.pausa = new Promise((resolve) => {
    liberar = resolve;
  });
  concluir(ambiente, 1, 1);
  concluir(ambiente, 1, 2);
  concluir(ambiente, 1, 3);
  await esperar();
  assert.equal(pedidosDeGravacao(ambiente.servidor).length, 1, "só um envio em andamento");

  ambiente.servidor.pausa = null;
  liberar();
  await esperar(20);
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1", "1-2", "1-3"]);
  assert.ok(pedidosDeGravacao(ambiente.servidor).length <= 2);
});

// ---------------- Modo DEV ----------------

test("modo DEV: conclusões vão para o progresso de teste e nunca são enviadas", async () => {
  const ambiente = abrirPagina();
  await identificar(ambiente, ID_ANA);
  concluir(ambiente, 1, 1);
  await esperar();
  const pedidosAntes = ambiente.servidor.pedidos.length;

  ambiente.pagina.modoDevLiberado = true;
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).fasesConcluidas, [], "o DEV não mostra o progresso do jogador");
  concluir(ambiente, 3, 2); // o DEV pode pular fases
  ambiente.pagina.ServicoProgresso.definirProgressoDeTeste(TODAS);
  await esperar();

  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).mundosDesbloqueados, [1, 2, 3, 4, 5]);
  assert.deepEqual(JSON.parse(ambiente.localStorage.dados.get(CHAVE_DEV)).fasesConcluidas, TODAS);
  assert.equal(ambiente.servidor.pedidos.length, pedidosAntes, "nada do DEV vai para o servidor");
  assert.deepEqual(progressoGuardado(ambiente.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1"]);

  // Resetar o progresso de teste não toca no jogador nem no banco.
  ambiente.pagina.ServicoProgresso.definirProgressoDeTeste([]);
  ambiente.pagina.modoDevLiberado = false;
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).fasesConcluidas, ["1-1"]);
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1"]);
});

// ---------------- Armazenamento bloqueado e iframe ----------------

test("armazenamento bloqueado: o jogo continua com o progresso em memória e sincroniza", async () => {
  const ambiente = abrirPagina({
    localStorage: criarArmazenamento({}, { bloqueado: true }),
    sessionStorage: criarArmazenamento({}, { bloqueado: true }),
  });
  await identificar(ambiente, ID_ANA);
  concluir(ambiente, 1, 1);
  await esperar();
  assert.deepEqual(copia(ambiente.pagina.obterProgresso()).faseMaximaPorMundo, { 1: 2 });
  assert.deepEqual(ambiente.servidor.progresso.get(ID_ANA), ["1-1"]);
});

test("dentro do iframe da fase, a conclusão é entregue ao serviço do menu", async () => {
  const menu = abrirPagina();
  await identificar(menu, ID_ANA);

  // A fase não tem acesso ao armazenamento (ex.: bloqueado no iframe do HUB).
  const servidorDaFase = criarServidorFalso();
  const fase = abrirPagina({
    pai: menu.pagina,
    servidor: servidorDaFase,
    localStorage: criarArmazenamento({}, { bloqueado: true }),
    sessionStorage: criarArmazenamento({}, { bloqueado: true }),
  });
  concluir(fase, 1, 1);
  await esperar();

  assert.deepEqual(progressoGuardado(menu.localStorage, CHAVE_ANA).fasesConcluidas, ["1-1"]);
  assert.deepEqual(menu.servidor.progresso.get(ID_ANA), ["1-1"]);
  assert.equal(servidorDaFase.pedidos.length, 0, "quem envia é o menu, que não é recarregado entre fases");
  assert.deepEqual(copia(fase.pagina.obterProgresso()).fasesConcluidas, ["1-1"]);
});

test("menu em outro site (iframe do HUB): a fase usa o próprio serviço sem erro", async () => {
  const paiDeOutroSite = {};
  Object.defineProperty(paiDeOutroSite, "ServicoProgresso", {
    get() {
      throw new Error("SecurityError: Blocked a frame with origin");
    },
  });
  const sessionStorage = criarArmazenamento();
  const servidor = criarServidorFalso();
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({ jogadorId: ID_ANA, ...servidor.sessao(ID_ANA) }));

  const pagina = abrirPagina({ pai: paiDeOutroSite, sessionStorage, servidor });
  concluir(pagina, 1, 1);
  await esperar();
  assert.deepEqual(servidor.progresso.get(ID_ANA), ["1-1"]);
});
