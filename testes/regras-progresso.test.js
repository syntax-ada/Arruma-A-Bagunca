// Testes das regras de progressão compartilhadas (js/regras-progresso.js):
// catálogo das 13 fases, sequência, repetição e o objeto que o menu usa.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Regras = require("../js/regras-progresso.js");

const TODAS = ["1-1", "1-2", "1-3", "2-1", "2-2", "2-3", "3-1", "3-2", "3-3", "4-1", "4-2", "4-3", "5-1"];

test("o catálogo tem as 13 fases oficiais: Mundos 1 a 4 com 3 fases e o Mundo 5 (bônus) com 1", () => {
  assert.deepEqual([...Regras.ORDEM_DAS_FASES], TODAS);
});

test("o catálogo bate com os arquivos de js/mundos/", () => {
  const pasta = path.join(__dirname, "..", "js", "mundos");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const arquivo of fs.readdirSync(pasta).filter((f) => /^mundo\d+\.js$/.test(f)).sort()) {
    vm.runInContext(fs.readFileSync(path.join(pasta, arquivo), "utf8"), sandbox);
  }
  const doJogo = {};
  for (const mundo of Object.values(sandbox.window.MUNDOS)) {
    doJogo[mundo.id] = mundo.totalFases;
  }
  assert.deepEqual(doJogo, { ...Regras.TOTAL_FASES_POR_MUNDO });
});

test("ids válidos e inválidos", () => {
  assert.deepEqual(Regras.lerIdDaFase("2-3"), { mundo: 2, fase: 3 });
  assert.deepEqual(Regras.lerIdDaFase("5-1"), { mundo: 5, fase: 1 });
  for (const invalido of ["1-99", "1-4", "5-2", "6-1", "0-1", "1-0", "11", "1_1", " 1-1", "1-1 ", "", null, undefined, 11, {}, ["1-1"]]) {
    assert.equal(Regras.lerIdDaFase(invalido), null, JSON.stringify(invalido));
    assert.equal(Regras.faseExiste(invalido), false);
  }
});

test("normalizarLista descarta lixo, remove repetição e ordena", () => {
  assert.deepEqual(Regras.normalizarLista(["2-1", "1-1", "1-99", 5, null, "1-1", "6-1", "1-2"]), ["1-1", "1-2", "2-1"]);
  assert.deepEqual(Regras.normalizarLista("1-1"), []);
  assert.deepEqual(Regras.normalizarLista(undefined), []);
});

test("derivarProgresso reproduz o formato antigo do menu, passo a passo", () => {
  assert.deepEqual(Regras.derivarProgresso([]), {
    mundosDesbloqueados: [1],
    faseMaximaPorMundo: { 1: 1 },
    fasesConcluidas: [],
  });
  assert.deepEqual(Regras.derivarProgresso(["1-1"]).faseMaximaPorMundo, { 1: 2 });
  assert.deepEqual(Regras.derivarProgresso(["1-1", "1-2", "1-3"]), {
    mundosDesbloqueados: [1, 2],
    faseMaximaPorMundo: { 1: 3, 2: 1 },
    fasesConcluidas: ["1-1", "1-2", "1-3"],
  });
  // Mundo 4 completo libera a fase bônus (Mundo 5).
  assert.deepEqual(Regras.derivarProgresso(TODAS.slice(0, 12)).mundosDesbloqueados, [1, 2, 3, 4, 5]);
});

test("depois da fase bônus não existe Mundo 6", () => {
  const progresso = Regras.derivarProgresso(TODAS);
  assert.deepEqual(progresso.mundosDesbloqueados, [1, 2, 3, 4, 5]);
  assert.deepEqual(progresso.faseMaximaPorMundo, { 1: 3, 2: 3, 3: 3, 4: 3, 5: 1 });
  assert.equal(Regras.proximaFase(TODAS), null);
});

test("fase concluída fora de ordem não libera nada", () => {
  // Ex.: alguém abriu fase1.html?mundo=4&fase=3 pela URL.
  const progresso = Regras.derivarProgresso(["4-3"]);
  assert.deepEqual(progresso.mundosDesbloqueados, [1]);
  assert.deepEqual(progresso.faseMaximaPorMundo, { 1: 1 });
  assert.deepEqual(Regras.fasesEmSequencia(["1-1", "1-2", "2-1"]), ["1-1", "1-2"]);
});

test("avaliarNovasConclusoes: sequência válida, fora de ordem, inexistente e repetida", () => {
  assert.deepEqual(Regras.avaliarNovasConclusoes([], ["1-1"]), { aceitas: ["1-1"], repetidas: [], recusadas: [] });

  // Em lote, a ordem do pedido não importa: vale a ordem oficial.
  assert.deepEqual(Regras.avaliarNovasConclusoes([], ["1-3", "1-1", "1-2"]).aceitas, ["1-1", "1-2", "1-3"]);

  assert.deepEqual(Regras.avaliarNovasConclusoes([], ["2-1"]), {
    aceitas: [],
    repetidas: [],
    recusadas: [{ fase: "2-1", motivo: "FORA_DE_ORDEM" }],
  });
  assert.deepEqual(Regras.avaliarNovasConclusoes(["1-1"], ["1-1"]), { aceitas: [], repetidas: ["1-1"], recusadas: [] });

  const misto = Regras.avaliarNovasConclusoes(["1-1"], ["1-1", "1-2", "1-2", "1-99", "3-1", 7]);
  assert.deepEqual(misto.aceitas, ["1-2"]);
  assert.deepEqual(misto.repetidas.sort(), ["1-1", "1-2"]);
  assert.deepEqual(misto.recusadas, [
    { fase: "1-99", motivo: "FASE_INEXISTENTE" },
    { fase: "7", motivo: "FASE_INEXISTENTE" },
    { fase: "3-1", motivo: "FORA_DE_ORDEM" },
  ]);

  // A fase bônus exige o Mundo 4 completo.
  assert.equal(Regras.avaliarNovasConclusoes(TODAS.slice(0, 11), ["5-1"]).recusadas[0].motivo, "FORA_DE_ORDEM");
  assert.deepEqual(Regras.avaliarNovasConclusoes(TODAS.slice(0, 12), ["5-1"]).aceitas, ["5-1"]);
});
