let draggableItems = [];
let dropZones = [];
const feedbackMessage = document.querySelector("#feedback-message");

let activeDrag = null;

// ==========================================================
// FUNÇÕES DE RANDOMIZAÇÃO E GERAÇÃO REUTILIZÁVEL DE OBJETOS
// ==========================================================
function embaralharArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function selecionarItensPorCiclos(modelos, quantidade) {
  const selecionados = [];
  while (selecionados.length < quantidade) {
    const ciclo = embaralharArray(modelos);
    for (const modelo of ciclo) {
      if (selecionados.length < quantidade) {
        selecionados.push(modelo);
      } else {
        break;
      }
    }
  }
  return selecionados;
}

function gerarItensFase(cotas) {
  let todosItens = [];
  let contadorId = 1;

  cotas.forEach(({ modelos, quantidade }) => {
    const itensEscolhidos = selecionarItensPorCiclos(modelos, quantidade);
    itensEscolhidos.forEach((modelo) => {
      todosItens.push({
        id: `item-${modelo.baseId}-${contadorId++}`,
        baseId: modelo.baseId,
        category: modelo.category,
        itemName: modelo.itemName,
        ariaLabel: modelo.ariaLabel,
        imgSrc: modelo.imgSrc,
        imgAlt: modelo.imgAlt,
      });
    });
  });

  return embaralharArray(todosItens);
}

const CESTAS_PADRAO_ALTO_CONTRASTE = {
  brinquedos: "assets/images/tela_fase1/Acessibilidade/sprites_cestas/brinquedo/cesta_brinquedo_padrão.png",
  comidas: "assets/images/tela_fase1/Acessibilidade/sprites_cestas/comida/cesta_comida_padrão.png",
  materiais: "assets/images/tela_fase1/Acessibilidade/sprites_cestas/material_escolar/cesta_material_escolar_padrao.png",
};

const CESTAS_PADRAO_ALTO_CONTRASTE_MUNDO2 = {
  animais: "assets/images/mundo_2/Acessibilidade/cesta_animais_padrao.png",
  brinquedos: "assets/images/mundo_2/Acessibilidade/cesta_brinquedos_padrao.png",
  comidas: "assets/images/mundo_2/Acessibilidade/cesta_comida_padrao.png",
  comida: "assets/images/mundo_2/Acessibilidade/cesta_comida_padrao.png",
};

const CESTAS_PADRAO_ALTO_CONTRASTE_MUNDO3 = {
  bebidas: "assets/images/mundo_3/Acessibilidade/cesta_bebidas_padrao.png",
  brinquedos: "assets/images/mundo_3/Acessibilidade/cesta_brinquedos_padrao.png",
  comidas: "assets/images/mundo_3/Acessibilidade/cesta_comidas_padrao.png",
};

const CESTAS_PADRAO_ALTO_CONTRASTE_MUNDO4 = {
  comida: "assets/images/mundo_4/Acessibilidade/cesta_comidas_padrao.png",
  comidas: "assets/images/mundo_4/Acessibilidade/cesta_comidas_padrao.png",
  mochila: "assets/images/mundo_4/Acessibilidade/cesta_mochila_padrao.png",
};

function normalizarNomeItemMundo1(identificador) {
  if (!identificador) return "";
  const s = String(identificador).toLowerCase().trim();
  if (s.includes("urso") || s.includes("ursinho")) return "urso";
  if (s.includes("trem") || s.includes("tren") || s.includes("trenzinho") || s.includes("comboio")) return "trem";
  if (s.includes("robo") || s.includes("robô")) return "robo";
  if (s.includes("banana")) return "banana";
  if (s.includes("maca") || s.includes("maç") || s.includes("maça") || s.includes("maçã")) return "maca";
  if (s.includes("pera") || s.includes("pêra")) return "pera";
  if (s.includes("apontador")) return "apontador";
  if (s.includes("borracha")) return "borracha";
  if (s.includes("lapis") || s.includes("lápis")) return "lapis";
  return "";
}

function isAltoContrasteAtivo() {
  return Boolean(
    typeof document !== "undefined" &&
      (document.body.classList.contains("alto-contraste") ||
        document.documentElement.classList.contains("alto-contraste"))
  );
}

function obterMundoAtivoId() {
  const mundoAtivo =
    typeof window !== "undefined" && typeof window.obterMundoAtivo === "function"
      ? window.obterMundoAtivo()
      : null;
  if (mundoAtivo) return mundoAtivo;
  if (typeof document !== "undefined") {
    if (document.body.classList.contains("mundo-2")) return 2;
    if (document.body.classList.contains("mundo-1")) return 1;
    if (document.body.classList.contains("mundo-3")) return 3;
    if (document.body.classList.contains("mundo-4")) return 4;
    if (document.body.classList.contains("mundo-5")) return 5;
  }
  return 1;
}

function isMundo1AltoContraste() {
  return Boolean(isAltoContrasteAtivo() && obterMundoAtivoId() === 1);
}

function isMundo2AltoContraste() {
  return Boolean(isAltoContrasteAtivo() && obterMundoAtivoId() === 2);
}

