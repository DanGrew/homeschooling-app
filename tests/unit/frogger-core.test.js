const { createRequire } = require('module')
const require2 = createRequire(import.meta.url)
const {
  createPRNG,
  createSimulation,
  stepSimulation,
  pauseSimulation,
  resumeSimulation,
  getEntityTileX,
  getRowEntities,
  collectEntity,
  addPlayer,
  createPlayer,
  snapshotPositions,
  buildRowVelocities,
  clampVisualToSim,
  stepPlatformVisualX,
  stepObstacleVisualX,
  MIN_OBSTACLE_GAP
} = require2('../../core/frogger/frogger-core.js')

// ---- helpers ----

function makeScenario(overrides) {
  return Object.assign({
    id: 'test',
    grid: { rows: 8, cols: 10 },
    rows: [],
    entities: {},
    resetPoints: [{ id: 'start', position: { x: 5, y: 7 } }]
  }, overrides)
}

function makeRow(id, dir, moveEvery, opts) {
  return Object.assign({
    id: id,
    baseTile: 'hazard',
    wrap: true,
    movement: { direction: dir, moveEvery: moveEvery }
  }, opts)
}

// ---- createSimulation ----

test('initial phase is running', () => {
  const state = createSimulation(makeScenario())
  expect(state.phase).toBe('running')
})

test('grid dimensions match scenario', () => {
  const state = createSimulation(makeScenario({ grid: { rows: 5, cols: 12 } }))
  expect(state.grid.rows).toBe(5)
  expect(state.grid.cols).toBe(12)
})

test('pre-placed entities are loaded', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'log1', type: 'platform', x: 2, width: 2 }] }
  })
  const state = createSimulation(scenario)
  expect(state.entities).toHaveLength(1)
  expect(state.entities[0].id).toBe('log1')
  expect(state.entities[0].type).toBe('platform')
  expect(state.entities[0].rowId).toBe('r1')
  expect(state.entities[0].x).toBe(2)
  expect(state.entities[0].width).toBe(2)
})

test('entity defaults width to 1 when omitted', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'e1', type: 'obstacle', x: 0 }] }
  })
  const state = createSimulation(scenario)
  expect(state.entities[0].width).toBe(1)
})

test('rows with no entities start with empty entity list', () => {
  const scenario = makeScenario({ rows: [makeRow('r1', 'right', 1)] })
  const state = createSimulation(scenario)
  expect(state.entities).toHaveLength(0)
})

test('spawnCounter initialised to spawnEvery for spawning rows', () => {
  const spawnDef = { entity: { type: 'platform', width: 1 }, spawnEvery: 17 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 8), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  expect(state.spawnCounters['r1']).toBe(17)
})

test('no spawnCounter for rows with no spawns', () => {
  const scenario = makeScenario({ rows: [makeRow('r1', 'right', 1)] })
  const state = createSimulation(scenario)
  expect(state.spawnCounters['r1']).toBeUndefined()
})

// ---- stepSimulation: movement ----

test('entity moves right on move tick', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 3)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(0)
  stepSimulation(state, scenario, 3)
  expect(state.entities[0].x).toBe(1)
})

test('entity moves left on move tick', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'left', 2)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 5, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 2)
  expect(state.entities[0].x).toBe(4)
})

test('entity does not move on non-move tick', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 5)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 3, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  stepSimulation(state, scenario, 3)
  expect(state.entities[0].x).toBe(3)
})

test('entities in different rows move at independent rates', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1), makeRow('r2', 'left', 2)],
    entities: {
      r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }],
      r2: [{ id: 'e2', type: 'platform', x: 5, width: 1 }]
    }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities.find(e => e.id === 'e1').x).toBe(1)
  expect(state.entities.find(e => e.id === 'e2').x).toBe(5)
})

test('row with direction none does not move entities', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'none', 0)],
    entities: { r1: [{ id: 'e1', type: 'ground', x: 3, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  expect(state.entities[0].x).toBe(3)
})

// ---- stepSimulation: wrapping ----

test('right-moving entity wraps at cols (non-spawn row)', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 9, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(0)
})

