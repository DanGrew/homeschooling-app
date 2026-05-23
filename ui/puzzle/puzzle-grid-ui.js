const FEEDBACK_CLASS = { true: 'feedback-correct', false: 'feedback-wrong' };

function makeCell(r, c, onCellTap) {
  const cell = document.createElement('div');
  cell.dataset.row = r;
  cell.dataset.col = c;
  cell.style.cssText = 'border:2px solid #ddd;cursor:pointer;overflow:hidden;box-sizing:border-box;position:relative;';
  cell.addEventListener('click', () => [() => onCellTap(r, c), () => {}][+(!!cell.dataset.locked)]());
  return cell;
}

export function buildGrid(container, rows, cols, onCellTap) {
  container.innerHTML = '';
  container.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);width:100%;height:100%;position:relative;z-index:1;`;
  Array.from({ length: rows * cols }, (_, i) => makeCell(Math.floor(i / cols), i % cols, onCellTap))
    .forEach(cell => container.appendChild(cell));
  return container;
}

export function clearSelectedSlot(slot) {
  slot.style.borderColor = '#ccc';
  slot.style.backgroundImage = '';
  slot.style.backgroundSize = '';
  slot.style.backgroundPosition = '';
}

export function fillSelectedSlot(slot, piece, imageSrc, bgW, bgH, tileW, tileH) {
  slot.style.borderColor = '#F5A623';
  slot.style.backgroundImage = `url(${imageSrc})`;
  slot.style.backgroundSize = `${bgW}px ${bgH}px`;
  slot.style.backgroundPosition = `-${piece.correct.col * tileW}px -${piece.correct.row * tileH}px`;
}

export function placeInCell(gridEl, row, col, imageSrc, fullW, fullH, cellW, cellH, pieceRow, pieceCol) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.style.backgroundImage = `url(${imageSrc})`;
  cell.style.backgroundSize = `${fullW}px ${fullH}px`;
  cell.style.backgroundPosition = `-${pieceCol * cellW}px -${pieceRow * cellH}px`;
}

export function clearCell(gridEl, row, col) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.style.backgroundImage = '';
  cell.classList.remove('feedback-correct', 'feedback-wrong');
}

export function lockCell(gridEl, row, col) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.dataset.locked = 'true';
  cell.style.cursor = 'default';
}

export function markCell(gridEl, row, col, correct) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.classList.remove('feedback-correct', 'feedback-wrong');
  cell.classList.add(FEEDBACK_CLASS[correct]);
}