function isMundo3AltoContraste() {
  return Boolean(isAltoContrasteAtivo() && obterMundoAtivoId() === 3);
}

function isMundo4AltoContraste() {
  return Boolean(isAltoContrasteAtivo() && obterMundoAtivoId() === 4);
}

function isCestaAltoContrasteDisponivel() {
  const mid = obterMundoAtivoId();
  return Boolean(isAltoContrasteAtivo() && (mid === 1 || mid === 2 || mid === 3 || mid === 4));
}

function obterItensNaCesta(dropZone) {
  if (!dropZone || typeof draggableItems === "undefined" || !draggableItems) return [];
  const items = Array.from(draggableItems).filter(
    (item) => item.dataset.dropZoneId === dropZone.id && item.classList.contains("is-correct")
  );
  return items
    .map((item) => {
      const imgItem = item.querySelector("img");
      return normalizarNomeItemMundo1(
        item.dataset.baseId ||
        item.id ||
        item.dataset.itemName ||
        (imgItem && (imgItem.getAttribute("src") || imgItem.src)) ||
        (imgItem && imgItem.alt) ||
        ""
      );
    })
    .filter(Boolean);
}

function obterTotalItensCategoria(categoria) {
  if (typeof draggableItems === "undefined" || !draggableItems) return 3;
  const count = Array.from(draggableItems).filter(
    (item) => item.dataset.category === categoria
  ).length;
  return count > 0 ? count : 3;
}

function obterSpriteCestaAltoContraste(categoria, mundoId) {
  const mid = mundoId || obterMundoAtivoId();
  if (mid === 4) {
    return CESTAS_PADRAO_ALTO_CONTRASTE_MUNDO4[categoria] || null;
  }
  if (mid === 3) {
    return CESTAS_PADRAO_ALTO_CONTRASTE_MUNDO3[categoria] || null;
  }
  if (mid === 2) {
    return CESTAS_PADRAO_ALTO_CONTRASTE_MUNDO2[categoria] || null;
  }
  return CESTAS_PADRAO_ALTO_CONTRASTE[categoria] || null;
}

function atualizarCestaAltoContraste(dropZone) {
  if (!dropZone || !isCestaAltoContrasteDisponivel()) return;
  const categoria = dropZone.dataset.accepts;
  const novoSrc = obterSpriteCestaAltoContraste(categoria, obterMundoAtivoId());
  const imgCesta = dropZone.querySelector(".cesta-img");
  if (novoSrc && imgCesta) {
    imgCesta.src = novoSrc;
  }
}

function atualizarVisualCestasAltoContraste() {
  if (typeof document === "undefined") return;
  const altoContraste = isCestaAltoContrasteDisponivel();
  const mid = obterMundoAtivoId();
  document.querySelectorAll(".drop-zone").forEach((dropZone) => {
    const imgCesta = dropZone.querySelector(".cesta-img");
    if (!imgCesta) return;
    if (altoContraste) {
      const categoria = dropZone.dataset.accepts;
      const spriteAltoContraste = obterSpriteCestaAltoContraste(categoria, mid);
      if (spriteAltoContraste) {
        imgCesta.src = spriteAltoContraste;
      }
    } else if (dropZone._spriteNormal) {
      imgCesta.src = dropZone._spriteNormal;
    }
  });
}

let activeConfig = null;
let basketSprites = {};
let tutorialFase1Ativo = false;
let tutorialItemAlvo = null;
let tutorialCestaAlvo = null;
let timerBalaoTutorialConclusao = null;
let timerCorFeedbackHud = null;

function atualizarCoordenadasTutorialArraste() {
  if (!tutorialFase1Ativo || !tutorialItemAlvo || !tutorialCestaAlvo) {
    return;
  }
  const maozinha = document.querySelector("#tutorial-maozinha-arraste");
  const balao = document.querySelector("#tutorial-balao-arraste");
  const itemRect = tutorialItemAlvo.getBoundingClientRect();
  const cestaRect = tutorialCestaAlvo.getBoundingClientRect();

  if (maozinha) {
    const startX = Math.round(itemRect.left + itemRect.width * 0.45);
    const startY = Math.round(itemRect.top + itemRect.height * 0.35);
    const endX = Math.round(cestaRect.left + cestaRect.width * 0.45);
    const endY = Math.round(cestaRect.top + cestaRect.height * 0.25);
    maozinha.style.setProperty("--tut-start-x", `${startX}px`);
    maozinha.style.setProperty("--tut-start-y", `${startY}px`);
    maozinha.style.setProperty("--tut-end-x", `${endX}px`);
    maozinha.style.setProperty("--tut-end-y", `${endY}px`);
  }

  if (balao) {
    const balaoX = Math.round(itemRect.left + itemRect.width / 2);
    const balaoY = Math.max(80, Math.round(itemRect.top - 18));
    balao.style.setProperty("--tut-balao-x", `${balaoX}px`);
    balao.style.setProperty("--tut-balao-y", `${balaoY}px`);
  }
}

