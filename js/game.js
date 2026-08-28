const draggableItem = document.querySelector(".draggable-item");
const dropZones = document.querySelectorAll(".drop-zone");
const feedbackMessage = document.querySelector("#feedback-message");

let activeDrag = null;

function startGame() {
  if (!draggableItem || dropZones.length === 0 || !feedbackMessage) {
    return;
  }

  saveStartPosition(draggableItem);

  draggableItem.addEventListener("pointerdown", startDrag);
  draggableItem.addEventListener("pointermove", moveDrag);
  draggableItem.addEventListener("pointerup", finishDrag);
  draggableItem.addEventListener("pointercancel", cancelDrag);
  draggableItem.addEventListener("keydown", handleItemKeyboard);

  dropZones.forEach((dropZone) => {
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
  showFeedback("Leve o carrinho até a caixa.", "neutral");
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
    targetDropZone.classList.add("is-correct");
    item.classList.add("is-correct");
    showFeedback("Muito bem! O carrinho está no lugar certo.", "success");
  } else {
    returnItemToStart(item);
    showFeedback("Quase! Tente colocar o carrinho na caixa de brinquedos.", "error");
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

function placeItemInsideDropZone(item, dropZone) {
  const playArea = document.querySelector("#play-area");
  const playAreaRect = playArea.getBoundingClientRect();
  const dropZoneRect = dropZone.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  const centeredLeft = dropZoneRect.left - playAreaRect.left + (dropZoneRect.width - itemRect.width) / 2;
  const centeredTop = dropZoneRect.top - playAreaRect.top + (dropZoneRect.height - itemRect.height) / 2;

  item.style.left = `${centeredLeft}px`;
  item.style.top = `${centeredTop}px`;
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
