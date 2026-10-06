/**
 * @file mundos/mundo4.js
 * @description Dados e configurações do Mundo 4 — Acampamento.
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — MUNDO 4 (ACAMPAMENTO)
 * ============================================================================
 * Este arquivo concentra os dados específicos do Mundo 4:
 * - Catálogo de modelos de objetos (Mochila e Comida);
 * - Mapeamento de cestas e sprites da pasta sprites_cestas_4;
 * - Configurações das 3 fases progressivas com a operação de Divisão;
 * - Auto-registro em window.MUNDOS[4].
 *
 * OPERAÇÃO: DIVISÃO. Cada fase declara operacao: "divisao" e math.js resolve a
 * conta pela operação correspondente em js/operacoes.js.
 *
 * ⚠️ A ORDEM DO ARRAY "categorias" É SIGNIFICATIVA NESTE MUNDO.
 * Como na subtração do Mundo 2, a ordem declarada é a ordem dos termos: a
 * primeira categoria é o DIVIDENDO e a segunda é o DIVISOR. Inverter as duas
 * muda a conta. Aqui Comida é sempre o dividendo e Mochila sempre o divisor.
 *
 * As cotas de cada fase são os termos da conta. js/operacoes.js exige divisão
 * exata e recusa divisor zero ou resto, acusando no console.
 * ============================================================================
 */

(function () {
  // ==========================================================
  // FUNDOS DE TELA DO MUNDO 4 (ACAMPAMENTO)
  // ==========================================================
  const FUNDO_MUNDO_4_BAGUNCADO = "assets/images/mundo_4/acampamento_bagunçado.png";
  const FUNDO_MUNDO_4_ARRUMADO = "assets/images/mundo_4/acampamento.png";

  // ==========================================================
  // CATÁLOGO DE MODELOS DISPONÍVEIS POR CATEGORIA
  // ==========================================================
  const MODELOS_COMIDA = [
    {
      baseId: "marshmellow",
      category: "comida",
      itemName: "o marshmallow",
      ariaLabel: "Marshmallow. Arraste para a cesta de comida.",
      imgSrc: "assets/images/mundo_4/marshmellow.png",
      imgAlt: "Marshmallow",
    },
    {
      baseId: "pao",
      category: "comida",
      itemName: "o pão",
      ariaLabel: "Pão. Arraste para a cesta de comida.",
      imgSrc: "assets/images/mundo_4/pao.png",
      imgAlt: "Pão",
    },
    {
      baseId: "maca",
      category: "comida",
      itemName: "a maçã",
      ariaLabel: "Maçã. Arraste para a cesta de comida.",
      imgSrc: "assets/images/mundo_4/maça.png",
      imgAlt: "Maçã",
    },
  ];

  const MODELOS_MOCHILA = [
    {
      baseId: "binoculos",
      category: "mochila",
      itemName: "os binóculos",
      ariaLabel: "Binóculos. Arraste para a mochila.",
      imgSrc: "assets/images/mundo_4/binoculos.png",
      imgAlt: "Binóculos",
    },
    {
      baseId: "chapeu",
      category: "mochila",
      itemName: "o chapéu",
      ariaLabel: "Chapéu. Arraste para a mochila.",
      imgSrc: "assets/images/mundo_4/chapeu.png",
      imgAlt: "Chapéu",
    },
  ];

  // ==========================================================
  // FUNÇÕES DE GERAÇÃO DINÂMICA DE ITENS
  // As cotas seguem a ordem das categorias: Comida (dividendo), Mochila (divisor).
  // ==========================================================
  function getGerarItensFaseFn() {
    if (typeof gerarItensFase === "function") return gerarItensFase;
    if (typeof window !== "undefined" && typeof window.gerarItensFase === "function") return window.gerarItensFase;
    return null;
  }

  function gerarItensMundo4Fase1() {
    const fn = getGerarItensFaseFn();
    // Fase 1: 4 itens Comida / 4 itens Mochila — conta 4 ÷ 4 = 1
    return fn ? fn([
      { categoria: "comida", quantidade: 4, modelos: MODELOS_COMIDA },
      { categoria: "mochila", quantidade: 4, modelos: MODELOS_MOCHILA },
    ]) : [];
  }

  function gerarItensMundo4Fase2() {
    const fn = getGerarItensFaseFn();
    // Fase 2: 9 itens Comida / 3 itens Mochila — conta 9 ÷ 3 = 3
    return fn ? fn([
      { categoria: "comida", quantidade: 9, modelos: MODELOS_COMIDA },
      { categoria: "mochila", quantidade: 3, modelos: MODELOS_MOCHILA },
    ]) : [];
  }

  function gerarItensMundo4Fase3() {
    const fn = getGerarItensFaseFn();
    // Fase 3: 10 itens Comida / 5 itens Mochila — conta 10 ÷ 5 = 2
    return fn ? fn([
      { categoria: "comida", quantidade: 10, modelos: MODELOS_COMIDA },
      { categoria: "mochila", quantidade: 5, modelos: MODELOS_MOCHILA },
    ]) : [];
  }

  // ==========================================================
  // SPRITES DAS CESTAS DO MUNDO 4
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

  const SPRITES_MOCHILA_MUNDO4 = [
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
  // CONFIGURAÇÃO DA FASE 1 (Mundo 4 — Acampamento)
  // 2 Categorias (Comida e Mochila) | 8 Objetos no total
  // Divisão: 4 ÷ 4 = 1  (dividendo: Comida, divisor: Mochila)
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
        id: "cesta-comida",
        accepts: "comida",
        nome: "Comida",
        ariaLabel: "Cesta de comida do acampamento",
        icone: "🍎",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_comida.png",
        etiquetaImgAlt: "Categoria Comida",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-mochila",
        accepts: "mochila",
        nome: "Mochila",
        ariaLabel: "Mochila de acampamento",
        icone: "🎒",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_mochila.png",
        etiquetaImgAlt: "Categoria Mochila",
        sprites: SPRITES_MOCHILA_MUNDO4,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 2 (Mundo 4 — Acampamento)
  // 2 Categorias (Comida e Mochila) | 12 Objetos no total
  // Divisão: 9 ÷ 3 = 3  (dividendo: Comida, divisor: Mochila)
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
        id: "cesta-comida",
        accepts: "comida",
        nome: "Comida",
        ariaLabel: "Cesta de comida do acampamento",
        icone: "🍎",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_comida.png",
        etiquetaImgAlt: "Categoria Comida",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-mochila",
        accepts: "mochila",
        nome: "Mochila",
        ariaLabel: "Mochila de acampamento",
        icone: "🎒",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_mochila.png",
        etiquetaImgAlt: "Categoria Mochila",
        sprites: SPRITES_MOCHILA_MUNDO4,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 3 (Mundo 4 — Acampamento)
  // 2 Categorias (Comida e Mochila) | 15 Objetos no total
  // Divisão: 10 ÷ 5 = 2  (dividendo: Comida, divisor: Mochila)
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
        id: "cesta-comida",
        accepts: "comida",
        nome: "Comida",
        ariaLabel: "Cesta de comida do acampamento",
        icone: "🍎",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_comida.png",
        etiquetaImgAlt: "Categoria Comida",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-mochila",
        accepts: "mochila",
        nome: "Mochila",
        ariaLabel: "Mochila de acampamento",
        icone: "🎒",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_4/botton_mochila.png",
        etiquetaImgAlt: "Categoria Mochila",
        sprites: SPRITES_MOCHILA_MUNDO4,
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