function removerElementosTutorialArraste() {
  tutorialFase1Ativo = false;
  tutorialItemAlvo = null;
  tutorialCestaAlvo = null;
  window.removeEventListener("resize", atualizarCoordenadasTutorialArraste);

  document.querySelector("#tutorial-overlay")?.remove();
  document.querySelector("#tutorial-balao-arraste")?.remove();
  document.querySelector("#tutorial-maozinha-arraste")?.remove();

  document.querySelectorAll(".tutorial-destaque-item, .tutorial-destaque-slot, .tutorial-destaque-cesta, .tutorial-bloqueado").forEach((el) => {
    el.classList.remove("tutorial-destaque-item", "tutorial-destaque-slot", "tutorial-destaque-cesta", "tutorial-bloqueado");
  });
}

function iniciarTutorialArrasteFase1() {
  removerElementosTutorialArraste();
  if (timerBalaoTutorialConclusao) {
    clearTimeout(timerBalaoTutorialConclusao);
    timerBalaoTutorialConclusao = null;
  }
  document.querySelector("#tutorial-balao-conclusao")?.remove();

  const telaOrganizacao = document.querySelector("#tela-organizacao");
  if (!telaOrganizacao || draggableItems.length === 0 || dropZones.length === 0) {
    return;
  }

  const itemUrsinho = Array.from(draggableItems).find(
    (el) => el.id.includes("urso") || (el.dataset.itemName && el.dataset.itemName.includes("ursinho"))
  ) || Array.from(draggableItems).find(
    (el) => el.dataset.category === "brinquedos"
  ) || draggableItems[0];

  const cestaBrinquedos = findCorrectDropZone(itemUrsinho);
  if (!itemUrsinho || !cestaBrinquedos) {
    return;
  }

  tutorialFase1Ativo = true;
  tutorialItemAlvo = itemUrsinho;
  tutorialCestaAlvo = cestaBrinquedos;

  const overlay = document.createElement("div");
  overlay.id = "tutorial-overlay";
  overlay.className = "tutorial-overlay-escuro";
  overlay.setAttribute("aria-hidden", "true");
  telaOrganizacao.appendChild(overlay);

  const balao = document.createElement("div");
  balao.id = "tutorial-balao-arraste";
  balao.className = "tutorial-balao-fase";
  balao.setAttribute("role", "status");
  balao.setAttribute("aria-live", "polite");
  balao.textContent = "Arraste o objeto para sua cesta!";
  telaOrganizacao.appendChild(balao);

  const maozinha = document.createElement("img");
  maozinha.id = "tutorial-maozinha-arraste";
  maozinha.className = "tutorial-maozinha-arraste";
  maozinha.src = "assets/images/tela_fase1/maozinha.png";
  maozinha.alt = "";
  maozinha.setAttribute("aria-hidden", "true");
  telaOrganizacao.appendChild(maozinha);

  draggableItems.forEach((item) => {
    const slot = item.closest(".slot-objeto");
    if (item === tutorialItemAlvo) {
      item.classList.add("tutorial-destaque-item");
      slot?.classList.add("tutorial-destaque-slot");
    } else {
      item.classList.add("tutorial-bloqueado");
      slot?.classList.add("tutorial-bloqueado");
    }
  });

  dropZones.forEach((cesta) => {
    if (cesta === tutorialCestaAlvo) {
      cesta.classList.add("tutorial-destaque-cesta");
    } else {
      cesta.classList.add("tutorial-bloqueado");
    }
  });

  requestAnimationFrame(() => {
    atualizarCoordenadasTutorialArraste();
  });
  window.addEventListener("resize", atualizarCoordenadasTutorialArraste);
}

function concluirTutorialArrasteFase1() {
  if (!tutorialFase1Ativo) {
    return;
  }
  const cestaRecompensa = tutorialCestaAlvo;
  removerElementosTutorialArraste();

  const telaOrganizacao = document.querySelector("#tela-organizacao");
  if (!telaOrganizacao) {
    return;
  }

  if (cestaRecompensa) {
    cestaRecompensa.classList.add("cesta-recompensa-tutorial");
    const estrelasContainer = document.createElement("div");
    estrelasContainer.className = "tutorial-estrelas-recompensa";
    estrelasContainer.setAttribute("aria-hidden", "true");
    ["⭐", "✨", "🌟", "✨", "⭐"].forEach((icone, idx) => {
      const span = document.createElement("span");
      span.className = `estrela-particula estrela-${idx + 1}`;
      span.textContent = icone;
      estrelasContainer.appendChild(span);
    });
    cestaRecompensa.appendChild(estrelasContainer);
    setTimeout(() => {
      cestaRecompensa.classList.remove("cesta-recompensa-tutorial");
      estrelasContainer.remove();
    }, 1600);
  }

  const balaoConclusao = document.createElement("div");
  balaoConclusao.id = "tutorial-balao-conclusao";
  balaoConclusao.className = "tutorial-balao-fase tutorial-balao-central tutorial-balao-recompensa";
  balaoConclusao.setAttribute("role", "status");
  balaoConclusao.setAttribute("aria-live", "polite");
  balaoConclusao.textContent = "⭐ Muito bem! ⭐";
  telaOrganizacao.appendChild(balaoConclusao);

  timerBalaoTutorialConclusao = setTimeout(() => {
    balaoConclusao.classList.remove("tutorial-balao-recompensa");
    balaoConclusao.classList.add("tutorial-balao-pulo");
    balaoConclusao.textContent = "Agora tente completar as outras!";

    timerBalaoTutorialConclusao = setTimeout(() => {
      balaoConclusao.classList.add("tutorial-balao-saindo");
      setTimeout(() => {
        balaoConclusao.remove();
      }, 400);
      timerBalaoTutorialConclusao = null;
    }, 2600);
  }, 1150);
}

