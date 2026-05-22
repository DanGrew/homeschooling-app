var DOMINO_CELL   = 52;
var DOMINO_ORIGIN = 2000;

function buildDominoHalfEl(value) {
  var el = document.createElement('div');
  el.className = 'domino-half';
  el.setAttribute('data-value', value);
  el.textContent = value;
  return el;
}

function buildDominoDividerEl() {
  var el = document.createElement('div');
  el.className = 'domino-divider';
  return el;
}

function buildDominoTileEl(placedTile) {
  var tile = placedTile.tile;
  var halves = [tile.left, tile.right];
  var fi = Number(placedTile.flipped);
  var el = document.createElement('div');
  el.className = 'domino-tile domino-tile-horizontal';
  el.style.left = (DOMINO_ORIGIN + placedTile.col * DOMINO_CELL) + 'px';
  el.style.top  = (DOMINO_ORIGIN + placedTile.row * DOMINO_CELL) + 'px';
  el.setAttribute('data-testid', 'domino-tile-' + tile.id);
  el.appendChild(buildDominoHalfEl(halves[fi]));
  el.appendChild(buildDominoDividerEl());
  el.appendChild(buildDominoHalfEl(halves[1 - fi]));
  return el;
}

function buildDominoEndpointEl(endpoint) {
  var el = document.createElement('div');
  el.className = 'domino-endpoint';
  el.setAttribute('data-testid', 'domino-endpoint');
  el.setAttribute('data-value', endpoint.value);
  el.style.left = (DOMINO_ORIGIN + endpoint.col * DOMINO_CELL) + 'px';
  el.style.top  = (DOMINO_ORIGIN + endpoint.row * DOMINO_CELL) + 'px';
  return el;
}

function initDominoPan(viewport, world) {
  var state = { dragging: false, startX: 0, startY: 0, panX: 0, panY: 0 };

  function applyPan() {
    world.style.transform = 'translate(' + state.panX + 'px, ' + state.panY + 'px)';
  }

  viewport.addEventListener('mousedown', function(e) {
    state.dragging = true;
    state.startX = e.clientX - state.panX;
    state.startY = e.clientY - state.panY;
    viewport.classList.add('panning');
  });

  window.addEventListener('mousemove', function(e) {
    [e].filter(function() { return state.dragging; }).forEach(function(ev) {
      state.panX = ev.clientX - state.startX;
      state.panY = ev.clientY - state.startY;
      applyPan();
    });
  });

  window.addEventListener('mouseup', function() {
    state.dragging = false;
    viewport.classList.remove('panning');
  });

  viewport.addEventListener('touchstart', function(e) {
    var t = e.touches[0];
    state.dragging = true;
    state.startX = t.clientX - state.panX;
    state.startY = t.clientY - state.panY;
  }, { passive: true });

  viewport.addEventListener('touchmove', function(e) {
    [e.touches[0]].filter(function() { return state.dragging; }).forEach(function(t) {
      state.panX = t.clientX - state.startX;
      state.panY = t.clientY - state.startY;
      applyPan();
    });
  }, { passive: true });

  viewport.addEventListener('touchend', function() {
    state.dragging = false;
  });

  return state;
}

function attachEndpointHandler(el, handler, idx) {
  el.addEventListener('click', function(e) { e.stopPropagation(); handler(idx); });
  el.addEventListener('touchend', function(e) { e.preventDefault(); e.stopPropagation(); handler(idx); });
}

function renderDominoBoard(viewport, gameState, options) {
  var opts = Object(options);
  viewport.innerHTML = '';

  var world = document.createElement('div');
  world.className = 'domino-board-world';
  world.setAttribute('data-testid', 'domino-board-world');
  viewport._dominoWorld = world;

  gameState.board.tiles.forEach(function(pt) {
    world.appendChild(buildDominoTileEl(pt));
  });

  gameState.board.endpoints.forEach(function(ep, idx) {
    var el = buildDominoEndpointEl(ep);
    [opts.onEndpointTap].filter(Boolean).forEach(function(handler) {
      attachEndpointHandler(el, handler, idx);
    });
    world.appendChild(el);
  });

  viewport.appendChild(world);

  var panState = initDominoPan(viewport, world);
  var panX = Math.round(viewport.clientWidth / 2) - DOMINO_ORIGIN - DOMINO_CELL;
  var panY = Math.round(viewport.clientHeight / 2) - DOMINO_ORIGIN - Math.round(DOMINO_CELL / 2);
  panState.panX = panX;
  panState.panY = panY;
  world.style.transform = 'translate(' + panX + 'px, ' + panY + 'px)';
}

function setDominoEndpointsActive(viewport, active) {
  [viewport._dominoWorld].filter(Boolean).forEach(function(world) {
    world.querySelectorAll('.domino-endpoint').forEach(function(el) {
      el.classList.toggle('domino-endpoint-active', Boolean(active));
    });
  });
}

function showDominoPreview(viewport, placedTile) {
  clearDominoPreview(viewport);
  [viewport._dominoWorld].filter(Boolean).forEach(function(world) {
    var el = buildDominoTileEl(placedTile);
    el.classList.add('domino-preview-tile');
    el.setAttribute('data-testid', 'domino-preview-tile');
    world.appendChild(el);
  });
}

function clearDominoPreview(viewport) {
  [viewport._dominoWorld].filter(Boolean).forEach(function(world) {
    [world.querySelector('[data-testid="domino-preview-tile"]')].filter(Boolean).forEach(function(el) {
      el.remove();
    });
  });
}
