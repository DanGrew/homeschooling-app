const { generateTiles, dealHands, validatePlacement, playerHasValidPlacement, checkCompletion, createInitialBoard, createDominoGame, advanceTurn, placeTile, drawTile, getPreviewPlacement, DOMINO_VALUES, ROTATION_GEOMETRY } = require('../../../core/domino/domino-core.js')

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

test('no duplicate tile ids', () => {
  const tiles = generateTiles('colours')
  const ids = tiles.map(t => t.id)
  expect(new Set(ids).size).toBe(28)
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
  const endpoints = [
    { value: startingTile.left,  col: -1, row: 0, direction: 'west' },
    { value: startingTile.right, col:  2, row: 0, direction: 'east' }
  ]
  ;['p0', 'p1'].forEach(pid => {
    expect(playerHasValidPlacement(hands[pid], endpoints)).toBe(true)
  })
})

// ---- validatePlacement (rotation API) ----

test('validatePlacement valid rotation 0 at east endpoint with left match', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'red', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tile, ep, 0).valid).toBe(true)
})

test('validatePlacement invalid rotation 0 when value mismatch', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'green', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tile, ep, 0).valid).toBe(false)
})

test('validatePlacement invalid rotation 0 at west endpoint', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'red', col: -1, row: 0, direction: 'west' }
  expect(validatePlacement(tile, ep, 0).valid).toBe(false)
})

test('validatePlacement valid rotation 180 at west endpoint with right match', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const ep = { value: 'red', col: -1, row: 0, direction: 'west' }
  expect(validatePlacement(tile, ep, 180).valid).toBe(true)
})

test('validatePlacement invalid rotation 180 at east endpoint', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const ep = { value: 'red', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tile, ep, 180).valid).toBe(false)
})

test('validatePlacement valid rotation 90 at south endpoint with left match', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'red', col: 0, row: 2, direction: 'south' }
  expect(validatePlacement(tile, ep, 90).valid).toBe(true)
})

test('validatePlacement valid rotation 270 at north endpoint with right match', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const ep = { value: 'red', col: 0, row: -2, direction: 'north' }
  expect(validatePlacement(tile, ep, 270).valid).toBe(true)
})

// ---- ROTATION_GEOMETRY ----

test('ROTATION_GEOMETRY 0 has correct offsets and direction', () => {
  const g = ROTATION_GEOMETRY[0]
  expect(g.colOff).toBe(0)
  expect(g.rowOff).toBe(0)
  expect(g.epColOff).toBe(2)
  expect(g.epRowOff).toBe(0)
  expect(g.epDir).toBe('east')
  expect(g.anchorLeft).toBe(true)
})

test('ROTATION_GEOMETRY 180 has correct offsets and direction', () => {
  const g = ROTATION_GEOMETRY[180]
  expect(g.colOff).toBe(-1)
  expect(g.rowOff).toBe(0)
  expect(g.epColOff).toBe(-2)
  expect(g.epRowOff).toBe(0)
  expect(g.epDir).toBe('west')
  expect(g.anchorLeft).toBe(false)
})

test('ROTATION_GEOMETRY 90 has correct offsets and direction', () => {
  const g = ROTATION_GEOMETRY[90]
  expect(g.colOff).toBe(0)
  expect(g.rowOff).toBe(0)
  expect(g.epColOff).toBe(0)
  expect(g.epRowOff).toBe(2)
  expect(g.epDir).toBe('south')
  expect(g.anchorLeft).toBe(true)
})

test('ROTATION_GEOMETRY 270 has correct offsets and direction', () => {
  const g = ROTATION_GEOMETRY[270]
  expect(g.colOff).toBe(0)
  expect(g.rowOff).toBe(-1)
  expect(g.epColOff).toBe(0)
  expect(g.epRowOff).toBe(-2)
  expect(g.epDir).toBe('north')
  expect(g.anchorLeft).toBe(false)
})

// ---- playerHasValidPlacement ----

test('playerHasValidPlacement returns true when tile left matches east endpoint', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const endpoints = [{ value: 'red', col: 2, row: 0, direction: 'east' }]
  expect(playerHasValidPlacement([tile], endpoints)).toBe(true)
})

test('playerHasValidPlacement returns true when tile right matches west endpoint via rotation 180', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const endpoints = [{ value: 'red', col: -1, row: 0, direction: 'west' }]
  expect(playerHasValidPlacement([tile], endpoints)).toBe(true)
})

