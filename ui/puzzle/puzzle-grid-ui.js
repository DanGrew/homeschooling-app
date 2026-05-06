export function buildGrid(container, rows, cols, onCellTap) {
  container.innerHTML = '';
  container.style.cssText = `display:grid;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);width:100%;height:100%;position:relative;z-index:1;`;
  Array.from({ length: rows * cols }, (_, i) => ({ r: Math.floor(i / cols), c: i % cols })).forEach(({ r, c }) => {
    const cell = document.createElement('div');
    cell.dataset.row = r;
    cell.dataset.col = c;
    cell.style.cssText = 'border:2px solid #ddd;cursor:pointer;overflow:hidden;box-sizing:border-box;position:relative;';
    cell.addEventListener('click', () => onCellTap(r, c));
    container.appendChild(cell);
  });
  return container;
}

var PIECE_STYLES = {
  'true': (imageSrc, bgW, bgH, tileW, tileH, piece) => ({
    borderColor: '#F5A623',
    backgroundImage: `url(${imageSrc})`,
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `-${piece.correct.col * tileW}px -${piece.correct.row * tileH}px`
  }),
  'false': () => ({ borderColor: '#ccc', backgroundImage: '', backgroundSize: '', backgroundPosition: '' })
};

export function updateSelectedSlot(slot, piece, imageSrc, bgW, bgH, tileW, tileH) {
  Object.assign(slot.style, PIECE_STYLES[String(!!piece)](imageSrc, bgW, bgH, tileW, tileH, piece));
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

var MARK_CLASS = { 'true': 'feedback-correct', 'false': 'feedback-wrong' };

export function markCell(gridEl, row, col, correct) {
  const cell = gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  cell.classList.remove('feedback-correct', 'feedback-wrong');
  cell.classList.add(MARK_CLASS[String(correct)]);
}