test('left-moving entity wraps when x+width <= 0 (non-spawn row)', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'left', 1)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(9)
})

test('wrap false row: no wrapping (entity slides off grid)', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1, { wrap: false })],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 9, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(10)
})

// ---- stepSimulation: spawning ----

test('no spawn on tick 0 — first spawn after spawnEvery ticks', () => {
  const spawnDef = { entity: { type: 'platform', width: 1 }, spawnEvery: 4 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  for (var t = 0; t < 3; t++) stepSimulation(state, scenario, t)
  expect(state.entities).toHaveLength(0)
  stepSimulation(state, scenario, 3)
  expect(state.entities.filter(e => e.rowId === 'r1')).toHaveLength(1)
})

test('right-moving spawn starts at x = -width', () => {
  const spawnDef = { entity: { type: 'platform', width: 2 }, spawnEvery: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  const spawned = state.entities.find(e => e.rowId === 'r1')
  expect(spawned.x).toBe(-2)
})

test('left-moving spawn starts at x = cols', () => {
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, spawnEvery: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'left', 1), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  const spawned = state.entities.find(e => e.rowId === 'r1')
  expect(spawned.x).toBe(10)
})

test('spawn counter resets to spawnEvery after spawn', () => {
  const spawnDef = { entity: { type: 'platform', width: 1 }, spawnEvery: 3 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  stepSimulation(state, scenario, 1)
  stepSimulation(state, scenario, 2)
  expect(state.spawnCounters['r1']).toBe(3)
})

test('spawning row: right entity removed when x >= cols', () => {
  const spawnDef = { entity: { type: 'platform', width: 1 }, spawnEvery: 100 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 9, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities.filter(e => e.rowId === 'r1' && !e.collected)).toHaveLength(0)
})

test('spawning row: left entity removed when x+width <= 0', () => {
  const spawnDef = { entity: { type: 'platform', width: 1 }, spawnEvery: 100 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'left', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities.filter(e => e.rowId === 'r1' && !e.collected)).toHaveLength(0)
})

// ---- stepSimulation: carrying ----

test('player on platform is carried right when platform moves', () => {
  const scenario = makeScenario({
    rows: [{ id: 'river', y: 3, baseTile: 'hazard', wrap: true, movement: { direction: 'right', moveEvery: 1 } }],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 3 }] }
  })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(4, 3))
  stepSimulation(state, scenario, 1)
  expect(state.player.x).toBe(5)
  expect(state.entities[0].x).toBe(5)
})

test('player on platform is carried left when platform moves', () => {
  const scenario = makeScenario({
    rows: [{ id: 'river', y: 3, baseTile: 'hazard', wrap: true, movement: { direction: 'left', moveEvery: 1 } }],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 3 }] }
  })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(4, 3))
  stepSimulation(state, scenario, 1)
  expect(state.player.x).toBe(3)
})

test('player not on platform is not carried', () => {
  const scenario = makeScenario({
    rows: [{ id: 'river', y: 3, baseTile: 'hazard', wrap: true, movement: { direction: 'right', moveEvery: 1 } }],
    entities: { river: [{ id: 'log1', type: 'platform', x: 7, width: 2 }] }
  })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(2, 3))
  stepSimulation(state, scenario, 1)
  expect(state.player.x).toBe(2)
})

test('player on different row not carried when platform moves', () => {
  const scenario = makeScenario({
    rows: [
      { id: 'river', y: 3, baseTile: 'hazard', wrap: true, movement: { direction: 'right', moveEvery: 1 } },
      { id: 'ground', y: 4, baseTile: 'ground', wrap: false, movement: { direction: 'none', moveEvery: 0 } }
    ],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 3 }] }
  })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(4, 4))
  stepSimulation(state, scenario, 1)
  expect(state.player.x).toBe(4)
})

