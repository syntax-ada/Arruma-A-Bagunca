/**
 * @file mundos/mundo1.js
 * @description Dados e configurações do Mundo 1 — A Casa.
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — NÃO É UM MOTOR DE JOGO
 * ============================================================================
 * Este arquivo concentra APENAS os dados específicos do Mundo 1:
 * catálogo de modelos, cotas de objetos por fase e a configuração das fases.
 *
 * A lógica genérica (arraste, renderização, contagem, embaralhamento) vive em
 * game.js e é compartilhada por todos os mundos. Nada de lógica nova deve ser
 * adicionado aqui — se precisar de comportamento, ele pertence ao motor.
 *
 * O mundo se auto-registra em window.MUNDOS ao final do arquivo, para que
 * main.js consiga localizá-lo por MUNDOS[1] sem precisar conhecer seu nome.
 * Adicionar um mundo novo = criar o arquivo + carregá-lo no HTML. Nenhum
 * arquivo existente precisa ser editado.
 *
 * Carregamento: este arquivo depende de game.js apenas em tempo de CHAMADA
 * (gerarItensFase / embaralharArray), nunca em tempo de carga.
 * ============================================================================
 */

(function () {
  // ==========================================================
  // CATÁLOGO DE MODELOS DISPONÍVEIS POR CATEGORIA
  // ==========================================================
  const MODELOS_BRINQUEDOS = [
    {
      baseId: "urso",
      category: "brinquedos",
      itemName: "o ursinho",
      ariaLabel: "Ursinho de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/tela_fase1/uso 3.png",
      imgAlt: "Ursinho de brinquedo",
    },
    {
      baseId: "trenzinho",
      category: "brinquedos",
      itemName: "o trenzinho",
      ariaLabel: "Trenzinho de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/tela_fase1/tremzinho.png",
      imgAlt: "Trenzinho de brinquedo",
    },
  ];

  const MODELOS_COMIDAS = [
    {
      baseId: "banana",
      category: "comidas",
      itemName: "a banana",
      ariaLabel: "Banana. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/tela_fase1/banana.png",
      imgAlt: "Banana",
    },
    {
      baseId: "maca",
      category: "comidas",
      itemName: "a maçã",
      ariaLabel: "Maçã. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/tela_fase1/maça.png",
      imgAlt: "Maçã",
    },
    {
      baseId: "pera",
      category: "comidas",
      itemName: "a pera",
      ariaLabel: "Pera. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/tela_fase1/pera.png",
      imgAlt: "Pera",
    },
  ];

  const MODELOS_MATERIAIS = [
    {
      baseId: "lapis",
      category: "materiais",
      itemName: "o lápis",
      ariaLabel: "Lápis. Arraste para a cesta de materiais escolares.",
      imgSrc: "assets/images/tela_fase1/lápis.png",
      imgAlt: "Lápis",
    },
    {
      baseId: "borracha",
      category: "materiais",
      itemName: "a borracha",
      ariaLabel: "Borracha. Arraste para a cesta de materiais escolares.",
      imgSrc: "assets/images/tela_fase1/borracha.png",
      imgAlt: "Borracha",
    },
    {
      baseId: "apontador",
      category: "materiais",
      itemName: "o apontador",
      ariaLabel: "Apontador. Arraste para a cesta de materiais escolares.",
      imgSrc: "assets/images/tela_fase1/apontador.png",
      imgAlt: "Apontador",
    },
  ];

  function getGerarItensFaseFn() {
    if (typeof gerarItensFase === "function") return gerarItensFase;
    if (typeof window !== "undefined" && typeof window.gerarItensFase === "function") return window.gerarItensFase;
    return null;
  }

  function gerarItensFase1() {
    const fn = getGerarItensFaseFn();
    const modelosComidasFase1 = MODELOS_COMIDAS.filter((c) => c.baseId !== "pera");
    return fn ? fn([
      { categoria: "brinquedos", quantidade: 3, modelos: MODELOS_BRINQUEDOS },
      { categoria: "comidas", quantidade: 2, modelos: modelosComidasFase1 },
    ]) : ITENS_FASE_1;
  }

  function gerarItensFase2() {
    const fn = getGerarItensFaseFn();
    return fn ? fn([
      { categoria: "brinquedos", quantidade: 3, modelos: MODELOS_BRINQUEDOS },
      { categoria: "comidas", quantidade: 3, modelos: MODELOS_COMIDAS },
      { categoria: "materiais", quantidade: 3, modelos: MODELOS_MATERIAIS },
    ]) : [];
  }

  function gerarItensFase3() {
    const fn = getGerarItensFaseFn();
    return fn ? fn([
      { categoria: "brinquedos", quantidade: 2, modelos: MODELOS_BRINQUEDOS },
      { categoria: "comidas", quantidade: 5, modelos: MODELOS_COMIDAS },
      { categoria: "materiais", quantidade: 7, modelos: MODELOS_MATERIAIS },
    ]) : [];
  }

  const ITENS_FASE_1 = [
    {
      id: "item-urso-1",
      category: "brinquedos",
      itemName: "o ursinho",
      ariaLabel: "Ursinho de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/tela_fase1/uso 3.png",
      imgAlt: "Ursinho de brinquedo",
    },
    {
      id: "item-trenzinho-1",
      category: "brinquedos",
      itemName: "o trenzinho",
      ariaLabel: "Trenzinho de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/tela_fase1/tremzinho.png",
      imgAlt: "Trenzinho de brinquedo",
    },
    {
      id: "item-urso-2",
      category: "brinquedos",
      itemName: "o ursinho",
      ariaLabel: "Ursinho de brinquedo. Arraste para a cesta de brinquedos.",
      imgSrc: "assets/images/tela_fase1/uso 3.png",
      imgAlt: "Ursinho de brinquedo",
    },
    {
      id: "item-banana",
      category: "comidas",
      itemName: "a banana",
      ariaLabel: "Banana. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/tela_fase1/banana.png",
      imgAlt: "Banana",
    },
    {
      id: "item-maca",
      category: "comidas",
      itemName: "a maçã",
      ariaLabel: "Maçã. Arraste para a cesta de comidas.",
      imgSrc: "assets/images/tela_fase1/maça.png",
      imgAlt: "Maçã",
    },
  ];

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 1 (Mundo 1 — Adição)
  // 2 Categorias (Brinquedos e Comidas) | 5 Objetos no total
  // ==========================================================
  const CONFIG_FASE_1 = {
    operacao: "soma",
    gerarObjetos: gerarItensFase1,
    get objetos() {
      return gerarItensFase1();
    },
    categorias: [
      {
        id: "cesta-brinquedos",
        accepts: "brinquedos",
        nome: "Brinquedos",
        ariaLabel: "Cesta de brinquedos",
        icone: "🧸",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/tela_fase1/botton_brinquedos.png",
        etiquetaImgAlt: "Categoria Brinquedos",
        sprites: [
          "assets/images/tela_fase1/sprites_cestas/brinquedos/1_cesta_brinquedo-1.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/1_cesta_brinquedo.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/2_cesta_brinquedo.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/3_cesta_brinquedo.png",
        ],
      },
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas",
        icone: "🍎",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/tela_fase1/botton_comida.png",
        etiquetaImgAlt: "Categoria Comida",
        sprites: [
          "assets/images/tela_fase1/sprites_cestas/comidas/1_cesta_comida-1.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/1_cesta_comida.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/2_cesta_comida.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/3_cesta_comida.png",
        ],
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 2
  // 3 Categorias | 9 Objetos no total: 3 Brinquedos, 3 Comidas, 3 Materiais
  // ==========================================================
  const CONFIG_FASE_2 = {
    operacao: "soma",
    gerarObjetos: gerarItensFase2,
    get objetos() {
      return gerarItensFase2();
    },
    categorias: [
      {
        id: "cesta-brinquedos",
        accepts: "brinquedos",
        nome: "Brinquedos",
        ariaLabel: "Cesta de brinquedos",
        icone: "🧸",
        posicao: "esq-topo",
        etiquetaImgSrc: "assets/images/tela_fase1/botton_brinquedos.png",
        etiquetaImgAlt: "Categoria Brinquedos",
        sprites: [
          "assets/images/tela_fase1/sprites_cestas/brinquedos/1_cesta_brinquedo-1.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/1_cesta_brinquedo.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/2_cesta_brinquedo.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/3_cesta_brinquedo.png",
        ],
      },
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas",
        icone: "🍎",
        posicao: "esq-base",
        etiquetaImgSrc: "assets/images/tela_fase1/botton_comida.png",
        etiquetaImgAlt: "Categoria Comida",
        sprites: [
          "assets/images/tela_fase1/sprites_cestas/comidas/1_cesta_comida-1.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/1_cesta_comida.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/2_cesta_comida.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/3_cesta_comida.png",
        ],
      },
      {
        id: "cesta-materiais",
        accepts: "materiais",
        nome: "Materiais",
        ariaLabel: "Cesta de materiais escolares",
        icone: "✏️",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/tela_fase1/botton_material.png",
        etiquetaImgAlt: "Categoria Material escolar",
        sprites: [
          "assets/images/tela_fase1/sprites_cestas/materiais/1_cesta_material-1.png",
          "assets/images/tela_fase1/sprites_cestas/materiais/1_cesta_material.png",
          "assets/images/tela_fase1/sprites_cestas/materiais/2_cesta_material.png",
          "assets/images/tela_fase1/sprites_cestas/materiais/3_cesta_material.png",
        ],
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 3
  // 3 Categorias | 14 Objetos no total: 2 Brinquedos, 5 Comidas, 7 Materiais
  // ==========================================================
  const CONFIG_FASE_3 = {
    operacao: "soma",
    gerarObjetos: gerarItensFase3,
    get objetos() {
      return gerarItensFase3();
    },
    categorias: [
      {
        id: "cesta-brinquedos",
        accepts: "brinquedos",
        nome: "Brinquedos",
        ariaLabel: "Cesta de brinquedos",
        icone: "🧸",
        posicao: "esq-topo",
        etiquetaImgSrc: "assets/images/tela_fase1/botton_brinquedos.png",
        etiquetaImgAlt: "Categoria Brinquedos",
        sprites: [
          "assets/images/tela_fase1/sprites_cestas/brinquedos/1_cesta_brinquedo-1.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/1_cesta_brinquedo.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/2_cesta_brinquedo.png",
          "assets/images/tela_fase1/sprites_cestas/brinquedos/3_cesta_brinquedo.png",
        ],
      },
      {
        id: "cesta-comidas",
        accepts: "comidas",
        nome: "Comidas",
        ariaLabel: "Cesta de comidas",
        icone: "🍎",
        posicao: "esq-base",
        etiquetaImgSrc: "assets/images/tela_fase1/botton_comida.png",
        etiquetaImgAlt: "Categoria Comida",
        sprites: [
          "assets/images/tela_fase1/sprites_cestas/comidas/1_cesta_comida-1.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/1_cesta_comida.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/2_cesta_comida.png",
          "assets/images/tela_fase1/sprites_cestas/comidas/3_cesta_comida.png",
        ],
      },
      {
        id: "cesta-materiais",
        accepts: "materiais",
        nome: "Materiais",
        ariaLabel: "Cesta de materiais escolares",
        icone: "✏️",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/tela_fase1/botton_material.png",
        etiquetaImgAlt: "Categoria Material escolar",
        sprites: [
          "assets/images/tela_fase1/sprites_cestas/materiais/1_cesta_material-1.png",
          "assets/images/tela_fase1/sprites_cestas/materiais/1_cesta_material.png",
          "assets/images/tela_fase1/sprites_cestas/materiais/2_cesta_material.png",
          "assets/images/tela_fase1/sprites_cestas/materiais/3_cesta_material.png",
        ],
      },
    ],
  };

  // ==========================================================
  // DEFINIÇÃO DO MUNDO 1
  // ==========================================================
  const MUNDO_1 = {
    id: 1,
    nome: "A Casa",
    totalFases: 3,
    html: "fase1.html",
    fases: {
      1: CONFIG_FASE_1,
      2: CONFIG_FASE_2,
      3: CONFIG_FASE_3,
    },
  };

  // ==========================================================
  // REGISTRO DO MUNDO
  // Permite que main.js encontre este mundo por MUNDOS[1].
  // ==========================================================
  if (typeof window !== "undefined") {
    window.MUNDOS = window.MUNDOS || {};
    window.MUNDOS[MUNDO_1.id] = MUNDO_1;
    window.MUNDO_1 = MUNDO_1;
  }
})();