function renderizarCestas(listaCategorias = []) {

  const containerCategorias = document.querySelector(".categorias");
  if (!containerCategorias) {
    return;
  }

  containerCategorias.innerHTML = "";
  basketSprites = {};

  listaCategorias.forEach((cat) => {
    basketSprites[cat.accepts] = cat.sprites || [];

    const dropZone = document.createElement("div");
    const classesCesta = Array.from(new Set(["categoria", "cesta-container", "drop-zone", cat.id, `cesta-${cat.accepts}`].filter(Boolean))).join(" ");
    dropZone.className = `${classesCesta}${cat.posicao ? ` posicao-${cat.posicao}` : ""}${cat.classeCesta ? ` ${cat.classeCesta}` : ""}`;
    dropZone.id = cat.id;
    dropZone.dataset.accepts = cat.accepts;
    dropZone.tabIndex = 0;
    dropZone.setAttribute("aria-label", cat.ariaLabel);

    const srOnly = document.createElement("strong");
    srOnly.className = "sr-only";
    srOnly.textContent = cat.nome;
    dropZone.appendChild(srOnly);

    // Criação segura do elemento de contador no DOM para evitar TypeErrors em atualizações de pontuação
    const contador = document.createElement("div");
    contador.className = "contador contador-categoria";
    contador.setAttribute("aria-label", "0 itens organizados");
    contador.textContent = "0";
    dropZone.appendChild(contador);

    const imgCesta = document.createElement("img");
    imgCesta.className = `cesta cesta-img${cat.classeCesta ? ` ${cat.classeCesta}` : ""}`;
    const cestaSrcNormal = typeof cat.sprites === "string"
      ? cat.sprites
      : (Array.isArray(cat.sprites) && cat.sprites.length > 0 ? cat.sprites[0] : (cat.imgSrc || ""));
    dropZone._spriteNormal = cestaSrcNormal;
    dropZone._itensAltoContraste = [];

    if (isCestaAltoContrasteDisponivel()) {
      const spriteInicial = obterSpriteCestaAltoContraste(cat.accepts, obterMundoAtivoId());
      imgCesta.src = spriteInicial || cestaSrcNormal;
    } else {
      imgCesta.src = cestaSrcNormal;
    }
    imgCesta.alt = `${cat.ariaLabel} com zero itens`;
    dropZone.appendChild(imgCesta);

    // Contador numérico dinâmico sobre a cesta (inicializado em 0)
    const contadorItens = document.createElement("div");
    contadorItens.className = "contador-itens contador-circulo";
    const contadorNumero = document.createElement("span");
    contadorNumero.className = "contador-numero";
    contadorNumero.textContent = "0";
    contadorItens.appendChild(contadorNumero);
    dropZone.appendChild(contadorItens);

    // Container para sobreposição dinâmica de itens dentro da cesta (inicia vazio)
    const itensSobrepostos = document.createElement("div");
    itensSobrepostos.className = "itens-sobrepostos";
    dropZone.appendChild(itensSobrepostos);

    const etiquetaSrc = cat.etiquetaImgSrc || cat.etiqueta;
    if (typeof etiquetaSrc === "string" && etiquetaSrc.trim() !== "") {
      const imgEtiqueta = document.createElement("img");
      imgEtiqueta.className = "etiqueta-categoria categoria-img";
      imgEtiqueta.src = etiquetaSrc.trim();
      imgEtiqueta.alt = cat.etiquetaImgAlt || `Categoria ${cat.nome}`;
      dropZone.appendChild(imgEtiqueta);
    }


    containerCategorias.appendChild(dropZone);
  });

  dropZones = document.querySelectorAll(".drop-zone");
}

function renderizarGradeObjetos(listaObjetos = []) {
  const containerGrid = document.querySelector("#grid-objetos");
  if (!containerGrid) {
    return;
  }

  containerGrid.innerHTML = "";

  listaObjetos.forEach((dados) => {
    const slot = document.createElement("div");
    slot.className = "slot-objeto";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "draggable-item";
    button.id = dados.id;
    if (dados.baseId) {
      button.dataset.baseId = dados.baseId;
    }
    button.dataset.category = dados.category;
    button.dataset.itemName = dados.itemName;
    button.setAttribute("aria-label", dados.ariaLabel);

    const img = document.createElement("img");
    img.className = "objeto";
    img.src = dados.imgSrc;
    img.alt = dados.imgAlt;

    button.appendChild(img);
    slot.appendChild(button);
    containerGrid.appendChild(slot);
  });

  draggableItems = document.querySelectorAll(".draggable-item");
}