test('carrying clamped at right grid edge', () => {
  const scenario = makeScenario({
    rows: [{ id: 'river', y: 3, baseTile: 'hazard', wrap: true, movement: { direction: 'right', moveEvery: 1 } }],
    entities: { river: [{ id: 'log1', type: 'platform', x: 9, width: 1 }] }
  })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(9, 3))
  stepSimulation(state, scenario, 1)
  expect(state.player.x).toBe(9)
})

test('carrying clamped at left grid edge', () => {
  const scenario = makeScenario({
    rows: [{ id: 'river', y: 3, baseTile: 'hazard', wrap: true, movement: { direction: 'left', moveEvery: 1 } }],
    entities: { river: [{ id: 'log1', type: 'platform', x: 0, width: 3 }] }
  })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(0, 3))
  stepSimulation(state, scenario, 1)
  expect(state.player.x).toBe(0)
})

test('player not carried on non-move tick', () => {
  const scenario = makeScenario({
    rows: [{ id: 'river', y: 3, baseTile: 'hazard', wrap: true, movement: { direction: 'right', moveEvery: 5 } }],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 3 }] }
  })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(4, 3))
  stepSimulation(state, scenario, 1)
  expect(state.player.x).toBe(4)
})

// ---- pause / resume ----

test('paused simulation does not move entities', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  pauseSimulation(state)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(0)
})

test('resumed simulation moves entities again', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  pauseSimulation(state)
  resumeSimulation(state)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(1)
})

test('pause sets phase to paused', () => {
  const state = createSimulation(makeScenario())
  pauseSimulation(state)
  expect(state.phase).toBe('paused')
})

test('resume sets phase to running', () => {
  const state = createSimulation(makeScenario())
  pauseSimulation(state)
  resumeSimulation(state)
  expect(state.phase).toBe('running')
})

// ---- getEntityTileX ----

test('getEntityTileX floors float x', () => {
  expect(getEntityTileX({ x: 3.9 })).toBe(3)
  expect(getEntityTileX({ x: 0.1 })).toBe(0)
  expect(getEntityTileX({ x: 5.0 })).toBe(5)
})

// ---- getRowEntities ----

test('getRowEntities returns only entities in that row', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1), makeRow('r2', 'left', 1)],
    entities: {
      r1: [{ id: 'a', type: 'platform', x: 0, width: 1 }],
      r2: [{ id: 'b', type: 'obstacle', x: 5, width: 1 }]
    }
  })
  const state = createSimulation(scenario)
  const r1Ents = getRowEntities(state, 'r1')
  expect(r1Ents).toHaveLength(1)
  expect(r1Ents[0].id).toBe('a')
})

test('getRowEntities excludes collected entities', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'c', type: 'collectible', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  collectEntity(state, 'c')
  expect(getRowEntities(state, 'r1')).toHaveLength(0)
})

// ---- collectEntity ----

test('collectEntity marks entity as collected', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'gem1', type: 'collectible', x: 2, width: 1 }] }
  })
  const state = createSimulation(scenario)
  collectEntity(state, 'gem1')
  expect(state.entities[0].collected).toBe(true)
})

test('collected entity does not move on step', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'gem1', type: 'collectible', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  collectEntity(state, 'gem1')
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(0)
})

// ---- createPRNG ----

test('PRNG produces values in [0, 1)', () => {
  const rng = createPRNG(12345)
  for (var i = 0; i < 100; i++) {
    const v = rng()
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThan(1)
  }
})

test('PRNG is deterministic for same seed', () => {
  const rng1 = createPRNG(99)
  const rng2 = createPRNG(99)
  for (var i = 0; i < 20; i++) {
    expect(rng1()).toBe(rng2())
  }
})

test('PRNG produces different sequences for different seeds', () => {
  const rng1 = createPRNG(1)
  const rng2 = createPRNG(2)
  const seq1 = [rng1(), rng1(), rng1()]
  const seq2 = [rng2(), rng2(), rng2()]
  expect(seq1).not.toEqual(seq2)
})

// ---- obstacle minimum gap ----

test('MIN_OBSTACLE_GAP is 2', () => {
  expect(MIN_OBSTACLE_GAP).toBe(2)
})