test('playerHasValidPlacement returns false when no tile matches any endpoint', () => {
  const tile = { id: 'g-y', left: 'green', right: 'yellow' }
  const endpoints = [
    { value: 'red', col: -1, row: 0, direction: 'west' },
    { value: 'blue', col: 2, row: 0, direction: 'east' }
  ]
  expect(playerHasValidPlacement([tile], endpoints)).toBe(false)
})

// ---- checkCompletion ----

const ep = (value, direction = 'east') => ({ value, col: 0, row: 0, direction })

test('not complete when draw pile has tiles', () => {
  const state = {
    drawPile: [{ id: 'x', left: 'red', right: 'blue' }],
    board: { endpoints: [ep('green'), ep('green')] },
    players: [{ id: 'p0' }],
    hands: { p0: [] }
  }
  expect(checkCompletion(state)).toBe(false)
})

test('not complete when draw empty but a player can place', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = {
    drawPile: [],
    board: { endpoints: [ep('red'), ep('green')] },
    players: [{ id: 'p0' }, { id: 'p1' }],
    hands: { p0: [tile], p1: [] }
  }
  expect(checkCompletion(state)).toBe(false)
})

test('complete when draw empty and no player can place', () => {
  const state = {
    drawPile: [],
    board: { endpoints: [ep('purple'), ep('purple')] },
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
    board: { endpoints: [ep('red'), ep('blue')] },
    players: [{ id: 'p0' }, { id: 'p1' }],
    hands: { p0: [], p1: [] }
  }
  expect(checkCompletion(state)).toBe(true)
})

// ---- createInitialBoard ----

test('initial board has one placed tile', () => {
  const tile = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const board = createInitialBoard(tile)
  expect(board.tiles).toHaveLength(1)
  expect(board.tiles[0].tile).toBe(tile)
  expect(board.tiles[0].col).toBe(0)
  expect(board.tiles[0].row).toBe(0)
})

test('initial board has two endpoints', () => {
  const tile = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const board = createInitialBoard(tile)
  expect(board.endpoints).toHaveLength(2)
})

test('initial board endpoint values match tile halves', () => {
  const tile = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const board = createInitialBoard(tile)
  const values = board.endpoints.map(ep => ep.value)
  expect(values).toContain('red')
  expect(values).toContain('blue')
})

test('initial board endpoints have position properties', () => {
  const tile = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const board = createInitialBoard(tile)
  board.endpoints.forEach(ep => {
    expect(typeof ep.col).toBe('number')
    expect(typeof ep.row).toBe('number')
  })
})

// ---- createDominoGame ----

test('createDominoGame returns correct phase and turnIndex', () => {
  const setup = { players: [{ name: 'A', icon: 'cat', role: 'child_primary' }, { name: 'B', icon: 'dog', role: 'adult_observer' }], matchType: 'colours' }
  const game = createDominoGame(setup)
  expect(game.phase).toBe('playing')
  expect(game.turnIndex).toBe(0)
})

test('createDominoGame assigns player ids', () => {
  const setup = { players: [{ name: 'A', icon: 'cat', role: 'child_primary' }, { name: 'B', icon: 'dog', role: 'adult_observer' }], matchType: 'colours' }
  const game = createDominoGame(setup)
  expect(game.players[0].id).toBe('p0')
  expect(game.players[1].id).toBe('p1')
})

test('createDominoGame board has starting tile and endpoints', () => {
  const setup = { players: [{ name: 'A', icon: 'cat', role: 'child_primary' }, { name: 'B', icon: 'dog', role: 'adult_observer' }], matchType: 'colours' }
  const game = createDominoGame(setup)
  expect(game.board.tiles).toHaveLength(1)
  expect(game.board.endpoints).toHaveLength(2)
})

test('createDominoGame hands contain 7 tiles each', () => {
  const setup = { players: [{ name: 'A', icon: 'cat', role: 'child_primary' }, { name: 'B', icon: 'dog', role: 'adult_observer' }], matchType: 'colours' }
  const game = createDominoGame(setup)
  expect(game.hands['p0']).toHaveLength(7)
  expect(game.hands['p1']).toHaveLength(7)
})

// ---- createInitialBoard: direction and rotation ----

test('initial board endpoints have direction property', () => {
  const tile = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const board = createInitialBoard(tile)
  const dirs = board.endpoints.map(ep => ep.direction)
  expect(dirs).toContain('west')
  expect(dirs).toContain('east')
})

test('initial board starting tile has rotation 0', () => {
  const tile = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const board = createInitialBoard(tile)
  expect(board.tiles[0].rotation).toBe(0)
})

// ---- advanceTurn ----

function makeState(overrides) {
  return Object.assign({
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [{ id: 'x', left: 'red', right: 'blue' }],
    hands: { p0: [], p1: [] },
    board: { endpoints: [{ value: 'purple', col: -1, row: 0, direction: 'west' }, { value: 'purple', col: 2, row: 0, direction: 'east' }], tiles: [] }
  }, overrides)
}