function startGame(config) {
  if (!config) {
    console.error("[game.js] startGame chamado sem objeto de configuração.");
    return;
  }

  activeConfig = config;

  document.body.classList.remove("cenario-arrumado");
  if (activeConfig.fundoArrumado && typeof Image !== "undefined") {
    const imgArrumado = new Image();
    imgArrumado.src = activeConfig.fundoArrumado;
  }

  const usarHudHtmlPuro = true;
  document.querySelectorAll(".hud-container").forEach((hudContainer) => {
    const imgExistente = hudContainer.querySelector(".caixa-instrucoes");
    const tituloExistente = hudContainer.querySelector(".hud-titulo, .hud-titulo-mundo2");
    if (usarHudHtmlPuro) {
      if (imgExistente) {
        imgExistente.remove();
      }
      hudContainer.classList.remove("hud-instrucoes-mundo2");
      hudContainer.classList.add("hud-instrucoes");
      if (!tituloExistente) {
        const spanTitulo = document.createElement("span");
        spanTitulo.className = "hud-titulo";
        spanTitulo.textContent = "Arrume a Bagunça!";
        hudContainer.prepend(spanTitulo);
      } else {
        tituloExistente.className = "hud-titulo";
      }
    } else {
      hudContainer.classList.remove("hud-instrucoes-mundo2");
      if (tituloExistente) {
        tituloExistente.remove();
      }
      if (!imgExistente) {
        const novaImg = document.createElement("img");
        novaImg.className = "caixa-instrucoes";

        novaImg.alt = "Caixa de instruções";
        hudContainer.prepend(novaImg);
      } else {

      }
    }
  });
  if (feedbackMessage) {
    showFeedback("Coloque cada item em sua respectiva cesta.", "neutral");
  }
  const fundoInicial = activeConfig.fundoBaguncado || activeConfig.fundo;
  if (fundoInicial) {
    document.body.style.backgroundImage = `url("${fundoInicial}")`;
  } else {
    document.body.style.backgroundImage = "";
  }

  const telaOrganizacao = document.querySelector("#tela-organizacao");
  const telaMatematica = document.querySelector("#tela-matematica");
  if (telaOrganizacao) {
    telaOrganizacao.classList.remove("escondido");
  }
  if (telaMatematica) {
    telaMatematica.classList.add("escondido");
  }

  const listaObjetos = typeof activeConfig.gerarObjetos === "function"
    ? activeConfig.gerarObjetos()
    : activeConfig.objetos;

  renderizarCestas(activeConfig.categorias);
  const mundoAtivo = typeof window.obterMundoAtivo === "function" ? window.obterMundoAtivo() : 1;
  const faseAtiva = typeof window.obterFaseAtiva === "function" ? window.obterFaseAtiva() : 1;
  const deveExibirTutorialFase1 = Number(mundoAtivo) === 1 && Number(faseAtiva) === 1 && !activeConfig.boss;
  if (deveExibirTutorialFase1 && Array.isArray(listaObjetos)) {
    const idxUrso = listaObjetos.findIndex((obj) => obj && (String(obj.id).includes("urso") || String(obj.itemName).includes("ursinho")));
    if (idxUrso > 0) {
      const [ursoItem] = listaObjetos.splice(idxUrso, 1);
      listaObjetos.unshift(ursoItem);
    }
  }
  renderizarGradeObjetos(listaObjetos);

  if (draggableItems.length === 0 || dropZones.length === 0 || !feedbackMessage) {
    return;
  }

  draggableItems.forEach((item) => {
    item.addEventListener("pointerdown", startDrag);
    item.addEventListener("pointermove", moveDrag);
    item.addEventListener("pointerup", finishDrag);
    item.addEventListener("pointercancel", cancelDrag);
    item.addEventListener("keydown", handleItemKeyboard);
  });

  dropZones.forEach((dropZone) => {
    updateDropZoneCounter(dropZone);
    dropZone.addEventListener("keydown", handleDropZoneKeyboard);
  });

  // Fase que declara um adversário inverte a ordem: a primeira etapa interativa
  // é o desafio, não a organização. Os objetos, as cestas e os eventos acima já
  // ficam prontos — eles só entram em cena depois que o adversário cair, e a
  // casa segue bagunçada até lá. Quem não declara adversário começa arrumando,
  // exatamente como antes.
  if (activeConfig.boss && typeof iniciarEtapaMatematica === "function") {
    iniciarEtapaMatematica(null, activeConfig);
  } else if (deveExibirTutorialFase1) {
    iniciarTutorialArrasteFase1();
  }
}

function startDrag(event) {
  const item = event.currentTarget;

  if (item.classList.contains("is-correct") || (tutorialFase1Ativo && item !== tutorialItemAlvo)) {
    return;
  }

  const itemRect = item.getBoundingClientRect();

  // Durante o arraste, o objeto passa a usar a tela toda como referência.
  item.style.position = "fixed";
  item.style.left = `${itemRect.left}px`;
  item.style.top = `${itemRect.top}px`;
  item.style.width = `${itemRect.width}px`;
  item.style.height = `${itemRect.height}px`;

  activeDrag = {
    item,
    pointerId: event.pointerId,
    // Mantém o centro visual do objeto abaixo do mouse ou toque.
    shiftX: item.offsetWidth / 2,
    shiftY: item.offsetHeight / 2,
  };

  item.setPointerCapture(event.pointerId);
  item.classList.add("is-dragging");
  if (tutorialFase1Ativo) {
    document.querySelector("#tutorial-maozinha-arraste")?.classList.add("tutorial-maozinha-pausada");
  }
  showFeedback(`Leve ${item.dataset.itemName} até a caixa.`, "neutral");
}