test('obstacle spawn blocked when existing obstacle within gap (rightward)', () => {
  // car1 at x=1. After move (tick 0): x=2. dist=2-(-1)=3 <= MIN_OBSTACLE_GAP+w=3 → blocked
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, spawnEvery: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'car1', type: 'obstacle', x: 1, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  expect(state.entities.filter(e => e.rowId === 'r1' && !e.collected)).toHaveLength(1)
})

test('obstacle spawn proceeds when existing obstacle beyond gap (rightward)', () => {
  // car1 at x=5. After move: x=6. dist=6-(-1)=7 > 3 → spawn proceeds
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, spawnEvery: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'car1', type: 'obstacle', x: 5, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  expect(state.entities.filter(e => e.rowId === 'r1').length).toBeGreaterThan(1)
})

test('obstacle spawn blocked when existing obstacle within gap (leftward)', () => {
  // car1 at x=8 width=1. After move: x=7. spawnX=10. dist=10-(7+1)=2 <= 3 → blocked
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, spawnEvery: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'left', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'car1', type: 'obstacle', x: 8, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  expect(state.entities.filter(e => e.rowId === 'r1' && !e.collected)).toHaveLength(1)
})

test('gap check does not affect platform spawning', () => {
  // platform at x=0 (near spawn) — gap check skipped for platforms → spawn proceeds
  const spawnDef = { entity: { type: 'platform', width: 1 }, spawnEvery: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'log1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  expect(state.entities.filter(e => e.rowId === 'r1').length).toBeGreaterThan(1)
})

test('counter set to 1 when obstacle spawn blocked (retry next tick)', () => {
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, spawnEvery: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'car1', type: 'obstacle', x: 1, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0)
  expect(state.spawnCounters['r1']).toBe(1)
})

// ---- snapshotPositions ----

test('snapshotPositions captures player x and y', () => {
  const scenario = makeScenario({ rows: [makeRow('r1', 'right', 1)] })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(3, 5))
  const snap = snapshotPositions(state)
  expect(snap.player.x).toBe(3)
  expect(snap.player.y).toBe(5)
})

test('snapshotPositions player snapshot is independent copy', () => {
  const scenario = makeScenario({ rows: [makeRow('r1', 'right', 1)] })
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(3, 5))
  const snap = snapshotPositions(state)
  state.player.x = 9
  expect(snap.player.x).toBe(3)
})

test('snapshotPositions captures entity x by id', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'log1', type: 'platform', x: 7, width: 2 }] }
  })
  const state = createSimulation(scenario)
  const snap = snapshotPositions(state)
  expect(snap.entities['log1'].x).toBe(7)
})

test('snapshotPositions entity snapshot is independent copy', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 1)],
    entities: { r1: [{ id: 'log1', type: 'platform', x: 7, width: 2 }] }
  })
  const state = createSimulation(scenario)
  const snap = snapshotPositions(state)
  state.entities[0].x = 0
  expect(snap.entities['log1'].x).toBe(7)
})

test('snapshotPositions with no player returns null player', () => {
  const state = createSimulation(makeScenario())
  const snap = snapshotPositions(state)
  expect(snap.player).toBeNull()
})

test('snapshotPositions with no entities returns empty entities object', () => {
  const state = createSimulation(makeScenario())
  const snap = snapshotPositions(state)
  expect(snap.entities).toEqual({})
})

// ---- buildRowVelocities ----

test('buildRowVelocities right row returns positive velocity', () => {
  const scenario = makeScenario({ rows: [makeRow('r1', 'right', 5)] })
  const vels = buildRowVelocities(scenario)
  expect(vels['r1']).toBeCloseTo(1 / (5 * 100))
})

test('buildRowVelocities left row returns negative velocity', () => {
  const scenario = makeScenario({ rows: [makeRow('r1', 'left', 4)] })
  const vels = buildRowVelocities(scenario)
  expect(vels['r1']).toBeCloseTo(-1 / (4 * 100))
})

test('buildRowVelocities none row returns zero velocity', () => {
  const scenario = makeScenario({ rows: [makeRow('r1', 'none', 1)] })
  const vels = buildRowVelocities(scenario)
  expect(vels['r1']).toBe(0)
})

