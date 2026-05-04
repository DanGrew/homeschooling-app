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

export function updateSelectedSlot(slot, src) {
  slot.innerHTML = src ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover;">` : '';
  slot.style.borderColor = src ? '#F5A623' : '#ccc';
}

export function placeInCell(gridEl, row, col, src) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;pointer-events:none;">`;
}

export function clearCell(gridEl, row, col) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.innerHTML = '';
  cell.classList.remove('feedback-correct', 'feedback-wrong');
}

export function markCell(gridEl, row, col, correct) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.classList.remove('feedback-correct', 'feedback-wrong');
  cell.classList.add(correct ? 'feedback-correct' : 'feedback-wrong');
}