function moveDrag(event) {
  if (!isCurrentPointer(event)) {
    return;
  }

  moveItemToPointer(activeDrag.item, event.clientX, event.clientY);
  updateDropZoneHighlight(event.clientX, event.clientY);
}

function adicionarItemSobreposto(dropZone, item) {
  if (!dropZone || !item) {
    return;
  }

  const imgItem = item.querySelector("img");
  const chaveItemMundo1 = normalizarNomeItemMundo1(
    item.dataset.baseId ||
    item.id ||
    item.dataset.itemName ||
    (imgItem && (imgItem.getAttribute("src") || imgItem.src)) ||
    (imgItem && imgItem.alt) ||
    ""
  );

  if (!dropZone._itensAltoContraste) {
    dropZone._itensAltoContraste = [];
  }
  if (chaveItemMundo1) {
    dropZone._itensAltoContraste.push(chaveItemMundo1);
  }

  const containerSobrepostos = dropZone.querySelector(".itens-sobrepostos");
  if (!containerSobrepostos) {
    return;
  }

  const imgOriginal = item.querySelector("img");
  const src = imgOriginal ? imgOriginal.getAttribute("src") || imgOriginal.src : "";
  if (!src) {
    return;
  }

  // Identificador do tipo de item para deduplicação visual
  const chaveItem = (item.dataset.itemName || imgOriginal.alt || src).trim();

  // Deduplicação visual: se um item do mesmo tipo já estiver na cesta, ignora a inserção
  const imagensExistentes = Array.from(containerSobrepostos.querySelectorAll("img"));
  const jaExiste = imagensExistentes.some((imgExistente) => {
    const mesmoSrc = (imgExistente.getAttribute("src") && imgExistente.getAttribute("src") === imgOriginal.getAttribute("src")) ||
                     (imgExistente.src && imgOriginal.src && imgExistente.src === imgOriginal.src);
    const mesmaChave = imgExistente.dataset.itemKey && imgExistente.dataset.itemKey === chaveItem;
    const mesmoAlt = imgOriginal.alt && imgExistente.alt && imgExistente.alt === imgOriginal.alt;
    return Boolean(mesmoSrc || mesmaChave || mesmoAlt);
  });

  if (jaExiste) {
    return;
  }

  if (containerSobrepostos.children.length < 3) {
    const imgSobreposta = document.createElement("img");
    imgSobreposta.src = src;
    imgSobreposta.alt = imgOriginal.alt || "";
    imgSobreposta.dataset.itemKey = chaveItem;
    imgSobreposta.className = "item-sobreposto";
    imgSobreposta.draggable = false;
    imgSobreposta.setAttribute("aria-hidden", "true");
    imgSobreposta.style.filter = "brightness(0.95) contrast(1.1)";
    containerSobrepostos.appendChild(imgSobreposta);
  }
}

function finishDrag(event) {
  if (!isCurrentPointer(event)) {
    return;
  }

  const item = activeDrag.item;

  item.releasePointerCapture(event.pointerId);
  item.classList.remove("is-dragging");
  clearDropZoneHighlight();

  const targetDropZone = findDropZoneAtPoint(event.clientX, event.clientY);

  if (isCorrectDropZone(item, targetDropZone) && (!tutorialFase1Ativo || targetDropZone === tutorialCestaAlvo)) {
    placeItemInsideDropZone(item, targetDropZone);
    if (tutorialFase1Ativo && item === tutorialItemAlvo) {
      concluirTutorialArrasteFase1();
    }
    item.classList.add("is-correct");

    const contadorItens = targetDropZone.querySelector(".contador-itens");
    if (contadorItens) {
      const valorAtual = parseInt(contadorItens.textContent, 10) || 0;
      const elNum = contadorItens.querySelector(".contador-numero") || contadorItens;
      elNum.textContent = String(valorAtual + 1);
    }

    adicionarItemSobreposto(targetDropZone, item);
    atualizarCestaAltoContraste(targetDropZone);

    updateDropZoneCounter(targetDropZone);

    if (typeof window.tocarEfeito === "function") {
      window.tocarEfeito("certo");
    }

    if (isOrganizationComplete()) {
      showFeedback("Parabéns! Você organizou todos os objetos!", "success");
      if (activeConfig?.boss) {
        document.body.classList.add("cenario-arrumado");
        if (activeConfig.fundoArrumado) {
          document.body.style.backgroundImage = `url("${activeConfig.fundoArrumado}")`;
        }
      }

      const resumoCategorias = getCategorySummary();
      setTimeout(() => {
        document.body.classList.add("cenario-arrumado");
        if (activeConfig?.fundoArrumado) {
          document.body.style.backgroundImage = `url("${activeConfig.fundoArrumado}")`;
        }
        if (typeof iniciarEtapaMatematica === "function") {
          iniciarEtapaMatematica(resumoCategorias, activeConfig);
        }
      }, 1000);
    } else {
      showFeedback(`Muito bem! ${item.dataset.itemName} está em ${getDropZoneName(targetDropZone)}.`, "success");
    }
  } else {
    returnItemToStart(item);
    showFeedbackForIncorrectDrop(item);
    if (tutorialFase1Ativo) {
      document.querySelector("#tutorial-maozinha-arraste")?.classList.remove("tutorial-maozinha-pausada");
      atualizarCoordenadasTutorialArraste();
    }

    if (typeof window.tocarEfeito === "function") {
      window.tocarEfeito("errado");
    }
  }

  activeDrag = null;
}

