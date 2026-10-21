/**
 * @file limite.js
 * @description Limite de requisições (rate limiting) COMPARTILHADO entre
 * instâncias da Vercel.
 *
 * Cada função da Vercel pode rodar em várias instâncias ao mesmo tempo, e um
 * contador em memória só enxergaria a própria instância. Por isso os
 * contadores ficam no banco que o jogo já usa: a função SQL
 * consumir_limite_requisicoes (migração em supabase/migrations/) soma e
 * confere tudo em uma única operação atômica. Não há serviço novo nem custo
 * fixo extra.
 *
 * Como funciona: janela fixa. Ex.: "5 pedidos a cada 15 minutos por rede".
 * Passou do limite → 429 MUITAS_TENTATIVAS, com o cabeçalho Retry-After.
 *
 * Privacidade: o banco não guarda IP nem id de jogador. A chave de cada
 * contador é um HMAC (com segredo do servidor) da regra + valor.
 *
 * Se o banco não responder:
 *   - endpoints do jogo LIBERAM o pedido (a criança continua jogando) e o
 *     servidor registra o problema no log;
 *   - o login administrativo RECUSA (503): sem limite, ele ficaria exposto a
 *     tentativas repetidas de PIN.
 *
 * Os limites ficam em REGRAS, abaixo. Para mudar, altere aqui e rode os testes.
 *
 * ⚠️ Este limite protege o banco e o PIN, mas não impede que a função seja
 * chamada (cada pedido recusado ainda conta como execução na Vercel). Para
 * barrar pedidos antes de chegarem ao código, use também o firewall da
 * Vercel (opcional; ver docs/seguranca.md).
 */

const crypto = require("node:crypto");
const net = require("node:net");
const { ErroHttp } = require("./http");
const supabase = require("./supabase");

const MINUTO = 60;

// escopo "ip":      por rede do aparelho (IPv4 inteiro; IPv6 por /64)
// escopo "jogador": por jogador da sessão (só nos endpoints de progresso)
// escopo "global":  todos os pedidos juntos (só no login administrativo)
const REGRAS = Object.freeze({
  // Tentativas de PIN: poucas por rede e um teto geral contra ataque
  // espalhado por muitos endereços.
  adminLogin: [
    { escopo: "ip", limite: 5, janelaSegundos: 15 * MINUTO },
    { escopo: "global", limite: 30, janelaSegundos: 60 * MINUTO },
  ],
  adminRevogarSessao: [{ escopo: "ip", limite: 30, janelaSegundos: 10 * MINUTO }],
  // Uma sala de aula inteira pode sair pela mesma rede (mesmo IP): limites
  // folgados por rede.
  jogadoresVerificar: [{ escopo: "ip", limite: 120, janelaSegundos: 10 * MINUTO }],
  jogadoresEntrar: [{ escopo: "ip", limite: 120, janelaSegundos: 10 * MINUTO }],
  progressoConsultar: [
    { escopo: "ip", limite: 600, janelaSegundos: 10 * MINUTO },
    { escopo: "jogador", limite: 60, janelaSegundos: 10 * MINUTO },
  ],
  progressoRegistrar: [
    { escopo: "ip", limite: 600, janelaSegundos: 10 * MINUTO },
    { escopo: "jogador", limite: 60, janelaSegundos: 10 * MINUTO },
  ],
});

const MENSAGEM_LIMITE = "Muitas tentativas. Espere um pouco e tente de novo.";

// Atalho local: quando o banco já disse "bloqueado", esta instância lembra até
// a janela acabar e recusa sem consultar o banco de novo (alivia o banco
// durante uma enxurrada de pedidos). A fonte de verdade continua sendo o banco.
const bloqueiosLocais = new Map();
const MAXIMO_BLOQUEIOS_LOCAIS = 5000;

/**
 * IP de quem fez o pedido. Na Vercel (variável VERCEL definida), vale o
 * primeiro endereço de x-forwarded-for, que a própria Vercel preenche e
 * sobrescreve. Fora da Vercel (servidor local), esse cabeçalho é ignorado,
 * porque qualquer um poderia inventá-lo; vale o endereço da conexão.
 */
function obterIpDoCliente(req) {
  if (process.env.VERCEL) {
    const encaminhado = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (encaminhado) {
      return encaminhado;
    }
  }
  return String(req.socket?.remoteAddress || "");
}

