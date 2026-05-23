export function buildTray(container, pieces, onSelect, imageSrc, fullW, fullH, tileW, tileH, colCount) {
  container.innerHTML = '';
  container.style.cssText = `display:grid;grid-template-columns:repeat(${colCount},${tileW}px);gap:6px;padding:10px;justify-content:center;`;
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
  tray.querySelectorAll('[data-piece-id]').forEach(el => {
    el.style.borderColor = ['transparent', '#F5A623'][+(el.dataset.pieceId === id)];
  });
}

export function removeTrayPiece(tray, id) {
  tray.querySelector(`#tray-${id}`)?.style.setProperty('visibility', 'hidden');
}

export function lockTrayPiece(tray, id) {
  tray.querySelector(`#tray-${id}`)?.setAttribute('data-locked', 'true');
}

export function restoreTrayPiece(tray, id) {
  const el = tray.querySelector(`#tray-${id}`);
  [() => el?.style.setProperty('visibility', 'visible'), () => {}][+(!!el?.getAttribute('data-locked'))]();
}
