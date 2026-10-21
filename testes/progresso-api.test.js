// Testes da sessão do jogador, dos endpoints de progresso, da revogação de
// sessões e do limite de requisições, com o Supabase SIMULADO
// (testes/apoio/supabase-falso.js): nada de rede real nem credenciais reais.
// Cada arquivo de teste roda em um processo separado no node --test, então
// estas variáveis de ambiente não vazam para outros testes.

const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { criarServidor } = require("../scripts/servidor-local");
const { criarTokenJogador } = require("../api/_lib/sessao-jogador");
const { criarTokenSessao } = require("../api/_lib/sessao-admin");
const { esquecerBloqueiosLocais } = require("../api/_lib/limite");
const { CHAVE_FALSA, URL_FALSA, criarSupabaseFalso } = require("./apoio/supabase-falso");

const SEGREDO_JOGADOR = "segredo-de-jogador-falso-para-teste-0123456789";
const SEGREDO_ADMIN = "segredo-admin-falso-para-teste-abcdefghijklmn";
const TODAS = ["1-1", "1-2", "1-3", "2-1", "2-2", "2-3", "3-1", "3-2", "3-3", "4-1", "4-2", "4-3", "5-1"];
const RPC_LIMITE = "rpc/consumir_limite_requisicoes";

const consoleErrorReal = console.error;
const NOMES_AMBIENTE = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "PLAYER_SESSION_SECRET", "ADMIN_SESSION_SECRET", "ADMIN_ALLOWED_ORIGINS", "VERCEL"];
const ambienteOriginal = Object.fromEntries(NOMES_AMBIENTE.map((nome) => [nome, process.env[nome]]));

const banco = criarSupabaseFalso();
let desinstalar;
let servidor;
let base;
let logs;

