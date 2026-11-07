// Testes dos caminhos e arquivos de áudio (js/audio.js).
// Garante que todas as referências de áudio (narrações, efeitos e trilhas)
// correspondam exatamente aos arquivos versionados, respeitando maiúsculas/minúsculas,
// acentuação, espaços e extensões para evitar falhas em sistemas Linux (como a hospedagem na Vercel).

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const RAIZ = path.resolve(__dirname, "..");

/**
 * Confere a existência exata do caminho no sistema de arquivos,
 * comparando segmento por segmento com readdirSync para garantir
 * sensibilidade a maiúsculas/minúsculas mesmo no Windows.
 */
function existeComExatidao(caminhoRelativo) {
  const segmentos = caminhoRelativo.split(/[\\\/]/).filter(Boolean);
  let atual = RAIZ;
  for (const segmento of segmentos) {
    let entradas;
    try {
      entradas = fs.readdirSync(atual);
    } catch {
      return false;
    }
    if (!entradas.includes(segmento)) {
      return false;
    }
    atual = path.join(atual, segmento);
  }
  return true;
}

/**
 * Extrai os caminhos de áudio literais configurados em js/audio.js
 */
function extrairCaminhosDeAudio() {
  const conteudo = fs.readFileSync(path.join(RAIZ, "js", "audio.js"), "utf8");
  const regex = /"(assets\/audio\/[^"]+)"/g;
  const caminhos = [];
  let match;
  while ((match = regex.exec(conteudo)) !== null) {
    const caminho = match[1];
    // Ignora prefixos genéricos ou fallbacks usados em verificações defensivas
    if (caminho !== "assets/audio/Efeitos/FaseConcluida.wav" && caminho !== "assets/audio/Mundos/") {
      caminhos.push(caminho);
    }
  }
  return caminhos;
}

test("todas as referências de narração em js/audio.js correspondem exatamente aos arquivos existentes", () => {
  const caminhos = extrairCaminhosDeAudio();
  const narracoes = caminhos.filter((c) => c.toLowerCase().includes("narra"));

  assert.ok(narracoes.length >= 16, "deve encontrar as 16 narrações mapeadas");

  for (const caminho of narracoes) {
    assert.ok(
      caminho.startsWith("assets/audio/narração/"),
      `o caminho da narração deve usar 'narração' minúsculo: ${caminho}`
    );
    assert.equal(
      existeComExatidao(caminho),
      true,
      `o arquivo de áudio deve existir com a mesma grafia e maiúsculas/minúsculas: ${caminho}`
    );
  }
});

test("todas as referências de efeitos e trilhas em js/audio.js existem com grafia exata", () => {
  const caminhos = extrairCaminhosDeAudio();
  const outros = caminhos.filter((c) => !c.toLowerCase().includes("narra"));

  assert.ok(outros.length > 0, "deve encontrar trilhas e efeitos sonoros");

  for (const caminho of outros) {
    assert.equal(
      existeComExatidao(caminho),
      true,
      `o arquivo de áudio deve existir com a mesma grafia e maiúsculas/minúsculas: ${caminho}`
    );
  }
});

test("caminhos de áudio conferem com os arquivos rastreados no Git (quando disponível)", () => {
  let arquivosGit;
  try {
    const saida = cp.execSync("git -c core.quotepath=false ls-files assets/audio", {
      cwd: RAIZ,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    arquivosGit = new Set(saida.split(/\r?\n/).filter(Boolean));
  } catch {
    // Se o Git não estiver disponível no ambiente, ignora esta etapa
    return;
  }

  const caminhos = extrairCaminhosDeAudio();
  for (const caminho of caminhos) {
    assert.equal(
      arquivosGit.has(caminho),
      true,
      `o caminho '${caminho}' deve constar com a mesma grafia no índice do Git`
    );
  }
});

