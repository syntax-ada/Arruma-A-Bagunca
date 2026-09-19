/**
 * @file mundos/mundo2.js
 * @description Dados e configurações do Mundo 2 — Parque.
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — MUNDO 2 (PARQUE)
 * ============================================================================
 * Este arquivo concentra os dados específicos do Mundo 2:
 * - Catálogo de modelos de objetos (Comidas, Animais e Brinquedos);
 * - Mapeamento de cestas e sprites da pasta sprites_cestas_2;
 * - Configurações das 3 fases progressivas;
 * - Auto-registro em window.MUNDOS[2].
 *
 * TODO: Back-end substituirá por lógica de subtração futuramente.
 * ============================================================================
 */

(function () {
  // ==========================================================
  // FUNDOS DE TELA DO MUNDO 2 (PARQUE)
  // ==========================================================
  const FUNDO_MUNDO_2_BAGUNCADO = "assets/images/mundo_2/Parque piqueninque_bagunçado.png";
  const FUNDO_MUNDO_2_ARRUMADO = "assets/images/mundo_2/Parque piqueninque.png";

  // ==========================================================
  // CATÁLOGO DE MODELOS DISPONÍVEIS POR CATEGORIA
  // ==========================================================
  const MODELOS_COMIDAS = [
    {
      baseId: "hamburguer",
      category: "comidas",
      itemName: "o hambúrguer",
      ariaLabel: "Hambúrguer de lanche. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_2/hambuerguer.png",
      imgAlt: "Hambúrguer",
    },
    {
      baseId: "maca",
      category: "comidas",
      itemName: "a maçã",
      ariaLabel: "Maçã. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_2/maça.png",
      imgAlt: "Maçã",
    },
    {
      baseId: "melancia",
      category: "comidas",
      itemName: "a melancia",
      ariaLabel: "Pedaço de melancia. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/mundo_2/melancia.png",
      imgAlt: "Melancia",
    },
  ];

  const MODELOS_ANIMAIS = [
    {
      baseId: "cachorro",
      category: "animais",
      itemName: "o cachorrinho",
      ariaLabel: "Cachorrinho. Arraste para a caixa dos animais.",
      imgSrc: "assets/images/mundo_2/cachorro.png",
      imgAlt: "Cachorrinho",
    },
    {
      baseId: "gato",
      category: "animais",
      itemName: "o gatinho",
      ariaLabel: "Gatinho. Arraste para a caixa dos animais.",
      imgSrc: "assets/images/mundo_2/gato.png",
      imgAlt: "Gatinho",
    },
    {
      baseId: "passaro",
      category: "animais",
      itemName: "o passarinho",
      ariaLabel: "Passarinho. Arraste para a caixa dos animais.",
      imgSrc: "assets/images/mundo_2/passaro.png",
      imgAlt: "Passarinho",
    },
  ];

  const MODELOS_BRINQUEDOS = [
    {
      baseId: "robo",
      category: "brinquedos",
      itemName: "o robô",
      ariaLabel: "Robô de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/mundo_2/robo.png",
      imgAlt: "Robô de brinquedo",
    },
    {
      baseId: "trem",
      category: "brinquedos",
      itemName: "o trenzinho",
      ariaLabel: "Trenzinho de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/mundo_2/trem.png",
      imgAlt: "Trenzinho de brinquedo",
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

  function gerarItensMundo2Fase1() {
    const fn = getGerarItensFaseFn();
    // Fase 1: 2 categorias (Comidas e Animais) com 6 itens (3 de cada)
    return fn ? fn([
      { categoria: "comidas", quantidade: 3, modelos: MODELOS_COMIDAS },
      { categoria: "animais", quantidade: 3, modelos: MODELOS_ANIMAIS },
    ]) : [];
  }

  function gerarItensMundo2Fase2() {
    const fn = getGerarItensFaseFn();
    // Fase 2: 3 categorias (Comidas, Animais e Brinquedos) com 9 itens (3 de cada)
    return fn ? fn([
      { categoria: "comidas", quantidade: 3, modelos: MODELOS_COMIDAS },
      { categoria: "animais", quantidade: 3, modelos: MODELOS_ANIMAIS },
      { categoria: "brinquedos", quantidade: 3, modelos: MODELOS_BRINQUEDOS },
    ]) : [];
  }

  function gerarItensMundo2Fase3() {
    const fn = getGerarItensFaseFn();
    // Fase 3: 3 categorias com 12 itens distribuídos (4 de cada)
    return fn ? fn([
      { categoria: "comidas", quantidade: 4, modelos: MODELOS_COMIDAS },
      { categoria: "animais", quantidade: 4, modelos: MODELOS_ANIMAIS },
      { categoria: "brinquedos", quantidade: 4, modelos: MODELOS_BRINQUEDOS },
    ]) : [];
  }

  // ==========================================================
  // SPRITES DAS CESTAS DO MUNDO 2
  // ==========================================================
  const SPRITES_CESTA_ANIMAIS_MUNDO2 = [
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-1.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-2.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-3.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-4.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-5.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-6.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-7.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-8.png",
    "assets/images/mundo_2/sprites_cestas_2/caixa_pet_piquenique-9.png",
  ];

  const SPRITES_CESTA_BRINQUEDOS_MUNDO2 = [
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-1.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-2.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-3.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-4.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-5.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-6.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-7.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-8.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_brinquedos_piquenique-9.png",
  ];

  const SPRITES_CESTA_COMIDAS_MUNDO2 = [
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-1.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-2.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-3.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-4.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-5.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-6.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-7.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-8.png",
    "assets/images/mundo_2/sprites_cestas_2/cesta_comidas_piquenique-9.png",
  ];

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 1 (Mundo 2 — Parque)
  // 2 Categorias (Comidas e Animais) | 6 Objetos no total
  // ==========================================================
  const CONFIG_FASE_1_MUNDO_2 = {
    fundo: FUNDO_MUNDO_2_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_2_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_2_ARRUMADO,
    gerarObjetos: gerarItensMundo2Fase1,
    get objetos() {
      return gerarItensMundo2Fase1();
    },
    categorias: [
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas do piquenique",
        icone: "🍎",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_2/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO2,
      },
      {
        id: "cesta-animais",
        accepts: "animais",
        nome: "Animais",
        ariaLabel: "Caixa de animais de estimação",
        icone: "🐶",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_2/botton_animais.png",
        etiquetaImgAlt: "Categoria Animais",
        sprites: SPRITES_CESTA_ANIMAIS_MUNDO2,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 2 (Mundo 2 — Parque)
  // 3 Categorias (Comidas, Animais e Brinquedos) | 9 Objetos no total
  // ==========================================================
  const CONFIG_FASE_2_MUNDO_2 = {
    fundo: FUNDO_MUNDO_2_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_2_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_2_ARRUMADO,
    gerarObjetos: gerarItensMundo2Fase2,
    get objetos() {
      return gerarItensMundo2Fase2();
    },
    categorias: [
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas do piquenique",
        icone: "🍎",
        posicao: "esq-topo",
        etiquetaImgSrc: "assets/images/mundo_2/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO2,
      },
      {
        id: "cesta-animais",
        accepts: "animais",
        nome: "Animais",
        ariaLabel: "Caixa de animais de estimação",
        icone: "🐶",
        posicao: "esq-base",
        etiquetaImgSrc: "assets/images/mundo_2/botton_animais.png",
        etiquetaImgAlt: "Categoria Animais",
        sprites: SPRITES_CESTA_ANIMAIS_MUNDO2,
      },
      {
        id: "cesta-brinquedos",
        accepts: "brinquedos",
        nome: "Brinquedos",
        ariaLabel: "Cesta de brinquedos",
        icone: "🧸",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_2/botton_brinquedos.png",
        etiquetaImgAlt: "Categoria Brinquedos",
        sprites: SPRITES_CESTA_BRINQUEDOS_MUNDO2,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 3 (Mundo 2 — Parque)
  // 3 Categorias (Comidas, Animais e Brinquedos) | 12 Objetos no total
  // ==========================================================
  const CONFIG_FASE_3_MUNDO_2 = {
    fundo: FUNDO_MUNDO_2_BAGUNCADO,
    fundoBaguncado: FUNDO_MUNDO_2_BAGUNCADO,
    fundoArrumado: FUNDO_MUNDO_2_ARRUMADO,
    gerarObjetos: gerarItensMundo2Fase3,
    get objetos() {
      return gerarItensMundo2Fase3();
    },
    categorias: [
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas do piquenique",
        icone: "🍎",
        posicao: "esq-topo",
        etiquetaImgSrc: "assets/images/mundo_2/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO2,
      },
      {
        id: "cesta-animais",
        accepts: "animais",
        nome: "Animais",
        ariaLabel: "Caixa de animais de estimação",
        icone: "🐶",
        posicao: "esq-base",
        etiquetaImgSrc: "assets/images/mundo_2/botton_animais.png",
        etiquetaImgAlt: "Categoria Animais",
        sprites: SPRITES_CESTA_ANIMAIS_MUNDO2,
      },
      {
        id: "cesta-brinquedos",
        accepts: "brinquedos",
        nome: "Brinquedos",
        ariaLabel: "Cesta de brinquedos",
        icone: "🧸",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_2/botton_brinquedos.png",
        etiquetaImgAlt: "Categoria Brinquedos",
        sprites: SPRITES_CESTA_BRINQUEDOS_MUNDO2,
      },
    ],
  };

  // ==========================================================
  // DEFINIÇÃO DO MUNDO 2
  // ==========================================================
  const MUNDO_2 = {
    id: 2,
    nome: "Parque",
    totalFases: 3,
    html: "fase1.html",
    fases: {
      1: CONFIG_FASE_1_MUNDO_2,
      2: CONFIG_FASE_2_MUNDO_2,
      3: CONFIG_FASE_3_MUNDO_2,
    },
  };

  // ==========================================================
  // REGISTRO DO MUNDO
  // Permite que main.js e dev.js localizem este mundo por MUNDOS[2].
  // ==========================================================
  if (typeof window !== "undefined") {
    window.MUNDOS = window.MUNDOS || {};
    window.MUNDOS[MUNDO_2.id] = MUNDO_2;
    window.MUNDO_2 = MUNDO_2;
  }
})();