test('advanceTurn increments turnIndex', () => {
  const state = makeState()
  advanceTurn(state)
  expect(state.turnIndex).toBe(1)
})

test('advanceTurn wraps around', () => {
  const state = makeState({ turnIndex: 1 })
  advanceTurn(state)
  expect(state.turnIndex).toBe(0)
})

test('advanceTurn sets phase complete when game ends', () => {
  const state = makeState({ drawPile: [], hands: { p0: [], p1: [] } })
  advanceTurn(state)
  expect(state.phase).toBe('complete')
})

// ---- placeTile ----

function makePlayingState() {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileB = { id: 'blue-green', left: 'blue', right: 'green', orientation: 'horizontal' }
  const tileC = { id: 'red-orange', left: 'red', right: 'orange', orientation: 'horizontal' }
  const tileD = { id: 'green-yellow', left: 'green', right: 'yellow', orientation: 'horizontal' }
  return {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [tileC],
    hands: { p0: [tileB, tileD], p1: [tileD] },
    stats: { p0: { tilesPlaced: 0 }, p1: { tilesPlaced: 0 } },
    board: {
      tiles: [{ tile: tileA, col: 0, row: 0, rotation: 0 }],
      endpoints: [
        { value: 'red',  col: -1, row: 0, direction: 'west' },
        { value: 'blue', col:  2, row: 0, direction: 'east' }
      ]
    }
  }
}

test('placeTile returns success for valid placement', () => {
  const state = makePlayingState()
  const result = placeTile(state, 'blue-green', 1)
  expect(result.success).toBe(true)
})

test('placeTile removes tile from hand', () => {
  const state = makePlayingState()
  placeTile(state, 'blue-green', 1)
  expect(state.hands['p0']).toHaveLength(1)
})

test('placeTile adds tile to board', () => {
  const state = makePlayingState()
  placeTile(state, 'blue-green', 1)
  expect(state.board.tiles).toHaveLength(2)
})

test('placeTile updates endpoint on east side', () => {
  const state = makePlayingState()
  placeTile(state, 'blue-green', 1)
  const eastEp = state.board.endpoints.find(ep => ep.direction === 'east')
  expect(eastEp.value).toBe('green')
  expect(eastEp.col).toBe(4)
})

test('placeTile advances turn', () => {
  const state = makePlayingState()
  placeTile(state, 'blue-green', 1)
  expect(state.turnIndex).toBe(1)
})

test('placeTile returns failure for invalid tile id', () => {
  const state = makePlayingState()
  expect(placeTile(state, 'no-tile', 1).success).toBe(false)
})

test('placeTile returns failure for invalid match', () => {
  const state = makePlayingState()
  const badTile = { id: 'purple-yellow', left: 'purple', right: 'yellow', orientation: 'horizontal' }
  state.hands['p0'] = [badTile]
  expect(placeTile(state, 'purple-yellow', 1).success).toBe(false)
})

test('placeTile sets phase complete when hand emptied', () => {
  const state = makePlayingState()
  state.drawPile = []
  state.hands['p0'] = [state.hands['p0'][0]]
  placeTile(state, 'blue-green', 1)
  expect(state.phase).toBe('complete')
})

test('placeTile with rotation 180 on west endpoint places at correct col', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileC = { id: 'green-red', left: 'green', right: 'red', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [tileC], p1: [] },
    stats: { p0: { tilesPlaced: 0 }, p1: { tilesPlaced: 0 } },
    board: {
      tiles: [{ tile: tileA, col: 0, row: 0, rotation: 0 }],
      endpoints: [
        { value: 'red',  col: -1, row: 0, direction: 'west' },
        { value: 'blue', col:  2, row: 0, direction: 'east' }
      ]
    }
  }
  placeTile(state, 'green-red', 0, 180)
  const placed = state.board.tiles.find(pt => pt.tile.id === 'green-red')
  expect(placed.col).toBe(-2)
  expect(placed.rotation).toBe(180)
})

test('placeTile with rotation 180 updates west endpoint', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileC = { id: 'green-red', left: 'green', right: 'red', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [tileC], p1: [] },
    stats: { p0: { tilesPlaced: 0 }, p1: { tilesPlaced: 0 } },
    board: {
      tiles: [{ tile: tileA, col: 0, row: 0, rotation: 0 }],
      endpoints: [
        { value: 'red',  col: -1, row: 0, direction: 'west' },
        { value: 'blue', col:  2, row: 0, direction: 'east' }
      ]
    }
  }
  placeTile(state, 'green-red', 0, 180)
  const westEp = state.board.endpoints.find(ep => ep.direction === 'west')
  expect(westEp.value).toBe('green')
  expect(westEp.col).toBe(-3)
})

