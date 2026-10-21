
/**
 * @file supabase.js
 * @description Acesso ao Supabase pela API REST, exclusivamente no servidor.
 *
 * Não colocar este arquivo dentro de js/: ele utiliza a chave secreta.
 * Não depende de bibliotecas externas; usa fetch nativo do Node.js.
 */

const { ErroHttp } = require("./http");

const TEMPO_LIMITE_MS = 8000;
const AVATAR_PADRAO = "padrao";

// Formato que a normalização (apelido.js) sempre produz. O banco também deve
// recusar qualquer valor fora dele; esta verificação evita ao menos enviá-lo.
const FORMATO_NORMALIZADO = /^[a-z0-9]{3,20}$/;

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function exigirUuid(valor) {
  if (typeof valor !== "string" || !FORMATO_UUID.test(valor)) {
    console.error("[supabase] Identificador fora do formato esperado; nada foi enviado ao banco.");
    throw new ErroHttp(500, "ERRO_INTERNO", "Algo deu errado. Tente de novo.");
  }
}

function exigirFormatoNormalizado(valor) {
  if (typeof valor !== "string" || !FORMATO_NORMALIZADO.test(valor)) {
    console.error("[supabase] Apelido normalizado fora do formato esperado; nada foi enviado ao banco.");
    throw new ErroHttp(500, "ERRO_INTERNO", "Algo deu errado. Tente de novo.");
  }
}

// Chaves feitas para ficar no navegador (papel "anon"). No lugar da chave
// secreta, o servidor passaria a agir como um visitante anônimo.
function ehChavePublica(chave) {
  if (chave.startsWith("sb_publishable_")) {
    return true;
  }
  const partes = chave.split(".");
  if (partes.length === 3) {
    try {
      const papel = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")).role;
      return papel === "anon";
    } catch {
      return false;
    }
  }
  return false;
}

function obterConfiguracao() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const chave = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !chave) {
    // Só os nomes das variáveis; nunca os valores.
    console.error("[supabase] Configuração ausente: defina SUPABASE_URL e SUPABASE_SECRET_KEY.");
    throw new ErroHttp(
      503,
      "SERVICO_INDISPONIVEL",
      "Não conseguimos conectar agora. Tente de novo!"
    );
  }

  if (ehChavePublica(chave)) {
    console.error(
      "[supabase] SUPABASE_SECRET_KEY parece ser a chave PUBLICÁVEL (anon). Use a chave secreta (sb_secret_...)."
    );
    throw new ErroHttp(
      503,
      "SERVICO_INDISPONIVEL",
      "Não conseguimos conectar agora. Tente de novo!"
    );
  }

  try {
    const endereco = new URL(url);
    if (
      endereco.protocol !== "https:" ||
      endereco.hostname !== "localhost"
    ) {
      // O Supabase hospedado deve utilizar HTTPS.
      if (endereco.protocol !== "https:") {
        throw new Error("URL insegura");
      }
    }
  } catch {
    console.error("[supabase] SUPABASE_URL inválida: use o endereço https do projeto.");
    throw new ErroHttp(
      503,
      "SERVICO_INDISPONIVEL",
      "Não conseguimos conectar agora. Tente de novo!"
    );
  }

  return { url, chave };
}

