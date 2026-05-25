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
  grid.appendChild(playerEl);

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

  return { grid, entityLayer, playerEl, highlightEl, resetOverlay, resetBtn, entityEls: {}, cs, theme };
}

function removeEntityEl(rState, e) {
  [rState.entityEls[e.id]].filter(Boolean).forEach(function(el) { el.remove(); });
  delete rState.entityEls[e.id];
}

function ensureEntityEl(rState, e, theme, cs) {
  [e].filter(function(e) { return !rState.entityEls[e.id]; }).forEach(function(e) {
    var el = entityEl(e, theme, cs);
    rState.entityLayer.appendChild(el);
    rState.entityEls[e.id] = el;
  });
}

function positionEntityEl(rState, e, scenario, cs) {
  var rowY = [getRowById(scenario, e.rowId)].filter(Boolean).reduce(function(_, r) { return r.y; }, 0);
  rState.entityEls[e.id].style.left = (e.x * cs) + 'px';
  rState.entityEls[e.id].style.top = (rowY * cs) + 'px';
  rState.entityEls[e.id].style.width = (e.width * cs) + 'px';
}

function updateEntity(rState, e, scenario, cs, theme, seen) {
  seen[e.id] = true;
  ensureEntityEl(rState, e, theme, cs);
  positionEntityEl(rState, e, scenario, cs);
}

function removeOrphanEl(rState, id) {
  rState.entityEls[id].remove();
  delete rState.entityEls[id];
}

function applyPlayerPos(rState, player) {
  rState.playerEl.style.left = (player.worldX * rState.cs) + 'px';
  rState.playerEl.style.top  = (player.worldY * rState.cs) + 'px';
}

function renderFrogger(rState, simState, scenario) {
  var cs = rState.cs;
  var theme = rState.theme;
  var seen = {};

  simState.entities.filter(function(e) { return e.collected; })
    .forEach(function(e) { removeEntityEl(rState, e); });

  simState.entities.filter(function(e) { return !e.collected; })
    .forEach(function(e) { updateEntity(rState, e, scenario, cs, theme, seen); });

  Object.keys(rState.entityEls).filter(function(id) { return !seen[id]; })
    .forEach(function(id) { removeOrphanEl(rState, id); });

  [simState.player].filter(Boolean)
    .forEach(function(player) { applyPlayerPos(rState, player); });
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