// ---- drawTile ----

test('drawTile adds tile to current player hand', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [tile],
    hands: { p0: [], p1: [] },
    board: { endpoints: [{ value: 'purple', col: -1, row: 0, direction: 'west' }, { value: 'purple', col: 2, row: 0, direction: 'east' }], tiles: [] }
  }
  drawTile(state)
  expect(state.hands['p0']).toHaveLength(1)
  expect(state.hands['p0'][0].id).toBe('r-b')
})

test('drawTile removes tile from draw pile', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [tile],
    hands: { p0: [], p1: [] },
    board: { endpoints: [{ value: 'purple', col: -1, row: 0, direction: 'west' }, { value: 'purple', col: 2, row: 0, direction: 'east' }], tiles: [] }
  }
  drawTile(state)
  expect(state.drawPile).toHaveLength(0)
})

test('drawTile advances turn', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [tile],
    hands: { p0: [], p1: [] },
    board: { endpoints: [{ value: 'purple', col: -1, row: 0, direction: 'west' }, { value: 'purple', col: 2, row: 0, direction: 'east' }], tiles: [] }
  }
  drawTile(state)
  expect(state.turnIndex).toBe(1)
})

test('drawTile returns success and tile', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [tile],
    hands: { p0: [], p1: [] },
    board: { endpoints: [], tiles: [] }
  }
  const result = drawTile(state)
  expect(result.success).toBe(true)
  expect(result.tile.id).toBe('r-b')
})

test('drawTile returns failure on empty draw pile', () => {
  const state = {
    players: [{ id: 'p0' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [] },
    board: { endpoints: [], tiles: [] }
  }
  expect(drawTile(state).success).toBe(false)
})

// ---- getPreviewPlacement ----

test('getPreviewPlacement returns tile, col, row, rotation for east endpoint', () => {
  const state = makePlayingState()
  const preview = getPreviewPlacement(state, 'blue-green', 1)
  expect(preview).not.toBeNull()
  expect(preview.tile.id).toBe('blue-green')
  expect(preview.col).toBe(2)
  expect(preview.row).toBe(0)
  expect(preview.rotation).toBe(0)
})

test('getPreviewPlacement returns null for unknown tile id', () => {
  const state = makePlayingState()
  expect(getPreviewPlacement(state, 'no-tile', 1)).toBeNull()
})

test('getPreviewPlacement returns null for invalid endpoint index', () => {
  const state = makePlayingState()
  expect(getPreviewPlacement(state, 'blue-green', 99)).toBeNull()
})

test('getPreviewPlacement auto-detects rotation 180 for west endpoint', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileFlipped = { id: 'green-red', left: 'green', right: 'red', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [tileFlipped] },
    board: {
      tiles: [{ tile: tileA, col: 0, row: 0, rotation: 0 }],
      endpoints: [
        { value: 'red',  col: -1, row: 0, direction: 'west' },
        { value: 'blue', col:  2, row: 0, direction: 'east' }
      ]
    }
  }
  const preview = getPreviewPlacement(state, 'green-red', 0)
  expect(preview.rotation).toBe(180)
  expect(preview.col).toBe(-2)
})

test('getPreviewPlacement uses explicit rotation when provided', () => {
  const state = makePlayingState()
  const preview = getPreviewPlacement(state, 'blue-green', 1, 90)
  expect(preview.rotation).toBe(90)
  expect(preview.col).toBe(2)
  expect(preview.row).toBe(0)
})

// ---- stats ----

test('createDominoGame initialises stats for each player', () => {
  const setup = { matchType: 'colours', players: [{ name: 'A', icon: 'cat', role: 'child' }, { name: 'B', icon: 'dog', role: 'child' }] }
  const state = createDominoGame(setup)
  expect(state.stats['p0']).toEqual({ tilesPlaced: 0 })
  expect(state.stats['p1']).toEqual({ tilesPlaced: 0 })
})

test('placeTile increments tilesPlaced for active player', () => {
  const state = makePlayingState()
  placeTile(state, 'blue-green', 1)
  expect(state.stats['p0'].tilesPlaced).toBe(1)
  expect(state.stats['p1'].tilesPlaced).toBe(0)
})

test('placeTile does not increment tilesPlaced on failure', () => {
  const state = makePlayingState()
  placeTile(state, 'bad-id', 1)
  expect(state.stats['p0'].tilesPlaced).toBe(0)
})
