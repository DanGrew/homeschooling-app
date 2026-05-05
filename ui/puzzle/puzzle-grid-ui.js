export function buildGrid(container, rows, cols, onCellTap) {
  container.innerHTML = '';
  container.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);width:100%;height:100%;position:relative;z-index:1;`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.style.cssText = 'border:2px solid #ddd;cursor:pointer;overflow:hidden;box-sizing:border-box;position:relative;';
      cell.addEventListener('click', () => onCellTap(r, c));
      container.appendChild(cell);
    }
  }
  return container;
}

export function updateSelectedSlot(slot, piece, imageSrc, bgW, bgH, tileW, tileH) {
  slot.style.borderColor = piece ? '#F5A623' : '#ccc';
  slot.style.backgroundImage = piece ? `url(${imageSrc})` : '';
  slot.style.backgroundSize = piece ? `${bgW}px ${bgH}px` : '';
  slot.style.backgroundPosition = piece ? `-${piece.correct.col * tileW}px -${piece.correct.row * tileH}px` : '';
}

export function placeInCell(gridEl, row, col, imageSrc, fullW, fullH, cellW, cellH) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.style.backgroundImage = `url(${imageSrc})`;
  cell.style.backgroundSize = `${fullW}px ${fullH}px`;
  cell.style.backgroundPosition = `-${col * cellW}px -${row * cellH}px`;
}

export function clearCell(gridEl, row, col) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.style.backgroundImage = '';
  cell.classList.remove('feedback-correct', 'feedback-wrong');
}

export function markCell(gridEl, row, col, correct) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.classList.remove('feedback-correct', 'feedback-wrong');
  cell.classList.add(correct ? 'feedback-correct' : 'feedback-wrong');
}
