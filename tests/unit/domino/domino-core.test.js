const { generateTiles, dealHands, validatePlacement, checkCompletion, DOMINO_VALUES } = require('../../../core/domino/domino-core')

// ---- generateTiles ----

test('generates 28 tiles', () => {
  expect(generateTiles('colours')).toHaveLength(28)
})

test('generates 28 tiles for all match types', () => {
  Object.keys(DOMINO_VALUES).forEach(type => {
    expect(generateTiles(type)).toHaveLength(28)
  })
})

test('tile has id, left, right, orientation', () => {
  const tile = generateTiles('colours')[0]
  expect(tile).toHaveProperty('id')
  expect(tile).toHaveProperty('left')
  expect(tile).toHaveProperty('right')
  expect(tile).toHaveProperty('orientation')
})

test('tile values are from the match type set', () => {
  const tiles = generateTiles('shapes')
  const values = new Set(DOMINO_VALUES.shapes)
  tiles.forEach(t => {
    expect(values.has(t.left)).toBe(true)
    expect(values.has(t.right)).toBe(true)
  })
})

test('no duplicate tiles', () => {
  const tiles = generateTiles('colours')
  const ids = tiles.map(t => t.id)
  expect(new Set(ids).size).toBe(28)
})

test('tile ids are symmetric — each pair appears once', () => {
  const tiles = generateTiles('colours')
  const pairs = tiles.map(t => [t.left, t.right].sort().join('|'))
  expect(new Set(pairs).size).toBe(28)
})

// ---- validatePlacement ----

test('valid when left matches endpoint', () => {
  const tile = { left: 'red', right: 'blue', orientation: 'horizontal' }
  const result = validatePlacement(tile, 'red')
  expect(result.valid).toBe(true)
  expect(result.orientation).toBe('horizontal')
})

test('valid when right matches endpoint — returns vertical orientation', () => {
  const tile = { left: 'red', right: 'blue', orientation: 'horizontal' }
  const result = validatePlacement(tile, 'blue')
  expect(result.valid).toBe(true)
  expect(result.orientation).toBe('vertical')
})

test('invalid when neither half matches endpoint', () => {
  const tile = { left: 'red', right: 'blue', orientation: 'horizontal' }
  const result = validatePlacement(tile, 'green')
  expect(result.valid).toBe(false)
  expect(result.orientation).toBeNull()
})

test('double tile valid at matching endpoint', () => {
  const tile = { left: 'red', right: 'red', orientation: 'horizontal' }
  expect(validatePlacement(tile, 'red').valid).toBe(true)
})

// ---- dealHands ----

test('2-player deal gives each player 7 tiles', () => {
  const tiles = generateTiles('colours')
  const { hands } = dealHands(tiles, 2)
  expect(hands['p0']).toHaveLength(7)
  expect(hands['p1']).toHaveLength(7)
})

test('3-player deal gives each player 7 tiles', () => {
  const tiles = generateTiles('colours')
  const { hands } = dealHands(tiles, 3)
  expect(hands['p0']).toHaveLength(7)
  expect(hands['p1']).toHaveLength(7)
  expect(hands['p2']).toHaveLength(7)
})

test('2-player draw pile has 13 tiles', () => {
  const tiles = generateTiles('colours')
  const { drawPile } = dealHands(tiles, 2)
  expect(drawPile).toHaveLength(13)
})

test('3-player draw pile has 6 tiles', () => {
  const tiles = generateTiles('colours')
  const { drawPile } = dealHands(tiles, 3)
  expect(drawPile).toHaveLength(6)
})

test('starting tile is a single tile', () => {
  const tiles = generateTiles('colours')
  const { startingTile } = dealHands(tiles, 2)
  expect(startingTile).toHaveProperty('left')
  expect(startingTile).toHaveProperty('right')
})

test('no tile appears in both hand and draw pile', () => {
  const tiles = generateTiles('colours')
  const { hands, drawPile, startingTile } = dealHands(tiles, 2)
  const allIds = [
    ...hands['p0'].map(t => t.id),
    ...hands['p1'].map(t => t.id),
    ...drawPile.map(t => t.id),
    startingTile.id
  ]
  expect(new Set(allIds).size).toBe(28)
})

test('each player has at least one tile playable vs starting tile', () => {
  const tiles = generateTiles('colours')
  const { hands, startingTile } = dealHands(tiles, 2)
  const endpoints = [startingTile.left, startingTile.right]
  ;['p0', 'p1'].forEach(pid => {
    const canPlay = hands[pid].some(tile =>
      validatePlacement(tile, endpoints[0]).valid || validatePlacement(tile, endpoints[1]).valid
    )
    expect(canPlay).toBe(true)
  })
})

// ---- checkCompletion ----

test('not complete when draw pile has tiles', () => {
  const state = {
    drawPile: [{ id: 'x', left: 'red', right: 'blue' }],
    board: { endpoints: ['green', 'green'] },
    players: [{ id: 'p0' }],
    hands: { p0: [] }
  }
  expect(checkCompletion(state)).toBe(false)
})

test('not complete when draw empty but a player can place', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = {
    drawPile: [],
    board: { endpoints: ['red', 'green'] },
    players: [{ id: 'p0' }, { id: 'p1' }],
    hands: { p0: [tile], p1: [] }
  }
  expect(checkCompletion(state)).toBe(false)
})

test('complete when draw empty and no player can place', () => {
  const state = {
    drawPile: [],
    board: { endpoints: ['purple', 'purple'] },
    players: [{ id: 'p0' }, { id: 'p1' }],
    hands: {
      p0: [{ id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }],
      p1: [{ id: 'g-y', left: 'green', right: 'yellow', orientation: 'horizontal' }]
    }
  }
  expect(checkCompletion(state)).toBe(true)
})

test('complete with empty hands and empty draw pile', () => {
  const state = {
    drawPile: [],
    board: { endpoints: ['red', 'blue'] },
    players: [{ id: 'p0' }, { id: 'p1' }],
    hands: { p0: [], p1: [] }
  }
  expect(checkCompletion(state)).toBe(true)
})
