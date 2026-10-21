/**
 * @file http.js
 * @description Funções HTTP compartilhadas pelos endpoints da pasta api/.
 *
 * Usa só APIs nativas do Node (res.statusCode, res.setHeader, res.end) para
 * que o mesmo endpoint rode igual na Vercel e no servidor local
 * (scripts/servidor-local.js).
 *
 * Arquivos dentro de "api/_lib/" não viram rota: a Vercel ignora caminhos que
 * começam com "_", e o servidor local segue a mesma regra.
 */

const LIMITE_CORPO_BYTES = 10 * 1024;

/**
 * Erro com status HTTP e código para o frontend. Os endpoints lançam este
 * erro e "tratarErro" transforma em resposta JSON.
 */
class ErroHttp extends Error {
  constructor(status, codigo, mensagem, extras) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.extras = extras;
  }
}

function responderJson(res, status, corpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(corpo));
}

/**
 * Formato padrão de erro: { erro: "CODIGO", mensagem: "texto curto", ...extras }.
 */
function responderErro(res, status, codigo, mensagem, extras) {
  responderJson(res, status, { erro: codigo, mensagem, ...extras });
}

/**
 * Responde 405 quando o método não é o esperado. Devolve true se pode seguir.
 */
function aceitarMetodo(req, res, metodo) {
  if (req.method === metodo) {
    return true;
  }
  res.setHeader("Allow", metodo);
  responderErro(res, 405, "METODO_NAO_PERMITIDO", `Use o método ${metodo}.`);
  return false;
}

function interpretarJson(conteudo) {
  if (conteudo !== null && typeof conteudo === "object" && !Buffer.isBuffer(conteudo)) {
    return conteudo;
  }
  const texto = Buffer.isBuffer(conteudo) ? conteudo.toString("utf8") : String(conteudo);
  if (Buffer.byteLength(texto) > LIMITE_CORPO_BYTES) {
    throw new ErroHttp(413, "CORPO_GRANDE_DEMAIS", "Os dados enviados são grandes demais.");
  }
  try {
    return JSON.parse(texto);
  } catch (erro) {
    throw new ErroHttp(400, "REQUISICAO_INVALIDA", "Os dados enviados não são um JSON válido.");
  }
}

function lerTextoDoStream(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    let tamanho = 0;
    let excedeu = false;

    req.on("data", (parte) => {
      if (excedeu) {
        return;
      }
      tamanho += parte.length;
      if (tamanho > LIMITE_CORPO_BYTES) {
        excedeu = true;
        reject(new ErroHttp(413, "CORPO_GRANDE_DEMAIS", "Os dados enviados são grandes demais."));
        return;
      }
      partes.push(parte);
    });
    req.on("end", () => {
      if (!excedeu) {
        resolve(Buffer.concat(partes).toString("utf8"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Lê o corpo da requisição como JSON.
 *
 * Na Vercel, o corpo pode já chegar lido em "req.body" (a leitura pode lançar
 * erro se o JSON for inválido). No servidor local, "req.body" não existe e o
 * corpo é lido do stream. ⚠️ O caminho da Vercel só poderá ser confirmado na
 * etapa de implantação.
 */
async function lerJson(req) {
  const tipo = String(req.headers["content-type"] || "").toLowerCase();
  if (!tipo.startsWith("application/json")) {
    throw new ErroHttp(415, "TIPO_NAO_SUPORTADO", "Envie os dados em JSON.");
  }

  let corpoPronto;
  try {
    corpoPronto = req.body;
  } catch (erro) {
    throw new ErroHttp(400, "REQUISICAO_INVALIDA", "Os dados enviados não são um JSON válido.");
  }

  if (corpoPronto !== undefined) {
    return interpretarJson(corpoPronto);
  }

  return interpretarJson(await lerTextoDoStream(req));
}

/**
 * Converte qualquer erro em resposta. Erros inesperados viram 500 genérico:
 * o detalhe vai só para o log do servidor, nunca para o navegador.
 */
function tratarErro(res, erro) {
  if (erro instanceof ErroHttp) {
    responderErro(res, erro.status, erro.codigo, erro.message, erro.extras);
    return;
  }
  console.error("[api] Erro inesperado:", erro);
  responderErro(res, 500, "ERRO_INTERNO", "Algo deu errado. Tente de novo.");
}

module.exports = {
  ErroHttp,
  LIMITE_CORPO_BYTES,
  aceitarMetodo,
  lerJson,
  responderErro,
  responderJson,
  tratarErro,
};
