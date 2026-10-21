
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
    let codigo = "";
    try {
      const corpoErro = await resposta.json();
      if (typeof corpoErro?.code === "string" && /^[A-Za-z0-9_]{1,20}$/.test(corpoErro.code)) {
        codigo = ` (código ${corpoErro.code})`;
      }
    } catch {
      // Sem corpo JSON: fica só o status.
    }
    console.error(
      "[supabase] Requisição falhou:",
      resposta.status,
      resposta.statusText + codigo
    );

    throw new ErroHttp(
      503,
      "SERVICO_INDISPONIVEL",
      "Não conseguimos conectar agora. Tente de novo!"
    );
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

module.exports = {
  AVATAR_PADRAO,
  buscarPorApelidoNormalizado,
  criarOuRecuperar,
};
