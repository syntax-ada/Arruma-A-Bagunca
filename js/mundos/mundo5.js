/**
 * @file mundos/mundo5.js
 * @description Dados e configurações do Mundo 5 — Desafio Final (fase bônus).
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — MUNDO 5 (DESAFIO FINAL)
 * ============================================================================
 * Este arquivo concentra os dados específicos do Mundo 5:
 * - Os CINCO desafios matemáticos do desafio final (o conteúdo central daqui);
 * - Catálogo de modelos de objetos e sprites de cesta (provisórios);
 * - Configuração da única fase;
 * - Auto-registro em window.MUNDOS[5].
 *
 * Como nos demais mundos, aqui não entra lógica: nem cálculo, nem fluxo de
 * jogo, nem DOM. O motor (game.js, math.js) consome estes dados.
 *
 * ----------------------------------------------------------------------------
 * UMA FASE, CINCO DESAFIOS
 * ----------------------------------------------------------------------------
 * Diferente dos Mundos 1–4, que têm 3 fases com uma conta cada, o Mundo 5 tem
 * UMA fase que reúne cinco contas — por isso totalFases: 1.
 *
 * As cinco contas são EXPRESSÕES COMPOSTAS (mais de um operador na mesma
 * conta). Quem as resolve e valida é a operação "composta" de js/operacoes.js,
 * que já respeita a precedência convencional: × e ÷ antes de + e −, e, entre
 * operações de mesma prioridade, da esquerda para a direita.
 *
 * ----------------------------------------------------------------------------
 * ⚠️ O QUE AINDA É PROVISÓRIO NESTE ARQUIVO
 * ----------------------------------------------------------------------------
 * O design do Boss ainda não existe. Para que o mundo possa ser carregado e
 * testado, a fase reaproveita TEMPORARIAMENTE o cenário do Mundo 3 (Praia):
 * fundos, modelos de objetos, categorias e sprites de cesta. Cada arquivo de
 * mundo é uma IIFE fechada, então os dados do mundo3.js não são importáveis:
 * eles são redeclarados aqui, como manda o padrão do projeto (o mundo4.js faz
 * o mesmo). Ao definir a arte real, troque modelos, sprites, fundos e
 * etiquetas — nada fora deste arquivo depende deles.
 *
 * Também provisório: o campo "operacao" da fase. Enquanto o motor não souber
 * percorrer a lista "desafios", ele continua montando UMA conta simples a
 * partir das quantidades organizadas — então a fase declara "multiplicacao",
 * igual à Fase 1 do Mundo 3 que ela reaproveita, e segue jogável do começo ao
 * fim. A lista "desafios" abaixo fica declarada e ainda não é consumida; ligá-la
 * ao motor é a etapa seguinte, e é lá que este campo deixa de fazer sentido.
 * ============================================================================
 */

