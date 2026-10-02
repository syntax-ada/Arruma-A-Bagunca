/**
 * @file operacoes.js
 * @description Catálogo das operações matemáticas disponíveis no jogo.
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — NÃO É UM MOTOR DE JOGO
 * ============================================================================
 * Cada operação reúne APENAS o que muda de uma conta para outra:
 *
 *   simbolo           → operador exibido entre as parcelas ("+", "−", "×", "÷")
 *   pergunta          → enunciado do desafio
 *   calcular          → reduz as parcelas, em sequência, a um resultado
 *   validar           → diz se a conta é possível (guarda de autoria de fase)
 *   gerarAlternativas → distratores plausíveis para aquela operação
 *   mensagemSucesso   → frase de acerto
 *
 * Tudo que é comum às três operações (normalizar dados, renderizar a conta,
 * embaralhar alternativas, conferir a resposta, feedback, progresso e
 * navegação) continua em math.js. Nada de DOM deve entrar aqui.
 *
 * As parcelas NUNCA são sorteadas: elas vêm da quantidade real de objetos
 * organizados pela criança (game.js → getCategorySummary), na ordem em que as
 * categorias estão declaradas no arquivo do mundo. Para a subtração essa ordem
 * é semântica — a primeira categoria é o minuendo.
 *
 * ----------------------------------------------------------------------------
 * CONTAS COMPOSTAS (vários operadores em uma só conta)
 * ----------------------------------------------------------------------------
 * As quatro operações acima aplicam UM operador a todas as parcelas. A entrada
 * "composta" generaliza isso: a conta passa a declarar também os operadores de
 * cada lacuna, e as quatro operações continuam intactas.
 *
 *   { valores: [2, 5, 2, 1], operadores: ["×", "+", "-"] }  →  2 × 5 + 2 − 1
 *
 * Para isso, "calcular" e "validar" aceitam um SEGUNDO argumento opcional com
 * os operadores. As quatro operações simples ignoram esse argumento — em
 * JavaScript, argumentos extras não atrapalham —, então nada muda para elas.
 *
 * Uma conta simples é o caso particular em que todos os operadores são iguais:
 * não existe "sistema do Mundo 5", existe uma lista de operadores que nos
 * Mundos 1–4 é uniforme.
 *
 * ⚠️ ORDEM DE CARREGAMENTO: este arquivo deve vir ANTES de math.js no HTML.
 * ============================================================================
 */

