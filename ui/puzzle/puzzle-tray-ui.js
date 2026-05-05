export function buildTray(container, pieces, onSelect, tileW = 64, tileH = 64) {
  container.innerHTML = '';
  container.style.cssText = 'display:flex;gap:8px;padding:10px;align-items:center;justify-content:center;flex-wrap:wrap;';
  pieces.forEach(p => {
    const img = document.createElement('img');
    img.id = `tray-${p.id}`;
    img.src = p.src;
    img.dataset.pieceId = p.id;
    img.style.cssText = `height:${tileH}px;width:${tileW}px;object-fit:cover;cursor:pointer;border:3px solid transparent;border-radius:4px;flex-shrink:0;`;
    img.addEventListener('click', () => onSelect(p.id));
    container.appendChild(img);
  });
  return container;
}

export function highlightTray(tray, id) {
  tray.querySelectorAll('img').forEach(img => {
    img.style.borderColor = img.dataset.pieceId === id ? '#F5A623' : 'transparent';
  });
}

export function removeTrayPiece(tray, id) {
  const img = tray.querySelector(`#tray-${id}`);
  img && (img.style.visibility = 'hidden');
}

export function restoreTrayPiece(tray, id) {
  const img = tray.querySelector(`#tray-${id}`);
  img && (img.style.visibility = 'visible');
}