function expandirIpv6(ip) {
  let texto = ip;
  const ipv4NoFim = /(\d+\.\d+\.\d+\.\d+)$/.exec(texto);
  if (ipv4NoFim) {
    const [a, b, c, d] = ipv4NoFim[1].split(".").map(Number);
    texto = `${texto.slice(0, -ipv4NoFim[1].length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [esquerda, direita] = texto.split("::");
  const inicio = esquerda ? esquerda.split(":") : [];
  const fim = texto.includes("::") && direita ? direita.split(":") : [];
  const zeros = texto.includes("::") ? 8 - inicio.length - fim.length : 0;
  return [...inicio, ...Array(zeros).fill("0"), ...fim].map((bloco) => bloco.toLowerCase().replace(/^0+(?=.)/, ""));
}

/**
 * Agrupa o endereço: IPv4 inteiro; IPv6 pelo prefixo /64 (um aparelho com
 * IPv6 costuma ter muitos endereços dentro do mesmo /64).
 */
function grupoDoIp(ip) {
  let texto = String(ip || "").trim().replace(/^\[|\]$/g, "").split("%")[0];
  const mapeado = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(texto);
  if (mapeado) {
    texto = mapeado[1];
  }
  if (net.isIPv4(texto)) {
    return texto;
  }
  if (net.isIPv6(texto)) {
    return `${expandirIpv6(texto).slice(0, 4).join(":")}::/64`;
  }
  return "desconhecido";
}

function segredoDasChaves() {
  // A chave secreta do Supabase já é obrigatória para o limite funcionar e
  // nunca sai do servidor. O prefixo separa este uso dos demais.
  const chave = (process.env.SUPABASE_SECRET_KEY || "").trim();
  if (!chave) {
    throw new Error("SUPABASE_SECRET_KEY ausente");
  }
  return `arruma-bagunca:limite:${chave}`;
}

function montarChave(nomeDaRegra, escopo, valor, segredo) {
  const resumo = crypto.createHmac("sha256", segredo).update(`${nomeDaRegra}|${escopo}|${valor}`).digest("base64url");
  return `${nomeDaRegra}:${escopo}:${resumo.slice(0, 32)}`;
}

function erroMuitasTentativas(esperaSegundos) {
  const espera = Math.max(1, Math.ceil(esperaSegundos));
  return new ErroHttp(429, "MUITAS_TENTATIVAS", MENSAGEM_LIMITE, { esperaSegundos: espera }, { "Retry-After": String(espera) });
}

function lembrarBloqueio(assinatura, esperaSegundos) {
  if (bloqueiosLocais.size >= MAXIMO_BLOQUEIOS_LOCAIS) {
    bloqueiosLocais.clear();
  }
  bloqueiosLocais.set(assinatura, Date.now() + Math.max(1, esperaSegundos) * 1000);
}

function bloqueioLocalAtivo(assinatura) {
  const ate = bloqueiosLocais.get(assinatura);
  if (ate === undefined) {
    return 0;
  }
  if (ate <= Date.now()) {
    bloqueiosLocais.delete(assinatura);
    return 0;
  }
  return (ate - Date.now()) / 1000;
}

/**
 * Conta o pedido nas regras de "nomeDaRegra" e lança 429 se passou do limite.
 *
 * opções:
 *   jogadorId      — necessário para as regras de escopo "jogador"
 *   falharFechado  — true: se o banco não responder, recusa com 503
 */
async function aplicarLimite(req, nomeDaRegra, { jogadorId, falharFechado = false } = {}) {
  const regras = REGRAS[nomeDaRegra];
  if (!regras) {
    throw new Error(`Regra de limite desconhecida: ${nomeDaRegra}`);
  }

  let pedidos;
  try {
    const segredo = segredoDasChaves();
    const valores = { ip: grupoDoIp(obterIpDoCliente(req)), jogador: jogadorId, global: "todos" };
    pedidos = regras
      .filter((regra) => valores[regra.escopo])
      .map((regra) => ({
        chave: montarChave(nomeDaRegra, regra.escopo, valores[regra.escopo], segredo),
        limite: regra.limite,
        janelaSegundos: regra.janelaSegundos,
      }));
  } catch (erro) {
    return indisponivel(nomeDaRegra, falharFechado);
  }

  const assinatura = pedidos.map((pedido) => pedido.chave).join("|");
  const esperaLocal = bloqueioLocalAtivo(assinatura);
  if (esperaLocal > 0) {
    throw erroMuitasTentativas(esperaLocal);
  }

  let resultado;
  try {
    resultado = await supabase.consumirLimites(pedidos);
  } catch (erro) {
    return indisponivel(nomeDaRegra, falharFechado);
  }

  if (!resultado.permitido) {
    lembrarBloqueio(assinatura, resultado.esperaSegundos);
    throw erroMuitasTentativas(resultado.esperaSegundos);
  }
}

function indisponivel(nomeDaRegra, falharFechado) {
  // Só o nome da regra; nunca IP, chave ou id.
  if (falharFechado) {
    console.error(`[limite] Limite indisponível (${nomeDaRegra}): pedido recusado.`);
    throw new ErroHttp(503, "SERVICO_INDISPONIVEL", "Serviço indisponível no momento. Tente de novo mais tarde.");
  }
  console.error(`[limite] Limite indisponível (${nomeDaRegra}): pedido liberado.`);
}

/** Só para testes: esquece os bloqueios lembrados por esta instância. */
function esquecerBloqueiosLocais() {
  bloqueiosLocais.clear();
}

module.exports = {
  REGRAS,
  aplicarLimite,
  esquecerBloqueiosLocais,
  grupoDoIp,
  obterIpDoCliente,
};
