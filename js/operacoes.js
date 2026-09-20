/**
 * @file operacoes.js
 * @description Catálogo das operações matemáticas disponíveis no jogo.
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — NÃO É UM MOTOR DE JOGO
 * ============================================================================
 * Cada operação reúne APENAS o que muda de uma conta para outra:
 *
 *   simbolo           → operador exibido entre as parcelas ("+", "−", "×")
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
 * ⚠️ ORDEM DE CARREGAMENTO: este arquivo deve vir ANTES de math.js no HTML.
 * ============================================================================
 */

(function () {
  // Quantidade de botões de resposta exibidos na tela (1 correto + 2 distratores).
  const TOTAL_ALTERNATIVAS = 3;

  // Teto do resultado da multiplicação. Mantém as contas em território simples
  // para a faixa etária: 3 × 3 × 3 = 27 passa, 4 × 4 × 3 = 48 é recusado na
  // autoria da fase em vez de virar um desafio impossível na tela.
  const LIMITE_MULTIPLICACAO = 30;

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
  // REGISTRO DAS OPERAÇÕES
  // math.js localiza a operação da fase por OPERACOES[config.operacao].
  // ==========================================================
  const OPERACOES = {
    [SOMA.id]: SOMA,
    [SUBTRACAO.id]: SUBTRACAO,
    [MULTIPLICACAO.id]: MULTIPLICACAO,
  };

  if (typeof window !== "undefined") {
    window.OPERACOES = OPERACOES;
  }

  // Permite testar as regras das operações fora do navegador, sem DOM.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = OPERACOES;
  }
})();
