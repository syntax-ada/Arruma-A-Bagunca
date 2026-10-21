// Testes do token da sessão do jogador (api/_lib/sessao-jogador.js), sem banco.
// A parte que consulta o banco (sessão revogada, expirada no banco, limite)
// está em testes/progresso-api.test.js. Os segredos abaixo são fictícios.

const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  criarSessaoJogador,
  criarTokenJogador,
  exigirSessaoJogador,
  lerTokenDoCabecalho,
  verificarTokenJogador,
} = require("../api/_lib/sessao-jogador");
const { criarTokenSessao } = require("../api/_lib/sessao-admin");

const SEGREDO = "segredo-de-jogador-falso-para-teste-0123456789";
const OUTRO_SEGREDO = "outro-segredo-de-jogador-falso-para-teste-987";
const SESSAO = "0b6f2a4e-1c3d-4e5f-8a9b-0c1d2e3f4a5b";
const ID = "3f2b8c1e-5d4a-4b6f-9e8d-7c6b5a4f3e2d";
const OUTRO_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const AGORA = 1_700_000_000_000;
const EXPIRA = AGORA + 12 * 60 * 60 * 1000;

const ambienteOriginal = {
  PLAYER_SESSION_SECRET: process.env.PLAYER_SESSION_SECRET,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
};

afterEach(() => {
  for (const [nome, valor] of Object.entries(ambienteOriginal)) {
    if (valor === undefined) {
      delete process.env[nome];
    } else {
      process.env[nome] = valor;
    }
  }
});

async function capturarErros(funcao) {
  const original = console.error;
  const logs = [];
  console.error = (...partes) => logs.push(partes.join(" "));
  try {
    return { resultado: await funcao(), logs };
  } finally {
    console.error = original;
  }
}

test("token válido é aceito e devolve a sessão e o jogador", () => {
  const { token, expiraEm } = criarTokenJogador({ sessaoId: SESSAO, jogadorId: ID, expiraEm: EXPIRA }, SEGREDO);
  assert.equal(expiraEm, EXPIRA);
  assert.ok(token.startsWith(`${SESSAO}.${ID}.${EXPIRA}.`));
  assert.deepEqual(verificarTokenJogador(token, SEGREDO, { agora: AGORA + 1000 }), {
    valido: true,
    sessaoId: SESSAO,
    jogadorId: ID,
    expiraEm: EXPIRA,
  });
});

test("token expirado, adulterado, de outro segredo ou malformado é recusado", () => {
  const { token } = criarTokenJogador({ sessaoId: SESSAO, jogadorId: ID, expiraEm: EXPIRA }, SEGREDO);
  assert.equal(verificarTokenJogador(token, SEGREDO, { agora: EXPIRA }).motivo, "EXPIRADO");
  assert.equal(verificarTokenJogador(token, OUTRO_SEGREDO, { agora: AGORA }).motivo, "ASSINATURA_INVALIDA");

  const [sessao, , expira, assinatura] = token.split(".");
  // Trocar o jogador (tentar virar outra criança) invalida a assinatura.
  assert.equal(verificarTokenJogador(`${sessao}.${OUTRO_ID}.${expira}.${assinatura}`, SEGREDO, { agora: AGORA }).motivo, "ASSINATURA_INVALIDA");
  // Trocar a sessão também.
  assert.equal(verificarTokenJogador(`${OUTRO_ID}.${ID}.${expira}.${assinatura}`, SEGREDO, { agora: AGORA }).motivo, "ASSINATURA_INVALIDA");
  // Esticar a validade também.
  assert.equal(verificarTokenJogador(`${sessao}.${ID}.${Number(expira) + 1}.${assinatura}`, SEGREDO, { agora: AGORA }).motivo, "ASSINATURA_INVALIDA");

  for (const ruim of [undefined, "", "abc", `${sessao}.${ID}.${expira}`, `${ID}.${expira}.${assinatura}`, `x.${ID}.${expira}.${assinatura}`, `${sessao}.${ID}.amanha.${assinatura}`]) {
    assert.equal(verificarTokenJogador(ruim, SEGREDO, { agora: AGORA }).valido, false, String(ruim));
  }
});

