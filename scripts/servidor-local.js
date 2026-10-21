/**
 * @file servidor-local.js
 * @description Servidor de DESENVOLVIMENTO: roda o jogo e a pasta api/ no
 * próprio computador, sem conta na Vercel e sem dependências externas.
 * Não é usado em produção.
 *
 * Uso (na raiz do projeto):
 *   node scripts/servidor-local.js
 *   → abra http://localhost:3000
 *
 * Para a identificação do jogador funcionar, o servidor precisa das variáveis
 * SUPABASE_URL e SUPABASE_SECRET_KEY. Elas ficam em .env.local (fora do git):
 *   node --env-file=.env.local scripts/servidor-local.js
 *
 * ⚠️ Com o .env.local configurado, os jogadores criados aqui (e, com
 * PLAYER_SESSION_SECRET, as fases concluídas) são gravados no banco REAL do
 * Supabase configurado nele — não é um ambiente de teste.
 *
 * Variáveis opcionais: PORTA (padrão 3000) e HOST (padrão 127.0.0.1 — só este
 * computador).
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const PASTA_API = path.join(RAIZ, "api");

const TIPOS_DE_ARQUIVO = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function responderJson(res, status, corpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(corpo));
}

function responderTexto(res, status, texto) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(texto);
}

/**
 * /api/jogadores/verificar → api/jogadores/verificar.js
 * /api/jogadores           → api/jogadores.js ou api/jogadores/index.js
 *
 * Mesma regra da Vercel: arquivos e pastas que começam com "_" (como
 * api/_lib) não viram rota.
 */
async function tratarApi(req, res, caminho) {
  const segmentos = caminho.split("/").filter(Boolean).slice(1);

  if (segmentos.length === 0 || segmentos.some((segmento) => !/^[a-z0-9-]+$/.test(segmento))) {
    responderJson(res, 404, { erro: "NAO_ENCONTRADO", mensagem: "Endpoint não encontrado." });
    return;
  }

  const candidatos = [
    path.join(PASTA_API, ...segmentos) + ".js",
    path.join(PASTA_API, ...segmentos, "index.js"),
  ];
  const arquivo = candidatos.find((candidato) => fs.existsSync(candidato) && fs.statSync(candidato).isFile());

  if (!arquivo) {
    responderJson(res, 404, { erro: "NAO_ENCONTRADO", mensagem: "Endpoint não encontrado." });
    return;
  }

  try {
    await require(arquivo)(req, res);
  } catch (erro) {
    console.error("[servidor-local] Erro no endpoint:", erro);
    if (!res.headersSent) {
      responderJson(res, 500, { erro: "ERRO_INTERNO", mensagem: "Algo deu errado. Tente de novo." });
    }
  }
}

/**
 * Lê o cabeçalho Range ("bytes=inicio-fim"). A trilha sonora usa loop e
 * volta ao início pelo currentTime, e o navegador precisa de respostas
 * parciais (206) para isso funcionar sem cortes.
 */
function lerIntervalo(cabecalho, tamanho) {
  const partes = /^bytes=(\d*)-(\d*)$/.exec(String(cabecalho || "").trim());
  if (!partes || (partes[1] === "" && partes[2] === "")) {
    return null;
  }

  let inicio;
  let fim;
  if (partes[1] === "") {
    // "bytes=-500" → os últimos 500 bytes
    inicio = Math.max(0, tamanho - Number(partes[2]));
    fim = tamanho - 1;
  } else {
    inicio = Number(partes[1]);
    fim = partes[2] === "" ? tamanho - 1 : Math.min(Number(partes[2]), tamanho - 1);
  }

  if (inicio >= tamanho || inicio > fim) {
    return "invalido";
  }
  return { start: inicio, end: fim };
}

function servirArquivo(req, res, caminho) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    responderTexto(res, 405, "Método não permitido.");
    return;
  }

  let relativo;
  try {
    relativo = decodeURIComponent(caminho);
  } catch (erro) {
    responderTexto(res, 400, "Endereço inválido.");
    return;
  }
  if (relativo.endsWith("/")) {
    relativo += "index.html";
  }

  // Bloqueia arquivos ocultos (.env.local, .git...), barras invertidas e o
  // código da pasta api/, que não deve ser entregue como arquivo.
  const segmentos = relativo.split("/").filter(Boolean);
  const bloqueado =
    segmentos.some((segmento) => segmento.startsWith(".") || segmento.includes("\\") || segmento.includes("\0")) ||
    segmentos[0] === "api";
  const absoluto = path.join(RAIZ, ...segmentos);

  if (bloqueado || !absoluto.startsWith(RAIZ + path.sep)) {
    responderTexto(res, 404, "Arquivo não encontrado.");
    return;
  }

  fs.stat(absoluto, (erro, info) => {
    if (erro || !info.isFile()) {
      responderTexto(res, 404, "Arquivo não encontrado.");
      return;
    }

    const intervalo = lerIntervalo(req.headers.range, info.size);
    if (intervalo === "invalido") {
      res.setHeader("Content-Range", `bytes */${info.size}`);
      responderTexto(res, 416, "Intervalo inválido.");
      return;
    }

    res.setHeader("Content-Type", TIPOS_DE_ARQUIVO[path.extname(absoluto).toLowerCase()] || "application/octet-stream");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-cache");

    if (intervalo) {
      res.statusCode = 206;
      res.setHeader("Content-Range", `bytes ${intervalo.start}-${intervalo.end}/${info.size}`);
      res.setHeader("Content-Length", intervalo.end - intervalo.start + 1);
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Length", info.size);
    }

    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(absoluto, intervalo || undefined).pipe(res);
  });
}

function criarServidor() {
  return http.createServer((req, res) => {
    const caminho = new URL(req.url, "http://localhost").pathname;

    if (caminho === "/api" || caminho.startsWith("/api/")) {
      // Registra só método, caminho e status — nunca o corpo (pode conter apelidos).
      res.on("finish", () => console.log(`[api] ${req.method} ${caminho} → ${res.statusCode}`));
      tratarApi(req, res, caminho);
      return;
    }

    servirArquivo(req, res, caminho);
  });
}

function iniciar() {
  const porta = Number(process.env.PORTA) || 3000;
  const host = process.env.HOST || "127.0.0.1";
  const servidor = criarServidor();

  servidor.on("error", (erro) => {
    if (erro.code === "EADDRINUSE") {
      console.error(`A porta ${porta} já está em uso. Tente outra, por exemplo: PORTA=3001`);
    } else {
      console.error(erro);
    }
    process.exitCode = 1;
  });

  servidor.listen(porta, host, () => {
    const endereco = host === "127.0.0.1" ? "localhost" : host;
    console.log("Arruma a Bagunça — servidor local");
    console.log(`  Jogo: http://${endereco}:${porta}`);
    // Só informa se está configurado; nunca imprime os valores.
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
      console.log("  Supabase: configurado — os jogadores criados são gravados no banco.");
    } else {
      console.log("  ⚠ Supabase NÃO configurado: a identificação mostrará \"Não conseguimos conectar\".");
      console.log("    Rode: node --env-file=.env.local scripts/servidor-local.js");
    }
    if (process.env.PLAYER_SESSION_SECRET) {
      console.log("  Sessão do jogador: configurada — o progresso é salvo no banco.");
    } else {
      console.log("  ⚠ PLAYER_SESSION_SECRET NÃO configurado: o progresso fica só no navegador.");
    }
    console.log("  Ctrl+C para parar.");
  });
}

if (require.main === module) {
  iniciar();
}

module.exports = { criarServidor };
