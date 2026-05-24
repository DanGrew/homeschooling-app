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

function entityEl(entity, theme, cs) {
  var el = document.createElement('div');
  el.style.cssText = 'position:absolute;height:' + cs + 'px;';
  el.setAttribute('data-testid', 'frogger-entity-' + entity.type);
  var assetKey = theme.map && theme.map[entity.type];
  var assetPath = assetKey && theme.assets && theme.assets[assetKey];
  if (assetPath) {
    el.appendChild(assetImg(assetPath));
  } else {
    el.style.background = ENTITY_FALLBACK_FILL[entity.type] || '#888';
    el.style.borderRadius = '4px';
    el.style.boxSizing = 'border-box';
  }
  return el;
}

function initFroggerRenderer(container, scenario, theme) {
  var cols = scenario.grid.cols;
  var rows = scenario.grid.rows;
  var cs = calcCellSize(container, cols, rows);

  var grid = document.createElement('div');
  grid.setAttribute('data-testid', 'frogger-grid');
  grid.style.cssText = 'position:relative;width:' + (cols * cs) + 'px;height:' + (rows * cs) + 'px;overflow:hidden;margin:auto;';

  (scenario.rows || []).forEach(function(rowDef) {
    var lane = document.createElement('div');
    var tileCfg = (theme.tiles && theme.tiles[rowDef.baseTile]) || {};
    lane.style.cssText = 'position:absolute;left:0;top:' + (rowDef.y * cs) + 'px;width:100%;height:' + cs + 'px;background:' + (tileCfg.fill || '#ccc') + ';';
    grid.appendChild(lane);
  });

  var entityLayer = document.createElement('div');
  entityLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  grid.appendChild(entityLayer);

  var playerEl = document.createElement('div');
  playerEl.setAttribute('data-testid', 'frogger-player');
  playerEl.style.cssText = 'position:absolute;width:' + cs + 'px;height:' + cs + 'px;z-index:10;';
  var playerAsset = theme.assets && theme.map && theme.assets[theme.map.player];
  if (playerAsset) {
    playerEl.appendChild(assetImg(playerAsset));
  } else {
    playerEl.style.background = '#00cc44';
    playerEl.style.borderRadius = '50%';
    playerEl.style.boxSizing = 'border-box';
  }
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

  return {
    grid: grid,
    entityLayer: entityLayer,
    playerEl: playerEl,
    highlightEl: highlightEl,
    resetOverlay: resetOverlay,
    resetBtn: resetBtn,
    entityEls: {},
    cs: cs,
    theme: theme
  };
}

function getRowY(scenario, rowId) {
  var rows = scenario.rows || [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === rowId) return rows[i].y;
  }
  return 0;
}

function renderFrogger(rState, simState, scenario, HOP_DURATION) {
  var cs = rState.cs;
  var theme = rState.theme;
  var seen = {};

  simState.entities.forEach(function(e) {
    if (e.collected) {
      if (rState.entityEls[e.id]) {
        rState.entityEls[e.id].remove();
        delete rState.entityEls[e.id];
      }
      return;
    }
    seen[e.id] = true;
    var el = rState.entityEls[e.id];
    if (!el) {
      el = entityEl(e, theme, cs);
      rState.entityLayer.appendChild(el);
      rState.entityEls[e.id] = el;
    }
    el.style.left = (e.x * cs) + 'px';
    el.style.top = (getRowY(scenario, e.rowId) * cs) + 'px';
    el.style.width = (e.width * cs) + 'px';
  });

  Object.keys(rState.entityEls).forEach(function(id) {
    if (!seen[id]) {
      rState.entityEls[id].remove();
      delete rState.entityEls[id];
    }
  });

  var player = simState.player;
  if (player) {
    var px, py;
    if (player.hopState === 'hopping' && player.hopFrom && player.hopTo) {
      var progress = 1 - Math.max(0, player.hopTimer / HOP_DURATION);
      px = player.hopFrom.x + (player.hopTo.x - player.hopFrom.x) * progress;
      py = player.hopFrom.y + (player.hopTo.y - player.hopFrom.y) * progress;
    } else {
      px = player.x;
      py = player.y;
    }
    rState.playerEl.style.left = (px * cs) + 'px';
    rState.playerEl.style.top = (py * cs) + 'px';
  }
}

function showCollisionHighlight(rState, collision) {
  var cs = rState.cs;
  var hl = rState.highlightEl;
  hl.style.left = (collision.playerX * cs) + 'px';
  hl.style.top = (collision.playerY * cs) + 'px';
  hl.style.transition = 'none';
  hl.style.opacity = '1';
  setTimeout(function() {
    hl.style.transition = 'opacity 0.5s';
    hl.style.opacity = '0';
  }, 50);
}

function showResetPrompt(rState) {
  rState.resetOverlay.style.display = 'flex';
}

function hideResetPrompt(rState) {
  rState.resetOverlay.style.display = 'none';
}
