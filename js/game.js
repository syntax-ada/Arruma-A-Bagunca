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

let activeConfig = null;
let basketSprites = {};

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
    dropZone.className = `categoria drop-zone${cat.posicao ? ` posicao-${cat.posicao}` : ""}`;
    dropZone.id = cat.id;
    dropZone.dataset.accepts = cat.accepts;
    dropZone.tabIndex = 0;
    dropZone.setAttribute("aria-label", cat.ariaLabel);

    const srOnly = document.createElement("strong");
    srOnly.className = "sr-only";
    srOnly.textContent = cat.nome;

    const contador = document.createElement("span");
    contador.className = "contador-categoria";
    contador.setAttribute("aria-label", "0 itens organizados");
    contador.textContent = "0";

    const imgCesta = document.createElement("img");
    imgCesta.className = "cesta";
    imgCesta.src = cat.sprites && cat.sprites.length > 0 ? cat.sprites[0] : "";
    imgCesta.alt = `${cat.ariaLabel} com zero itens`;

    const imgEtiqueta = document.createElement("img");
    imgEtiqueta.className = "etiqueta-categoria";
    imgEtiqueta.src = cat.etiquetaImgSrc;
    imgEtiqueta.alt = cat.etiquetaImgAlt;

    dropZone.appendChild(srOnly);
    dropZone.appendChild(contador);
    dropZone.appendChild(imgCesta);
    dropZone.appendChild(imgEtiqueta);

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
    return;
  }

  activeConfig = config;

  document.body.classList.remove("cenario-arrumado");

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
}

function startDrag(event) {
  const item = event.currentTarget;

  if (item.classList.contains("is-correct")) {
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
  showFeedback(`Leve ${item.dataset.itemName} até a caixa.`, "neutral");
}

function moveDrag(event) {
  if (!isCurrentPointer(event)) {
    return;
  }

  moveItemToPointer(activeDrag.item, event.clientX, event.clientY);
  updateDropZoneHighlight(event.clientX, event.clientY);
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

  if (isCorrectDropZone(item, targetDropZone)) {
    placeItemInsideDropZone(item, targetDropZone);
    item.classList.add("is-correct");
    updateDropZoneCounter(targetDropZone);

    if (isOrganizationComplete()) {
      showFeedback("Parabéns! Você organizou todos os objetos!", "success");

      const resumoCategorias = getCategorySummary();
      setTimeout(() => {
        document.body.classList.add("cenario-arrumado");
        if (typeof iniciarDesafioMatematico === "function") {
          iniciarDesafioMatematico(resumoCategorias);
        }
      }, 1000);
    } else {
      showFeedback(`Muito bem! ${item.dataset.itemName} está em ${getDropZoneName(targetDropZone)}.`, "success");
    }
  } else {
    returnItemToStart(item);
    showFeedbackForIncorrectDrop(item);
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

  const counter = dropZone.querySelector(".contador-categoria");
  if (counter) {
    counter.textContent = placedCount;
    counter.setAttribute("aria-label", `${placedCount} itens organizados`);
  }

  const category = dropZone.dataset.accepts;
  const cestaImg = dropZone.querySelector(".cesta");
  const catConfig = activeConfig?.categorias?.find((c) => c.accepts === category);
  const sprites = catConfig?.sprites || basketSprites[category];

  if (cestaImg && sprites && sprites.length > 0) {
    const maxSpriteIndex = sprites.length - 1;
    const spriteIndex = Math.min(placedCount, maxSpriteIndex);
    cestaImg.src = sprites[spriteIndex];
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
  feedbackMessage.classList.remove("is-success", "is-error");

  if (type === "success") {
    feedbackMessage.classList.add("is-success");
  }

  if (type === "error") {
    feedbackMessage.classList.add("is-error");
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
    currentAvailableItem.classList.add("is-correct");
    updateDropZoneCounter(event.currentTarget);

    if (isOrganizationComplete()) {
      showFeedback("Parabéns! Você organizou todos os objetos!", "success");

      const resumoCategorias = getCategorySummary();
      setTimeout(() => {
        document.body.classList.add("cenario-arrumado");
        if (typeof iniciarDesafioMatematico === "function") {
          iniciarDesafioMatematico(resumoCategorias);
        }
      }, 1000);
    } else {
      showFeedback(`Muito bem! ${currentAvailableItem.dataset.itemName} está em ${getDropZoneName(event.currentTarget)}.`, "success");
    }
  } else {
    showFeedback("Quase! Esta não é a caixa certa.", "error");
  }
}

if (typeof window !== "undefined") {
  window.startGame = startGame;
}

// A inicializacao do jogo e responsabilidade de main.js (ponto de entrada).
// Nao inicialize aqui: isso causaria dupla inicializacao.
