/**
 * @file mundos/mundo4.js
 * @description Dados e configurações do Mundo 4 — estrutura provisória.
 *
 * ============================================================================
 * ARQUIVO DECLARATIVO — MUNDO 4 (ESTRUTURA PROVISÓRIA)
 * ============================================================================
 * Este arquivo concentra os dados específicos do Mundo 4:
 * - Catálogo de modelos de objetos;
 * - Mapeamento de cestas e sprites;
 * - Configurações das 3 fases;
 * - Auto-registro em window.MUNDOS[4].
 *
 * ⚠️ TEMA E ASSETS PROVISÓRIOS. O Mundo 4 ainda não tem tema, categorias nem
 * arte próprios. Enquanto isso, reaproveita as categorias (Comidas e Bebidas),
 * os sprites e os fundos do Mundo 3 (Praia), apenas para que a estrutura possa
 * ser exercitada. Cada arquivo de mundo é uma IIFE fechada, então os dados do
 * mundo3.js não são importáveis: eles são redeclarados aqui, como manda o
 * padrão do projeto. Ao definir o tema real, troque modelos, sprites, fundos e
 * etiquetas — nada fora deste arquivo depende deles.
 *
 * OPERAÇÃO: DIVISÃO. Cada fase declara operacao: "divisao" e math.js resolve a
 * conta pela operação correspondente em js/operacoes.js.
 *
 * ⚠️ A ORDEM DO ARRAY "categorias" É SIGNIFICATIVA NESTE MUNDO.
 * Como na subtração do Mundo 2, a ordem declarada é a ordem dos termos: a
 * primeira categoria é o DIVIDENDO e a segunda é o DIVISOR. Inverter as duas
 * muda a conta. Aqui Comidas é sempre o dividendo e Bebidas sempre o divisor.
 *
 * As cotas de cada fase são os termos da conta. js/operacoes.js exige divisão
 * exata e recusa divisor zero ou resto, acusando no console.
 * ============================================================================
 */

(function () {
  // ==========================================================
  // FUNDOS DE TELA (provisórios — reaproveitados do Mundo 3)
  // ==========================================================
  const FUNDO_MUNDO_4_BAGUNCADO = "assets/images/mundo_3/praia_bagunçado.png";
  const FUNDO_MUNDO_4_ARRUMADO = "assets/images/mundo_3/praia.png";

  // ==========================================================
  // CATÁLOGO DE MODELOS DISPONÍVEIS POR CATEGORIA
  // (provisórios — reaproveitados do Mundo 3)
  // ==========================================================
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
    // Fase 1: 2 categorias (Comidas e Bebidas) com 8 itens — conta 4 ÷ 4 = 1
    return fn ? fn([
      { categoria: "comidas", quantidade: 4, modelos: MODELOS_COMIDAS },
      { categoria: "bebidas", quantidade: 4, modelos: MODELOS_BEBIDAS },
    ]) : [];
  }

  function gerarItensMundo4Fase2() {
    const fn = getGerarItensFaseFn();
    // Fase 2: 2 categorias (Comidas e Bebidas) com 12 itens — conta 9 ÷ 3 = 3
    return fn ? fn([
      { categoria: "comidas", quantidade: 9, modelos: MODELOS_COMIDAS },
      { categoria: "bebidas", quantidade: 3, modelos: MODELOS_BEBIDAS },
    ]) : [];
  }

  function gerarItensMundo4Fase3() {
    const fn = getGerarItensFaseFn();
    // Fase 3: 2 categorias (Comidas e Bebidas) com 15 itens — conta 10 ÷ 5 = 2
    return fn ? fn([
      { categoria: "comidas", quantidade: 10, modelos: MODELOS_COMIDAS },
      { categoria: "bebidas", quantidade: 5, modelos: MODELOS_BEBIDAS },
    ]) : [];
  }

  // ==========================================================
  // SPRITES DAS CESTAS (provisórios — reaproveitados do Mundo 3)
  // ==========================================================
  const SPRITES_CESTA_COMIDAS_MUNDO4 = [
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

  const SPRITES_CESTA_BEBIDAS_MUNDO4 = [
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

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 1 (Mundo 4)
  // 2 Categorias (Comidas e Bebidas) | 8 Objetos no total
  // Divisão: 4 ÷ 4 = 1  (dividendo: Comidas, divisor: Bebidas)
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
        icone: "🍦",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-bebidas",
        accepts: "bebidas",
        nome: "Bebidas",
        ariaLabel: "Cesta de bebidas",
        icone: "🥤",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_bebidas.png",
        etiquetaImgAlt: "Categoria Bebidas",
        sprites: SPRITES_CESTA_BEBIDAS_MUNDO4,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 2 (Mundo 4)
  // 2 Categorias (Comidas e Bebidas) | 12 Objetos no total
  // Divisão: 9 ÷ 3 = 3  (dividendo: Comidas, divisor: Bebidas)
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
        icone: "🍦",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-bebidas",
        accepts: "bebidas",
        nome: "Bebidas",
        ariaLabel: "Cesta de bebidas",
        icone: "🥤",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_bebidas.png",
        etiquetaImgAlt: "Categoria Bebidas",
        sprites: SPRITES_CESTA_BEBIDAS_MUNDO4,
      },
    ],
  };

  // ==========================================================
  // CONFIGURAÇÃO DA FASE 3 (Mundo 4)
  // 2 Categorias (Comidas e Bebidas) | 15 Objetos no total
  // Divisão: 10 ÷ 5 = 2  (dividendo: Comidas, divisor: Bebidas)
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
        icone: "🍦",
        posicao: "esq-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_comida.png",
        etiquetaImgAlt: "Categoria Comidas",
        sprites: SPRITES_CESTA_COMIDAS_MUNDO4,
      },
      {
        id: "cesta-bebidas",
        accepts: "bebidas",
        nome: "Bebidas",
        ariaLabel: "Cesta de bebidas",
        icone: "🥤",
        posicao: "dir-centro",
        etiquetaImgSrc: "assets/images/mundo_3/botton_bebidas.png",
        etiquetaImgAlt: "Categoria Bebidas",
        sprites: SPRITES_CESTA_BEBIDAS_MUNDO4,
      },
    ],
  };

  // ==========================================================
  // DEFINIÇÃO DO MUNDO 4
  // O nome segue provisório até a equipe definir o tema.
  // ==========================================================
  const MUNDO_4 = {
    id: 4,
    nome: "Mundo 4",
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