before(async () => {
  desinstalar = banco.instalar();
  console.error = (...partes) => logs.push(partes.map(String).join(" "));
  servidor = criarServidor();
  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => {
  servidor.close();
  desinstalar();
  console.error = consoleErrorReal;
  for (const [nome, valor] of Object.entries(ambienteOriginal)) {
    if (valor === undefined) {
      delete process.env[nome];
    } else {
      process.env[nome] = valor;
    }
  }
});

beforeEach(() => {
  banco.zerar();
  esquecerBloqueiosLocais();
  logs = [];
  process.env.SUPABASE_URL = URL_FALSA;
  process.env.SUPABASE_SECRET_KEY = CHAVE_FALSA;
  process.env.PLAYER_SESSION_SECRET = SEGREDO_JOGADOR;
  process.env.ADMIN_SESSION_SECRET = SEGREDO_ADMIN;
  process.env.ADMIN_ALLOWED_ORIGINS = base;
  delete process.env.VERCEL;
});

const fetchDoTeste = (...argumentos) => globalThis.fetch(...argumentos);

function pedir(caminho, { metodo = "GET", token, corpo, tipo = "application/json", cabecalhos = {} } = {}) {
  const headers = { ...cabecalhos };
  if (token !== undefined) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (corpo !== undefined) {
    headers["Content-Type"] = tipo;
  }
  return fetchDoTeste(base + caminho, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

async function entrar(apelido, cabecalhos) {
  const resposta = await pedir("/api/jogadores", { metodo: "POST", corpo: { apelido }, cabecalhos });
  const corpo = await resposta.json();
  return { status: resposta.status, ...corpo, token: corpo.sessao?.token, sessaoId: corpo.sessao?.token?.split(".")[0] };
}

async function registrar(token, fasesConcluidas) {
  const resposta = await pedir("/api/progresso/registrar", { metodo: "POST", token, corpo: { fasesConcluidas } });
  return { status: resposta.status, cabecalhos: resposta.headers, corpo: await resposta.json() };
}

async function consultar(token) {
  const resposta = await pedir("/api/progresso", { token });
  return { status: resposta.status, cabecalhos: resposta.headers, corpo: await resposta.json() };
}

function cookieAdmin() {
  return `ab_admin=${criarTokenSessao("ADM01", SEGREDO_ADMIN).token}`;
}

function revogar(corpo, { cookie = cookieAdmin(), origem = base } = {}) {
  const cabecalhos = {};
  if (cookie) {
    cabecalhos.Cookie = cookie;
  }
  if (origem) {
    cabecalhos.Origin = origem;
  }
  return pedir("/api/admin/revogar-sessao-jogador", { metodo: "POST", corpo, cabecalhos });
}

function linhasDoJogador(jogadorId) {
  return [...banco.conclusoes.values()].filter((c) => c.player_id === jogadorId).map((c) => `${c.world}-${c.phase}`).sort();
}

function nadaVazou(texto) {
  return ![CHAVE_FALSA, "projeto-falso", SEGREDO_JOGADOR, SEGREDO_ADMIN].some((segredo) => texto.includes(segredo));
}

// ---------------- Sessão do jogador ----------------

test("identificação devolve uma sessão assinada e registrada no banco; cada entrada cria uma sessão nova", async () => {
  const primeiro = await entrar("Gato Feliz");
  assert.equal(primeiro.criado, true);
  assert.ok(primeiro.sessao.expiraEm > Date.now());
  const [sessaoId, jogadorId] = primeiro.token.split(".");
  assert.equal(jogadorId, primeiro.jogador.id);
  const linha = banco.sessoes.get(sessaoId);
  assert.equal(linha.player_id, primeiro.jogador.id);
  assert.equal(linha.revoked_at, null);
  assert.equal(Date.parse(linha.expires_at), primeiro.sessao.expiraEm);
  assert.ok(nadaVazou(JSON.stringify(primeiro)));

  const segundo = await entrar("gato feliz");
  assert.equal(segundo.criado, false);
  assert.equal(segundo.jogador.id, primeiro.jogador.id);
  assert.notEqual(segundo.sessaoId, primeiro.sessaoId);
  assert.equal(banco.sessoes.size, 2);
});

test("sem PLAYER_SESSION_SECRET ou sem a tabela de sessões, a identificação continua funcionando, com sessao null", async () => {
  delete process.env.PLAYER_SESSION_SECRET;
  const semSegredo = await entrar("Gato Feliz");
  assert.equal(semSegredo.status, 201);
  assert.equal(semSegredo.sessao, null);
  assert.ok(logs.some((l) => l.includes("PLAYER_SESSION_SECRET")));

  process.env.PLAYER_SESSION_SECRET = SEGREDO_JOGADOR;
  banco.modo = "sem-tabela-de-sessoes";
  logs = [];
  const semTabela = await entrar("Gato Feliz");
  assert.equal(semTabela.status, 200);
  assert.equal(semTabela.sessao, null);
  assert.ok(logs.some((l) => l.includes("[sessao-jogador]")));
  assert.ok(logs.every(nadaVazou));
});

test("progresso exige sessão: sem token, adulterado, expirado, de outro segredo ou administrativo → 401 sem tocar no banco", async () => {
  const { jogador, token, sessaoId } = await entrar("Gato Feliz");
  const [, , expira, assinatura] = token.split(".");
  banco.chamadas.length = 0;

  const tokensRuins = [
    undefined,
    "",
    "lixo",
    `${sessaoId}.${crypto.randomUUID()}.${expira}.${assinatura}`, // trocar o jogador
    `${crypto.randomUUID()}.${jogador.id}.${expira}.${assinatura}`, // trocar a sessão
    criarTokenJogador({ sessaoId, jogadorId: jogador.id, expiraEm: Date.now() - 1000 }, SEGREDO_JOGADOR).token, // expirado
    criarTokenJogador({ sessaoId, jogadorId: jogador.id, expiraEm: Date.now() + 60000 }, "outro-segredo-qualquer-com-mais-de-32-caracteres").token,
    criarTokenSessao("ADM01", SEGREDO_ADMIN).token,
    criarTokenSessao("ADM01", SEGREDO_JOGADOR).token,
  ];

  for (const ruim of tokensRuins) {
    for (const resposta of [await consultar(ruim), await registrar(ruim, ["1-1"])]) {
      assert.equal(resposta.status, 401, String(ruim));
      assert.equal(resposta.corpo.erro, "NAO_AUTENTICADO");
    }
  }
  assert.equal(banco.conclusoes.size, 0);
  assert.equal(banco.chamadas.length, 0, "token falso não consulta banco, sessão nem limite");
});

test("o id enviado pelo navegador é ignorado: vale sempre o jogador do token", async () => {
  const ana = await entrar("Ana Clara");
  const beto = await entrar("Beto Azul");

  const resposta = await pedir("/api/progresso/registrar", {
    metodo: "POST",
    token: ana.token,
    corpo: { fasesConcluidas: ["1-1"], player_id: beto.jogador.id, jogadorId: beto.jogador.id },
  });
  assert.equal(resposta.status, 200);
  assert.deepEqual(linhasDoJogador(ana.jogador.id), ["1-1"]);
  assert.deepEqual(linhasDoJogador(beto.jogador.id), []);

  const consulta = await pedir(`/api/progresso?player_id=${beto.jogador.id}`, { token: ana.token });
  assert.deepEqual((await consulta.json()).fasesConcluidas, ["1-1"]);
});

test("sem segredo próprio (ausente ou igual ao do admin), os endpoints de progresso respondem 503", async () => {
  const { token } = await entrar("Gato Feliz");
  for (const configurar of [
    () => delete process.env.PLAYER_SESSION_SECRET,
    () => { process.env.PLAYER_SESSION_SECRET = SEGREDO_ADMIN; },
  ]) {
    configurar();
    logs = [];
    assert.equal((await consultar(token)).status, 503);
    assert.equal((await registrar(token, ["1-1"])).status, 503);
    assert.ok(logs.every(nadaVazou));
    process.env.PLAYER_SESSION_SECRET = SEGREDO_JOGADOR;
  }
  assert.equal(banco.conclusoes.size, 0);
});

// ---------------- Revogação de sessões ----------------

test("revogar UMA sessão: só aquele token passa a receber 401; as outras sessões seguem funcionando", async () => {
  const anaCelular = await entrar("Ana Clara");
  const anaTablet = await entrar("Ana Clara");
  const beto = await entrar("Beto Azul");
  await registrar(anaCelular.token, ["1-1"]);

  const resposta = await revogar({ sessao: anaCelular.sessaoId });
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), { revogadas: 1 });

  assert.equal((await consultar(anaCelular.token)).status, 401);
  assert.equal((await registrar(anaCelular.token, ["1-2"])).status, 401);
  assert.deepEqual((await consultar(anaTablet.token)).corpo.fasesConcluidas, ["1-1"], "outra sessão da mesma criança continua");
  assert.equal((await registrar(beto.token, ["1-1"])).status, 200, "outros jogadores não são afetados");
  assert.deepEqual(linhasDoJogador(anaCelular.jogador.id), ["1-1"], "revogar não apaga progresso");

  // Revogar de novo não conta duas vezes.
  assert.deepEqual(await (await revogar({ sessao: anaCelular.sessaoId })).json(), { revogadas: 0 });
});

test("revogar pelo apelido encerra todas as sessões daquele jogador; entrar de novo cria uma sessão válida", async () => {
  const ana1 = await entrar("Ana Clara");
  const ana2 = await entrar("Ana Clara");
  const beto = await entrar("Beto Azul");

  const resposta = await revogar({ apelido: "ana  clara" });
  assert.deepEqual(await resposta.json(), { revogadas: 2 });
  assert.equal((await consultar(ana1.token)).status, 401);
  assert.equal((await consultar(ana2.token)).status, 401);
  assert.equal((await consultar(beto.token)).status, 200);

  const anaDeNovo = await entrar("Ana Clara");
  assert.equal((await consultar(anaDeNovo.token)).status, 200);
});

test("sessão vencida ou de outro jogador no banco é recusada, mesmo com assinatura válida", async () => {
  const ana = await entrar("Ana Clara");
  const beto = await entrar("Beto Azul");

  banco.sessoes.get(ana.sessaoId).expires_at = new Date(Date.now() - 1000).toISOString();
  assert.equal((await consultar(ana.token)).status, 401);

  // Defesa em profundidade: um token assinado apontando a sessão de outro jogador.
  const misturado = criarTokenJogador({ sessaoId: beto.sessaoId, jogadorId: ana.jogador.id, expiraEm: Date.now() + 60000 }, SEGREDO_JOGADOR).token;
  assert.equal((await consultar(misturado)).status, 401);
  // Sessão que não existe no banco.
  const inventada = criarTokenJogador({ sessaoId: crypto.randomUUID(), jogadorId: ana.jogador.id, expiraEm: Date.now() + 60000 }, SEGREDO_JOGADOR).token;
  assert.equal((await consultar(inventada)).status, 401);
});

test("revogação exige sessão administrativa, origem oficial e pedido bem formado", async () => {
  const ana = await entrar("Ana Clara");

  assert.equal((await revogar({ sessao: ana.sessaoId }, { cookie: null })).status, 401);
  assert.equal((await revogar({ sessao: ana.sessaoId }, { cookie: "ab_admin=ADM01.9999999999999.falsa" })).status, 401);
  assert.equal((await revogar({ sessao: ana.sessaoId }, { origem: "https://site-malicioso.exemplo" })).status, 403);
  assert.equal((await revogar({ sessao: ana.sessaoId }, { origem: null })).status, 403);
  // Token de JOGADOR no lugar do cookie administrativo não serve.
  assert.equal((await revogar({ sessao: ana.sessaoId }, { cookie: `ab_admin=${ana.token}` })).status, 401);

  for (const corpo of [{}, { sessao: "nao-e-uuid" }, { sessao: ana.sessaoId, apelido: "Ana Clara" }, { apelido: "a" }, { sessao: 123 }]) {
    assert.equal((await revogar(corpo)).status, 400, JSON.stringify(corpo));
  }
  assert.equal((await revogar({ apelido: "Ninguem Aqui" })).status, 404);
  assert.equal((await pedir("/api/admin/revogar-sessao-jogador", { cabecalhos: { Cookie: cookieAdmin(), Origin: base } })).status, 405);

  assert.equal(banco.sessoes.get(ana.sessaoId).revoked_at, null, "nenhuma tentativa inválida revogou nada");
  assert.equal((await consultar(ana.token)).status, 200);
});

// ---------------- Limite de requisições ----------------

test("limite por jogador no progresso: o 61º pedido em 10 min recebe 429 com Retry-After; outro jogador segue normal", async () => {
  const ana = await entrar("Ana Clara");
  const beto = await entrar("Beto Azul");

  for (let i = 0; i < 60; i++) {
    assert.equal((await consultar(ana.token)).status, 200, `pedido ${i + 1}`);
  }
  const bloqueado = await consultar(ana.token);
  assert.equal(bloqueado.status, 429);
  assert.equal(bloqueado.corpo.erro, "MUITAS_TENTATIVAS");
  const espera = Number(bloqueado.cabecalhos.get("retry-after"));
  assert.ok(espera >= 1 && espera <= 600, String(espera));
  assert.equal(bloqueado.corpo.esperaSegundos, espera);
  assert.ok(nadaVazou(JSON.stringify(bloqueado.corpo)));

  // A gravação tem o seu próprio limite, e outro jogador na mesma rede não é afetado.
  assert.equal((await registrar(ana.token, ["1-1"])).status, 200);
  assert.equal((await consultar(beto.token)).status, 200);

  // Enquanto o bloqueio vale, esta instância recusa sem consultar o banco de novo.
  const antes = banco.chamadasDe(RPC_LIMITE).length;
  assert.equal((await consultar(ana.token)).status, 429);
  assert.equal(banco.chamadasDe(RPC_LIMITE).length, antes);

  // Passada a janela, volta a funcionar (relógio do banco adiantado; outra instância).
  banco.deslocamentoRelogioMs = 10 * 60 * 1000;
  esquecerBloqueiosLocais();
  assert.equal((await consultar(ana.token)).status, 200);
});

test("limite por rede na identificação: o 121º pedido recebe 429; outra rede segue normal (na Vercel)", async () => {
  process.env.VERCEL = "1";
  const daEscola = { "X-Forwarded-For": "203.0.113.10" };
  for (let i = 0; i < 120; i++) {
    assert.equal((await entrar(`Aluno ${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}`, daEscola)).status !== 429, true);
  }
  const bloqueado = await pedir("/api/jogadores", { metodo: "POST", corpo: { apelido: "Mais Um" }, cabecalhos: daEscola });
  assert.equal(bloqueado.status, 429);
  assert.ok(Number(bloqueado.headers.get("retry-after")) >= 1);

  const deOutraRede = await entrar("Mais Um", { "X-Forwarded-For": "198.51.100.7" });
  assert.equal(deOutraRede.status, 201);
});

test("fora da Vercel, X-Forwarded-For inventado não engana o limite", async () => {
  delete process.env.VERCEL;
  for (let i = 0; i < 120; i++) {
    await pedir("/api/jogadores/verificar", { metodo: "POST", corpo: { apelido: "Gato Feliz" }, cabecalhos: { "X-Forwarded-For": `10.0.0.${i}` } });
  }
  const resposta = await pedir("/api/jogadores/verificar", { metodo: "POST", corpo: { apelido: "Gato Feliz" }, cabecalhos: { "X-Forwarded-For": "10.9.9.9" } });
  assert.equal(resposta.status, 429);
});

test("o banco guarda só resumos nas chaves do limite: nada de IP nem id de jogador", async () => {
  process.env.VERCEL = "1";
  const ana = await entrar("Ana Clara", { "X-Forwarded-For": "203.0.113.55" });
  await consultar(ana.token);
  const chaves = [...banco.contadores.keys()];
  assert.ok(chaves.length >= 2);
  for (const chave of chaves) {
    assert.ok(!chave.includes("203.0.113") && !chave.includes(ana.jogador.id), chave);
    assert.match(chave, /^[A-Za-z]+:(ip|jogador|global):[A-Za-z0-9_-]{32}$/);
  }
});

test("sem a função de limite (migração não aplicada), o jogo continua funcionando e o servidor avisa no log", async () => {
  banco.modo = "sem-funcao-de-limite";
  const ana = await entrar("Ana Clara");
  assert.equal(ana.status, 201);
  assert.equal((await registrar(ana.token, ["1-1"])).status, 200);
  assert.equal((await consultar(ana.token)).status, 200);
  assert.ok(logs.some((l) => l.includes("[limite]") && l.includes("liberado")));
  assert.ok(logs.every(nadaVazou));
});

// ---------------- Progressão ----------------

test("progressão válida: as 13 fases, uma a uma, até a fase bônus", async () => {
  const { jogador, token } = await entrar("Gato Feliz");
  assert.deepEqual((await consultar(token)).corpo, { fasesConcluidas: [] });

  for (const [indice, fase] of TODAS.entries()) {
    const { status, corpo } = await registrar(token, [fase]);
    assert.equal(status, 200, fase);
    assert.deepEqual(corpo.registradas, [fase]);
    assert.deepEqual(corpo.repetidas, []);
    assert.deepEqual(corpo.recusadas, []);
    assert.deepEqual(corpo.fasesConcluidas, TODAS.slice(0, indice + 1));
  }

  assert.deepEqual((await consultar(token)).corpo.fasesConcluidas, TODAS);
  assert.equal(linhasDoJogador(jogador.id).length, 13);
});

test("lote enviado depois de jogar sem conexão é aceito na ordem oficial", async () => {
  const { token } = await entrar("Gato Feliz");
  const { corpo } = await registrar(token, ["1-3", "1-1", "2-1", "1-2"]);
  assert.deepEqual(corpo.registradas, ["1-1", "1-2", "1-3", "2-1"]);
  assert.deepEqual(corpo.fasesConcluidas, ["1-1", "1-2", "1-3", "2-1"]);
});

test("progressão inválida: fase fora de ordem ou inexistente é recusada e nada é gravado", async () => {
  const { jogador, token } = await entrar("Gato Feliz");

  const pulando = await registrar(token, ["2-1"]);
  assert.equal(pulando.status, 200);
  assert.deepEqual(pulando.corpo.registradas, []);
  assert.deepEqual(pulando.corpo.recusadas, [{ fase: "2-1", motivo: "FORA_DE_ORDEM" }]);

  // A fase bônus exige o Mundo 4 completo.
  assert.deepEqual((await registrar(token, ["4-3", "5-1"])).corpo.recusadas.map((r) => r.motivo), ["FORA_DE_ORDEM", "FORA_DE_ORDEM"]);

  const inexistentes = await registrar(token, ["1-99", "6-1", "5-2", "0-1", 7, null, { mundo: 1 }]);
  assert.equal(inexistentes.status, 200);
  assert.ok(inexistentes.corpo.recusadas.every((r) => r.motivo === "FASE_INEXISTENTE"));
  assert.equal(inexistentes.corpo.recusadas.length, 7);

  const misto = await registrar(token, ["1-1", "3-3", "1-99"]);
  assert.deepEqual(misto.corpo.registradas, ["1-1"]);
  assert.deepEqual(misto.corpo.recusadas, [
    { fase: "1-99", motivo: "FASE_INEXISTENTE" },
    { fase: "3-3", motivo: "FORA_DE_ORDEM" },
  ]);

  assert.deepEqual(linhasDoJogador(jogador.id), ["1-1"]);
});

test("duplicidade: registrar a mesma conclusão de novo não cria outra linha nem dá erro", async () => {
  const { jogador, token } = await entrar("Gato Feliz");
  await registrar(token, ["1-1"]);

  const deNovo = await registrar(token, ["1-1"]);
  assert.equal(deNovo.status, 200);
  assert.deepEqual(deNovo.corpo.registradas, []);
  assert.deepEqual(deNovo.corpo.repetidas, ["1-1"]);

  const repetidaNoPedido = await registrar(token, ["1-2", "1-2", "1-1"]);
  assert.deepEqual(repetidaNoPedido.corpo.registradas, ["1-2"]);
  assert.deepEqual(repetidaNoPedido.corpo.repetidas.sort(), ["1-1", "1-2"]);

  assert.deepEqual(linhasDoJogador(jogador.id), ["1-1", "1-2"]);
});

test("duplicidade concorrente: 10 pedidos simultâneos da mesma fase gravam uma linha", async () => {
  const { jogador, token } = await entrar("Gato Feliz");
  const respostas = await Promise.all(Array.from({ length: 10 }, () => registrar(token, ["1-1"])));
  assert.ok(respostas.every((r) => r.status === 200));
  assert.deepEqual(linhasDoJogador(jogador.id), ["1-1"]);
  assert.equal(respostas.flatMap((r) => r.corpo.registradas).length, 1);
});

test("jogadores diferentes não se misturam", async () => {
  const ana = await entrar("Ana Clara");
  const beto = await entrar("Beto Azul");
  await registrar(ana.token, ["1-1", "1-2", "1-3"]);
  await registrar(beto.token, ["1-1"]);

  assert.deepEqual((await consultar(ana.token)).corpo.fasesConcluidas, ["1-1", "1-2", "1-3"]);
  assert.deepEqual((await consultar(beto.token)).corpo.fasesConcluidas, ["1-1"]);
});

// ---------------- Pedidos malformados, CORS e falhas ----------------

test("corpo inválido: 400/415; método errado: 405", async () => {
  const { token } = await entrar("Gato Feliz");
  for (const corpo of [{}, { fasesConcluidas: "1-1" }, { fasesConcluidas: [] }, { fasesConcluidas: Array(14).fill("1-1") }, [], null]) {
    const resposta = await pedir("/api/progresso/registrar", { metodo: "POST", token, corpo });
    assert.equal(resposta.status, 400, JSON.stringify(corpo));
    assert.equal((await resposta.json()).erro, "REQUISICAO_INVALIDA");
  }
  assert.equal((await pedir("/api/progresso/registrar", { metodo: "POST", token, corpo: "{quebrado" })).status, 400);
  assert.equal((await pedir("/api/progresso/registrar", { metodo: "POST", token, corpo: "fasesConcluidas=1-1", tipo: "text/plain" })).status, 415);
  assert.equal((await pedir("/api/progresso/registrar", { token })).status, 405);
  assert.equal((await pedir("/api/progresso", { metodo: "POST", token, corpo: { fasesConcluidas: ["1-1"] } })).status, 405);
  assert.equal(banco.conclusoes.size, 0);
});

test("CORS: nenhum endpoint libera outro site (sem Access-Control-Allow-Origin; pré-voo recusado)", async () => {
  const { token } = await entrar("Gato Feliz");
  const deFora = { Origin: "https://site-malicioso.exemplo" };
  for (const caminho of ["/api/progresso", "/api/progresso/registrar", "/api/jogadores", "/api/jogadores/verificar", "/api/admin/login", "/api/admin/revogar-sessao-jogador"]) {
    const preVoo = await pedir(caminho, {
      metodo: "OPTIONS",
      cabecalhos: { ...deFora, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization, content-type" },
    });
    assert.equal(preVoo.status, 405, caminho);
    assert.equal(preVoo.headers.get("access-control-allow-origin"), null, caminho);
  }
  const leitura = await pedir("/api/progresso", { token, cabecalhos: deFora });
  assert.equal(leitura.headers.get("access-control-allow-origin"), null);
  assert.equal(leitura.headers.get("x-content-type-options"), "nosniff");
});

test("banco fora do ar: 503 amigável, sem vazar chave, endereço ou token", async () => {
  const { token } = await entrar("Gato Feliz");
  for (const falha of ["rede", "erro500"]) {
    banco.modo = falha;
    logs = [];
    for (const resposta of [await pedir("/api/progresso", { token }), await pedir("/api/progresso/registrar", { metodo: "POST", token, corpo: { fasesConcluidas: ["1-1"] } })]) {
      const texto = await resposta.text();
      assert.equal(resposta.status, 503, falha);
      assert.equal(JSON.parse(texto).erro, "SERVICO_INDISPONIVEL");
      assert.ok(nadaVazou(texto) && !texto.includes(token));
    }
    assert.ok(logs.length > 0);
    assert.ok(logs.every((l) => nadaVazou(l) && !l.includes(token)), `${falha}: o log não pode conter segredos`);
  }

  banco.modo = "normal";
  assert.deepEqual((await registrar(token, ["1-1"])).corpo.registradas, ["1-1"]);
});

test("jogador removido do banco (sessões apagadas em cascata): 401 e nada é gravado", async () => {
  const { jogador, token } = await entrar("Gato Feliz");
  banco.jogadores.delete(jogador.id);
  for (const [id, sessao] of banco.sessoes) {
    if (sessao.player_id === jogador.id) {
      banco.sessoes.delete(id);
    }
  }
  const { status, corpo } = await registrar(token, ["1-1"]);
  assert.equal(status, 401);
  assert.equal(corpo.erro, "NAO_AUTENTICADO");
  assert.equal(banco.conclusoes.size, 0);
});

test("o pedido ao banco usa o id do token só no filtro e na linha, e a chave só nos cabeçalhos", async () => {
  const { jogador, token } = await entrar("Gato Feliz");
  await registrar(token, ["1-1"]);
  const leitura = banco.chamadasDe("phase_completions").find((c) => c.metodo === "GET");
  assert.equal(leitura.consulta.get("player_id"), `eq.${jogador.id}`);
  const escrita = banco.chamadasDe("phase_completions").find((c) => c.metodo === "POST");
  assert.deepEqual(escrita.corpo, [{ player_id: jogador.id, world: 1, phase: 1 }]);
  for (const chamada of banco.chamadas) {
    assert.ok(!chamada.consulta.toString().includes(CHAVE_FALSA));
  }
});
