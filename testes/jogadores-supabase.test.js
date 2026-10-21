// Testes dos endpoints de jogadores com o Supabase SIMULADO.
//
// Nenhum teste aqui usa credenciais reais nem acessa a internet: o fetch global
// é trocado por um "Supabase de mentira" em memória que imita só o que o
// api/_lib/supabase.js usa da API REST (tabela public.players com
// normalized_nickname UNIQUE). Cada arquivo de teste roda em um processo
// separado no node --test, então estas variáveis de ambiente não vazam.

const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { criarServidor } = require("../scripts/servidor-local");

const URL_FALSA = "https://projeto-falso.supabase.test";
const CHAVE_FALSA = "chave-secreta-falsa-para-teste-1234567890";

const fetchReal = globalThis.fetch;
const consoleErrorReal = console.error;
const ambienteOriginal = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
};

let servidor;
let base;
let tabela; // normalized_nickname → linha
let chamadas; // pedidos que chegaram ao Supabase falso
let modo; // "normal" | "erro500" | "rede" | "tempo-esgotado" | "json-invalido" | "sem-autorizacao" | "sem-permissao"
let logs; // tudo que o servidor escreveu em console.error

function responderFalso(status, corpo) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Imita o PostgREST para a tabela players. A inserção é atômica, como a
// restrição UNIQUE do banco: o segundo INSERT do mesmo apelido normalizado é
// ignorado (corpo vazio), e é isso que o servidor precisa tratar.
async function supabaseFalso(entrada, opcoes = {}) {
  const endereco = new URL(typeof entrada === "string" ? entrada : entrada.url);
  const cabecalhos = new Headers(opcoes.headers);
  chamadas.push({
    metodo: opcoes.method || "GET",
    caminho: endereco.pathname,
    consulta: endereco.searchParams,
    cabecalhos,
    corpo: opcoes.body ? JSON.parse(opcoes.body) : null,
  });

  // Dá chance de outros pedidos entrarem no meio (concorrência de verdade).
  await new Promise((resolve) => setImmediate(resolve));

  if (modo === "rede") {
    throw new TypeError("fetch failed");
  }
  if (modo === "tempo-esgotado") {
    throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
  }
  if (modo === "erro500") {
    return responderFalso(500, { message: `falha interna em ${URL_FALSA} com ${CHAVE_FALSA}` });
  }
  if (modo === "sem-permissao") {
    // Corpo no formato do PostgREST; a mensagem contém dados que NÃO podem ir para o log.
    return responderFalso(401, { code: "42501", message: `permission denied (${CHAVE_FALSA}) apelido-secreto` });
  }
  if (modo === "json-invalido") {
    return new Response("<html>não é json</html>", { status: 200 });
  }
  if (
    modo === "sem-autorizacao" ||
    cabecalhos.get("apikey") !== process.env.SUPABASE_SECRET_KEY ||
    cabecalhos.get("authorization") !== `Bearer ${process.env.SUPABASE_SECRET_KEY}`
  ) {
    return responderFalso(401, { message: "Invalid API key" });
  }
  if (endereco.pathname !== "/rest/v1/players") {
    return responderFalso(404, { message: "tabela inexistente" });
  }

  if ((opcoes.method || "GET") === "GET") {
    const filtro = endereco.searchParams.get("normalized_nickname") || "";
    const linha = tabela.get(filtro.replace(/^eq\./, ""));
    return responderFalso(200, linha ? [{ id: linha.id, nickname: linha.nickname, avatar: linha.avatar }] : []);
  }

  const corpo = JSON.parse(opcoes.body);
  if (tabela.has(corpo.normalized_nickname)) {
    return responderFalso(201, []); // duplicado ignorado
  }
  const linha = { id: crypto.randomUUID(), ...corpo };
  tabela.set(corpo.normalized_nickname, linha);
  return responderFalso(201, [{ id: linha.id, nickname: linha.nickname, avatar: linha.avatar }]);
}

