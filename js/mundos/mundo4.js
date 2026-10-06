/**
 * @file mundos/mundo4.js
 * @description Dados e configurações do Mundo 4 — Acampamento.
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — MUNDO 4 (ACAMPAMENTO)
 * ============================================================================
 * Este arquivo concentra os dados específicos do Mundo 4:
 * - Catálogo de modelos de objetos;
 * - Mapeamento de cestas e sprites;
 * - Configurações das 3 fases;
 * - Auto-registro em window.MUNDOS[4].
 *
 * TEMA: ACAMPAMENTO. As categorias são Comidas (maçã, pão e marshmallow) e
 * Mochila (chapéu, binóculos e mapa), e toda a arte vem de
 * assets/images/mundo_4/. Cada arquivo de mundo é uma IIFE fechada, então os
 * dados dos outros mundos não são importáveis: eles são redeclarados aqui,
 * como manda o padrão do projeto.
 *
 * OPERAÇÃO: DIVISÃO. Cada fase declara operacao: "divisao" e math.js resolve a
 * conta pela operação correspondente em js/operacoes.js.
 *
 * ⚠️ A ORDEM DO ARRAY "categorias" É SIGNIFICATIVA NESTE MUNDO.
 * Como na subtração do Mundo 2, a ordem declarada é a ordem dos termos: a
 * primeira categoria é o DIVIDENDO e a segunda é o DIVISOR. Inverter as duas
 * muda a conta. Aqui Comidas é sempre o dividendo e Mochila sempre o divisor.
 *
 * As cotas de cada fase são os termos da conta. js/operacoes.js exige divisão
 * exata e recusa divisor zero ou resto, acusando no console.
 * ============================================================================
 */

