export function buildTray(container, pieces, onSelect, imageSrc, fullW, fullH, tileW, tileH, colCount) {
  container.innerHTML = '';
  container.style.cssText = colCount
    ? `display:grid;grid-template-columns:repeat(${colCount},${tileW}px);gap:6px;padding:10px;justify-content:center;`
    : 'display:flex;gap:6px;padding:10px;align-items:center;justify-content:center;flex-wrap:wrap;';
  pieces.forEach(p => {
    const div = document.createElement('div');
    div.id = `tray-${p.id}`;
    div.dataset.pieceId = p.id;
    div.style.cssText = `width:${tileW}px;height:${tileH}px;background-image:url(${imageSrc});background-size:${fullW}px ${fullH}px;background-position:-${p.correct.col * tileW}px -${p.correct.row * tileH}px;cursor:pointer;border:3px solid transparent;border-radius:4px;flex-shrink:0;`;
    div.addEventListener('click', () => onSelect(p.id));
    container.appendChild(div);
  });
  return container;
}

export function highlightTray(tray, id) {
  const COLORS = { selected: '#F5A623', none: 'transparent' };
  tray.querySelectorAll('[data-piece-id]').forEach(el => {
    el.style.borderColor = COLORS[el.dataset.pieceId === id ? 'selected' : 'none'];
  });
}

export function removeTrayPiece(tray, id) {
  const el = tray.querySelector(`#tray-${id}`);
  el && (el.style.visibility = 'hidden');
}

export function restoreTrayPiece(tray, id) {
  const el = tray.querySelector(`#tray-${id}`);
  el && (el.style.visibility = 'visible');
}
