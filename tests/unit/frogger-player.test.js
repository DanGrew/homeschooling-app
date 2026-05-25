const { createRequire } = require('module')
const require2 = createRequire(import.meta.url)
const {
  STEP,
  createSimulation,
  pauseSimulation,
  createPlayer,
  addPlayer,
  getRowAtY,
  getRowById,
  entityOverlapsPlayerTile,
  isOnPlatform,
  applyInput,
  applyCarrying,
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

// ---- createPlayer ----

test('createPlayer has correct initial state', () => {
  const p = createPlayer(3, 5)
  expect(p.x).toBe(3)
  expect(p.y).toBe(5)
  expect(p.worldX).toBe(3)
  expect(p.worldY).toBe(5)
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

// ---- applyInput ----

test('STEP is 0.5', () => {
  expect(STEP).toBe(0.5)
})

test('applyInput moves player up by STEP', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'up')
  expect(state.player.worldY).toBeCloseTo(6.5)
  expect(state.player.y).toBe(6)
})

test('applyInput moves player down by STEP', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g6', 6), makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 6)
  applyInput(state, scenario, 'down')
  expect(state.player.worldY).toBeCloseTo(6.5)
  expect(state.player.y).toBe(6)
})

test('applyInput moves player left by STEP', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'left')
  expect(state.player.worldX).toBeCloseTo(4.5)
  expect(state.player.x).toBe(4)
})

test('applyInput moves player right by STEP', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'right')
  expect(state.player.worldX).toBeCloseTo(5.5)
  expect(state.player.x).toBe(5)
})

test('applyInput two steps cross tile boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'up')
  applyInput(state, scenario, 'up')
  expect(state.player.worldY).toBeCloseTo(6)
  expect(state.player.y).toBe(6)
})

test('applyInput blocked at top boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g0', 0)] })
  const state = simWithPlayer(scenario, 5, 0)
  applyInput(state, scenario, 'up')
  expect(state.player.worldY).toBe(0)
  expect(state.player.y).toBe(0)
})

test('applyInput blocked at bottom boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'down')
  applyInput(state, scenario, 'down') // 7.5 → 8.0 blocked
  expect(state.player.worldY).toBeCloseTo(7.5)
})

test('applyInput blocked at left boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 0, 7)
  applyInput(state, scenario, 'left')
  expect(state.player.worldX).toBe(0)
  expect(state.player.x).toBe(0)
})

test('applyInput blocked at right boundary', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 9, 7)
  applyInput(state, scenario, 'right') // 9 → 9.5
  applyInput(state, scenario, 'right') // 9.5 → 10 blocked
  expect(state.player.worldX).toBeCloseTo(9.5)
})

test('applyInput blocked by wall row', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeWallRow('wall', 6)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'up')
  expect(state.player.worldY).toBe(7)
  expect(state.player.y).toBe(7)
})

test('applyInput does nothing when paused', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)] })
  const state = simWithPlayer(scenario, 5, 7)
  pauseSimulation(state)
  applyInput(state, scenario, 'up')
  expect(state.player.worldY).toBe(7)
})

test('applyInput does nothing when no player', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = createSimulation(scenario)
  expect(() => applyInput(state, scenario, 'up')).not.toThrow()
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

test('collision fires immediately without hop guard', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)]
  })
  const state = simWithPlayer(scenario, 4, 3)
  expect(detectCollisions(state, scenario)).not.toBeNull()
})

test('obstacle in overlapping row hits player straddling rows', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('r5', 5), makeGroundRow('r6', 6)],
    entities: { r6: [{ id: 'car1', type: 'obstacle', x: 4, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 4, 5)
  applyInput(state, scenario, 'down') // worldY → 5.5, player bbox [5.5,6.5] overlaps row 6 bbox [6,7]
  const event = detectCollisions(state, scenario)
  expect(event).not.toBeNull()
  expect(event.type).toBe('obstacle')
})

test('obstacle collision detects when player worldX is non-integer', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('road', 5)],
    entities: { road: [{ id: 'car1', type: 'obstacle', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 4, 5)
  applyInput(state, scenario, 'right') // worldX → 4.5, x = 4
  // obstacle at x=5: overlaps [4.5, 5.5] ∩ [5, 6] → hit
  const event = detectCollisions(state, scenario)
  expect(event).not.toBeNull()
  expect(event.type).toBe('obstacle')
})

test('platform detection: centre inside log — safe', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 5, 3) // cx=5.5 inside [5,6]
  expect(isOnPlatform(state, scenario, state.player)).toBe(true)
})

test('platform detection: centre at left edge of log — safe (left-inclusive)', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 4, 3)
  applyInput(state, scenario, 'right') // worldX → 4.5, cx=5.0=log.x → safe
  expect(isOnPlatform(state, scenario, state.player)).toBe(true)
})

test('platform detection: centre at right edge of log — unsafe (right-exclusive)', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 5, 3)
  applyInput(state, scenario, 'right') // worldX → 5.5, cx=6.0=log.x+width → unsafe
  expect(isOnPlatform(state, scenario, state.player)).toBe(false)
})

test('platform detection: centre right of log — unsafe', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 6, 3) // cx=6.5, past log [5,6]
  expect(isOnPlatform(state, scenario, state.player)).toBe(false)
})

