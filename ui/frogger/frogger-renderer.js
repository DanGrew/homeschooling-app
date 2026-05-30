var ENTITY_FALLBACK_FILL = { obstacle: '#cc3300', platform: '#886633', collectible: '#ffcc00' };

function calcCellSize(container, cols, rows) {
  var cs = Math.floor(Math.min(container.offsetWidth / cols, container.offsetHeight / rows));
  return Math.max(cs, 40);
}

function assetImg(src) {
  var img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
  return img;
}

function applyEntityFallback(el, entity) {
  el.style.background = [ENTITY_FALLBACK_FILL[entity.type], '#888'].filter(Boolean)[0];
  el.style.borderRadius = '4px';
  el.style.boxSizing = 'border-box';
}

function applyEntityAsset(el, assetPath) {
  el.appendChild(assetImg(assetPath));
}

function entityEl(entity, theme, cs) {
  var el = document.createElement('div');
  el.style.cssText = 'position:absolute;height:' + cs + 'px;';
  el.setAttribute('data-testid', 'frogger-entity-' + entity.type);
  var assetPath = theme.assets[theme.map[entity.type]];
  var APPLY = { 'true': applyEntityAsset.bind(null, el, assetPath), 'false': applyEntityFallback.bind(null, el, entity) };
  APPLY[String(!!assetPath)]();
  return el;
}

function applyPlayerFallback(playerEl) {
  playerEl.style.background = '#00cc44';
  playerEl.style.borderRadius = '50%';
  playerEl.style.boxSizing = 'border-box';
}

function buildPlayerEl(theme, cs) {
  var playerEl = document.createElement('div');
  playerEl.setAttribute('data-testid', 'frogger-player');
  playerEl.style.cssText = 'position:absolute;width:' + cs + 'px;height:' + cs + 'px;z-index:10;';
  var playerAsset = theme.assets[theme.map.player];
  var BUILD = { 'true': function() { playerEl.appendChild(assetImg(playerAsset)); }, 'false': function() { applyPlayerFallback(playerEl); } };
  BUILD[String(!!playerAsset)]();
  return playerEl;
}

var PREVIEW_DOT_COLOR = { 'true': 'rgba(60,220,60,1.0)', 'false': 'rgba(255,60,60,1.0)' };

function previewDotEl(x, y, r) {
  var el = document.createElement('div');
  el.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;z-index:11;left:' + (x - r) + 'px;top:' + (y - r) + 'px;width:' + (r * 2) + 'px;height:' + (r * 2) + 'px;';
  return el;
}

function buildPreviewDots(playerEl, cs, r) {
  var mid = cs / 2;
  var dots = { left: previewDotEl(0, mid, r), right: previewDotEl(cs, mid, r), up: previewDotEl(mid, 0, r), down: previewDotEl(mid, cs, r) };
  playerEl.appendChild(dots.left);
  playerEl.appendChild(dots.right);
  playerEl.appendChild(dots.up);
  playerEl.appendChild(dots.down);
  return dots;
}

function applyPreviewColor(dotEl, safe) {
  dotEl.style.background = PREVIEW_DOT_COLOR[String(safe)];
}

function updatePreviewDots(rState, simState, scenario) {
  [simState.player].filter(Boolean).forEach(function(p) {
    var preview = getMovePreview(simState, scenario, p);
    applyPreviewColor(rState.previewDots.left,  preview.left);
    applyPreviewColor(rState.previewDots.right, preview.right);
    applyPreviewColor(rState.previewDots.up,    preview.up);
    applyPreviewColor(rState.previewDots.down,  preview.down);
  });
}

function buildLane(rowDef, theme, cs) {
  var lane = document.createElement('div');
  var fill = theme.tiles[rowDef.baseTile].fill;
  lane.style.cssText = 'position:absolute;left:0;top:' + (rowDef.y * cs) + 'px;width:100%;height:' + cs + 'px;background:' + fill + ';';
  return lane;
}

