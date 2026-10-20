// Testes do servidor local (scripts/servidor-local.js) e dos endpoints de
// jogadores com o armazenamento TEMPORÁRIO. Sobe o servidor numa porta livre.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { criarServidor } = require("../scripts/servidor-local");

let servidor;
let base;

before(async () => {
  servidor = criarServidor();
  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => {
  servidor.close();
});

function postJson(caminho, corpo, cabecalhos = { "Content-Type": "application/json" }) {
  return fetch(base + caminho, {
    method: "POST",
    headers: cabecalhos,
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

// O fetch normaliza "../" e "%2e%2e" antes de enviar; aqui o caminho vai exatamente como escrito.
function getCru(caminho) {
  return new Promise((resolve, reject) => {
    const { port } = servidor.address();
    const pedido = http.request({ host: "127.0.0.1", port, path: caminho, method: "GET" }, (resposta) => {
      resposta.resume();
      resposta.on("end", () => resolve(resposta.statusCode));
    });
    pedido.on("error", reject);
    pedido.end();
  });
}

test("serve a página inicial e os scripts do jogo", async () => {
  const pagina = await fetch(`${base}/`);
  assert.equal(pagina.status, 200);
  assert.match(pagina.headers.get("content-type"), /text\/html/);
  const html = await pagina.text();
  assert.match(html, /id="tela-identificacao"/);
  assert.match(html, /<script src="js\/jogador.js"><\/script>\s*<script src="js\/menu.js">/);

  const script = await fetch(`${base}/js/menu.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);

  const fase = await fetch(`${base}/fase1.html?mundo=1&fase=1`);
  assert.equal(fase.status, 200);
});

test("serve arquivos com espaço e acento no nome", async () => {
  const imagem = await fetch(`${base}/assets/images/nova_tela_menu%20de_fases/mundo_1.png`);
  assert.equal(imagem.status, 200);
  assert.equal(imagem.headers.get("content-type"), "image/png");

  const botao = await fetch(`${base}/assets/images/tela_inicial/bot%C3%A3o_fechar.png`);
  assert.equal(botao.status, 200);
});

test("responde intervalos (Range) para a trilha sonora", async () => {
  const caminho = "/assets/audio/Mundos/Menu%20Principal.mp3";
  const parcial = await fetch(base + caminho, { headers: { Range: "bytes=0-99" } });
  assert.equal(parcial.status, 206);
  assert.equal(parcial.headers.get("content-length"), "100");
  assert.match(parcial.headers.get("content-range"), /^bytes 0-99\/\d+$/);
  assert.equal((await parcial.arrayBuffer()).byteLength, 100);

  const invalido = await fetch(base + caminho, { headers: { Range: "bytes=999999999-" } });
  assert.equal(invalido.status, 416);
});

test("não entrega arquivos ocultos, código da API nem caminhos fora do projeto", async () => {
  for (const caminho of [
    "/.gitignore",
    "/.env.example",
    "/.git/config",
    "/%2e%2e/%2e%2e/Windows/win.ini",
    "/js/..%5c..%5cREADME.md",
    "/js/%2e%2e%2f%2e%2e%2fREADME.md",
    "/api",
    "/api/_lib/http.js",
    "/nao-existe.html",
  ]) {
    assert.equal(await getCru(caminho), 404, caminho);
  }
});

test("rotas da API: _lib não vira rota e endpoint inexistente dá 404 em JSON", async () => {
  for (const caminho of ["/api/_lib/http", "/api/_lib/apelido", "/api/nao-existe", "/api/jogadores/../_lib/http"]) {
    const resposta = await postJson(caminho, { apelido: "teste" });
    assert.equal(resposta.status, 404, caminho);
  }
});

test("erros HTTP: método, tipo de conteúdo, JSON inválido, campo ausente, corpo grande", async () => {
  const get = await fetch(`${base}/api/jogadores/verificar`);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("allow"), "POST");
  assert.equal((await get.json()).erro, "METODO_NAO_PERMITIDO");

  const semJson = await postJson("/api/jogadores/verificar", "apelido=ana", { "Content-Type": "text/plain" });
  assert.equal(semJson.status, 415);

  const jsonInvalido = await postJson("/api/jogadores/verificar", "{apelido:");
  assert.equal(jsonInvalido.status, 400);
  assert.equal((await jsonInvalido.json()).erro, "REQUISICAO_INVALIDA");

  const semCampo = await postJson("/api/jogadores/verificar", { nome: "ana" });
  assert.equal(semCampo.status, 400);

  const campoErrado = await postJson("/api/jogadores/verificar", { apelido: 123 });
  assert.equal(campoErrado.status, 400);

  const grande = await postJson("/api/jogadores/verificar", { apelido: "a".repeat(20000) });
  assert.equal(grande.status, 413);
});

test("erros de validação respondem 422 com mensagem para a criança", async () => {
  const curto = await postJson("/api/jogadores/verificar", { apelido: "ab" });
  assert.equal(curto.status, 422);
  assert.deepEqual(await curto.json(), {
    erro: "APELIDO_INVALIDO",
    mensagem: "Use de 3 a 20 letras ou números.",
    motivo: "TAMANHO",
  });

  const ofensivo = await postJson("/api/jogadores", { apelido: "P0rr4" });
  assert.equal(ofensivo.status, 422);
  const corpo = await ofensivo.json();
  assert.equal(corpo.erro, "APELIDO_NAO_PERMITIDO");
  assert.equal(corpo.motivo, undefined); // não revela qual regra bloqueou

  const reservado = await postJson("/api/jogadores", { apelido: "ADM01" });
  assert.equal(reservado.status, 422);
});

test("cadastro novo, recuperação e apelidos equivalentes", async () => {
  const consulta = await postJson("/api/jogadores/verificar", { apelido: "  Leão   Azul " });
  assert.equal(consulta.status, 200);
  assert.deepEqual(await consulta.json(), { existe: false, apelido: "Leão Azul" });

  // Consultar não grava nada
  const consultaDeNovo = await postJson("/api/jogadores/verificar", { apelido: "Leão Azul" });
  assert.equal((await consultaDeNovo.json()).existe, false);

  const criacao = await postJson("/api/jogadores", { apelido: "Leão Azul", avatar: "outro" });
  assert.equal(criacao.status, 201);
  const criado = await criacao.json();
  assert.equal(criado.criado, true);
  assert.equal(criado.temporario, true);
  assert.equal(criado.jogador.apelido, "Leão Azul");
  assert.equal(criado.jogador.avatar, "padrao"); // avatar enviado é ignorado

  for (const variacao of ["leao azul", "LEÃO  AZUL", "leaoazul"]) {
    const encontrado = await (await postJson("/api/jogadores/verificar", { apelido: variacao })).json();
    assert.equal(encontrado.existe, true, variacao);
    assert.deepEqual(encontrado.jogador, criado.jogador, variacao);

    const recuperacao = await postJson("/api/jogadores", { apelido: variacao });
    assert.equal(recuperacao.status, 200, variacao);
    const recuperado = await recuperacao.json();
    assert.equal(recuperado.criado, false);
    // A grafia exibida é a do primeiro cadastro
    assert.deepEqual(recuperado.jogador, criado.jogador);
  }
});

test("cadastros simultâneos do mesmo apelido criam um único jogador", async () => {
  const variacoes = ["Teste Corrida", "teste corrida", "TESTE CORRIDA", " Tésté Córrida ", "testecorrida"];
  const pedidos = Array.from({ length: 20 }, (_, i) => postJson("/api/jogadores", { apelido: variacoes[i % variacoes.length] }));
  const respostas = await Promise.all(pedidos);
  const corpos = await Promise.all(respostas.map((r) => r.json()));

  assert.equal(respostas.filter((r) => r.status === 201).length, 1);
  assert.equal(respostas.filter((r) => r.status === 200).length, 19);
  assert.equal(new Set(corpos.map((c) => c.jogador.id)).size, 1);
});

test("fora do servidor local o armazenamento temporário se recusa (503)", async () => {
  const valorAnterior = process.env.ARRUMA_SERVIDOR_LOCAL;
  delete process.env.ARRUMA_SERVIDOR_LOCAL;
  try {
    const consulta = await postJson("/api/jogadores/verificar", { apelido: "Gato Feliz" });
    assert.equal(consulta.status, 503);
    assert.equal((await consulta.json()).erro, "SERVICO_INDISPONIVEL");

    // A validação continua valendo antes de tudo
    const invalido = await postJson("/api/jogadores", { apelido: "ab" });
    assert.equal(invalido.status, 422);
  } finally {
    process.env.ARRUMA_SERVIDOR_LOCAL = valorAnterior;
  }
});
