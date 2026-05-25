var MIN_OBSTACLE_GAP = 2;
var STEP = 0.5;

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
    rows[rowDef.id] = { def: rowDef, travelAccum: 0 };
    spawnCounters[rowDef.id] = 0;
  });
  // prng available for future use
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

function stepSimulation(state, scenario, dt) {
  if (state.phase !== 'running') return;

  var cols = state.grid.cols;

  (scenario.rows || []).forEach(function(rowDef) {
    var movement = rowDef.movement;
    if (!movement || movement.direction === 'none') return;

    var speed = movement.speed;
    var dir = movement.direction;
    var dx = (dir === 'right' ? 1 : -1) * speed * dt;
    var wrap = rowDef.wrap !== false;
    var absDx = Math.abs(dx);

    state.entities.forEach(function(e) {
      if (e.rowId !== rowDef.id || e.collected) return;
      e.x += dx;
      if (wrap) {
        if (dir === 'right' && e.x >= cols) e.x -= cols;
        if (dir === 'left' && e.x + e.width <= 0) e.x += cols;
      }
    });

    if (rowDef.spawns && rowDef.spawns.length > 0) {
      var prevAccum = state.spawnCounters[rowDef.id];
      var newAccum = prevAccum + absDx;
      var finalAccum = newAccum;

      rowDef.spawns.forEach(function(spawnDef) {
        var every = spawnDef.every;
        var prevCount = Math.floor(prevAccum / every);
        var newCount = Math.floor(newAccum / every);
        var toSpawn = newCount - prevCount;

        for (var i = 0; i < toSpawn; i++) {
          var eDef = spawnDef.entity;
          var w = eDef.width !== undefined ? eDef.width : 1;
          var spawnX = dir === 'right' ? -w : cols;

          if (eDef.type === 'obstacle') {
            var tooClose = false;
            state.entities.forEach(function(ex) {
              if (ex.rowId !== rowDef.id || ex.type !== 'obstacle' || ex.collected) return;
              var dist = dir === 'right' ? ex.x - (-w) : cols - (ex.x + ex.width);
              if (dist <= MIN_OBSTACLE_GAP + w) tooClose = true;
              var distWrap = dir === 'right' ? cols - (ex.x + ex.width) : ex.x + ex.width;
              if (wrap && distWrap <= MIN_OBSTACLE_GAP + w) tooClose = true;
            });
            if (tooClose) {
              finalAccum = 0;
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
      });

      state.spawnCounters[rowDef.id] = finalAccum;
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
  return {
    x: x,
    y: y,
    worldX: x,
    worldY: y
  };
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

function isOnPlatform(state, scenario, player) {
  var row = getRowAtY(scenario, player.y);
  if (!row) return false;
  var entities = state.entities;
  for (var i = 0; i < entities.length; i++) {
    var e = entities[i];
    if (e.rowId !== row.id || e.type !== 'platform' || e.collected) continue;
    var cx = player.worldX + 0.5;
    if (e.x < cx && cx < e.x + e.width) return true;
  }
  return false;
}

function applyInput(state, scenario, direction) {
  if (state.phase !== 'running') return;
  var player = state.player;
  if (!player) return;
  var dx = direction === 'left' ? -STEP : direction === 'right' ? STEP : 0;
  var dy = direction === 'up' ? -STEP : direction === 'down' ? STEP : 0;
  var nx = player.worldX + dx;
  var ny = player.worldY + dy;
  if (nx < 0 || nx >= state.grid.cols || ny < 0 || ny >= state.grid.rows) return;
  var destRow = getRowAtY(scenario, Math.floor(ny));
  if (destRow && destRow.baseTile === 'wall') return;
  player.worldX = nx;
  player.worldY = ny;
  player.x = Math.floor(nx);
  player.y = Math.floor(ny);
}

function applyCarrying(state, scenario, dt) {
  if (state.phase !== 'running') return;
  var player = state.player;
  if (!player) return;

  var row = getRowAtY(scenario, player.y);
  if (!row || !row.movement || row.movement.direction === 'none') return;
  if (!isOnPlatform(state, scenario, player)) return;

  var dx = (row.movement.direction === 'right' ? 1 : -1) * row.movement.speed * dt;
  player.worldX += dx;

  var cols = state.grid.cols;
  if (player.worldX < 0) player.worldX = 0;
  if (player.worldX > cols - 1) player.worldX = cols - 1;
  player.x = Math.floor(player.worldX);
}

function detectCollisions(state, scenario) {
  if (state.phase !== 'running') return null;
  var player = state.player;
  if (!player) return null;

  var entities = state.entities;
  for (var i = 0; i < entities.length; i++) {
    var e = entities[i];
    if (e.type !== 'obstacle' || e.collected) continue;
    var eRow = getRowById(scenario, e.rowId);
    if (!eRow || eRow.y !== player.y) continue;
    if (entityOverlapsPlayerTile(e, player.worldX)) {
      return { type: 'obstacle', playerX: player.x, playerY: player.y, entityId: e.id };
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
      player.worldX = pos.x;
      player.worldY = pos.y;
      return;
    }
  }
}

if (typeof module !== 'undefined') module.exports = {
  MIN_OBSTACLE_GAP,
  STEP,
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
  applyInput,
  applyCarrying,
  detectCollisions,
  resetPlayer
};
