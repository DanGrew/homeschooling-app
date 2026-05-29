const { createRequire } = require('module')
const require2 = createRequire(import.meta.url)
const {
  createSimulation,
  pauseSimulation,
  createPlayer,
  addPlayer,
  getRowAtY,
  getRowById,
  entityOverlapsPlayerTile,
  isOnPlatform,
  applyInput,
  detectCollisions,
  resetPlayer,
  isSafeMove,
  getMovePreview
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
  return { id, y, baseTile: 'ground', wrap: false, movement: { direction: 'none', moveEvery: 0 } }
}

function makeHazardRow(id, y) {
  return { id, y, baseTile: 'hazard', wrap: true, movement: { direction: 'right', moveEvery: 0 } }
}

function makeWallRow(id, y) {
  return { id, y, baseTile: 'wall', wrap: false, movement: { direction: 'none', moveEvery: 0 } }
}

function simWithPlayer(scenario, px, py) {
  const state = createSimulation(scenario)
  addPlayer(state, createPlayer(px, py))
  return state
}

// ---- createPlayer ----

test('createPlayer returns {x, y} only — no worldX/worldY', () => {
  const p = createPlayer(3, 5)
  expect(p.x).toBe(3)
  expect(p.y).toBe(5)
  expect(p.worldX).toBeUndefined()
  expect(p.worldY).toBeUndefined()
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
  const scenario = makeScenario({ rows: [makeGroundRow('r0', 0), makeHazardRow('r3', 3)] })
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

test('entity does not overlap', () => {
  expect(entityOverlapsPlayerTile({ x: 5, width: 1 }, 3)).toBe(false)
  expect(entityOverlapsPlayerTile({ x: 2, width: 1 }, 3)).toBe(false)
})

// ---- isOnPlatform ----

test('player on platform returns true', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 2 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  expect(isOnPlatform(state, scenario, state.player)).toBe(true)
})

test('player at last cell of platform returns true', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 3 }] }
  })
  const state = simWithPlayer(scenario, 6, 3)
  expect(isOnPlatform(state, scenario, state.player)).toBe(true)
})

test('player at platform right edge returns false (exclusive)', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 4, width: 2 }] }
  })
  const state = simWithPlayer(scenario, 6, 3)
  expect(isOnPlatform(state, scenario, state.player)).toBe(false)
})

test('player not on platform returns false', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 7, width: 2 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  expect(isOnPlatform(state, scenario, state.player)).toBe(false)
})

test('no platform entities in row returns false', () => {
  const scenario = makeScenario({ rows: [makeHazardRow('river', 3)] })
  const state = simWithPlayer(scenario, 4, 3)
  expect(isOnPlatform(state, scenario, state.player)).toBe(false)
})

// ---- applyInput ----

test('applyInput moves player up by one cell', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'up')
  expect(state.player.y).toBe(6)
  expect(state.player.x).toBe(5)
})

test('applyInput moves player down by one cell', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g6', 6), makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 6)
  applyInput(state, scenario, 'down')
  expect(state.player.y).toBe(7)
})

test('applyInput moves player left by one cell', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'left')
  expect(state.player.x).toBe(4)
})

test('applyInput moves player right by one cell', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'right')
  expect(state.player.x).toBe(6)
})

test('applyInput blocked at top boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g0', 0)] })
  const state = simWithPlayer(scenario, 5, 0)
  applyInput(state, scenario, 'up')
  expect(state.player.y).toBe(0)
})

test('applyInput blocked at bottom boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'down')
  expect(state.player.y).toBe(7)
})

test('applyInput blocked at left boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 0, 7)
  applyInput(state, scenario, 'left')
  expect(state.player.x).toBe(0)
})

test('applyInput blocked at right boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 9, 7)
  applyInput(state, scenario, 'right')
  expect(state.player.x).toBe(9)
})

test('applyInput blocked by wall row', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeWallRow('wall', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'up')
  expect(state.player.y).toBe(7)
})

test('applyInput does nothing when paused', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)] })
  const state = simWithPlayer(scenario, 5, 7)
  pauseSimulation(state)
  applyInput(state, scenario, 'up')
  expect(state.player.y).toBe(7)
})

test('applyInput does nothing when no player', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = createSimulation(scenario)
  expect(() => applyInput(state, scenario, 'up')).not.toThrow()
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
  const scenario = makeScenario({ rows: [makeHazardRow('river', 3)] })
  const state = simWithPlayer(scenario, 4, 3)
  const event = detectCollisions(state, scenario)
  expect(event).not.toBeNull()
  expect(event.type).toBe('hazard')
})