test('platform detection: centre left of log — unsafe', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('river', 3, 'right', 1)],
    entities: { river: [{ id: 'log1', type: 'platform', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 3, 3) // cx=3.5, before log [5,6]
  expect(isOnPlatform(state, scenario, state.player)).toBe(false)
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
  expect(state.player.worldY).toBe(7)
})

test('reset clears worldY', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g7', 7), makeGroundRow('g6', 6)],
    resetPoints: [{ id: 'start', position: { x: 5, y: 7 } }]
  })
  const state = simWithPlayer(scenario, 5, 7)
  applyInput(state, scenario, 'up')
  expect(state.player.worldY).toBeCloseTo(6.5)
  resetPlayer(state, scenario, 'start')
  expect(state.player.worldY).toBe(7)
  expect(state.player.y).toBe(7)
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

// ---- isSafeMove ----

test('isSafeMove: safe move onto ground row', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g6', 6), makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  expect(isSafeMove(state, scenario, state.player, 0, -STEP)).toBe(true)
})

test('isSafeMove: blocked by out-of-bounds left', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 0, 7)
  expect(isSafeMove(state, scenario, state.player, -STEP, 0)).toBe(false)
})

test('isSafeMove: blocked by out-of-bounds right', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 9.5, 7)
  expect(isSafeMove(state, scenario, state.player, STEP, 0)).toBe(false)
})

test('isSafeMove: blocked by wall row', () => {
  const scenario = makeScenario({ rows: [makeWallRow('w5', 5), makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 6)
  expect(isSafeMove(state, scenario, state.player, 0, -STEP)).toBe(false)
})

test('isSafeMove: hazard row with no platform is unsafe', () => {
  const scenario = makeScenario({ rows: [makeHazardRow('h3', 3, 'right', 1), makeGroundRow('g4', 4)] })
  const state = simWithPlayer(scenario, 5, 4)
  expect(isSafeMove(state, scenario, state.player, 0, -STEP)).toBe(false)
})

test('isSafeMove: hazard row with platform under destination is safe', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('h3', 3, 'right', 1), makeGroundRow('g4', 4)],
    entities: { h3: [{ id: 'p1', type: 'platform', x: 4.7, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 5, 4)
  // player at worldX=5, moving up to y=3.5 → destRow y=3, cx = 5+0.5 = 5.5, platform 4.7..5.7 covers 5.5
  expect(isSafeMove(state, scenario, state.player, 0, -STEP)).toBe(true)
})

test('isSafeMove: obstacle at destination is unsafe', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g6', 6), makeGroundRow('g7', 7)],
    entities: { g6: [{ id: 'o1', type: 'obstacle', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 5, 7)
  expect(isSafeMove(state, scenario, state.player, 0, -STEP)).toBe(false)
})

test('isSafeMove: obstacle on different row does not block', () => {
  const scenario = makeScenario({
    rows: [makeGroundRow('g5', 5), makeGroundRow('g6', 6), makeGroundRow('g7', 7)],
    entities: { g5: [{ id: 'o1', type: 'obstacle', x: 5, width: 1 }] }
  })
  const state = simWithPlayer(scenario, 5, 7)
  expect(isSafeMove(state, scenario, state.player, 0, -STEP)).toBe(true)
})

// ---- getMovePreview ----

test('getMovePreview: all directions safe on open ground', () => {
  const scenario = makeScenario({
    rows: [
      makeGroundRow('g5', 5), makeGroundRow('g6', 6),
      makeGroundRow('g7', 7), makeGroundRow('g6r', 6)
    ]
  })
  const scenario2 = makeScenario({
    rows: [makeGroundRow('g6', 6), makeGroundRow('g7', 7), makeGroundRow('g8', 8)]
  })
  const state = simWithPlayer(scenario2, 5, 7)
  const preview = getMovePreview(state, scenario2, state.player)
  expect(preview.left).toBe(true)
  expect(preview.right).toBe(true)
  expect(preview.up).toBe(true)
  expect(preview.down).toBe(true)
})

test('getMovePreview: left blocked at left edge', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 0, 7)
  const preview = getMovePreview(state, scenario, state.player)
  expect(preview.left).toBe(false)
})

test('getMovePreview: right blocked at right edge', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 9.5, 7)
  const preview = getMovePreview(state, scenario, state.player)
  expect(preview.right).toBe(false)
})

test('getMovePreview: up blocked by hazard with no platform', () => {
  const scenario = makeScenario({
    rows: [makeHazardRow('h6', 6, 'right', 1), makeGroundRow('g7', 7)]
  })
  const state = simWithPlayer(scenario, 5, 7)
  const preview = getMovePreview(state, scenario, state.player)
  expect(preview.up).toBe(false)
})

test('getMovePreview: returns object with all four keys', () => {
  const scenario = makeScenario({ rows: [makeGroundRow('g7', 7)] })
  const state = simWithPlayer(scenario, 5, 7)
  const preview = getMovePreview(state, scenario, state.player)
  expect(typeof preview.left).toBe('boolean')
  expect(typeof preview.right).toBe('boolean')
  expect(typeof preview.up).toBe('boolean')
  expect(typeof preview.down).toBe('boolean')
})
