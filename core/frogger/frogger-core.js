var MIN_OBSTACLE_GAP = 2;

function createPRNG(seed) {
  var s = (seed >>> 0) || 1;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSimulation(scenario, seed) {
  var rows = {};
  var entities = [];
  var spawnCounters = {};
  var prng = createPRNG(seed || 42);

  (scenario.rows || []).forEach(function(rowDef) {
    rows[rowDef.id] = { def: rowDef };
    if (rowDef.spawns && rowDef.spawns.length > 0) {
      spawnCounters[rowDef.id] = rowDef.spawns[0].spawnEvery;
    }
  });
  void prng;

  var entityMap = scenario.entities || {};
  Object.keys(entityMap).forEach(function(rowId) {
    (entityMap[rowId] || []).forEach(function(eDef) {
      entities.push({
        id: eDef.id,
        type: eDef.type,
        rowId: rowId,
        x: eDef.x,
        width: eDef.width !== undefined ? eDef.width : 1,
        collected: false
      });
    });
  });

  return {
    phase: 'running',
    grid: { rows: scenario.grid.rows, cols: scenario.grid.cols },
    rows: rows,
    entities: entities,
    spawnCounters: spawnCounters,
    _spawnIdCounter: 0,
    player: null
  };
}

function stepSimulation(state, scenario, tickCount) {
  if (state.phase !== 'running') return;
  var cols = state.grid.cols;
  var player = state.player;

  (scenario.rows || []).forEach(function(rowDef) {
    var movement = rowDef.movement;
    if (!movement || movement.direction === 'none' || !movement.moveEvery) return;

    var moveEvery = movement.moveEvery;
    var dir = movement.direction;
    var delta = dir === 'right' ? 1 : -1;
    var hasSpawns = rowDef.spawns && rowDef.spawns.length > 0;

    if (tickCount % moveEvery === 0) {
      var playerCarried = player && player.y === rowDef.y &&
        activePlatformsInRow(state, rowDef.id, player.x).length > 0;

      state.entities.forEach(function(e) {
        if (e.rowId !== rowDef.id || e.collected) return;
        e.x += delta;
      });

      if (hasSpawns) {
        state.entities = state.entities.filter(function(e) {
          if (e.rowId !== rowDef.id || e.collected) return true;
          return dir === 'right' ? e.x < cols : e.x + e.width > 0;
        });
      } else if (rowDef.wrap !== false) {
        state.entities.forEach(function(e) {
          if (e.rowId !== rowDef.id || e.collected) return;
          if (dir === 'right' && e.x >= cols) e.x -= cols;
          if (dir === 'left' && e.x + e.width <= 0) e.x += cols;
        });
      }

      if (playerCarried) {
        player.x += delta;
        player.x = Math.max(0, Math.min(cols - 1, player.x));
      }
    }

    if (hasSpawns) {
      state.spawnCounters[rowDef.id]--;
      if (state.spawnCounters[rowDef.id] <= 0) {
        var spawnDef = rowDef.spawns[0];
        state.spawnCounters[rowDef.id] = spawnDef.spawnEvery;
        var eDef = spawnDef.entity;
        var w = eDef.width !== undefined ? eDef.width : 1;
        var spawnX = dir === 'right' ? -w : cols;

        if (eDef.type === 'obstacle') {
          var tooClose = false;
          state.entities.forEach(function(ex) {
            if (ex.rowId !== rowDef.id || ex.type !== 'obstacle' || ex.collected) return;
            var dist = dir === 'right' ? ex.x - spawnX : spawnX - (ex.x + ex.width);
            if (dist <= MIN_OBSTACLE_GAP + w) tooClose = true;
          });
          if (tooClose) {
            state.spawnCounters[rowDef.id] = 1;
            return;
          }
        }

        state._spawnIdCounter++;
        state.entities.push({
          id: rowDef.id + '_s' + state._spawnIdCounter,
          type: eDef.type,
          rowId: rowDef.id,
          x: spawnX,
          width: w,
          collected: false
        });
      }
    }
  });
}

function pauseSimulation(state) {
  state.phase = 'paused';
}

function resumeSimulation(state) {
  state.phase = 'running';
}

function getEntityTileX(entity) {
  return Math.floor(entity.x);
}

function getRowEntities(state, rowId) {
  return state.entities.filter(function(e) { return e.rowId === rowId && !e.collected; });
}

function collectEntity(state, entityId) {
  state.entities.forEach(function(e) {
    if (e.id === entityId) e.collected = true;
  });
}

// ---- Player + Collision ----

function createPlayer(x, y) {
  return { x: x, y: y };
}

function addPlayer(state, player) {
  state.player = player;
}

function getRowAtY(scenario, y) {
  var rows = scenario.rows || [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].y === y) return rows[i];
  }
  return null;
}