(function () {
  // Quantidade de botões de resposta exibidos na tela (1 correto + 2 distratores).
  const TOTAL_ALTERNATIVAS = 3;

  // Teto do resultado da multiplicação. Vale como guarda de autoria de fase:
  // uma conta acima do teto é recusada com erro no console, em vez de virar um
  // desafio impossível na tela. O valor acompanha a maior conta em uso — hoje
  // a Fase 3 do Mundo 3 (2 × 4 × 5 = 40) —, então 40 passa e 4 × 4 × 3 = 48 é
  // recusado. É um limite técnico, não uma decisão pedagógica: ajuste-o junto
  // com as contas se um mundo novo precisar de resultados maiores.
  const LIMITE_MULTIPLICACAO = 40;

  function normalizarValores(valores) {
    return (Array.isArray(valores) ? valores : []).map((valor) => Number(valor) || 0);
  }

  // Completa o conjunto de alternativas subindo a partir do resultado, para
  // nunca produzir um valor negativo. O resultado correto é sempre o primeiro
  // item inserido no Set, então jamais é descartado pelo corte final.
  function completarAlternativas(opcoes, resultado) {
    let offset = 1;
    while (opcoes.size < TOTAL_ALTERNATIVAS) {
      opcoes.add(resultado + offset);
      offset++;
    }
    return Array.from(opcoes).slice(0, TOTAL_ALTERNATIVAS);
  }

  // ==========================================================
  // SOMA (+)
  // Comportamento preservado do math.js original: distratores em ±2, com
  // piso 1, e preenchimento crescente quando há colisão.
  // ==========================================================
  const SOMA = {
    id: "soma",
    simbolo: "+",
    pergunta: "Quantos objetos você organizou ao todo?",

    calcular(valores) {
      return normalizarValores(valores).reduce((acc, numero) => acc + numero, 0);
    },

    // A soma de quantidades organizadas nunca é negativa: não há conta inválida.
    validar() {
      return { valido: true, motivo: "" };
    },

    gerarAlternativas(resultado) {
      const opcoes = new Set();
      opcoes.add(resultado);
      opcoes.add(Math.max(1, resultado - 2));
      opcoes.add(resultado + 2);
      return completarAlternativas(opcoes, resultado);
    },

    mensagemSucesso(conta) {
      return `Muito bem! Você acertou! ${conta} objetos organizados ao todo!`;
    },
  };

  // ==========================================================
  // SUBTRAÇÃO (−)
  // Cálculo sequencial da esquerda para a direita. Nenhum resultado
  // intermediário pode ficar negativo.
  // ==========================================================
  const SUBTRACAO = {
    id: "subtracao",
    simbolo: "−",
    pergunta: "Quantos objetos sobraram?",

    calcular(valores) {
      const numeros = normalizarValores(valores);
      if (numeros.length === 0) {
        return 0;
      }
      return numeros.slice(1).reduce((acc, numero) => acc - numero, numeros[0]);
    },

    validar(valores) {
      const numeros = normalizarValores(valores);

      if (numeros.length < 2) {
        return { valido: false, motivo: "A subtração precisa de pelo menos duas parcelas." };
      }

      // Confere passo a passo: o parcial não pode ficar negativo em momento algum.
      let parcial = numeros[0];
      for (let i = 1; i < numeros.length; i++) {
        parcial -= numeros[i];
        if (parcial < 0) {
          return {
            valido: false,
            motivo: `Resultado intermediário negativo (${parcial}) no passo ${i + 1} de ${numeros.join(" − ")}.`,
          };
        }
      }

      return { valido: true, motivo: "" };
    },

    // Resultados de subtração são pequenos (muitas vezes 0 ou 1), então os
    // distratores andam de 1 em 1 — e nunca descem abaixo de zero.
    gerarAlternativas(resultado) {
      const opcoes = new Set();
      opcoes.add(resultado);
      if (resultado - 1 >= 0) {
        opcoes.add(resultado - 1);
      }
      opcoes.add(resultado + 1);
      return completarAlternativas(opcoes, resultado);
    },

    mensagemSucesso(conta) {
      return `Muito bem! Você acertou! ${conta} objetos restantes!`;
    },
  };

  // ==========================================================
  // MULTIPLICAÇÃO (×)
  // Cálculo sequencial, com teto de resultado para manter as contas simples.
  // ==========================================================
  const MULTIPLICACAO = {
    id: "multiplicacao",
    simbolo: "×",
    pergunta: "Quantos objetos há no total?",

    calcular(valores) {
      const numeros = normalizarValores(valores);
      if (numeros.length === 0) {
        return 0;
      }
      return numeros.reduce((acc, numero) => acc * numero, 1);
    },

    validar(valores) {
      const numeros = normalizarValores(valores);

      if (numeros.length < 2) {
        return { valido: false, motivo: "A multiplicação precisa de pelo menos dois fatores." };
      }

      const resultado = MULTIPLICACAO.calcular(numeros);
      if (resultado > LIMITE_MULTIPLICACAO) {
        return {
          valido: false,
          motivo: `Resultado ${resultado} acima do limite de ${LIMITE_MULTIPLICACAO} em ${numeros.join(" × ")}.`,
        };
      }

      return { valido: true, motivo: "" };
    },

    // Distratores com erro pedagógico reconhecível: somar em vez de multiplicar
    // e errar um dos fatores por um.
    gerarAlternativas(resultado, valores) {
      const numeros = normalizarValores(valores);
      const opcoes = new Set();
      opcoes.add(resultado);

      const somaDosFatores = numeros.reduce((acc, numero) => acc + numero, 0);
      if (somaDosFatores > 0) {
        opcoes.add(somaDosFatores);
      }

      if (numeros.length >= 2) {
        const ultimoFator = Math.max(1, numeros[numeros.length - 1] - 1);
        const quaseProduto = numeros
          .slice(0, -1)
          .reduce((acc, numero) => acc * numero, 1) * ultimoFator;
        if (quaseProduto > 0) {
          opcoes.add(quaseProduto);
        }
      }

      return completarAlternativas(opcoes, resultado);
    },

    mensagemSucesso(conta) {
      return `Muito bem! Você acertou! ${conta} objetos no total!`;
    },
  };

  // ==========================================================
  // DIVISÃO (÷)
  // Cálculo sequencial da esquerda para a direita. A divisão precisa ser
  // exata: nenhum passo pode ter divisor zero nem deixar resto.
  // ==========================================================
  const DIVISAO = {
    id: "divisao",
    simbolo: "÷",
    pergunta: "Quantos objetos ficam em cada grupo?",

    calcular(valores) {
      const numeros = normalizarValores(valores);
      if (numeros.length === 0) {
        return 0;
      }
      return numeros.slice(1).reduce((acc, numero) => acc / numero, numeros[0]);
    },

    validar(valores) {
      const numeros = normalizarValores(valores);

      if (numeros.length < 2) {
        return { valido: false, motivo: "A divisão precisa de pelo menos dois números." };
      }

      // Confere passo a passo: divisor zero e resto quebram a conta.
      let parcial = numeros[0];
      for (let i = 1; i < numeros.length; i++) {
        const divisor = numeros[i];

        if (divisor === 0) {
          return {
            valido: false,
            motivo: `Divisão por zero no passo ${i + 1} de ${numeros.join(" ÷ ")}.`,
          };
        }

        if (parcial % divisor !== 0) {
          return {
            valido: false,
            motivo: `Divisão não exata (${parcial} ÷ ${divisor} deixa resto) no passo ${i + 1} de ${numeros.join(" ÷ ")}.`,
          };
        }

        parcial = parcial / divisor;
      }

      return { valido: true, motivo: "" };
    },

    // Resultados de divisão são pequenos, como os da subtração: os distratores
    // andam de 1 em 1 e nunca descem abaixo de zero.
    gerarAlternativas(resultado) {
      const opcoes = new Set();
      opcoes.add(resultado);
      if (resultado - 1 >= 0) {
        opcoes.add(resultado - 1);
      }
      opcoes.add(resultado + 1);
      return completarAlternativas(opcoes, resultado);
    },

    mensagemSucesso(conta) {
      return `Muito bem! Você acertou! ${conta} objetos em cada grupo!`;
    },
  };

  // ==========================================================
  // EXPRESSÃO COMPOSTA (+ − × ÷ na mesma conta)
  // Não há aritmética nova aqui: cada passo da conta é resolvido pela operação
  // simples correspondente, declarada acima.
  // ==========================================================

  // Operadores aceitos numa expressão, mapeados para a operação que resolve
  // aquele passo.
  //
  // Os apelidos existem por um motivo prático: o símbolo de subtração do
  // catálogo é "−" (U+2212), mas um arquivo de mundo escrito à mão normalmente
  // traz o hífen "-" do teclado. O mesmo vale para "×"/"x" e "÷"/"/". Aceitar
  // as duas formas evita um erro silencioso de autoria difícil de enxergar.
  const OPERADORES_EXPRESSAO = {
    "+": SOMA,
    "−": SUBTRACAO,
    "-": SUBTRACAO,
    "×": MULTIPLICACAO,
    "x": MULTIPLICACAO,
    "*": MULTIPLICACAO,
    "÷": DIVISAO,
    "/": DIVISAO,
  };

  // Multiplicação e divisão são resolvidas antes de adição e subtração.
  const OPERACOES_PRIORITARIAS = [MULTIPLICACAO.id, DIVISAO.id];

  // Aceita tanto resolverExpressao(valores, operadores) quanto o formato
  // estruturado resolverExpressao({ valores, operadores }), que é como as
  // contas compostas são declaradas.
  function normalizarExpressao(entrada, operadores) {
    const fonte = (entrada && !Array.isArray(entrada) && typeof entrada === "object")
      ? entrada
      : { valores: entrada, operadores };

    return {
      numeros: normalizarValores(fonte.valores),
      operadores: Array.isArray(fonte.operadores) ? fonte.operadores.map(String) : [],
    };
  }

  // Resolve a expressão em DUAS PASSADAS, da esquerda para a direita:
  //
  //   passada 1 → colapsa × e ÷
  //   passada 2 → acumula + e −
  //
  // Não há parser, AST nem eval: os dados já chegam estruturados em dois
  // arrays, então não existe texto para interpretar.
  //
  // Calcular e validar percorrem ESTA MESMA rotina — calcular aproveita o
  // resultado, validar aproveita o motivo. Assim as duas nunca divergem.
  function resolverExpressao(entrada, operadoresDaChamada) {
    const { numeros, operadores } = normalizarExpressao(entrada, operadoresDaChamada);

    if (numeros.length < 2) {
      return {
        valido: false,
        motivo: "Uma expressão composta precisa de pelo menos dois valores.",
        resultado: 0,
      };
    }

    if (operadores.length !== numeros.length - 1) {
      return {
        valido: false,
        motivo: `São esperados ${numeros.length - 1} operador(es) para ${numeros.length} valores, mas vieram ${operadores.length}.`,
        resultado: 0,
      };
    }

    const naoReconhecido = operadores.find((operador) => !OPERADORES_EXPRESSAO[operador]);
    if (naoReconhecido !== undefined) {
      return {
        valido: false,
        motivo: `Operador "${naoReconhecido}" não reconhecido em ${numeros.join(" ? ")}. Use +, −, × ou ÷.`,
        resultado: 0,
      };
    }

    // Cópias de trabalho: a passada 1 substitui cada par de valores pelo
    // resultado do seu passo, encurtando as duas listas juntas.
    const valores = numeros.slice();
    const passos = operadores.map((operador) => OPERADORES_EXPRESSAO[operador]);

    let indice = 0;
    while (indice < passos.length) {
      if (!OPERACOES_PRIORITARIAS.includes(passos[indice].id)) {
        indice++;
        continue;
      }

      const esquerda = valores[indice];
      const direita = valores[indice + 1];

      // Mesmas guardas da divisão simples: divisor zero e resto quebram a conta.
      if (passos[indice].id === DIVISAO.id) {
        if (direita === 0) {
          return {
            valido: false,
            motivo: `Divisão por zero em ${esquerda} ÷ ${direita}, dentro de ${numeros.join(" ")}.`,
            resultado: 0,
          };
        }

        if (esquerda % direita !== 0) {
          return {
            valido: false,
            motivo: `Divisão não exata (${esquerda} ÷ ${direita} deixa resto), dentro de ${numeros.join(" ")}.`,
            resultado: 0,
          };
        }
      }

      valores.splice(indice, 2, passos[indice].calcular([esquerda, direita]));
      passos.splice(indice, 1);

      // O índice NÃO avança: o próximo operador tomou esta posição e também
      // pode ser prioritário (ex.: 12 ÷ 3 × 2).
    }

    // Passada 2: + e −, acumulando da esquerda para a direita. O parcial não
    // pode ficar negativo — é a mesma guarda que a subtração simples já aplica,
    // porque o jogo trabalha com números naturais.
    let parcial = valores[0];
    for (let i = 0; i < passos.length; i++) {
      parcial = passos[i].calcular([parcial, valores[i + 1]]);

      if (parcial < 0) {
        return {
          valido: false,
          motivo: `Resultado intermediário negativo (${parcial}) no passo ${i + 1} de ${numeros.join(" ")}.`,
          resultado: parcial,
        };
      }
    }

    return { valido: true, motivo: "", resultado: parcial };
  }

  const COMPOSTA = {
    id: "composta",

    // Uma expressão composta não tem um símbolo único: cada lacuna usa o seu
    // próprio operador, declarado em "operadores". Este campo existe apenas
    // para manter o contrato do catálogo e NÃO serve como separador da conta.
    simbolo: "",

    pergunta: "Qual é o resultado da conta?",

    calcular(valores, operadores) {
      return resolverExpressao(valores, operadores).resultado;
    },

    validar(valores, operadores) {
      const { valido, motivo } = resolverExpressao(valores, operadores);
      return { valido, motivo };
    },

    // Distratores de 1 em 1, sem descer abaixo de zero — mesmo critério já
    // usado pela subtração e pela divisão.
    gerarAlternativas(resultado) {
      const opcoes = new Set();
      opcoes.add(resultado);
      if (resultado - 1 >= 0) {
        opcoes.add(resultado - 1);
      }
      opcoes.add(resultado + 1);
      return completarAlternativas(opcoes, resultado);
    },

    mensagemSucesso(conta) {
      return `Muito bem! Você acertou! ${conta}`;
    },
  };

  // ==========================================================
  // REGISTRO DAS OPERAÇÕES
  // math.js localiza a operação da fase por OPERACOES[config.operacao].
  // ==========================================================
  const OPERACOES = {
    [SOMA.id]: SOMA,
    [SUBTRACAO.id]: SUBTRACAO,
    [MULTIPLICACAO.id]: MULTIPLICACAO,
    [DIVISAO.id]: DIVISAO,
    [COMPOSTA.id]: COMPOSTA,
  };

  if (typeof window !== "undefined") {
    window.OPERACOES = OPERACOES;
  }

  // Permite testar as regras das operações fora do navegador, sem DOM.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = OPERACOES;
  }
})();
