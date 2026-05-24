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
  var spawnSeeds = {};
  var prng = createPRNG(seed || 42);

  (scenario.rows || []).forEach(function(rowDef) {
    rows[rowDef.id] = { def: rowDef, travelAccum: 0 };
    spawnCounters[rowDef.id] = 0;
    spawnSeeds[rowDef.id] = prng;
  });

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
    _spawnIdCounter: 0
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

      rowDef.spawns.forEach(function(spawnDef) {
        var every = spawnDef.every;
        var prevCount = Math.floor(prevAccum / every);
        var newCount = Math.floor(newAccum / every);
        var toSpawn = newCount - prevCount;

        for (var i = 0; i < toSpawn; i++) {
          var eDef = spawnDef.entity;
          var w = eDef.width !== undefined ? eDef.width : 1;
          var spawnX = dir === 'right' ? -w : cols;
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

      state.spawnCounters[rowDef.id] = newAccum;
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

if (typeof module !== 'undefined') module.exports = {
  createPRNG,
  createSimulation,
  stepSimulation,
  pauseSimulation,
  resumeSimulation,
  getEntityTileX,
  getRowEntities,
  collectEntity
};