function getRowById(scenario, rowId) {
  var rows = scenario.rows || [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === rowId) return rows[i];
  }
  return null;
}

function entityOverlapsPlayerTile(entity, playerX) {
  return playerX + 1 > entity.x && playerX < entity.x + entity.width;
}

function activePlatformsInRow(state, rowId, playerX) {
  return state.entities.filter(function(e) {
    return !e.collected && e.type === 'platform' && e.rowId === rowId &&
           playerX >= e.x && playerX < e.x + e.width;
  });
}

function isOnPlatform(state, scenario, player) {
  var row = getRowAtY(scenario, player.y);
  if (!row) return false;
  for (var i = 0; i < state.entities.length; i++) {
    var e = state.entities[i];
    if (e.rowId !== row.id || e.type !== 'platform' || e.collected) continue;
    if (player.x >= e.x && player.x < e.x + e.width) return true;
  }
  return false;
}

function tileHasBlocker(entities, scenario, targetX, targetY) {
  return entities.some(function(e) {
    if (e.type !== 'blocker' || e.collected) return false;
    var row = getRowById(scenario, e.rowId);
    return row && row.y === targetY && Math.floor(e.x) === targetX;
  });
}

function applyInput(state, scenario, direction) {
  if (state.phase !== 'running') return;
  var player = state.player;
  if (!player) return;
  var dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
  var dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
  var nx = player.x + dx;
  var ny = player.y + dy;
  if (nx < 0 || nx >= state.grid.cols || ny < 0 || ny >= state.grid.rows) return;
  var destRow = getRowAtY(scenario, ny);
  if (destRow && destRow.baseTile === 'wall') return;
  if (tileHasBlocker(state.entities, scenario, nx, ny)) return;
  player.x = nx;
  player.y = ny;
}

// no-op stub: carrying is now handled inside stepSimulation
// kept as browser global so index.html does not crash before GAME-LOOP lands
function applyCarrying() {}

function detectCollisions(state, scenario) {
  if (state.phase !== 'running') return null;
  var player = state.player;
  if (!player) return null;

  var entities = state.entities;
  for (var i = 0; i < entities.length; i++) {
    var e = entities[i];
    if (e.type !== 'obstacle' || e.collected) continue;
    var eRow = getRowById(scenario, e.rowId);
    if (!eRow || player.y !== eRow.y) continue;
    if (entityOverlapsPlayerTile(e, player.x)) {
      return { type: 'obstacle', playerX: player.x, playerY: player.y, entityId: e.id };
    }
  }

  for (var j = 0; j < entities.length; j++) {
    var c = entities[j];
    if (c.type !== 'collectible' || c.collected) continue;
    var cRow = getRowById(scenario, c.rowId);
    if (!cRow || player.y !== cRow.y) continue;
    if (entityOverlapsPlayerTile(c, player.x)) {
      return { type: 'collectiblePickedUp', entityId: c.id };
    }
  }

  var row = getRowAtY(scenario, player.y);
  if (row && row.baseTile === 'hazard' && !isOnPlatform(state, scenario, player)) {
    return { type: 'hazard', playerX: player.x, playerY: player.y };
  }

  return null;
}

function resetPlayer(state, scenario, resetPointId) {
  var player = state.player;
  if (!player) return;
  var resetPoints = scenario.resetPoints || [];
  for (var i = 0; i < resetPoints.length; i++) {
    if (resetPoints[i].id === resetPointId) {
      var pos = resetPoints[i].position;
      player.x = pos.x;
      player.y = pos.y;
      return;
    }
  }
}

