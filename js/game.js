const draggableItems = document.querySelectorAll(".draggable-item");
const draggableItem = draggableItems[0];
const dropZones = document.querySelectorAll(".drop-zone");
const feedbackMessage = document.querySelector("#feedback-message");

let activeDrag = null;

const basketSprites = {
  brinquedos: [
    "assets/images/tela_fase1/sprites_cestas/brinquedos/1_cesta_brinquedo-1.png",
    "assets/images/tela_fase1/sprites_cestas/brinquedos/1_cesta_brinquedo.png",
    "assets/images/tela_fase1/sprites_cestas/brinquedos/2_cesta_brinquedo.png",
    "assets/images/tela_fase1/sprites_cestas/brinquedos/3_cesta_brinquedo.png",
  ],
  comidas: [
    "assets/images/tela_fase1/sprites_cestas/comidas/1_cesta_comida-1.png",
    "assets/images/tela_fase1/sprites_cestas/comidas/1_cesta_comida.png",
    "assets/images/tela_fase1/sprites_cestas/comidas/2_cesta_comida.png",
    "assets/images/tela_fase1/sprites_cestas/comidas/3_cesta_comida.png",
  ],
  materiais: [
    "assets/images/tela_fase1/sprites_cestas/materiais/1_cesta_material-1.png",
    "assets/images/tela_fase1/sprites_cestas/materiais/1_cesta_material.png",
    "assets/images/tela_fase1/sprites_cestas/materiais/2_cesta_material.png",
    "assets/images/tela_fase1/sprites_cestas/materiais/3_cesta_material.png",
  ],
};

function startGame() {
  if (draggableItems.length === 0 || dropZones.length === 0 || !feedbackMessage) {
    return;
  }

  draggableItems.forEach((item) => {
    saveStartPosition(item);
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

function saveStartPosition(item) {
  item.dataset.startLeft = item.offsetLeft;
  item.dataset.startTop = item.offsetTop;
}

function startDrag(event) {
  const item = event.currentTarget;

  if (item.classList.contains("is-correct")) {
    return;
  }

  const itemRect = item.getBoundingClientRect();

  activeDrag = {
    item,
    pointerId: event.pointerId,
    shiftX: event.clientX - itemRect.left,
    shiftY: event.clientY - itemRect.top,
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
    } else {
      showFeedback(`Muito bem! ${item.dataset.itemName} está em ${getDropZoneName(targetDropZone)}.`, "success");
    }
  } else {
    returnItemToStart(item);
    showFeedbackForIncorrectDrop(item);
  }

  activeDrag = null;
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
  const playArea = document.querySelector("#play-area");
  const playAreaRect = playArea.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  const newLeft = clientX - playAreaRect.left - activeDrag.shiftX;
  const newTop = clientY - playAreaRect.top - activeDrag.shiftY;
  const maxLeft = playArea.clientWidth - itemRect.width;
  const maxTop = playArea.clientHeight - itemRect.height;

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
  const playArea = document.querySelector("#play-area");
  const playAreaRect = playArea.getBoundingClientRect();
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
  const left = dropZoneRect.left - playAreaRect.left + (dropZoneRect.width - rowWidth) / 2 + column * (itemRect.width + gap);
  const top = dropZoneRect.top - playAreaRect.top + 72 + row * (itemRect.height + gap);

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
  if (cestaImg && basketSprites[category] && basketSprites[category][placedCount]) {
    cestaImg.src = basketSprites[category][placedCount];
  }
}

function returnItemToStart(item) {
  item.style.left = `${item.dataset.startLeft}px`;
  item.style.top = `${item.dataset.startTop}px`;
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

  if (draggableItem.classList.contains("is-correct")) {
    showFeedback("O carrinho já está no lugar certo.", "success");
    return;
  }

  if (isCorrectDropZone(draggableItem, event.currentTarget)) {
    placeItemInsideDropZone(draggableItem, event.currentTarget);
    event.currentTarget.classList.add("is-correct");
    draggableItem.classList.add("is-correct");
    showFeedback("Muito bem! O carrinho está no lugar certo.", "success");
  } else {
    showFeedback("Quase! Esta não é a caixa certa.", "error");
  }
}

startGame();