function getCategorySummary() {
  const categorias = activeConfig?.categorias || [];
  return categorias.map((cat) => {
    const count = Array.from(draggableItems).filter((item) => {
      return item.dataset.dropZoneId === cat.id && item.classList.contains("is-correct");
    }).length;

    return {
      key: cat.accepts,
      nome: cat.nome,
      icone: cat.icone || "",
      quantidade: count,
    };
  });
}

function getCategoryCounts() {
  const counts = {};

  dropZones.forEach((dropZone) => {
    const category = dropZone.dataset.accepts;
    const count = Array.from(draggableItems).filter((item) => {
      return item.dataset.dropZoneId === dropZone.id && item.classList.contains("is-correct");
    }).length;
    counts[category] = count;
  });

  return counts;
}

function cancelDrag(event) {
  if (!isCurrentPointer(event)) {
    return;
  }

  const item = activeDrag.item;

  item.classList.remove("is-dragging");
  clearDropZoneHighlight();
  returnItemToStart(item);
  showFeedback("Tudo bem, tente arrastar de novo.", "error");
  if (tutorialFase1Ativo) {
    document.querySelector("#tutorial-maozinha-arraste")?.classList.remove("tutorial-maozinha-pausada");
    atualizarCoordenadasTutorialArraste();
  }
  activeDrag = null;
}

function isCurrentPointer(event) {
  return activeDrag && activeDrag.pointerId === event.pointerId;
}

function moveItemToPointer(item, clientX, clientY) {
  const newLeft = clientX - activeDrag.shiftX;
  const newTop = clientY - activeDrag.shiftY;
  const maxLeft = window.innerWidth - item.offsetWidth;
  const maxTop = window.innerHeight - item.offsetHeight;

  item.style.left = `${limitNumber(newLeft, 0, maxLeft)}px`;
  item.style.top = `${limitNumber(newTop, 0, maxTop)}px`;
}

function limitNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function findDropZoneAtPoint(clientX, clientY) {
  return Array.from(dropZones).find((dropZone) => {
    const dropZoneRect = dropZone.getBoundingClientRect();

    return (
      clientX >= dropZoneRect.left &&
      clientX <= dropZoneRect.right &&
      clientY >= dropZoneRect.top &&
      clientY <= dropZoneRect.bottom
    );
  });
}

function isCorrectDropZone(item, dropZone) {
  if (!dropZone) {
    return false;
  }

  return item.dataset.category === dropZone.dataset.accepts;
}

function findCorrectDropZone(item) {
  return Array.from(dropZones).find((dropZone) => isCorrectDropZone(item, dropZone));
}

function isOrganizationComplete() {
  return Array.from(draggableItems).every((item) => item.classList.contains("is-correct"));
}

function getDropZoneName(dropZone) {
  const title = dropZone.querySelector("strong");

  return title ? title.textContent.trim() : "o destino correto";
}

function showFeedbackForIncorrectDrop(item) {
  const correctDropZone = findCorrectDropZone(item);

  if (correctDropZone) {
    showFeedback(`Quase! Tente colocar ${item.dataset.itemName} em ${getDropZoneName(correctDropZone)}.`, "error");
    return;
  }

  showFeedback(`Quase! Tente colocar ${item.dataset.itemName} no destino correto.`, "error");
}

function placeItemInsideDropZone(item, dropZone) {
  restoreItemPositioning(item);

  const itemContainer = item.offsetParent || document.body;
  const itemContainerRect = itemContainer.getBoundingClientRect();
  const dropZoneRect = dropZone.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const placedItems = Array.from(draggableItems).filter((placedItem) => {
    return placedItem.dataset.dropZoneId === dropZone.id;
  }).length;
  const itemsPerRow = 2;
  const gap = 12;
  const column = placedItems % itemsPerRow;
  const row = Math.floor(placedItems / itemsPerRow);
  const rowWidth = itemsPerRow * itemRect.width + gap;
  const left = dropZoneRect.left - itemContainerRect.left + (dropZoneRect.width - rowWidth) / 2 + column * (itemRect.width + gap);
  const top = dropZoneRect.top - itemContainerRect.top + 72 + row * (itemRect.height + gap);

  item.style.left = `${left}px`;
  item.style.top = `${top}px`;
  item.dataset.dropZoneId = dropZone.id;
}