test('buildRowVelocities multiple rows', () => {
  const scenario = makeScenario({ rows: [makeRow('r1', 'right', 2), makeRow('r2', 'left', 10)] })
  const vels = buildRowVelocities(scenario)
  expect(vels['r1']).toBeCloseTo(1 / 200)
  expect(vels['r2']).toBeCloseTo(-1 / 1000)
})

// ---- clampVisualToSim ----

test('clampVisualToSim returns visualX when within 1.5 of simX', () => {
  expect(clampVisualToSim(3.4, 3)).toBe(3.4)
})

test('clampVisualToSim returns simX when visualX more than 1.5 ahead', () => {
  expect(clampVisualToSim(5.0, 3)).toBe(3)
})

test('clampVisualToSim returns simX when visualX more than 1.5 behind', () => {
  expect(clampVisualToSim(1.0, 3)).toBe(3)
})

test('clampVisualToSim returns visualX at exactly 1.5 distance', () => {
  expect(clampVisualToSim(4.5, 3)).toBe(4.5)
})

test('clampVisualToSim returns simX when wrapping causes large jump', () => {
  expect(clampVisualToSim(9.8, 0)).toBe(0)
})

// ---- stepPlatformVisualX ----

test('stepPlatformVisualX advances toward simX at velocity', () => {
  const vel = 1 / 500  // moveEvery=5, 100ms tick
  const result = stepPlatformVisualX(0, 1, vel, 100)
  expect(result).toBeCloseTo(0.2)
})

test('stepPlatformVisualX converges to simX after full cycle', () => {
  const vel = 1 / 500
  let vx = 0
  for (let t = 0; t < 500; t += 16) vx = stepPlatformVisualX(vx, 1, vel, 16)
  expect(vx).toBeCloseTo(1, 1)
})

test('stepPlatformVisualX left-moving: visual can lead simX', () => {
  const vel = -1 / 500
  const result = stepPlatformVisualX(5, 4, vel, 100)
  expect(result).toBeCloseTo(4.8)
  expect(result).toBeLessThan(5)
  expect(result).toBeGreaterThan(4)
})

test('stepPlatformVisualX snaps to simX on large gap (wrap-around)', () => {
  const vel = -1 / 500
  expect(stepPlatformVisualX(9.8, 0, vel, 16)).toBe(0)
})

// ---- stepObstacleVisualX ----

test('stepObstacleVisualX right-moving: visual never exceeds simX', () => {
  const vel = 1 / 500
  const result = stepObstacleVisualX(0, 1, vel, 400)
  expect(result).toBeLessThanOrEqual(1)
})

test('stepObstacleVisualX left-moving: visual never goes below simX', () => {
  const vel = -1 / 500
  const result = stepObstacleVisualX(5, 4, vel, 400)
  expect(result).toBeGreaterThanOrEqual(4)
})

test('stepObstacleVisualX right-moving: lags then reaches simX at full cycle', () => {
  const vel = 1 / 500
  let vx = 0
  for (let t = 0; t < 500; t += 16) vx = stepObstacleVisualX(vx, 1, vel, 16)
  expect(vx).toBeCloseTo(1, 1)
})

test('stepObstacleVisualX right-moving: visual approaches simX smoothly mid-cycle', () => {
  const vel = 1 / 500
  const at250 = stepObstacleVisualX(0, 1, vel, 250)
  expect(at250).toBeGreaterThan(0)
  expect(at250).toBeLessThanOrEqual(1)
})

test('stepObstacleVisualX left-moving: visual approaches simX smoothly mid-cycle', () => {
  const vel = -1 / 500
  const at250 = stepObstacleVisualX(5, 4, vel, 250)
  expect(at250).toBeLessThan(5)
  expect(at250).toBeGreaterThanOrEqual(4)
})

test('stepObstacleVisualX snaps to simX on large gap (wrap-around)', () => {
  const vel = -1 / 500
  expect(stepObstacleVisualX(9.8, 0, vel, 16)).toBe(0)
})
