function buildDominoTrayHeaderEl(player) {
  var el = document.createElement('div');
  el.className = 'domino-tray-header';

  var img = document.createElement('img');
  img.src = cgImgSrc(player.icon);
  img.alt = player.name;
  img.setAttribute('data-testid', 'domino-tray-icon');
  el.appendChild(img);

  var name = document.createElement('span');
  name.textContent = player.name;
  name.setAttribute('data-testid', 'domino-tray-name');
  el.appendChild(name);

  return el;
}

function buildDominoTrayTileEl(tile) {
  var el = document.createElement('div');
  el.className = 'domino-tile domino-tile-horizontal domino-tray-tile';
  el.setAttribute('data-testid', 'domino-tray-tile');
  el.setAttribute('data-tile-id', tile.id);
  el.appendChild(buildDominoHalfEl(tile.left));
  el.appendChild(buildDominoDividerEl());
  el.appendChild(buildDominoHalfEl(tile.right));
  return el;
}

function renderDominoTray(container, gameState) {
  container.innerHTML = '';
  var player = gameState.players[gameState.turnIndex];
  var hand = gameState.hands[player.id];

  container.appendChild(buildDominoTrayHeaderEl(player));

  var tilesEl = document.createElement('div');
  tilesEl.className = 'domino-tray-tiles';
  tilesEl.setAttribute('data-testid', 'domino-tray-tiles');
  hand.forEach(function(tile) {
    tilesEl.appendChild(buildDominoTrayTileEl(tile));
  });
  container.appendChild(tilesEl);
}

function dominoTrayApplyRemove(container, tileId) {
  var tilesEl = container.querySelector('[data-testid="domino-tray-tiles"]');
  var found = tilesEl.querySelector('[data-tile-id="' + tileId + '"]');
  [found].filter(Boolean).forEach(function(el) { el.remove(); });
}

function dominoTrayApplyAdd(container, tile) {
  var tilesEl = container.querySelector('[data-testid="domino-tray-tiles"]');
  tilesEl.appendChild(buildDominoTrayTileEl(tile));
}