function updateDropZoneCounter(dropZone) {
  if (!dropZone) {
    return;
  }

  const placedCount = Array.from(draggableItems).filter((item) => {
    return item.dataset.dropZoneId === dropZone.id && item.classList.contains("is-correct");
  }).length;

  const counter = dropZone.querySelector(".contador") || dropZone.querySelector(".contador-categoria");
  if (counter) {
    counter.textContent = placedCount;
    counter.setAttribute("aria-label", `${placedCount} itens organizados`);
  }

  const contadorItens = dropZone.querySelector(".contador-itens");
  if (contadorItens) {
    const elNum = contadorItens.querySelector(".contador-numero") || contadorItens;
    elNum.textContent = String(placedCount);
  }
}

function returnItemToStart(item) {
  restoreItemPositioning(item);
  item.style.left = "";
  item.style.top = "";
  item.style.width = "";
  item.style.height = "";
}

function restoreItemPositioning(item) {
  item.style.position = "";
}

function updateDropZoneHighlight(clientX, clientY) {
  const currentDropZone = findDropZoneAtPoint(clientX, clientY);

  dropZones.forEach((dropZone) => {
    dropZone.classList.toggle("is-over", dropZone === currentDropZone);
  });
}

function clearDropZoneHighlight() {
  dropZones.forEach((dropZone) => {
    dropZone.classList.remove("is-over");
  });
}

function showFeedback(message, type) {
  feedbackMessage.textContent = message;
  if (timerCorFeedbackHud) {
    clearTimeout(timerCorFeedbackHud);
    timerCorFeedbackHud = null;
  }
  feedbackMessage.classList.remove("is-success", "is-error", "hud-feedback-acerto", "hud-feedback-erro");

  if (type === "success") {
    feedbackMessage.classList.add("is-success", "hud-feedback-acerto");
    timerCorFeedbackHud = setTimeout(() => {
      feedbackMessage.classList.remove("is-success", "hud-feedback-acerto");
      timerCorFeedbackHud = null;
    }, 1600);
  }

  if (type === "error") {
    feedbackMessage.classList.add("is-error", "hud-feedback-erro");
    timerCorFeedbackHud = setTimeout(() => {
      feedbackMessage.classList.remove("is-error", "hud-feedback-erro");
      timerCorFeedbackHud = null;
    }, 1600);
  }
}

function handleItemKeyboard(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  showFeedback("Use mouse ou toque para arrastar. O teclado será melhorado na próxima etapa.", "neutral");
}

function handleDropZoneKeyboard(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();

  const currentAvailableItem = Array.from(draggableItems).find(
    (item) => !item.classList.contains("is-correct")
  );

  if (!currentAvailableItem) {
    showFeedback("Todos os objetos já estão organizados.", "success");
    return;
  }

  if (isCorrectDropZone(currentAvailableItem, event.currentTarget)) {
    placeItemInsideDropZone(currentAvailableItem, event.currentTarget);
    if (tutorialFase1Ativo && currentAvailableItem === tutorialItemAlvo) {
      concluirTutorialArrasteFase1();
    }
    currentAvailableItem.classList.add("is-correct");

    const contadorItens = event.currentTarget.querySelector(".contador-itens");
    if (contadorItens) {
      const valorAtual = parseInt(contadorItens.textContent, 10) || 0;
      const elNum = contadorItens.querySelector(".contador-numero") || contadorItens;
      elNum.textContent = String(valorAtual + 1);
    }

    adicionarItemSobreposto(event.currentTarget, currentAvailableItem);
    atualizarCestaAltoContraste(event.currentTarget);

    updateDropZoneCounter(event.currentTarget);

    if (typeof window.tocarEfeito === "function") {
      window.tocarEfeito("certo");
    }

    if (isOrganizationComplete()) {
      showFeedback("Parabéns! Você organizou todos os objetos!", "success");
      if (activeConfig?.boss) {
        document.body.classList.add("cenario-arrumado");
        if (activeConfig.fundoArrumado) {
          document.body.style.backgroundImage = `url("${activeConfig.fundoArrumado}")`;
        }
      }

      const resumoCategorias = getCategorySummary();
      setTimeout(() => {
        document.body.classList.add("cenario-arrumado");
        if (activeConfig?.fundoArrumado) {
          document.body.style.backgroundImage = `url("${activeConfig.fundoArrumado}")`;
        }
        if (typeof iniciarEtapaMatematica === "function") {
          iniciarEtapaMatematica(resumoCategorias, activeConfig);
        }
      }, 1000);
    } else {
      showFeedback(`Muito bem! ${currentAvailableItem.dataset.itemName} está em ${getDropZoneName(event.currentTarget)}.`, "success");
    }
  } else {
    if (typeof window.tocarEfeito === "function") {
      window.tocarEfeito("errado");
    }
    showFeedback("Quase! Esta não é a caixa certa.", "error");
  }
}

if (typeof window !== "undefined") {
  window.startGame = startGame;
  window.gerarItensFase = gerarItensFase;
  window.embaralharArray = embaralharArray;
  window.findCorrectDropZone = findCorrectDropZone;
  window.atualizarVisualCestasAltoContraste = atualizarVisualCestasAltoContraste;
  window.obterSpriteCestaAltoContraste = obterSpriteCestaAltoContraste;
}
