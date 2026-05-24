const { createRequire } = require('module')
const require2 = createRequire(import.meta.url)
const {
  HOP_DURATION,
  createSimulation,
  stepSimulation,
  pauseSimulation,
  createPlayer,
  addPlayer,
  getRowAtY,
  getRowById,
  entityOverlapsPlayerTile,
  isOnPlatform,
  queueInput,
  stepPlayer,
  applyCarrying,
  detectCollisions,
  resetPlayer
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

function makeGroundRow(id, y) {
  return { id, y, baseTile: 'ground', wrap: true, movement: { direction: 'none', speed: 0 } }
}

function makeHazardRow(id, y, dir, speed) {
  return { id, y, baseTile: 'hazard', wrap: true, movement: { direction: dir, speed: speed } }
}

function makeWallRow(id, y) {
  return { id, y, baseTile: 'wall', wrap: false, movement: { direction: 'none', speed: 0 } }
}

function simWithPlayer(scenario, px, py) {
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(px, py))
  return state
}

function hopComplete(state, scenario) {
  stepPlayer(state, scenario, 0.001) // starts hop from idle
  stepPlayer(state, scenario, HOP_DURATION / 1000 + 0.001) // resolves
}

// ---- createPlayer ----

test('createPlayer has correct initial state', () => {
  const p = createPlayer(3, 5)
  expect(p.x).toBe(3)
  expect(p.y).toBe(5)
  expect(p.worldX).toBe(3)
  expect(p.hopState).toBe('idle')
  expect(p.hopTimer).toBe(0)
  expect(p.hopFrom).toBeNull()
  expect(p.hopTo).toBeNull()
  expect(p.pendingInput).toBeNull()
})

// ---- addPlayer ----

test('addPlayer attaches player to state', () => {
  const state = createSimulation(makeScenario())
  const player = createPlayer(5, 7)
  addPlayer(state, player)
  expect(state.player).toBe(player)
})

// ---- getRowAtY ----

test('getRowAtY returns matching row', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('r0', 0), makeHazardRow('r3', 3, 'right', 1)] })
  expect(getRowAtY(scenario, 3).id).toBe('r3')
})

test('getRowAtY returns null for unknown y', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('r0', 0)] })
  expect(getRowAtY(scenario, 5)).toBeNull()
})

// ---- getRowById ----

test('getRowById returns matching row', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('grass', 7)] })
  expect(getRowById(scenario, 'grass').y).toBe(7)
})

test('getRowById returns null for unknown id', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('r0', 0)] })
  expect(getRowById(scenario, 'nope')).toBeNull()
})

// ---- entityOverlapsPlayerTile ----

test('entity fully covers player tile', () => {
  expect(entityOverlapsPlayerTile({ x: 3, width: 2 }, 3)).toBe(true)
  expect(entityOverlapsPlayerTile({ x: 3, width: 2 }, 4)).toBe(true)
})

test('entity partially overlaps player tile', () => {
  expect(entityOverlapsPlayerTile({ x: 2.6, width: 1 }, 3)).toBe(true)
})

test('entity does not overlap', () => {
  expect(entityOverlapsPlayerTile({ x: 5, width: 1 }, 3)).toBe(false)
  expect(entityOverlapsPlayerTile({ x: 2, width: 1 }, 3)).toBe(false)
})

// ---- isOnPlatform ----

test('player on platform returns true', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 2 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  expect(isOnPlatform(state, scenario, state.player)).toBe(true)
})

test('player not on platform returns false', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 7, width: 2 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  expect(isOnPlatform(state, scenario, state.player)).toBe(false)
})

test('no platform entities in row returns false', () => {
  const scenario = makeScenario({ rows: [makeHazardRow('river', 3, 'right', 1)] })
  const state = simWithPlayer(scenario, 4, 3)
  expect(isOnPlatform(state, scenario, state.player)).toBe(false)
})

// ---- queueInput ----

test('queueInput sets pendingInput when idle', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  expect(state.player.pendingInput).toBe('up')
})

test('queueInput overwrites pendingInput during hop', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  stepPlayer(state, scenario, 0.001)
  queueInput(state, 'left')
  expect(state.player.pendingInput).toBe('left')
})

