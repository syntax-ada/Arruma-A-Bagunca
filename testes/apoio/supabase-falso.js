// Supabase SIMULADO para os testes (nada de rede real nem credenciais reais).
//
// Imita só o que api/_lib/supabase.js usa da API REST, com as mesmas regras
// das migrações em supabase/migrations/:
//   - players: normalized_nickname UNIQUE;
//   - phase_completions: chave primária (player_id, world, phase), chave
//     estrangeira para players e o CHECK das 13 fases;
//   - player_sessions: chave estrangeira para players; só revoked_at muda;
//   - rpc/consumir_limite_requisicoes: janela fixa por chave, como a função SQL.
//
// Este arquivo não é um teste (não termina em .test.js): o node --test não o
// executa sozinho.

const crypto = require("node:crypto");

const URL_FALSA = "https://projeto-falso.supabase.test";
const CHAVE_FALSA = "sb_secret_chave-falsa-para-teste-1234567890";

function responder(status, corpo) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function faseValidaNoBanco(world, phase) {
  return (world >= 1 && world <= 4 && phase >= 1 && phase <= 3) || (world === 5 && phase === 1);
}

function valorDoFiltro(parametros, nome) {
  const valor = parametros.get(nome);
  return valor === null ? null : valor.replace(/^eq\./, "");
}