async function requisitarSupabase(caminho, opcoes = {}) {
  const { url, chave } = obterConfiguracao();

  let resposta;

  try {
    resposta = await fetch(`${url}/rest/v1/${caminho}`, {
      ...opcoes,
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      headers: {
        apikey: chave,
        Authorization: `Bearer ${chave}`,
        Accept: "application/json",
        ...opcoes.headers,
      },
    });
  } catch (erro) {
    // Só o tipo do erro (ex.: TimeoutError); a mensagem pode citar o endereço.
    console.error("[supabase] Falha de conexão:", erro?.name || "erro desconhecido");
    throw new ErroHttp(
      503,
      "SERVICO_INDISPONIVEL",
      "Não conseguimos conectar agora. Tente de novo!"
    );
  }

  if (!resposta.ok) {
    // Os detalhes técnicos ficam apenas no servidor.
    // Nunca devolvemos URL, chave ou corpo do erro ao navegador.
    // Só o código curto do erro (ex.: 42501 permissão, 23505 duplicado); a
    // mensagem e os detalhes podem conter dados e não são registrados.
    let codigoBanco = "";
    try {
      const corpoErro = await resposta.json();
      if (typeof corpoErro?.code === "string" && /^[A-Za-z0-9_]{1,20}$/.test(corpoErro.code)) {
        codigoBanco = corpoErro.code;
      }
    } catch {
      // Sem corpo JSON: fica só o status.
    }
    console.error(
      "[supabase] Requisição falhou:",
      resposta.status,
      resposta.statusText + (codigoBanco ? ` (código ${codigoBanco})` : "")
    );

    const erro = new ErroHttp(
      503,
      "SERVICO_INDISPONIVEL",
      "Não conseguimos conectar agora. Tente de novo!"
    );
    // Só para o servidor decidir o que fazer (ex.: 23503 = jogador inexistente).
    // Não faz parte da resposta enviada ao navegador.
    erro.codigoBanco = codigoBanco;
    throw erro;
  }

  if (resposta.status === 204) {
    return [];
  }

  try {
    return await resposta.json();
  } catch {
    console.error("[supabase] Resposta que não é JSON válido (status", resposta.status + ").");
    throw new ErroHttp(
      503,
      "SERVICO_INDISPONIVEL",
      "Não conseguimos conectar agora. Tente de novo!"
    );
  }
}

function paraJogador(registro) {
  return {
    id: registro.id,
    apelido: registro.nickname,
    avatar: registro.avatar,
  };
}

/**
 * Consulta o perfil pelo apelido normalizado.
 * Não cria nem modifica registros.
 */
async function buscarPorApelidoNormalizado(apelidoNormalizado) {
  exigirFormatoNormalizado(apelidoNormalizado);
  const consulta = new URLSearchParams({
    select: "id,nickname,avatar",
    normalized_nickname: `eq.${apelidoNormalizado}`,
    limit: "1",
  });

  const registros = await requisitarSupabase(
    `players?${consulta.toString()}`
  );

  return registros.length ? paraJogador(registros[0]) : null;
}

/**
 * Cria o jogador ou recupera o existente.
 *
 * A restrição UNIQUE no banco e o upsert com ignore-duplicates
 * permitem lidar com duas criações simultâneas do mesmo apelido.
 * A grafia e o avatar do primeiro cadastro são preservados.
 */
async function criarOuRecuperar(apelido, apelidoNormalizado) {
  exigirFormatoNormalizado(apelidoNormalizado);
  const consulta = new URLSearchParams({
    on_conflict: "normalized_nickname",
    select: "id,nickname,avatar",
  });

  const registros = await requisitarSupabase(
    `players?${consulta.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify({
        nickname: apelido,
        normalized_nickname: apelidoNormalizado,
        avatar: AVATAR_PADRAO,
      }),
    }
  );

  if (registros.length > 0) {
    return {
      criado: true,
      jogador: paraJogador(registros[0]),
    };
  }

  // O registro já existia, inclusive se outra requisição acabou de criá-lo.
  const jogador = await buscarPorApelidoNormalizado(apelidoNormalizado);

  if (!jogador) {
    throw new ErroHttp(
      503,
      "SERVICO_INDISPONIVEL",
      "Não conseguimos conectar agora. Tente de novo!"
    );
  }

  return { criado: false, jogador };
}

/**
 * Lista as fases concluídas pelo jogador, como ids "mundo-fase" (ex.: "1-2").
 * O id do jogador vem SEMPRE da sessão validada no servidor, nunca do navegador.
 */
async function listarFasesConcluidas(jogadorId) {
  exigirUuid(jogadorId);
  const consulta = new URLSearchParams({
    select: "world,phase",
    player_id: `eq.${jogadorId}`,
    order: "world.asc,phase.asc",
  });

  const registros = await requisitarSupabase(`phase_completions?${consulta.toString()}`);
  return registros.map((registro) => `${registro.world}-${registro.phase}`);
}

/**
 * Grava conclusões já validadas por js/regras-progresso.js. Repetições são
 * ignoradas pela chave primária (player_id, world, phase): dois pedidos
 * simultâneos com a mesma fase gravam uma linha só. Devolve as fases que
 * foram de fato inseridas agora.
 *
 * Jogador inexistente (removido do banco) → 401: a sessão deixou de valer.
 */
async function registrarFasesConcluidas(jogadorId, fases) {
  exigirUuid(jogadorId);
  if (!Array.isArray(fases) || fases.length === 0) {
    return [];
  }

  const linhas = fases.map((id) => {
    const [world, phase] = id.split("-").map(Number);
    return { player_id: jogadorId, world, phase };
  });
  const consulta = new URLSearchParams({
    on_conflict: "player_id,world,phase",
    select: "world,phase",
  });

  let registros;
  try {
    registros = await requisitarSupabase(`phase_completions?${consulta.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify(linhas),
    });
  } catch (erro) {
    // 23503 = chave estrangeira: o jogador do token não existe mais no banco.
    if (erro?.codigoBanco === "23503") {
      throw new ErroHttp(401, "NAO_AUTENTICADO", "Entre de novo com o seu apelido para salvar o progresso.");
    }
    throw erro;
  }

  return registros.map((registro) => `${registro.world}-${registro.phase}`);
}