// ---- stepPlayer: hop mechanics ----

test('idle player with input starts hop', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  stepPlayer(state, scenario, 0.016)
  expect(state.player.hopState).toBe('hopping')
  expect(state.player.hopTo).toEqual({ x: 5, y: 6 })
})

test('hop timer decrements', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  stepPlayer(state, scenario, 0.016) // starts hop
  stepPlayer(state, scenario, 0.016) // decrements
  const timerAfter = state.player.hopTimer
  expect(timerAfter).toBeLessThan(HOP_DURATION)
  expect(timerAfter).toBeGreaterThan(0)
})

test('hop resolves position after duration', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  hopComplete(state, scenario)
  expect(state.player.x).toBe(5)
  expect(state.player.y).toBe(6)
  expect(state.player.hopState).toBe('idle')
  expect(state.player.hopFrom).toBeNull()
  expect(state.player.hopTo).toBeNull()
})

test('queued input fires after hop resolves', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6), makeGroundRow('g5', 5)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  stepPlayer(state, scenario, 0.001)
  queueInput(state, 'up')
  hopComplete(state, scenario)
  expect(state.player.hopState).toBe('hopping')
  expect(state.player.hopTo).toEqual({ x: 5, y: 5 })
})

// ---- stepPlayer: movement direction ----

test('up moves y - 1', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  hopComplete(state, scenario)
  expect(state.player.y).toBe(6)
})

test('down moves y + 1', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g6', 6), makeGroundRow('g7', 7)]
  })
  const state = simWithPlayer(scenario, 5, 6)
  queueInput(state, 'down')
  hopComplete(state, scenario)
  expect(state.player.y).toBe(7)
})

test('left moves x - 1', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'left')
  hopComplete(state, scenario)
  expect(state.player.x).toBe(4)
})

test('right moves x + 1', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'right')
  hopComplete(state, scenario)
  expect(state.player.x).toBe(6)
})

// ---- stepPlayer: blocking ----

test('move blocked by out-of-bounds top', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g0', 0)] })
  const state = simWithPlayer(scenario, 5, 0)
  queueInput(state, 'up')
  stepPlayer(state, scenario, 0.016)
  expect(state.player.hopState).toBe('idle')
  expect(state.player.y).toBe(0)
})

test('move blocked by out-of-bounds left', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 0, 7)
  queueInput(state, 'left')
  stepPlayer(state, scenario, 0.016)
  expect(state.player.hopState).toBe('idle')
  expect(state.player.x).toBe(0)
})

test('move blocked by out-of-bounds right', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 9, 7)
  queueInput(state, 'right')
  stepPlayer(state, scenario, 0.016)
  expect(state.player.hopState).toBe('idle')
})

test('move blocked by wall row', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeWallRow('wall', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  stepPlayer(state, scenario, 0.016)
  expect(state.player.hopState).toBe('idle')
  expect(state.player.y).toBe(7)
})

test('paused simulation does not move player', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  pauseSimulation(state)
  queueInput(state, 'up')
  stepPlayer(state, scenario, 0.016)
  expect(state.player.hopState).toBe('idle')
  expect(state.player.y).toBe(7)
})

// ---- applyCarrying ----

test('player on platform is carried with row', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 2)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 3 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  applyCarrying(state, scenario, 1)
  expect(state.player.worldX).toBeCloseTo(6)
})

test('player not on platform is not carried', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 2)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 7, width: 2 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  applyCarrying(state, scenario, 1)
  expect(state.player.worldX).toBe(4)
})

test('player carried left', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'left', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 3, width: 3 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  applyCarrying(state, scenario, 1)
  expect(state.player.worldX).toBeCloseTo(3)
})

test('carrying clamps at right edge', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 5)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 8, width: 3 }] }
  })
  const state = simWithPlayer(scenario, 9, 3)
  applyCarrying(state, scenario, 1)
  expect(state.player.worldX).toBe(9)
  expect(state.player.x).toBe(9)
})