test('hazard row with platform covering player — no collision', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3)],
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

test('paused simulation does not detect collisions', () => {
  const scenario = makeScenario({ rows: [makeHazardRow('river', 3)] })
  const state = simWithPlayer(scenario, 4, 3)
  pauseSimulation(state)
  expect(detectCollisions(state, scenario)).toBeNull()
})

test('collision returns player integer position', () => {
  const scenario = makeScenario({ rows: [makeHazardRow('river', 3)] })
  const state = simWithPlayer(scenario, 4, 3)
  const event = detectCollisions(state, scenario)
  expect(event.playerX).toBe(4)
  expect(event.playerY).toBe(3)
})

// ---- resetPlayer ----

test('resetPlayer moves player to named reset point', () => {
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
  expect(state.player.worldX).toBeUndefined()
  expect(state.player.worldY).toBeUndefined()
})

test('resetPlayer to mid point', () => {
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

test('resetPlayer with unknown id does nothing', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7)],
    resetPoints: [{ id: 'start', position: { x: 5, y: 7 } }]
  })
  const state = simWithPlayer(scenario, 2, 2)
  resetPlayer(state, scenario, 'nonexistent')
  expect(state.player.x).toBe(2)
  expect(state.player.y).toBe(2)
})

// ---- isSafeMove ----

test('isSafeMove: safe move onto ground row', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g6', 6), makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  expect(isSafeMove(state, scenario, state.player, 0, -1)).toBe(true)
})

test('isSafeMove: blocked by out-of-bounds left', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 0, 7)
  expect(isSafeMove(state, scenario, state.player, -1, 0)).toBe(false)
})

test('isSafeMove: blocked by out-of-bounds right', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 9, 7)
  expect(isSafeMove(state, scenario, state.player, 1, 0)).toBe(false)
})

test('isSafeMove: blocked by wall row', () => {
  const scenario = makeScenario({ rows: [makeWallRow('w6', 6), makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  expect(isSafeMove(state, scenario, state.player, 0, -1)).toBe(false)
})

test('isSafeMove: hazard row with no platform is unsafe', () => {
  const scenario = makeScenario({ rows: [makeHazardRow('h3', 3), makeGroundRow('g4', 4)] })
  const state = simWithPlayer(scenario, 5, 4)
  expect(isSafeMove(state, scenario, state.player, 0, -1)).toBe(false)
})

test('isSafeMove: hazard row with platform at destination is safe', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('h3', 3), makeGroundRow('g4', 4)],
    entities: { h3: [{ id: 'p1', type: 'platform', x: 5, width: 2 }] }
  })
  const state = simWithPlayer(scenario, 5, 4)
  expect(isSafeMove(state, scenario, state.player, 0, -1)).toBe(true)
})

test('isSafeMove: obstacle at destination is unsafe', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g6', 6), makeGroundRow('g7', 7)],
    entities: { g6: [{ id: 'o1', type: 'obstacle', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 5, 7)
  expect(isSafeMove(state, scenario, state.player, 0, -1)).toBe(false)
})

test('isSafeMove: obstacle on different row does not block', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g5', 5), makeGroundRow('g6', 6), makeGroundRow('g7', 7)],
    entities: { g5: [{ id: 'o1', type: 'obstacle', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 5, 7)
  expect(isSafeMove(state, scenario, state.player, 0, -1)).toBe(true)
})

// ---- getMovePreview ----

test('getMovePreview: all directions safe on open ground', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g5', 5), makeGroundRow('g6', 6), makeGroundRow('g7', 7)]
  })
  const state = simWithPlayer(scenario, 5, 6)
  const preview = getMovePreview(state, scenario, state.player)
  expect(preview.left).toBe(true)
  expect(preview.right).toBe(true)
  expect(preview.up).toBe(true)
  expect(preview.down).toBe(true)
})

test('getMovePreview: left blocked at left edge', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 0, 7)
  expect(getMovePreview(state, scenario, state.player).left).toBe(false)
})

test('getMovePreview: right blocked at right edge', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 9, 7)
  expect(getMovePreview(state, scenario, state.player).right).toBe(false)
})

test('getMovePreview: up blocked by hazard with no platform', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('h6', 6), makeGroundRow('g7', 7)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  expect(getMovePreview(state, scenario, state.player).up).toBe(false)
})

test('getMovePreview: returns object with all four boolean keys', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  const preview = getMovePreview(state, scenario, state.player)
  expect(typeof preview.left).toBe('boolean')
  expect(typeof preview.right).toBe('boolean')
  expect(typeof preview.up).toBe('boolean')
  expect(typeof preview.down).toBe('boolean')
})
