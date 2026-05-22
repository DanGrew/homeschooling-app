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

function buildDominoDrawBtnEl(onDraw) {
  var btn = document.createElement('button');
  btn.className = 'domino-btn domino-btn-draw';
  btn.setAttribute('data-testid', 'domino-draw-btn');
  btn.textContent = 'Draw';
  btn.addEventListener('click', onDraw);
  return btn;
}

function renderDominoTray(container, gameState, options) {
  var opts = Object(options);
  container.innerHTML = '';
  var player = gameState.players[gameState.turnIndex];
  var hand = gameState.hands[player.id];

  container.appendChild(buildDominoTrayHeaderEl(player));

  var tilesEl = document.createElement('div');
  tilesEl.className = 'domino-tray-tiles';
  tilesEl.setAttribute('data-testid', 'domino-tray-tiles');
  hand.forEach(function(tile) {
    var tileEl = buildDominoTrayTileEl(tile);
    [opts.onTileTap].filter(Boolean).forEach(function(handler) {
      tileEl.addEventListener('click', function() { handler(tile.id); });
    });
    tilesEl.appendChild(tileEl);
  });
  container.appendChild(tilesEl);

  var actionsEl = document.createElement('div');
  actionsEl.className = 'domino-tray-actions';
  actionsEl.setAttribute('data-testid', 'domino-tray-actions');

  [gameState.drawPile].filter(function(pile) { return pile.length > 0; }).forEach(function() {
    [opts.onDraw].filter(Boolean).forEach(function(handler) {
      actionsEl.appendChild(buildDominoDrawBtnEl(handler));
    });
  });

  var submitBtn = document.createElement('button');
  submitBtn.className = 'domino-btn domino-btn-submit';
  submitBtn.setAttribute('data-testid', 'domino-submit-btn');
  submitBtn.textContent = 'Place';
  submitBtn.disabled = true;
  [opts.onSubmit].filter(Boolean).forEach(function(handler) {
    submitBtn.addEventListener('click', handler);
  });
  actionsEl.appendChild(submitBtn);

  container.appendChild(actionsEl);
}

function dominoTraySetSelected(container, tileId) {
  container.querySelectorAll('[data-testid="domino-tray-tile"]').forEach(function(el) {
    el.classList.toggle('domino-tray-tile-selected', el.getAttribute('data-tile-id') === tileId);
  });
}

function dominoTraySetSubmitEnabled(container, enabled) {
  [container.querySelector('[data-testid="domino-submit-btn"]')].filter(Boolean).forEach(function(btn) {
    btn.disabled = !enabled;
  });
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