function initFroggerRenderer(container, scenario, theme) {
  var cols = scenario.grid.cols;
  var rows = scenario.grid.rows;
  var cs = calcCellSize(container, cols, rows);

  var grid = document.createElement('div');
  grid.setAttribute('data-testid', 'frogger-grid');
  grid.style.cssText = 'position:relative;width:' + (cols * cs) + 'px;height:' + (rows * cs) + 'px;overflow:hidden;margin:auto;';

  scenario.rows.forEach(function(rowDef) { grid.appendChild(buildLane(rowDef, theme, cs)); });

  var entityLayer = document.createElement('div');
  entityLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  grid.appendChild(entityLayer);

  var playerEl = buildPlayerEl(theme, cs);
  var dotR = Math.round(cs * 0.12);
  var contactDotEl = document.createElement('div');
  contactDotEl.style.cssText = 'position:absolute;background:rgba(255,255,0,1.0);border-radius:50%;left:' + (cs / 2 - dotR) + 'px;top:' + (cs / 2 - dotR) + 'px;width:' + (dotR * 2) + 'px;height:' + (dotR * 2) + 'px;pointer-events:none;z-index:11;';
  playerEl.appendChild(contactDotEl);
  var previewDots = buildPreviewDots(playerEl, cs, dotR);
  grid.appendChild(playerEl);

  var bboxLayer = document.createElement('div');
  bboxLayer.setAttribute('data-testid', 'frogger-bbox-layer');
  bboxLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:15;';
  grid.appendChild(bboxLayer);

  var highlightEl = document.createElement('div');
  highlightEl.setAttribute('data-testid', 'frogger-highlight');
  highlightEl.style.cssText = 'position:absolute;background:rgba(255,0,0,0.55);opacity:0;transition:opacity 0.5s;pointer-events:none;z-index:20;width:' + cs + 'px;height:' + cs + 'px;';
  grid.appendChild(highlightEl);

  var resetOverlay = document.createElement('div');
  resetOverlay.setAttribute('data-testid', 'frogger-reset-overlay');
  resetOverlay.style.cssText = 'display:none;position:absolute;inset:0;background:rgba(0,0,0,0.45);z-index:30;align-items:center;justify-content:center;flex-direction:column;';

  var resetMsg = document.createElement('div');
  resetMsg.setAttribute('data-testid', 'frogger-reset-msg');
  resetMsg.style.cssText = 'color:#fff;font-size:1.4rem;font-family:sans-serif;font-weight:bold;margin-bottom:16px;text-align:center;';
  resetMsg.textContent = 'Oops! Try a different way!';

  var resetBtn = document.createElement('button');
  resetBtn.setAttribute('data-testid', 'frogger-reset-btn');
  resetBtn.textContent = 'Try Again';
  resetBtn.style.cssText = 'font-size:1.1rem;padding:14px 28px;border-radius:10px;border:none;background:#fff;cursor:pointer;font-weight:bold;';
  resetOverlay.appendChild(resetMsg);
  resetOverlay.appendChild(resetBtn);
  grid.appendChild(resetOverlay);
  container.appendChild(grid);

  return { grid, entityLayer, playerEl, highlightEl, resetOverlay, resetBtn, bboxLayer, previewDots, entityEls: {}, visualX: {}, playerVisualX: null, rowVelocities: buildRowVelocities(scenario), cs, theme };
}

function removeEntityEl(rState, e) {
  [rState.entityEls[e.id]].filter(Boolean).forEach(function(el) { el.remove(); });
  delete rState.entityEls[e.id];
  delete rState.visualX[e.id];
}

function ensureEntityEl(rState, e, theme, cs) {
  [e].filter(function(e) { return !rState.entityEls[e.id]; }).forEach(function(e) {
    var el = entityEl(e, theme, cs);
    rState.entityLayer.appendChild(el);
    rState.entityEls[e.id] = el;
    rState.visualX[e.id] = e.x;
  });
}

function advanceEntityVisualX(rState, e, dt) {
  var next = rState.visualX[e.id] + rState.rowVelocities[e.rowId] * dt;
  rState.visualX[e.id] = clampVisualToSim(next, e.x);
}

function positionEntityEl(rState, e, scenario, cs) {
  var rowY = [getRowById(scenario, e.rowId)].filter(Boolean).reduce(function(_, r) { return r.y; }, 0);
  rState.entityEls[e.id].style.left = (rState.visualX[e.id] * cs) + 'px';
  rState.entityEls[e.id].style.top = (rowY * cs) + 'px';
  rState.entityEls[e.id].style.width = (e.width * cs) + 'px';
}

function updateEntity(rState, e, scenario, cs, theme, seen, dt) {
  seen[e.id] = true;
  ensureEntityEl(rState, e, theme, cs);
  advanceEntityVisualX(rState, e, dt);
  positionEntityEl(rState, e, scenario, cs);
}

function removeOrphanEl(rState, id) {
  rState.entityEls[id].remove();
  delete rState.entityEls[id];
  delete rState.visualX[id];
}

var BBOX_CFG = {
  obstacle:    { color: 'rgba(255,60,60,0.85)'  },
  platform:    { color: 'rgba(60,220,60,0.85)'  },
  collectible: { color: 'rgba(255,200,0,0.85)'  }
};