function isSafeMove(state, scenario, player, dx, dy) {
  var nx = player.x + dx;
  var ny = player.y + dy;
  if (nx < 0 || nx >= state.grid.cols || ny < 0 || ny >= state.grid.rows) return false;
  var destRow = getRowAtY(scenario, ny);
  if (!destRow) return false;
  if (destRow.baseTile === 'wall') return false;
  if (destRow.baseTile === 'hazard') {
    if (activePlatformsInRow(state, destRow.id, nx).length === 0) return false;
  }
  var entities = state.entities;
  for (var i = 0; i < entities.length; i++) {
    var e = entities[i];
    if (e.type !== 'obstacle' || e.collected) continue;
    var eRow = getRowById(scenario, e.rowId);
    if (!eRow || ny !== eRow.y) continue;
    if (entityOverlapsPlayerTile(e, nx)) return false;
  }
  return true;
}

function getMovePreview(state, scenario, player) {
  return {
    left:  isSafeMove(state, scenario, player, -1, 0),
    right: isSafeMove(state, scenario, player,  1, 0),
    up:    isSafeMove(state, scenario, player, 0, -1),
    down:  isSafeMove(state, scenario, player, 0,  1)
  };
}

function findCarryingPlatform(state, scenario, player) {
  var row = getRowAtY(scenario, player.y);
  if (!row) return null;
  var platforms = activePlatformsInRow(state, row.id, player.x);
  return platforms[0] || null;
}

var DIR_DELTA = { right: 1, left: -1, none: 0 };

function buildRowVelocities(scenario) {
  var map = {};
  scenario.rows.forEach(function(row) {
    map[row.id] = DIR_DELTA[row.movement.direction] / Math.max(1, row.movement.moveEvery * 100);
  });
  return map;
}

function clampVisualToSim(visualX, simX) {
  return [visualX].filter(function(v) { return Math.abs(v - simX) <= 1.5; }).reduce(function(_, v) { return v; }, simX);
}

function stepPlatformVisualX(visualX, simX, velocity, dt) {
  return clampVisualToSim(visualX + velocity * dt, simX);
}

function stepObstacleVisualX(visualX, simX, velocity, dt) {
  var next = clampVisualToSim(visualX + velocity * dt, simX);
  var absD = Math.abs(next - simX);
  return (next + simX - Math.sign(velocity) * absD) / 2;
}

function snapshotPositions(simState) {
  var player = simState.player;
  var entities = simState.entities || [];
  var snap = {
    player: player ? { x: player.x, y: player.y } : null,
    entities: {}
  };
  for (var i = 0; i < entities.length; i++) {
    snap.entities[entities[i].id] = { x: entities[i].x };
  }
  return snap;
}

function rowEntities(scenario, rowId) {
  return [].concat(scenario.entities[rowId]).filter(Boolean);
}

function countCollectibles(scenario) {
  return Object.keys(Object.assign({}, scenario.entities)).reduce(function(sum, rowId) {
    return sum + rowEntities(scenario, rowId).filter(function(e) { return e.type === 'collectible'; }).length;
  }, 0);
}

function getCollectAssetPath(theme) {
  return [theme.assets].filter(Boolean).map(function(a) { return a[theme.map.collectible]; }).filter(Boolean)[0];
}

if (typeof module !== 'undefined') module.exports = {
  MIN_OBSTACLE_GAP,
  createPRNG,
  createSimulation,
  stepSimulation,
  pauseSimulation,
  resumeSimulation,
  getEntityTileX,
  getRowEntities,
  collectEntity,
  createPlayer,
  addPlayer,
  getRowAtY,
  getRowById,
  entityOverlapsPlayerTile,
  isOnPlatform,
  tileHasBlocker,
  applyInput,
  detectCollisions,
  resetPlayer,
  activePlatformsInRow,
  findCarryingPlatform,
  isSafeMove,
  getMovePreview,
  snapshotPositions,
  buildRowVelocities,
  clampVisualToSim,
  stepPlatformVisualX,
  stepObstacleVisualX,
  rowEntities,
  countCollectibles,
  getCollectAssetPath
};
