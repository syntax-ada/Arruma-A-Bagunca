/**
 * @file gerar-hash-pin.js
 * @description Gera o hash do PIN administrativo para a variável ADMIN_PIN_HASH.
 *
 * Uso (na raiz do projeto):
 *   node scripts/gerar-hash-pin.js
 *
 * - O PIN é digitado duas vezes e NUNCA vai como argumento do comando, então
 *   não fica no histórico do terminal.
 * - Em PowerShell, cmd ou Windows Terminal a digitação aparece como "*". Em
 *   terminais que não permitem esconder (ex.: Git Bash/mintty), o script avisa
 *   antes; prefira um dos outros.
 * - A saída (stdout) é só o hash: copie para ADMIN_PIN_HASH no .env.local e
 *   nas variáveis da Vercel. Nunca salve o PIN em arquivo do projeto.
 */

const readline = require("node:readline");
const { PIN_MAXIMO, PIN_MINIMO, gerarHashPin, pinTemFormatoValido } = require("../api/_lib/pin");

const TAMANHO_RECOMENDADO = 10;

// Mensagens vão para stderr; stdout fica só com o hash.
function avisar(texto) {
  process.stderr.write(texto);
}

// Terminal interativo: lê tecla a tecla, mostrando "*" no lugar de cada dígito.
function perguntarOculto(pergunta) {
  return new Promise((resolve) => {
    const entrada = process.stdin;
    avisar(pergunta);
    entrada.setRawMode(true);
    entrada.resume();
    entrada.setEncoding("utf8");
    let valor = "";

    const aoDigitar = (teclas) => {
      for (const tecla of teclas) {
        if (tecla === "\r" || tecla === "\n") {
          entrada.setRawMode(false);
          entrada.pause();
          entrada.removeListener("data", aoDigitar);
          avisar("\n");
          resolve(valor);
          return;
        }
        if (tecla === "\u0003") {
          // Ctrl+C
          entrada.setRawMode(false);
          avisar("\nCancelado.\n");
          process.exit(130);
        }
        if (tecla === "\u007f" || tecla === "\b") {
          if (valor) {
            valor = valor.slice(0, -1);
            avisar("\b \b");
          }
          continue;
        }
        valor += tecla;
        avisar("*");
      }
    };
    entrada.on("data", aoDigitar);
  });
}

// Sem terminal interativo (Git Bash/mintty ou entrada redirecionada): lê linhas.
function criarLeitorDeLinhas() {
  const leitor = readline.createInterface({ input: process.stdin });
  const linhas = leitor[Symbol.asyncIterator]();
  return {
    async perguntar(pergunta) {
      avisar(pergunta);
      const { value, done } = await linhas.next();
      return done ? "" : value;
    },
    fechar() {
      leitor.close();
    },
  };
}

async function principal() {
  const interativo = Boolean(process.stdin.isTTY && process.stdin.setRawMode);
  let leitor = null;
  if (!interativo) {
    avisar("⚠ Este terminal não permite esconder a digitação: o PIN aparecerá na tela.\n");
    avisar("  Prefira PowerShell, cmd ou Windows Terminal. Ctrl+C cancela.\n");
    leitor = criarLeitorDeLinhas();
  }
  const perguntar = (texto) => (interativo ? perguntarOculto(texto) : leitor.perguntar(texto));

  avisar(`PIN do administrativo (${PIN_MINIMO} a ${PIN_MAXIMO} dígitos; recomendado ${TAMANHO_RECOMENDADO} ou mais).\n`);
  const pin = (await perguntar("PIN: ")).trim();
  const confirmacao = (await perguntar("Repita o PIN: ")).trim();
  if (leitor) {
    leitor.fechar();
  }

  if (pin !== confirmacao) {
    avisar("Os dois PINs não são iguais. Nada foi gerado.\n");
    process.exitCode = 1;
    return;
  }
  if (!pinTemFormatoValido(pin)) {
    avisar(`O PIN precisa ter de ${PIN_MINIMO} a ${PIN_MAXIMO} dígitos (só números). Nada foi gerado.\n`);
    process.exitCode = 1;
    return;
  }
  if (pin.length < TAMANHO_RECOMENDADO) {
    avisar(`⚠ PIN curto: sem limite de tentativas no servidor, use ${TAMANHO_RECOMENDADO} dígitos ou mais.\n`);
  }

  console.log(gerarHashPin(pin));
  avisar("↑ Copie a linha acima para ADMIN_PIN_HASH (.env.local e Vercel). Não é o PIN; trate como segredo.\n");
}

principal();
