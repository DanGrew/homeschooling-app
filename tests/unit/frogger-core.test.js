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
  MIN_OBSTACLE_GAP
} = require2('../../core/frogger/frogger-core.js')

// ---- scenario helpers ----

function makeScenario(overrides) {
  return Object.assign({
    id: 'test',
    grid: { rows: 8, cols: 10 },
    rows: [],
    entities: {},
    resetPoints: [{ id: 'start', position: { x: 5, y: 7 } }]
  }, overrides)
}

function makeRow(id, dir, speed, opts) {
  return Object.assign({
    id: id,
    baseTile: 'hazard',
    wrap: true,
    movement: { direction: dir, speed: speed }
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

// ---- stepSimulation: movement ----

test('entity moves right at correct speed', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 2)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.5)
  expect(state.entities[0].x).toBeCloseTo(1.0)
})

test('entity moves left at correct speed', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'left', 1)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 5, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBeCloseTo(4.0)
})

test('entity in different row not affected by row step', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 2), makeRow('r2', 'left', 2)],
    entities: {
      r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }],
      r2: [{ id: 'e2', type: 'obstacle', x: 5, width: 1 }]
    }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities.find(e => e.id === 'e1').x).toBeCloseTo(2)
  expect(state.entities.find(e => e.id === 'e2').x).toBeCloseTo(3)
})

test('row with direction none does not move entities', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'none', 0)],
    entities: { r1: [{ id: 'e1', type: 'ground', x: 3, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(3)
})

// ---- stepSimulation: wrapping ----

test('right-moving entity wraps when x >= cols', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 10)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 9, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.5)
  expect(state.entities[0].x).toBeCloseTo(4)
})

test('left-moving entity wraps when x + width <= 0', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'left', 1)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBeCloseTo(9)
})

test('wrap false: entity does not wrap', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 5, { wrap: false })],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 8, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBeCloseTo(13)
})

// ---- stepSimulation: spawning ----

test('entity spawns after enough tiles traveled', () => {
  const spawnDef = { entity: { type: 'platform', width: 2 }, every: 4 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  expect(state.entities).toHaveLength(0)
  stepSimulation(state, scenario, 4)
  expect(state.entities).toHaveLength(1)
  expect(state.entities[0].type).toBe('platform')
  expect(state.entities[0].rowId).toBe('r1')
})

test('right-moving spawn starts at negative x', () => {
  const spawnDef = { entity: { type: 'platform', width: 2 }, every: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 10), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.5)
  const spawned = state.entities.find(e => e.rowId === 'r1')
  expect(spawned.x).toBeLessThan(0)
})

test('left-moving spawn starts at cols', () => {
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, every: 1 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'left', 10), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.5)
  const spawned = state.entities.find(e => e.rowId === 'r1')
  expect(spawned.x).toBe(10)
})

test('spawns multiple entities for multiple intervals elapsed', () => {
  const spawnDef = { entity: { type: 'platform', width: 1 }, every: 2 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 6)
  expect(state.entities.length).toBe(3)
})

test('spawn accumulator is cumulative across steps', () => {
  const spawnDef = { entity: { type: 'platform', width: 1 }, every: 3 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })]
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 1)
  expect(state.entities).toHaveLength(0)
  stepSimulation(state, scenario, 1)
  expect(state.entities).toHaveLength(0)
  stepSimulation(state, scenario, 1)
  expect(state.entities).toHaveLength(1)
})

// ---- pause / resume ----

test('paused simulation does not move entities', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 2)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  pauseSimulation(state)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBe(0)
})

test('resumed simulation moves entities again', () => {
  const scenario = makeScenario({
    rows: [makeRow('r1', 'right', 2)],
    entities: { r1: [{ id: 'e1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  pauseSimulation(state)
  resumeSimulation(state)
  stepSimulation(state, scenario, 1)
  expect(state.entities[0].x).toBeCloseTo(2)
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
    rows: [makeRow('r1', 'right', 2)],
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
  // speed=1, dt=0.01 → entity at x=0 moves 0.01 tiles; post-move dist=1.01 < MIN_OBSTACLE_GAP+w=3
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, every: 0.01 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'car1', type: 'obstacle', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.01)
  expect(state.entities.filter(e => e.rowId === 'r1')).toHaveLength(1)
})

test('obstacle spawn proceeds when existing obstacle beyond gap (rightward)', () => {
  // speed=1, dt=0.01 → entity at x=5 stays at x=5.01; post-move dist=6.01 >= 3
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, every: 0.01 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'car1', type: 'obstacle', x: 5, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.01)
  expect(state.entities.filter(e => e.rowId === 'r1').length).toBeGreaterThan(1)
})

test('obstacle spawn blocked when existing obstacle within gap (leftward)', () => {
  // speed=1, dt=0.01 → entity at x=8.5 moves to x=8.49; right edge=9.49; dist=10-9.49=0.51 < 3
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, every: 0.01 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'left', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'car1', type: 'obstacle', x: 8.5, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.01)
  expect(state.entities.filter(e => e.rowId === 'r1')).toHaveLength(1)
})

test('gap check does not affect platform spawning', () => {
  // platform at x=0 — gap check skipped for platforms; spawn proceeds
  const spawnDef = { entity: { type: 'platform', width: 1 }, every: 0.01 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'log1', type: 'platform', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.01)
  expect(state.entities.filter(e => e.rowId === 'r1').length).toBeGreaterThan(1)
})

test('counter resets to 0 when obstacle spawn blocked', () => {
  const spawnDef = { entity: { type: 'obstacle', width: 1 }, every: 0.01 }
  const scenario = makeScenario({
    rows: [Object.assign(makeRow('r1', 'right', 1), { spawns: [spawnDef] })],
    entities: { r1: [{ id: 'car1', type: 'obstacle', x: 0, width: 1 }] }
  })
  const state = createSimulation(scenario)
  stepSimulation(state, scenario, 0.01)
  expect(state.spawnCounters['r1']).toBe(0)
})