function bboxDiv(x, y, w, h, color) {
  var el = document.createElement('div');
  el.style.cssText = 'position:absolute;box-sizing:border-box;border:2px solid ' + color + ';left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;';
  return el;
}

function bboxDivThick(x, y, w, h, color) {
  var el = document.createElement('div');
  el.style.cssText = 'position:absolute;box-sizing:border-box;border:3px solid ' + color + ';left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;';
  return el;
}

function appendEntityBBox(rState, layer, cs, scenario, e) {
  var cfg = BBOX_CFG[e.type];
  [getRowById(scenario, e.rowId)].filter(Boolean).forEach(function(row) {
    layer.appendChild(bboxDiv(rState.visualX[e.id] * cs, row.y * cs, e.width * cs, cs, cfg.color));
  });
}

function appendActivePlatformBBox(rState, layer, cs, scenario, e) {
  [getRowById(scenario, e.rowId)].filter(Boolean).forEach(function(row) {
    layer.appendChild(bboxDivThick(rState.visualX[e.id] * cs, row.y * cs, e.width * cs, cs, 'rgba(120,255,120,1.0)'));
  });
}

function renderBBoxes(rState, simState, scenario) {
  var layer = rState.bboxLayer;
  var cs = rState.cs;
  layer.innerHTML = '';
  simState.entities.filter(function(e) { return !e.collected; })
    .forEach(function(e) { appendEntityBBox(rState, layer, cs, scenario, e); });
  [simState.player].filter(Boolean).forEach(function(p) {
    layer.appendChild(bboxDiv(rState.playerVisualX * cs, p.y * cs, cs, cs, 'rgba(255,255,0,0.9)'));
    [findCarryingPlatform(simState, scenario, p)].filter(Boolean)
      .forEach(function(e) { appendActivePlatformBBox(rState, layer, cs, scenario, e); });
  });
}

function advancePlayerVisualX(rState, player, simState, scenario, prevPositions, alpha, dt) {
  var initX = [rState.playerVisualX].filter(function(v) { return v !== null; }).reduce(function(_, v) { return v; }, player.x);
  var carrier = findCarryingPlatform(simState, scenario, player);
  var prevX = [prevPositions.player].filter(Boolean).reduce(function(_, p) { return p.x; }, player.x);
  var ADVANCE = {
    'true':  function() { return clampVisualToSim(initX + rState.rowVelocities[carrier.rowId] * dt, player.x); },
    'false': function() { return prevX + (player.x - prevX) * alpha; }
  };
  rState.playerVisualX = ADVANCE[String(!!carrier)]();
}

function applyPlayerPos(rState, player, simState, scenario, prevPositions, alpha, dt) {
  advancePlayerVisualX(rState, player, simState, scenario, prevPositions, alpha, dt);
  rState.playerEl.style.left = (rState.playerVisualX * rState.cs) + 'px';
  rState.playerEl.style.top  = (player.y * rState.cs) + 'px';
}

function renderFrogger(rState, simState, scenario, prevPositions, alpha, dt) {
  var cs = rState.cs;
  var theme = rState.theme;
  var seen = {};

  simState.entities.filter(function(e) { return e.collected; })
    .forEach(function(e) { removeEntityEl(rState, e); });

  simState.entities.filter(function(e) { return !e.collected; })
    .forEach(function(e) { updateEntity(rState, e, scenario, cs, theme, seen, dt); });

  Object.keys(rState.entityEls).filter(function(id) { return !seen[id]; })
    .forEach(function(id) { removeOrphanEl(rState, id); });

  [simState.player].filter(Boolean)
    .forEach(function(player) { applyPlayerPos(rState, player, simState, scenario, prevPositions, alpha, dt); });

  renderBBoxes(rState, simState, scenario);
  updatePreviewDots(rState, simState, scenario);
}

function fadeOutHighlight(hl) {
  hl.style.transition = 'opacity 0.5s';
  hl.style.opacity = '0';
}

function showCollisionHighlight(rState, collision) {
  var hl = rState.highlightEl;
  hl.style.left = (collision.playerX * rState.cs) + 'px';
  hl.style.top = (collision.playerY * rState.cs) + 'px';
  hl.style.transition = 'none';
  hl.style.opacity = '1';
  setTimeout(fadeOutHighlight.bind(null, hl), 50);
}

function showResetPrompt(rState) { rState.resetOverlay.style.display = 'flex'; }
function hideResetPrompt(rState) { rState.resetOverlay.style.display = 'none'; }