test("token administrativo não vale como token de jogador", () => {
  const { token } = criarTokenSessao("ADM01", SEGREDO, { agora: AGORA });
  assert.equal(verificarTokenJogador(token, SEGREDO, { agora: AGORA }).valido, false);
});

test("segredo curto ou ausente e ids fora do formato são erros de programação", () => {
  assert.throws(() => criarTokenJogador({ sessaoId: SESSAO, jogadorId: ID, expiraEm: EXPIRA }, "curto"));
  assert.throws(() => verificarTokenJogador("x", undefined));
  assert.throws(() => criarTokenJogador({ sessaoId: "123", jogadorId: ID, expiraEm: EXPIRA }, SEGREDO));
  assert.throws(() => criarTokenJogador({ sessaoId: SESSAO, jogadorId: "123", expiraEm: EXPIRA }, SEGREDO));
  assert.throws(() => criarTokenJogador({ sessaoId: SESSAO, jogadorId: ID, expiraEm: 0 }, SEGREDO));
});

test("cabeçalho Authorization: só 'Bearer <token>' é lido", () => {
  assert.equal(lerTokenDoCabecalho("Bearer abc.def-ghi_1"), "abc.def-ghi_1");
  for (const ruim of [undefined, "", "abc", "Basic abc", "Bearer ", "Bearer a b", `Bearer ${"a".repeat(301)}`]) {
    assert.equal(lerTokenDoCabecalho(ruim), null, String(ruim));
  }
});

test("exigirSessaoJogador: token inválido → 401 sem consultar o banco; sem segredo próprio → 503", async () => {
  process.env.PLAYER_SESSION_SECRET = SEGREDO;
  process.env.ADMIN_SESSION_SECRET = OUTRO_SEGREDO;
  const fetchReal = globalThis.fetch;
  let chamouRede = false;
  globalThis.fetch = async () => {
    chamouRede = true;
    throw new Error("não deveria chamar a rede");
  };
  try {
    const deOutroSegredo = criarTokenJogador({ sessaoId: SESSAO, jogadorId: ID, expiraEm: Date.now() + 60000 }, OUTRO_SEGREDO).token;
    for (const cabecalho of [undefined, "Bearer lixo", `Bearer ${deOutroSegredo}`]) {
      await assert.rejects(
        () => exigirSessaoJogador({ headers: { authorization: cabecalho } }, "progressoConsultar"),
        (erro) => erro.status === 401 && erro.codigo === "NAO_AUTENTICADO"
      );
    }
    assert.equal(chamouRede, false, "token falso não chega ao banco nem ao limite");

    const valido = criarTokenJogador({ sessaoId: SESSAO, jogadorId: ID, expiraEm: Date.now() + 60000 }, SEGREDO).token;
    // Segredo ausente, curto ou IGUAL ao administrativo → serviço indisponível.
    for (const configurar of [
      () => delete process.env.PLAYER_SESSION_SECRET,
      () => { process.env.PLAYER_SESSION_SECRET = "curto"; },
      () => { process.env.PLAYER_SESSION_SECRET = OUTRO_SEGREDO; },
    ]) {
      configurar();
      const { logs } = await capturarErros(() =>
        assert.rejects(
          () => exigirSessaoJogador({ headers: { authorization: `Bearer ${valido}` } }, "progressoConsultar"),
          (erro) => erro.status === 503
        )
      );
      assert.ok(logs.some((l) => l.includes("PLAYER_SESSION_SECRET")));
      assert.ok(logs.every((l) => !l.includes(SEGREDO) && !l.includes(OUTRO_SEGREDO)), "o log não pode conter o segredo");
    }
    assert.equal(chamouRede, false);
  } finally {
    globalThis.fetch = fetchReal;
  }
});

test("criarSessaoJogador devolve null (sem lançar) quando o segredo não está configurado", async () => {
  delete process.env.PLAYER_SESSION_SECRET;
  const { resultado, logs } = await capturarErros(() => criarSessaoJogador(ID));
  assert.equal(resultado, null);
  assert.ok(logs.some((l) => l.includes("PLAYER_SESSION_SECRET")));
});
