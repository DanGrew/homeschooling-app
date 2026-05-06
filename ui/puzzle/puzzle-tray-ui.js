export function buildTray(container, pieces, onSelect, imageSrc, fullW, fullH, tileW, tileH) {
  container.innerHTML = '';
  container.style.cssText = 'display:flex;gap:8px;padding:10px;align-items:center;justify-content:center;flex-wrap:wrap;';
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

var TRAY_BORDER = { 'true': '#F5A623', 'false': 'transparent' };

export function highlightTray(tray, id) {
  tray.querySelectorAll('[data-piece-id]').forEach(el => {
    el.style.borderColor = TRAY_BORDER[String(el.dataset.pieceId === id)];
  });
}

export function removeTrayPiece(tray, id) {
  [tray.querySelector(`#tray-${id}`)].filter(Boolean).forEach(el => { el.style.visibility = 'hidden'; });
}

export function restoreTrayPiece(tray, id) {
  [tray.querySelector(`#tray-${id}`)].filter(Boolean).forEach(el => { el.style.visibility = 'visible'; });
}
