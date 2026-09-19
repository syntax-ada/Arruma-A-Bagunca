/**
 * @file mundos/mundo3.js
 * @description Dados e configurações do Mundo 3 — Praia.
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — MUNDO 3 (PRAIA)
 * ============================================================================
 * Este arquivo concentra os dados específicos do Mundo 3:
 * - Catálogo de modelos de objetos (Bebidas, Comidas e Brinquedos);
 * - Mapeamento de cestas e sprites da pasta sprites_cestas_3;
 * - Configurações das 3 fases progressivas;
 * - Auto-registro em window.MUNDOS[3].
 *
 * TODO: Back-end substituirá por lógica de multiplicação/divisão futuramente.
 * ============================================================================
 */

(function () {
  // ==========================================================
  // FUNDOS DE TELA DO MUNDO 3 (PRAIA)
  // ==========================================================
  const FUNDO_MUNDO_3_BAGUNCADO = "assets/images/mundo_3/praia_bagunçado.png";
  const FUNDO_MUNDO_3_ARRUMADO = "assets/images/mundo_3/praia.png";

  // ==========================================================
  // CATÁLOGO DE MODELOS DISPONÍVEIS POR CATEGORIA
  // ==========================================================
  const MODELOS_BEBIDAS = [
    {
      baseId: "agua",
      category: "bebidas",
      itemName: "a água",
      ariaLabel: "Garrafa de água mineral. Arraste para a cesta de bebidas.",
      imgSrc: "assets/images/mundo_3/agua.png",
      imgAlt: "Garrafa de água",
    },
    {
      baseId: "coca",
      category: "bebidas",
      itemName: "o refrigerante",
      ariaLabel: "Lata de refrigerante. Arraste para a cesta de bebidas.",
      imgSrc: "assets/images/mundo_3/coca.png",
      imgAlt: "Lata de refrigerante",
    },
  ];

  const MODELOS_COMIDAS = [
    {
      baseId: "algodao-doce",
      category: "comidas",
      itemName: "o algodão doce",
      ariaLabel: "Algodão doce. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_3/algodão_doce.png",
      imgAlt: "Algodão doce",
    },
    {
      baseId: "maca",
      category: "comidas",
      itemName: "a maçã",
      ariaLabel: "Maçã. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_3/maça.png",
      imgAlt: "Maçã",
    },
    {
      baseId: "sorvete",
      category: "comidas",
      itemName: "o sorvete",
      ariaLabel: "Casquinha de sorvete. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_3/sorvete.png",
      imgAlt: "Sorvete",
    },
  ];

  const MODELOS_BRINQUEDOS = [
    {
      baseId: "bola-volei",
      category: "brinquedos",
      itemName: "a bola de vôlei",
      ariaLabel: "Bola de vôlei. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/mundo_3/bola de volei.png",
      imgAlt: "Bola de vôlei",
    },
    {
      baseId: "robo",
      category: "brinquedos",
      itemName: "o robô",
      ariaLabel: "Robô de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/mundo_3/robo.png",
      imgAlt: "Robô de brinquedo",
    },
  ];

  // ==========================================================
  // FUNÇÕES DE GERAÇÃO DINÂMICA DE ITENS
  // ==========================================================
  function getGerarItensFaseFn() {
    if (typeof gerarItensFase === "function") return gerarItensFase;
    if (typeof window !== "undefined" && typeof window.gerarItensFase === "function") return window.gerarItensFase;
    return null;
  }

  function gerarItensMundo3Fase1() {
    const fn = getGerarItensFaseFn();
    // Fase 1: 2 categorias (Bebidas e Comidas) com 6 itens (3 de cada)
    return fn ? fn([
      { categoria: "bebidas", quantidade: 3, modelos: MODELOS_BEBIDAS },
      { categoria: "comidas", quantidade: 3, modelos: MODELOS_COMIDAS },
    ]) : [];
  }

  function gerarItensMundo3Fase2() {
    const fn = getGerarItensFaseFn();
    // Fase 2: 3 categorias (Bebidas, Comidas e Brinquedos) com 9 itens (3 de cada)
    return fn ? fn([
      { categoria: "bebidas", quantidade: 3, modelos: MODELOS_BEBIDAS },
      { categoria: "comidas", quantidade: 3, modelos: MODELOS_COMIDAS },
      { categoria: "brinquedos", quantidade: 3, modelos: MODELOS_BRINQUEDOS },
    ]) : [];
  }

  function gerarItensMundo3Fase3() {
    const fn = getGerarItensFaseFn();
    // Fase 3: 3 categorias com 12 itens distribuídos (4 de cada)
    return fn ? fn([
      { categoria: "bebidas", quantidade: 4, modelos: MODELOS_BEBIDAS },
      { categoria: "comidas", quantidade: 4, modelos: MODELOS_COMIDAS },
      { categoria: "brinquedos", quantidade: 4, modelos: MODELOS_BRINQUEDOS },
    ]) : [];
  }

  // ==========================================================
  // SPRITES DAS CESTAS DO MUNDO 3
  // ==========================================================
  const SPRITES_CESTA_BEBIDAS_MUNDO3 = [
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-0.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-1.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-2.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-3.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-4.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-5.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-6.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-7.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-8.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_bebida_praia-9.png",
  ];

  const SPRITES_CESTA_COMIDAS_MUNDO3 = [
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-0.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-1.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-2.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-3.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-4.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-5.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-6.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-7.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-8.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_comida_praia-9.png",
  ];

  const SPRITES_CESTA_BRINQUEDOS_MUNDO3 = [
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-0.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-1.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-2.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-3.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-4.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-5.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-6.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-7.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-8.png",
    "assets/images/mundo_3/sprites_cestas_3/cesta_brinquedo_praia-9.png",
  ];

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 1 (Mundo 3 — Praia)
  // 2 Categorias (Bebidas e Comidas) | 6 Objetos no total
  // ==========================================================
  const CONFIG_FASE_1_MUNDO_3 = {
    fundo: FUNDO_MUNDO_3_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_3_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_3_ARRUMADO,
    gerarObjetos: gerarItensMundo3Fase1,
    get objetos() {
      return gerarItensMundo3Fase1();
    },
    categorias: [
      {
        id: "cesta-bebidas",
        accepts: "bebidas",
        nome: "Bebidas",
        ariaLabel: "Cesta de bebidas da praia",
        icone: "🥤",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_bebidas.png",
        etiquetaImgAlt: "Categoria Bebidas",
        sprites: SPRITES_CESTA_BEBIDAS_MUNDO3,
      },
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas da praia",
        icone: "🍦",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO3,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 2 (Mundo 3 — Praia)
  // 3 Categorias (Bebidas, Comidas e Brinquedos) | 9 Objetos no total
  // ==========================================================
  const CONFIG_FASE_2_MUNDO_3 = {
    fundo: FUNDO_MUNDO_3_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_3_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_3_ARRUMADO,
    gerarObjetos: gerarItensMundo3Fase2,
    get objetos() {
      return gerarItensMundo3Fase2();
    },
    categorias: [
      {
        id: "cesta-bebidas",
        accepts: "bebidas",
        nome: "Bebidas",
        ariaLabel: "Cesta de bebidas da praia",
        icone: "🥤",
        posicao: "esq-topo",
        etiquetaImgSrc: "assets/images/mundo_3/botton_bebidas.png",
        etiquetaImgAlt: "Categoria Bebidas",
        sprites: SPRITES_CESTA_BEBIDAS_MUNDO3,
      },
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas da praia",
        icone: "🍦",
        posicao: "esq-base",
        etiquetaImgSrc: "assets/images/mundo_3/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO3,
      },
      {
        id: "cesta-brinquedos",
        accepts: "brinquedos",
        nome: "Brinquedos",
        ariaLabel: "Cesta de brinquedos da praia",
        icone: "🏐",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_brinquedos.png",
        etiquetaImgAlt: "Categoria Brinquedos",
        sprites: SPRITES_CESTA_BRINQUEDOS_MUNDO3,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 3 (Mundo 3 — Praia)
  // 3 Categorias (Bebidas, Comidas e Brinquedos) | 12 Objetos no total
  // ==========================================================
  const CONFIG_FASE_3_MUNDO_3 = {
    fundo: FUNDO_MUNDO_3_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_3_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_3_ARRUMADO,
    gerarObjetos: gerarItensMundo3Fase3,
    get objetos() {
      return gerarItensMundo3Fase3();
    },
    categorias: [
      {
        id: "cesta-bebidas",
        accepts: "bebidas",
        nome: "Bebidas",
        ariaLabel: "Cesta de bebidas da praia",
        icone: "🥤",
        posicao: "esq-topo",
        etiquetaImgSrc: "assets/images/mundo_3/botton_bebidas.png",
        etiquetaImgAlt: "Categoria Bebidas",
        sprites: SPRITES_CESTA_BEBIDAS_MUNDO3,
      },
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas da praia",
        icone: "🍦",
        posicao: "esq-base",
        etiquetaImgSrc: "assets/images/mundo_3/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO3,
      },
      {
        id: "cesta-brinquedos",
        accepts: "brinquedos",
        nome: "Brinquedos",
        ariaLabel: "Cesta de brinquedos da praia",
        icone: "🏐",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_brinquedos.png",
        etiquetaImgAlt: "Categoria Brinquedos",
        sprites: SPRITES_CESTA_BRINQUEDOS_MUNDO3,
      },
    ],
  };

  // ==========================================================
  // DEFINIÇÃO DO MUNDO 3
  // ==========================================================
  const MUNDO_3 = {
    id: 3,
    nome: "Praia",
    totalFases: 3,
    html: "fase1.html",
    fases: {
      1: CONFIG_FASE_1_MUNDO_3,
      2: CONFIG_FASE_2_MUNDO_3,
      3: CONFIG_FASE_3_MUNDO_3,
    },
  };

  // ==========================================================
  // REGISTRO DO MUNDO
  // Permite que main.js e dev.js localizem este mundo por MUNDOS[3].
  // ==========================================================
  if (typeof window !== "undefined") {
    window.MUNDOS = window.MUNDOS || {};
    window.MUNDOS[MUNDO_3.id] = MUNDO_3;
    window.MUNDO_3 = MUNDO_3;
  }
})();

