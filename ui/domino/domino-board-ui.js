var DOMINO_CELL   = 52;
var DOMINO_ORIGIN = 2000;

var ROTATION_LAYOUT = {
  0:   { cls: 'domino-tile-horizontal', fi: 0 },
  90:  { cls: 'domino-tile-vertical',   fi: 0 },
  180: { cls: 'domino-tile-horizontal', fi: 0 },
  270: { cls: 'domino-tile-vertical',   fi: 0 },
  45:  { cls: 'domino-tile-horizontal', fi: 1 },
  135: { cls: 'domino-tile-vertical',   fi: 1 },
  225: { cls: 'domino-tile-horizontal', fi: 1 },
  315: { cls: 'domino-tile-vertical',   fi: 1 }
};

var DOMINO_STATIC_TYPES = { colours: true, shapes: true, numbers: true };

var DOMINO_HALF_RENDER = {
  shapes:  function(el, value) { el.innerHTML = buildDominoShapeSvg(value); },
  numbers: function(el, value) { el.innerHTML = buildDominoNumberSvg(value); },
  icons: function(el, value) {
    var img = document.createElement('img');
    img.src = cgImgSrc(value);
    img.alt = value;
    img.style.cssText = 'width:32px;height:32px;object-fit:contain;';
    el.appendChild(img);
  }
};

function buildDominoHalfEl(value, matchType) {
  var el = document.createElement('div');
  el.className = 'domino-half';
  el.setAttribute('data-value', value);
  var render = DOMINO_HALF_RENDER[matchType] || (!DOMINO_STATIC_TYPES[matchType] && DOMINO_HALF_RENDER.icons);
  [render].filter(Boolean).forEach(function(r) { r(el, value); });
  return el;
}

function buildDominoDividerEl() {
  var el = document.createElement('div');
  el.className = 'domino-divider';
  return el;
}

function buildDominoTileEl(placedTile, matchType) {
  var tile = placedTile.tile;
  var layout = ROTATION_LAYOUT[placedTile.rotation];
  var halves = [tile.left, tile.right];
  var el = document.createElement('div');
  el.className = 'domino-tile ' + layout.cls;
  el.style.left = (DOMINO_ORIGIN + placedTile.col * DOMINO_CELL) + 'px';
  el.style.top  = (DOMINO_ORIGIN + placedTile.row * DOMINO_CELL) + 'px';
  el.setAttribute('data-testid', 'domino-tile-' + tile.id);
  el.appendChild(buildDominoHalfEl(halves[layout.fi], matchType));
  el.appendChild(buildDominoDividerEl());
  el.appendChild(buildDominoHalfEl(halves[1 - layout.fi], matchType));
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
  var state = { dragging: false, startX: 0, startY: 0, panX: 0, panY: 0, scale: 2 };
  world.style.transformOrigin = '0 0';

  function applyPan() {
    world.style.transform = 'translate(' + state.panX + 'px, ' + state.panY + 'px) scale(' + state.scale + ')';
  }
  state.applyPan = applyPan;

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

function buildDominoZoomBtns(viewport, panState) {
  var wrap = document.createElement('div');
  wrap.className = 'domino-zoom-controls';
  wrap.setAttribute('data-testid', 'domino-zoom-controls');

  [
    { text: '+', testid: 'domino-zoom-in', delta: 0.25 },
    { text: '\u2212', testid: 'domino-zoom-out', delta: -0.25 }
  ].forEach(function(cfg) {
    var btn = document.createElement('button');
    btn.className = 'domino-zoom-btn';
    btn.setAttribute('data-testid', cfg.testid);
    btn.setAttribute('type', 'button');
    btn.textContent = cfg.text;
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var box = viewport.getBoundingClientRect();
      var cx = box.width / 2;
      var cy = box.height / 2;
      var worldX = (cx - panState.panX) / panState.scale;
      var worldY = (cy - panState.panY) / panState.scale;
      panState.scale = Math.min(4, Math.max(0.5, panState.scale + cfg.delta));
      panState.panX = cx - worldX * panState.scale;
      panState.panY = cy - worldY * panState.scale;
      panState.applyPan();
    });
    wrap.appendChild(btn);
  });

  viewport.appendChild(wrap);
}

function attachEndpointHandler(el, handler, idx) {
  el.addEventListener('click', function(e) { e.stopPropagation(); handler(idx); });
  el.addEventListener('touchend', function(e) { e.preventDefault(); e.stopPropagation(); handler(idx); });
}

function attachPreviewRotateHandler(el, handler) {
  el.addEventListener('click', function(e) { e.stopPropagation(); handler(); });
  el.addEventListener('touchend', function(e) { e.preventDefault(); e.stopPropagation(); handler(); });
}

function renderDominoBoard(viewport, gameState, options) {
  var opts = Object(options);
  var savedPan = null;
  [viewport._dominoPanState].filter(Boolean).forEach(function(p) {
    savedPan = { panX: p.panX, panY: p.panY, scale: p.scale };
  });
  viewport.innerHTML = '';

  var world = document.createElement('div');
  world.className = 'domino-board-world';
  world.setAttribute('data-testid', 'domino-board-world');
  viewport._dominoWorld = world;

  gameState.board.tiles.forEach(function(pt) {
    world.appendChild(buildDominoTileEl(pt, gameState.matchType));
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
  var scale = panState.scale;
  panState.panX = Math.round(viewport.clientWidth / 2) - Math.round((DOMINO_ORIGIN + DOMINO_CELL) * scale);
  panState.panY = Math.round(viewport.clientHeight / 2) - Math.round((DOMINO_ORIGIN + DOMINO_CELL / 2) * scale);
  [savedPan].filter(Boolean).forEach(function(p) {
    panState.panX = p.panX; panState.panY = p.panY; panState.scale = p.scale;
  });
  panState.applyPan();
  viewport._dominoPanState = panState;
  buildDominoZoomBtns(viewport, panState);
}

function setDominoEndpointsActive(viewport, active) {
  [viewport._dominoWorld].filter(Boolean).forEach(function(world) {
    world.querySelectorAll('.domino-endpoint').forEach(function(el) {
      el.classList.toggle('domino-endpoint-active', Boolean(active));
    });
  });
}

function showDominoPreview(viewport, placedTile, options) {
  clearDominoPreview(viewport);
  var opts = Object(options);
  [viewport._dominoWorld].filter(Boolean).forEach(function(world) {
    var el = buildDominoTileEl(placedTile, opts.matchType);
    el.classList.add('domino-preview-tile');
    el.setAttribute('data-testid', 'domino-preview-tile');
    [opts.onPreviewRotate].filter(Boolean).forEach(function(handler) {
      attachPreviewRotateHandler(el, handler);
    });
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