function criarSupabaseFalso() {
  const banco = {
    jogadores: new Map(), // id → linha
    conclusoes: new Map(), // "player|world|phase" → linha
    sessoes: new Map(), // id → linha
    contadores: new Map(), // bucket_key → { inicio, hits }
    chamadas: [],
    // "normal" | "rede" | "erro500" | "sem-funcao-de-limite" | "sem-tabela-de-sessoes"
    modo: "normal",
    deslocamentoRelogioMs: 0,
  };

  banco.agora = () => Date.now() + banco.deslocamentoRelogioMs;

  banco.zerar = () => {
    banco.jogadores.clear();
    banco.conclusoes.clear();
    banco.sessoes.clear();
    banco.contadores.clear();
    banco.chamadas.length = 0;
    banco.modo = "normal";
    banco.deslocamentoRelogioMs = 0;
  };

  banco.chamadasDe = (caminho) => banco.chamadas.filter((c) => c.caminho === `/rest/v1/${caminho}`);

  // Mesma regra da função SQL consumir_limite_requisicoes.
  function consumirLimites({ p_chaves, p_limites, p_janelas }) {
    const agora = banco.agora() / 1000;
    let permitido = true;
    let espera = 0;
    p_chaves.forEach((chave, i) => {
      const janela = p_janelas[i];
      const inicio = Math.floor(agora / janela) * janela;
      const atual = banco.contadores.get(chave);
      const hits = atual && atual.inicio >= inicio ? atual.hits + 1 : 1;
      banco.contadores.set(chave, { inicio: Math.max(inicio, atual?.inicio ?? inicio), hits });
      if (hits > p_limites[i]) {
        permitido = false;
        espera = Math.max(espera, Math.ceil(inicio + janela - agora));
      }
    });
    return { permitido, espera_segundos: permitido ? 0 : Math.max(espera, 1) };
  }

  banco.fetch = async (entrada, opcoes = {}) => {
    const endereco = new URL(typeof entrada === "string" ? entrada : entrada.url);
    const metodo = opcoes.method || "GET";
    const cabecalhos = new Headers(opcoes.headers);
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : null;
    banco.chamadas.push({ metodo, caminho: endereco.pathname, consulta: endereco.searchParams, cabecalhos, corpo });

    // Deixa outros pedidos entrarem no meio (concorrência de verdade).
    await new Promise((resolve) => setImmediate(resolve));

    if (banco.modo === "rede") {
      throw new TypeError("fetch failed");
    }
    if (banco.modo === "erro500") {
      return responder(500, { message: `falha em ${URL_FALSA} com ${CHAVE_FALSA}` });
    }
    if (cabecalhos.get("apikey") !== CHAVE_FALSA || cabecalhos.get("authorization") !== `Bearer ${CHAVE_FALSA}`) {
      return responder(401, { message: "Invalid API key" });
    }

    const caminho = endereco.pathname.replace(/^\/rest\/v1\//, "");
    const filtros = endereco.searchParams;

    if (caminho === "rpc/consumir_limite_requisicoes") {
      if (banco.modo === "sem-funcao-de-limite") {
        return responder(404, { code: "PGRST202", message: "função não encontrada" });
      }
      return responder(200, consumirLimites(corpo));
    }

    if (caminho === "players") {
      if (metodo === "GET") {
        const alvo = valorDoFiltro(filtros, "normalized_nickname");
        const linha = [...banco.jogadores.values()].find((j) => j.normalized_nickname === alvo);
        return responder(200, linha ? [{ id: linha.id, nickname: linha.nickname, avatar: linha.avatar }] : []);
      }
      if ([...banco.jogadores.values()].some((j) => j.normalized_nickname === corpo.normalized_nickname)) {
        return responder(201, []);
      }
      const linha = { id: crypto.randomUUID(), ...corpo };
      banco.jogadores.set(linha.id, linha);
      return responder(201, [{ id: linha.id, nickname: linha.nickname, avatar: linha.avatar }]);
    }

    if (caminho === "phase_completions") {
      if (metodo === "GET") {
        const jogadorId = valorDoFiltro(filtros, "player_id");
        const linhas = [...banco.conclusoes.values()]
          .filter((c) => c.player_id === jogadorId)
          .sort((a, b) => a.world - b.world || a.phase - b.phase)
          .map(({ world, phase }) => ({ world, phase }));
        return responder(200, linhas);
      }
      // INSERT em lote, atômico: qualquer violação desfaz tudo.
      for (const linha of corpo) {
        if (!banco.jogadores.has(linha.player_id)) {
          return responder(409, { code: "23503", message: `violates foreign key ${linha.player_id}` });
        }
        if (!faseValidaNoBanco(linha.world, linha.phase)) {
          return responder(400, { code: "23514", message: "violates check constraint" });
        }
      }
      const inseridas = [];
      for (const linha of corpo) {
        const chave = `${linha.player_id}|${linha.world}|${linha.phase}`;
        if (!banco.conclusoes.has(chave)) {
          banco.conclusoes.set(chave, { ...linha, completed_at: new Date().toISOString() });
          inseridas.push({ world: linha.world, phase: linha.phase });
        }
      }
      return responder(201, inseridas);
    }

    if (caminho === "player_sessions") {
      if (banco.modo === "sem-tabela-de-sessoes") {
        return responder(404, { code: "PGRST205", message: "tabela não encontrada" });
      }
      if (metodo === "GET") {
        const linha = banco.sessoes.get(valorDoFiltro(filtros, "id"));
        return responder(200, linha ? [{ player_id: linha.player_id, expires_at: linha.expires_at, revoked_at: linha.revoked_at }] : []);
      }
      if (metodo === "POST") {
        if (!banco.jogadores.has(corpo.player_id)) {
          return responder(409, { code: "23503", message: "violates foreign key" });
        }
        const linha = { id: crypto.randomUUID(), player_id: corpo.player_id, expires_at: corpo.expires_at, revoked_at: null, created_at: new Date().toISOString() };
        banco.sessoes.set(linha.id, linha);
        return responder(201, [{ id: linha.id }]);
      }
      if (metodo === "PATCH") {
        // O banco só deixa o servidor mudar revoked_at.
        if (Object.keys(corpo).some((coluna) => coluna !== "revoked_at")) {
          return responder(401, { code: "42501", message: "permission denied" });
        }
        const porId = valorDoFiltro(filtros, "id");
        const porJogador = valorDoFiltro(filtros, "player_id");
        const soAtivas = filtros.get("revoked_at") === "is.null";
        const alteradas = [...banco.sessoes.values()].filter(
          (s) => (porId === null || s.id === porId) && (porJogador === null || s.player_id === porJogador) && (!soAtivas || s.revoked_at === null)
        );
        alteradas.forEach((s) => {
          s.revoked_at = corpo.revoked_at;
        });
        return responder(200, alteradas.map((s) => ({ id: s.id })));
      }
    }

    return responder(404, { message: "tabela inexistente" });
  };

  /** Troca o fetch global: endereços do Supabase falso vão para o banco simulado. */
  banco.instalar = () => {
    const fetchReal = globalThis.fetch;
    globalThis.fetch = (entrada, opcoes) => {
      const endereco = typeof entrada === "string" ? entrada : entrada.url;
      return endereco.startsWith(URL_FALSA) ? banco.fetch(entrada, opcoes) : fetchReal(entrada, opcoes);
    };
    return () => {
      globalThis.fetch = fetchReal;
    };
  };

  return banco;
}

module.exports = { CHAVE_FALSA, URL_FALSA, criarSupabaseFalso };