before(async () => {
  globalThis.fetch = (entrada, opcoes) => {
    const endereco = typeof entrada === "string" ? entrada : entrada.url;
    return endereco.startsWith(URL_FALSA) ? supabaseFalso(entrada, opcoes) : fetchReal(entrada, opcoes);
  };
  console.error = (...argumentos) => {
    logs.push(argumentos.map(String).join(" "));
  };

  servidor = criarServidor();
  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => {
  servidor.close();
  globalThis.fetch = fetchReal;
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
  tabela = new Map();
  chamadas = [];
  logs = [];
  modo = "normal";
  process.env.SUPABASE_URL = URL_FALSA;
  process.env.SUPABASE_SECRET_KEY = CHAVE_FALSA;
});

function postJson(caminho, corpo) {
  return fetchReal(base + caminho, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
}

function nadaVazou(texto) {
  return !texto.includes(CHAVE_FALSA) && !texto.includes("projeto-falso");
}

test("jogador novo: consulta não grava; criação devolve 201 e grava no formato da tabela", async () => {
  const consulta = await postJson("/api/jogadores/verificar", { apelido: "  Leão   Azul " });
  assert.equal(consulta.status, 200);
  assert.deepEqual(await consulta.json(), { existe: false, apelido: "Leão Azul" });
  assert.equal(tabela.size, 0);
  assert.deepEqual(chamadas.map((c) => c.metodo), ["GET"]);

  const criacao = await postJson("/api/jogadores", { apelido: "Leão Azul", avatar: "outro" });
  assert.equal(criacao.status, 201);
  const corpo = await criacao.json();
  assert.equal(corpo.criado, true);
  assert.equal(corpo.temporario, undefined); // o marcador do armazenamento temporário não existe mais
  assert.deepEqual(Object.keys(corpo.jogador).sort(), ["apelido", "avatar", "id"]);
  assert.equal(corpo.jogador.apelido, "Leão Azul");
  assert.equal(corpo.jogador.avatar, "padrao"); // avatar enviado pelo navegador é ignorado

  assert.equal(tabela.size, 1);
  const gravado = [...tabela.values()][0];
  assert.equal(gravado.nickname, "Leão Azul");
  assert.equal(gravado.normalized_nickname, "leaoazul");
  assert.equal(gravado.avatar, "padrao");
  assert.equal(corpo.jogador.id, gravado.id);
});

test("o pedido ao Supabase usa upsert que ignora duplicados e a chave só nos cabeçalhos", async () => {
  await postJson("/api/jogadores", { apelido: "Gato Feliz" });
  const insercao = chamadas.find((c) => c.metodo === "POST");
  assert.equal(insercao.caminho, "/rest/v1/players");
  assert.equal(insercao.consulta.get("on_conflict"), "normalized_nickname");
  assert.match(insercao.cabecalhos.get("prefer"), /resolution=ignore-duplicates/);
  assert.match(insercao.cabecalhos.get("prefer"), /return=representation/);
  assert.deepEqual(Object.keys(insercao.corpo).sort(), ["avatar", "nickname", "normalized_nickname"]);
  for (const chamada of chamadas) {
    assert.ok(!chamada.consulta.toString().includes(CHAVE_FALSA), "a chave não pode ir na URL");
  }
});

test("jogador existente é recuperado: mesmo id, mesma grafia, sem duplicata", async () => {
  const primeiro = await (await postJson("/api/jogadores", { apelido: "Leão Azul" })).json();

  for (const variacao of ["leao azul", "LEÃO  AZUL", "leaoazul", "  Léao   Âzul "]) {
    const consulta = await (await postJson("/api/jogadores/verificar", { apelido: variacao })).json();
    assert.equal(consulta.existe, true, variacao);
    assert.deepEqual(consulta.jogador, primeiro.jogador, variacao);

    const recuperacao = await postJson("/api/jogadores", { apelido: variacao });
    assert.equal(recuperacao.status, 200, variacao);
    const corpo = await recuperacao.json();
    assert.equal(corpo.criado, false);
    assert.deepEqual(corpo.jogador, primeiro.jogador); // vale a grafia do primeiro cadastro
  }
  assert.equal(tabela.size, 1);
});

test("20 cadastros simultâneos do mesmo apelido criam um único jogador", async () => {
  const variacoes = ["Teste Corrida", "teste corrida", "TESTE CORRIDA", " Tésté Córrida ", "testecorrida"];
  const respostas = await Promise.all(
    Array.from({ length: 20 }, (_, i) => postJson("/api/jogadores", { apelido: variacoes[i % variacoes.length] }))
  );
  const corpos = await Promise.all(respostas.map((r) => r.json()));

  assert.equal(tabela.size, 1);
  assert.equal(respostas.filter((r) => r.status === 201).length, 1);
  assert.equal(respostas.filter((r) => r.status === 200).length, 19);
  assert.equal(new Set(corpos.map((c) => c.jogador.id)).size, 1);
  assert.equal(corpos.filter((c) => c.criado).length, 1);
});

test("apelidos diferentes criam jogadores diferentes", async () => {
  const a = await (await postJson("/api/jogadores", { apelido: "Gato Preto" })).json();
  const b = await (await postJson("/api/jogadores", { apelido: "Gato Branco" })).json();
  assert.notEqual(a.jogador.id, b.jogador.id);
  assert.equal(tabela.size, 2);
});

test("apelido inválido ou não permitido: 422 sem sequer chamar o Supabase", async () => {
  // Mesmo com a configuração ausente: a validação vem antes de qualquer acesso ao banco.
  delete process.env.SUPABASE_URL;
  for (const apelido of ["", "ab", "a".repeat(21), "😀😀😀", "12345678", "P0rr4", "ADM01"]) {
    for (const caminho of ["/api/jogadores/verificar", "/api/jogadores"]) {
      const resposta = await postJson(caminho, { apelido });
      assert.equal(resposta.status, 422, `${caminho} ${apelido}`);
      const corpo = await resposta.json();
      assert.match(corpo.erro, /^APELIDO_/);
    }
  }
  assert.equal(chamadas.length, 0);
  assert.equal(tabela.size, 0);
  assert.equal(logs.length, 0);
});

test("configuração ausente ou insegura: 503 amigável, sem chamar a rede", async () => {
  const casos = [
    () => delete process.env.SUPABASE_URL,
    () => delete process.env.SUPABASE_SECRET_KEY,
    () => { process.env.SUPABASE_URL = "   "; },
    () => { process.env.SUPABASE_URL = "http://projeto-falso.supabase.test"; }, // sem HTTPS
    () => { process.env.SUPABASE_URL = "isto não é uma url"; },
  ];

  for (const [indice, quebrar] of casos.entries()) {
    quebrar();
    logs = [];
    for (const [caminho, corpoPedido] of [
      ["/api/jogadores/verificar", { apelido: "Gato Feliz" }],
      ["/api/jogadores", { apelido: "Gato Feliz" }],
    ]) {
      const resposta = await postJson(caminho, corpoPedido);
      assert.equal(resposta.status, 503, `caso ${indice} ${caminho}`);
      assert.deepEqual(await resposta.json(), {
        erro: "SERVICO_INDISPONIVEL",
        mensagem: "Não conseguimos conectar agora. Tente de novo!",
      });
    }
    assert.ok(logs.length > 0, `caso ${indice}: o servidor deve registrar o motivo`);
    assert.ok(logs.every(nadaVazou), "o log não pode conter chave nem endereço");
    process.env.SUPABASE_URL = URL_FALSA;
    process.env.SUPABASE_SECRET_KEY = CHAVE_FALSA;
  }
  assert.equal(chamadas.length, 0);
});

test("falhas do Supabase viram 503 e não vazam chave nem endereço", async () => {
  for (const falha of ["rede", "tempo-esgotado", "erro500", "json-invalido", "sem-autorizacao", "sem-permissao"]) {
    modo = falha;
    logs = [];
    for (const [caminho, corpoPedido] of [
      ["/api/jogadores/verificar", { apelido: "Gato Feliz" }],
      ["/api/jogadores", { apelido: "Gato Feliz" }],
    ]) {
      const resposta = await postJson(caminho, corpoPedido);
      const texto = await resposta.text();
      assert.equal(resposta.status, 503, `${falha} ${caminho}`);
      assert.equal(JSON.parse(texto).erro, "SERVICO_INDISPONIVEL");
      assert.ok(nadaVazou(texto), `${falha}: a resposta não pode conter chave nem endereço`);
    }
    assert.ok(logs.length > 0, `${falha}: o servidor deve registrar a falha`);
    assert.ok(logs.every(nadaVazou), `${falha}: o log não pode conter chave nem endereço`);
  }
  assert.equal(tabela.size, 0);
});

test("o servidor se recupera: depois da falha, o mesmo pedido funciona", async () => {
  modo = "rede";
  assert.equal((await postJson("/api/jogadores", { apelido: "Gato Feliz" })).status, 503);
  modo = "normal";
  const resposta = await postJson("/api/jogadores", { apelido: "Gato Feliz" });
  assert.equal(resposta.status, 201);
  assert.equal(tabela.size, 1);
});

test("a resposta de sucesso não contém a chave nem o endereço do Supabase", async () => {
  const texto = await (await postJson("/api/jogadores", { apelido: "Gato Feliz" })).text();
  assert.ok(nadaVazou(texto));
});

test("o código do navegador não conhece a chave do Supabase", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const arquivos = [
    path.join(__dirname, "..", "index.html"),
    path.join(__dirname, "..", "fase1.html"),
    ...fs.readdirSync(path.join(__dirname, "..", "js")).filter((f) => f.endsWith(".js")).map((f) => path.join(__dirname, "..", "js", f)),
  ];
  for (const arquivo of arquivos) {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    assert.ok(!/SUPABASE|supabase\.co|service_role|sb_secret_/i.test(conteudo), `${path.basename(arquivo)} menciona Supabase ou chave`);
  }
});

test("espaços de qualquer tipo no apelido recuperam o mesmo jogador e nunca chegam ao banco", async () => {
  const primeiro = await (await postJson("/api/jogadores", { apelido: "Ana Clara" })).json();
  const variacoes = [
    "Ana Clara", // espaço não separável
    "Ana	Clara", // tab
    "Ana　Clara", // espaço ideográfico
    "Ana Clara", // espaço largo
    "  ANA   CLARA  ",
    "anaclara",
    "Âna Clára",
  ];
  for (const apelido of variacoes) {
    const resposta = await postJson("/api/jogadores", { apelido });
    assert.equal(resposta.status, 200, JSON.stringify(apelido));
    assert.deepEqual((await resposta.json()).jogador, primeiro.jogador, JSON.stringify(apelido));
  }
  assert.equal(tabela.size, 1);
  assert.equal([...tabela.keys()][0], "anaclara");
  // Tudo que foi enviado ao banco como valor normalizado está no formato obrigatório.
  const enviados = chamadas.filter((c) => c.corpo).map((c) => c.corpo.normalized_nickname);
  assert.ok(enviados.length > 0 && enviados.every((v) => /^[a-z0-9]{3,20}$/.test(v)), JSON.stringify(enviados));
});

test("chave publicável ou anon no lugar da secreta é recusada, sem chamar a rede", async () => {
  const jwt = (papel) =>
    ["eyJhbGciOiJIUzI1NiJ9", Buffer.from(JSON.stringify({ role: papel })).toString("base64url"), "assinatura"].join(".");
  const publicas = ["sb_publishable_chave-falsa-1234567890abcdef", jwt("anon")];

  for (const chave of publicas) {
    process.env.SUPABASE_SECRET_KEY = chave;
    logs = [];
    for (const [caminho, corpoPedido] of [
      ["/api/jogadores/verificar", { apelido: "Gato Feliz" }],
      ["/api/jogadores", { apelido: "Gato Feliz" }],
    ]) {
      const resposta = await postJson(caminho, corpoPedido);
      assert.equal(resposta.status, 503, chave.slice(0, 12));
      assert.equal((await resposta.json()).erro, "SERVICO_INDISPONIVEL");
    }
    assert.ok(logs.some((l) => l.includes("PUBLICÁVEL")), "o log deve explicar o motivo");
    assert.ok(logs.every((l) => !l.includes(chave)), "o log não pode conter a chave");
  }
  assert.equal(chamadas.length, 0);
  assert.equal(tabela.size, 0);

  // As chaves legítimas continuam funcionando: sb_secret_ e JWT service_role.
  for (const chave of ["sb_secret_chave-falsa-1234567890abcdef", jwt("service_role")]) {
    process.env.SUPABASE_SECRET_KEY = chave;
    assert.equal((await postJson("/api/jogadores/verificar", { apelido: "Gato Feliz" })).status, 200, chave.slice(0, 12));
  }
});

test("o log de falha traz só o código curto do erro, nunca a mensagem do banco", async () => {
  modo = "sem-permissao";
  const resposta = await postJson("/api/jogadores", { apelido: "Gato Feliz" });
  assert.equal(resposta.status, 503);
  assert.ok(logs.some((l) => l.includes("42501")), "o código do erro deve aparecer no log");
  assert.ok(logs.every((l) => !l.includes("apelido-secreto") && !l.includes(CHAVE_FALSA)));
});

test("apelido normalizado fora do formato nunca é enviado ao banco (defesa em profundidade)", async () => {
  const supabase = require("../api/_lib/supabase");
  for (const valor of ["ana clara", "AnaClara", "an", "a".repeat(21), "ana_clara", "", undefined, 123]) {
    await assert.rejects(
      () => supabase.criarOuRecuperar("Ana Clara", valor),
      (erro) => erro.status === 500 && erro.codigo === "ERRO_INTERNO",
      String(valor)
    );
    await assert.rejects(() => supabase.buscarPorApelidoNormalizado(valor), (erro) => erro.status === 500, String(valor));
  }
  assert.equal(chamadas.length, 0);
  assert.ok(logs.length > 0);
});