// ---------------------------------------------------------------------------
// Sessões de jogador (tabela player_sessions): permitem revogar UMA sessão
// sem derrubar as outras. O token assinado leva o id da sessão; cada pedido de
// progresso confere aqui se ela continua ativa.
// ---------------------------------------------------------------------------

/** Cria a sessão no banco e devolve o id dela. */
async function registrarSessaoJogador(jogadorId, expiraEm) {
  exigirUuid(jogadorId);
  const registros = await requisitarSupabase("player_sessions?select=id", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ player_id: jogadorId, expires_at: new Date(expiraEm).toISOString() }),
  });
  const id = registros[0]?.id;
  exigirUuid(id);
  return id;
}

/**
 * true só se a sessão existe, é do jogador indicado, não foi revogada e não
 * expirou. Falha do banco → 503 (nunca libera sem conferir).
 */
async function sessaoJogadorEstaAtiva(sessaoId, jogadorId) {
  exigirUuid(sessaoId);
  exigirUuid(jogadorId);
  const consulta = new URLSearchParams({
    select: "player_id,expires_at,revoked_at",
    id: `eq.${sessaoId}`,
    limit: "1",
  });
  const [sessao] = await requisitarSupabase(`player_sessions?${consulta.toString()}`);
  return !!sessao && sessao.player_id === jogadorId && !sessao.revoked_at && Date.parse(sessao.expires_at) > Date.now();
}

/**
 * Revoga UMA sessão ({ sessaoId }) ou todas as sessões ativas de UM jogador
 * ({ jogadorId }). Devolve quantas foram revogadas agora.
 */
async function revogarSessoesJogador({ sessaoId, jogadorId }) {
  const filtro = new URLSearchParams({ select: "id", revoked_at: "is.null" });
  if (sessaoId) {
    exigirUuid(sessaoId);
    filtro.set("id", `eq.${sessaoId}`);
  } else {
    exigirUuid(jogadorId);
    filtro.set("player_id", `eq.${jogadorId}`);
  }
  const registros = await requisitarSupabase(`player_sessions?${filtro.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
  return registros.length;
}

// ---------------------------------------------------------------------------
// Limite de requisições: contadores compartilhados entre instâncias, na função
// consumir_limite_requisicoes (migração em supabase/migrations/).
// ---------------------------------------------------------------------------

/**
 * Conta mais um pedido em cada chave e diz se ele cabe nos limites.
 * regras: [{ chave, limite, janelaSegundos }]
 * Devolve { permitido, esperaSegundos }.
 */
async function consumirLimites(regras) {
  const resposta = await requisitarSupabase("rpc/consumir_limite_requisicoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      p_chaves: regras.map((regra) => regra.chave),
      p_limites: regras.map((regra) => regra.limite),
      p_janelas: regras.map((regra) => regra.janelaSegundos),
    }),
  });
  if (typeof resposta?.permitido !== "boolean") {
    console.error("[supabase] Resposta inesperada da função de limite.");
    throw new ErroHttp(503, "SERVICO_INDISPONIVEL", "Não conseguimos conectar agora. Tente de novo!");
  }
  return { permitido: resposta.permitido, esperaSegundos: Math.max(0, Number(resposta.espera_segundos) || 0) };
}

module.exports = {
  AVATAR_PADRAO,
  buscarPorApelidoNormalizado,
  consumirLimites,
  criarOuRecuperar,
  listarFasesConcluidas,
  registrarFasesConcluidas,
  registrarSessaoJogador,
  revogarSessoesJogador,
  sessaoJogadorEstaAtiva,
};