(function () {
  // ==========================================================
  // FUNDOS DE TELA
  // ==========================================================
  const FUNDO_MUNDO_4_BAGUNCADO = "assets/images/mundo_4/acampamento_bagunçado.png";
  const FUNDO_MUNDO_4_ARRUMADO = "assets/images/mundo_4/acampamento.png";

  // ==========================================================
  // CATÁLOGO DE MODELOS DISPONÍVEIS POR CATEGORIA
  // ==========================================================
  const MODELOS_COMIDAS = [
    {
      baseId: "pao",
      category: "comidas",
      itemName: "o pão",
      ariaLabel: "Pão. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_4/pao.png",
      imgAlt: "Pão",
    },
    {
      baseId: "maca",
      category: "comidas",
      itemName: "a maçã",
      ariaLabel: "Maçã. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_4/maça.png",
      imgAlt: "Maçã",
    },
    {
      baseId: "marshmallow",
      category: "comidas",
      itemName: "o marshmallow",
      ariaLabel: "Marshmallow no espeto. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_4/marshmellow.png",
      imgAlt: "Marshmallow no espeto",
    },
  ];

  const MODELOS_MOCHILA = [
    {
      baseId: "chapeu",
      category: "mochila",
      itemName: "o chapéu",
      ariaLabel: "Chapéu de explorador. Arraste para a mochila.",
      imgSrc: "assets/images/mundo_4/chapeu.png",
      imgAlt: "Chapéu de explorador",
    },
    {
      baseId: "binoculos",
      category: "mochila",
      itemName: "o binóculo",
      ariaLabel: "Binóculos. Arraste para a mochila.",
      imgSrc: "assets/images/mundo_4/binoculos.png",
      imgAlt: "Binóculos",
    },
    {
      baseId: "mapa",
      category: "mochila",
      itemName: "o mapa",
      ariaLabel: "Mapa do acampamento. Arraste para a mochila.",
      imgSrc: "assets/images/mundo_4/Group 499.png",
      imgAlt: "Mapa do acampamento",
    },
  ];

  // ==========================================================
  // FUNÇÕES DE GERAÇÃO DINÂMICA DE ITENS
  // As cotas seguem a mesma ordem do array "categorias" da fase: a primeira é
  // o dividendo e a segunda é o divisor. Categorias com cota maior que o
  // número de modelos disponíveis repetem modelos — é esperado.
  // ==========================================================
  function getGerarItensFaseFn() {
    if (typeof gerarItensFase === "function") return gerarItensFase;
    if (typeof window !== "undefined" && typeof window.gerarItensFase === "function") return window.gerarItensFase;
    return null;
  }

  function gerarItensMundo4Fase1() {
    const fn = getGerarItensFaseFn();
    // Fase 1: 2 categorias (Comidas e Mochila) com 8 itens — conta 4 ÷ 4 = 1
    return fn ? fn([
      { categoria: "comidas", quantidade: 4, modelos: MODELOS_COMIDAS },
      { categoria: "mochila", quantidade: 4, modelos: MODELOS_MOCHILA },
    ]) : [];
  }

  function gerarItensMundo4Fase2() {
    const fn = getGerarItensFaseFn();
    // Fase 2: 2 categorias (Comidas e Mochila) com 12 itens — conta 9 ÷ 3 = 3
    return fn ? fn([
      { categoria: "comidas", quantidade: 9, modelos: MODELOS_COMIDAS },
      { categoria: "mochila", quantidade: 3, modelos: MODELOS_MOCHILA },
    ]) : [];
  }

  function gerarItensMundo4Fase3() {
    const fn = getGerarItensFaseFn();
    // Fase 3: 2 categorias (Comidas e Mochila) com 15 itens — conta 10 ÷ 5 = 2
    return fn ? fn([
      { categoria: "comidas", quantidade: 10, modelos: MODELOS_COMIDAS },
      { categoria: "mochila", quantidade: 5, modelos: MODELOS_MOCHILA },
    ]) : [];
  }

  // ==========================================================
  // SPRITES DAS CESTAS
  // ==========================================================
  const SPRITES_CESTA_COMIDAS_MUNDO4 = [
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-0.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-1.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-2.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-3.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-4.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-5.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-6.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-7.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-8.png",
    "assets/images/mundo_4/sprites_cestas_4/cesta_comida_praia-9.png",
  ];

  const SPRITES_CESTA_MOCHILA_MUNDO4 = [
    "assets/images/mundo_4/sprites_cestas_4/mochila-0.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-1.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-2.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-3.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-4.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-5.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-6.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-7.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-8.png",
    "assets/images/mundo_4/sprites_cestas_4/mochila-9.png",
  ];

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 1 (Mundo 4)
  // 2 Categorias (Comidas e Mochila) | 8 Objetos no total
  // Divisão: 4 ÷ 4 = 1  (dividendo: Comidas, divisor: Mochila)
  // ==========================================================
  const CONFIG_FASE_1_MUNDO_4 = {
    operacao: "divisao",
    fundo: FUNDO_MUNDO_4_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_4_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_4_ARRUMADO,
    gerarObjetos: gerarItensMundo4Fase1,
    get objetos() {
      return gerarItensMundo4Fase1();
    },
    categorias: [
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas",
        icone: "🍎",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-mochila",
        accepts: "mochila",
        nome: "Mochila",
        ariaLabel: "Mochila do acampamento",
        icone: "🎒",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_mochila.png",
        etiquetaImgAlt: "Categoria Mochila",
        sprites: SPRITES_CESTA_MOCHILA_MUNDO4,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 2 (Mundo 4)
  // 2 Categorias (Comidas e Mochila) | 12 Objetos no total
  // Divisão: 9 ÷ 3 = 3  (dividendo: Comidas, divisor: Mochila)
  // ==========================================================
  const CONFIG_FASE_2_MUNDO_4 = {
    operacao: "divisao",
    fundo: FUNDO_MUNDO_4_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_4_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_4_ARRUMADO,
    gerarObjetos: gerarItensMundo4Fase2,
    get objetos() {
      return gerarItensMundo4Fase2();
    },
    categorias: [
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas",
        icone: "🍎",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-mochila",
        accepts: "mochila",
        nome: "Mochila",
        ariaLabel: "Mochila do acampamento",
        icone: "🎒",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_mochila.png",
        etiquetaImgAlt: "Categoria Mochila",
        sprites: SPRITES_CESTA_MOCHILA_MUNDO4,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 3 (Mundo 4)
  // 2 Categorias (Comidas e Mochila) | 15 Objetos no total
  // Divisão: 10 ÷ 5 = 2  (dividendo: Comidas, divisor: Mochila)
  // ==========================================================
  const CONFIG_FASE_3_MUNDO_4 = {
    operacao: "divisao",
    fundo: FUNDO_MUNDO_4_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_4_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_4_ARRUMADO,
    gerarObjetos: gerarItensMundo4Fase3,
    get objetos() {
      return gerarItensMundo4Fase3();
    },
    categorias: [
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas",
        icone: "🍎",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-mochila",
        accepts: "mochila",
        nome: "Mochila",
        ariaLabel: "Mochila do acampamento",
        icone: "🎒",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_mochila.png",
        etiquetaImgAlt: "Categoria Mochila",
        sprites: SPRITES_CESTA_MOCHILA_MUNDO4,
      },
    ],
  };

  // ==========================================================
  // DEFINIÇÃO DO MUNDO 4
  // ==========================================================
  const MUNDO_4 = {
    id: 4,
    nome: "Acampamento",
    totalFases: 3,
    html: "fase1.html",
    fases: {
      1: CONFIG_FASE_1_MUNDO_4,
      2: CONFIG_FASE_2_MUNDO_4,
      3: CONFIG_FASE_3_MUNDO_4,
    },
  };

  // ==========================================================
  // REGISTRO DO MUNDO
  // Permite que main.js e dev.js localizem este mundo por MUNDOS[4].
  // ==========================================================
  if (typeof window !== "undefined") {
    window.MUNDOS = window.MUNDOS || {};
    window.MUNDOS[MUNDO_4.id] = MUNDO_4;
    window.MUNDO_4 = MUNDO_4;
  }
})();