(function () {
  // ==========================================================
  // FUNDOS DE TELA (Sala à noite)
  // ==========================================================
  const FUNDO_MUNDO_5 = "assets/images/mundo_5/sala_noite.jpeg";

  // ==========================================================
  // OS CINCO DESAFIOS DO DESAFIO FINAL
  // ==========================================================
  // Este é o conteúdo central do arquivo. Cada desafio é uma expressão
  // composta, declarada como dois arrays alinhados:
  //
  //   valores     → as parcelas da conta, na ordem em que aparecem
  //   operadores  → o operador de cada lacuna ENTRE as parcelas
  //
  // Daí o invariante: operadores.length === valores.length - 1.
  //
  // Não há cálculo aqui. "resultadoEsperado" não monta a conta e não é
  // necessário ao motor: ele existe como conferência de autoria, para que um
  // erro de digitação nos valores possa ser percebido comparando-o com o
  // resultado que a operação "composta" calcula.
  const DESAFIOS_MUNDO_5 = [
    // C1 — 9 + 8 − 2
    { valores: [9, 8, 2], operadores: ["+", "-"], resultadoEsperado: 15 },

    // C2 — 4 × 3 + 3   (× antes de +)
    { valores: [4, 3, 3], operadores: ["×", "+"], resultadoEsperado: 15 },

    // C3 — 8 ÷ 4 − 1   (÷ antes de −)
    { valores: [8, 4, 1], operadores: ["÷", "-"], resultadoEsperado: 1 },

    // C4 — 2 × 5 + 2 − 1   (× antes de + e −)
    { valores: [2, 5, 2, 1], operadores: ["×", "+", "-"], resultadoEsperado: 11 },

    // C5 — 20 ÷ 4 + 6 − 2   (÷ antes de + e −)
    { valores: [20, 4, 6, 2], operadores: ["÷", "+", "-"], resultadoEsperado: 9 },
  ];

  // ==========================================================
  // CATÁLOGO DE MODELOS DISPONÍVEIS POR CATEGORIA (MUNDO 5)
  // ==========================================================
  const MODELOS_BEBIDAS = [
    {
      baseId: "agua",
      category: "bebidas",
      itemName: "a água",
      ariaLabel: "Garrafa de água mineral. Arraste para a cesta de bebidas.",
      imgSrc: "assets/images/mundo_5/sprites_mundo5/agua.png",
      imgAlt: "Garrafa de água",
    },
    {
      baseId: "coca",
      category: "bebidas",
      itemName: "o refrigerante",
      ariaLabel: "Lata de refrigerante. Arraste para a cesta de bebidas.",
      imgSrc: "assets/images/mundo_5/sprites_mundo5/coca.png",
      imgAlt: "Lata de refrigerante",
    },
    {
      baseId: "refri-laranja",
      category: "bebidas",
      itemName: "o refrigerante de laranja",
      ariaLabel: "Garrafa de suco de laranja. Arraste para a cesta de bebidas.",
      imgSrc: "assets/images/mundo_5/sprites_mundo5/refri_laranja.png",
      imgAlt: "Refrigerante de laranja",
    },
  ];

  const MODELOS_BRINQUEDOS = [
    {
      baseId: "bola-volei",
      category: "brinquedos",
      itemName: "a bola de vôlei",
      ariaLabel: "Bola de vôlei. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/mundo_5/sprites_mundo5/bola de volei.png",
      imgAlt: "Bola de vôlei",
    },
    {
      baseId: "robo",
      category: "brinquedos",
      itemName: "o robô",
      ariaLabel: "Robô de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/mundo_5/sprites_mundo5/robo.png",
      imgAlt: "Robô de brinquedo",
    },
    {
      baseId: "urso",
      category: "brinquedos",
      itemName: "o ursinho de pelúcia",
      ariaLabel: "Ursinho de pelúcia. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/mundo_5/sprites_mundo5/urso.png",
      imgAlt: "Ursinho de pelúcia",
    },
    {
      baseId: "tremzinho",
      category: "brinquedos",
      itemName: "o trenzinho",
      ariaLabel: "Trenzinho de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/mundo_5/sprites_mundo5/tremzinho.png",
      imgAlt: "Trenzinho de brinquedo",
    },
  ];

  // ==========================================================
  // GERAÇÃO DINÂMICA DE ITENS
  // As cotas seguem a mesma ordem do array "categorias" da fase. O gerador
  // genérico vive em game.js e é compartilhado por todos os mundos.
  // ==========================================================
  function getGerarItensFaseFn() {
    if (typeof gerarItensFase === "function") return gerarItensFase;
    if (typeof window !== "undefined" && typeof window.gerarItensFase === "function") return window.gerarItensFase;
    return null;
  }

  function gerarItensMundo5Fase1() {
    const fn = getGerarItensFaseFn();
    return fn ? fn([
      { categoria: "brinquedos", quantidade: 3, modelos: MODELOS_BRINQUEDOS },
      { categoria: "bebidas", quantidade: 3, modelos: MODELOS_BEBIDAS },
    ]) : [];
  }

  // ==========================================================
  // CESTAS UNIFICADAS DO MUNDO 5 (DESAFIO FINAL)
  // Imagens unificadas contendo cesto, etiqueta e bolinha de contagem
  // ==========================================================
  const SPRITES_CESTA_BEBIDAS_MUNDO5 = "assets/images/mundo_5/sprites_mundo5/cesta_bebidas.png";
  const SPRITES_CESTA_BRINQUEDOS_MUNDO5 = "assets/images/mundo_5/sprites_mundo5/cesta_brinquedos.png";

  // ==========================================================
  // CONFIGURAÇÃO DA FASE ÚNICA (Mundo 5 — Desafio Final)
  // Cenário Noturno | 2 Categorias | 6 Objetos no total
  // ==========================================================
  const CONFIG_FASE_1_MUNDO_5 = {
    operacao: "composta",

    // Os cinco desafios do desafio final, declarados aqui, na fase que os usa.
    desafios: DESAFIOS_MUNDO_5,

    // Adversário da fase. Declarar este campo é o que faz a área do Boss e os
    // corações aparecerem.
    boss: {
      nome: "Monstro da Bagunça",
      imgSrc: "assets/images/mundo_5/sprites_mundo5/monstro.png",
      imgAlt: "Monstro da Bagunça",
    },

    fundo: FUNDO_MUNDO_5,
    fundoBaguncado: FUNDO_MUNDO_5,
    fundoArrumado: FUNDO_MUNDO_5,
    gerarObjetos: gerarItensMundo5Fase1,
    get objetos() {
      return gerarItensMundo5Fase1();
    },
    categorias: [
      {
        id: "cesta-brinquedos",
        accepts: "brinquedos",
        nome: "Brinquedos",
        ariaLabel: "Cesta de brinquedos",
        icone: "🏐",
        posicao: "esq-centro",
        sprites: SPRITES_CESTA_BRINQUEDOS_MUNDO5,
      },
      {
        id: "cesta-bebidas",
        accepts: "bebidas",
        nome: "Bebidas",
        ariaLabel: "Cesta de bebidas",
        icone: "🥤",
        posicao: "dir-centro",
        sprites: SPRITES_CESTA_BEBIDAS_MUNDO5,
      },
    ],
  };

  // ==========================================================
  // DEFINIÇÃO DO MUNDO 5
  // Uma única fase, que reúne os cinco desafios.
  // ==========================================================
  const MUNDO_5 = {
    id: 5,
    nome: "Desafio Final",
    totalFases: 1,
    html: "fase1.html",
    fases: {
      1: CONFIG_FASE_1_MUNDO_5,
    },
  };

  // ==========================================================
  // REGISTRO DO MUNDO
  // Permite que main.js e dev.js localizem este mundo por MUNDOS[5].
  // ==========================================================
  if (typeof window !== "undefined") {
    window.MUNDOS = window.MUNDOS || {};
    window.MUNDOS[MUNDO_5.id] = MUNDO_5;
    window.MUNDO_5 = MUNDO_5;
  }
})();