test('carrying clamps at left edge', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'left', 5)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 0, width: 3 }] }
  })
  const state = simWithPlayer(scenario, 0, 3)
  applyCarrying(state, scenario, 1)
  expect(state.player.worldX).toBe(0)
  expect(state.player.x).toBe(0)
})

test('carrying skipped during hop', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 2), makeGroundRow('g4', 4)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 3 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  queueInput(state, 'down')
  stepPlayer(state, scenario, 0.001)
  applyCarrying(state, scenario, 1)
  expect(state.player.worldX).toBe(4)
})

// ---- detectCollisions ----

test('obstacle at player tile triggers collision', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('road', 5)],
    entities: { road: [{ id: 'car1', type: 'obstacle', x: 4, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 4, 5)
  const event = detectCollisions(state, scenario)
  expect(event).not.toBeNull()
  expect(event.type).toBe('obstacle')
  expect(event.entityId).toBe('car1')
})

test('obstacle in different row does not trigger', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('r5', 5), makeGroundRow('r6', 6)],
    entities: { r6: [{ id: 'car1', type: 'obstacle', x: 4, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 4, 5)
  expect(detectCollisions(state, scenario)).toBeNull()
})

test('hazard row with no platform triggers collision', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)]
  })
  const state = simWithPlayer(scenario, 4, 3)
  const event = detectCollisions(state, scenario)
  expect(event).not.toBeNull()
  expect(event.type).toBe('hazard')
})

test('hazard row with platform — no collision', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 2 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  expect(detectCollisions(state, scenario)).toBeNull()
})

test('ground row — no collision', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  expect(detectCollisions(state, scenario)).toBeNull()
})

test('no collision during hop', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)]
  })
  const state = simWithPlayer(scenario, 4, 3)
  queueInput(state, 'left')
  stepPlayer(state, scenario, 0.001)
  expect(detectCollisions(state, scenario)).toBeNull()
})

test('paused simulation does not detect collisions', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)]
  })
  const state = simWithPlayer(scenario, 4, 3)
  pauseSimulation(state)
  expect(detectCollisions(state, scenario)).toBeNull()
})

test('collision returns player position', () => {
  const scenario = makeScenario({ rows: [makeHazardRow('river', 3, 'right', 1)] })
  const state = simWithPlayer(scenario, 4, 3)
  const event = detectCollisions(state, scenario)
  expect(event.playerX).toBe(4)
  expect(event.playerY).toBe(3)
})

// ---- resetPlayer ----

test('reset moves player to named reset point', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7)],
    resetPoints: [
      { id: 'start', position: { x: 5, y: 7 } },
      { id: 'mid', position: { x: 5, y: 4 } }
    ]
  })
  const state = simWithPlayer(scenario, 0, 0)
  resetPlayer(state, scenario, 'start')
  expect(state.player.x).toBe(5)
  expect(state.player.y).toBe(7)
  expect(state.player.worldX).toBe(5)
})

test('reset clears hop state', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)],
    resetPoints: [{ id: 'start', position: { x: 5, y: 7 } }]
  })
  const state = simWithPlayer(scenario, 5, 7)
  queueInput(state, 'up')
  stepPlayer(state, scenario, 0.001)
  expect(state.player.hopState).toBe('hopping')
  resetPlayer(state, scenario, 'start')
  expect(state.player.hopState).toBe('idle')
  expect(state.player.pendingInput).toBeNull()
})

test('reset to mid point', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g4', 4)],
    resetPoints: [
      { id: 'start', position: { x: 5, y: 7 } },
      { id: 'mid', position: { x: 3, y: 4 } }
    ]
  })
  const state = simWithPlayer(scenario, 0, 0)
  resetPlayer(state, scenario, 'mid')
  expect(state.player.x).toBe(3)
  expect(state.player.y).toBe(4)
})

test('reset with unknown id does nothing', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7)],
    resetPoints: [{ id: 'start', position: { x: 5, y: 7 } }]
  })
  const state = simWithPlayer(scenario, 2, 2)
  resetPlayer(state, scenario, 'nonexistent')
  expect(state.player.x).toBe(2)
  expect(state.player.y).toBe(2)
})
