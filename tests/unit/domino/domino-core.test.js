const { generateTiles, dealHands, validatePlacement, playerHasValidPlacement, checkCompletion, createInitialBoard, createDominoGame, advanceTurn, placeTile, drawTile, getPreviewPlacement, getDominoMatchTypes, DOMINO_VALUES, DOMINO_STATIC_MATCH_TYPES_CORE, ROTATION_GEOMETRY, NEXT_ROTATION, findNextPreviewRotation, buildDominoShapeSvg, buildDominoNumberSvg, cellKey, placedTileCells, hasCollision, dominoShuffle } = require('../../../core/domino/domino-core.js')

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

test('generateTiles uses custom values when provided', () => {
  const custom = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  const tiles = generateTiles('colours', custom)
  expect(tiles).toHaveLength(28)
  const values = new Set(custom)
  tiles.forEach(t => {
    expect(values.has(t.left)).toBe(true)
    expect(values.has(t.right)).toBe(true)
  })
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

test('validatePlacement valid rotation 0 at west endpoint when left matches', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'red', col: -1, row: 0, direction: 'west' }
  expect(validatePlacement(tile, ep, 0).valid).toBe(true)
})

test('validatePlacement valid rotation 180 at west endpoint with right match', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const ep = { value: 'red', col: -1, row: 0, direction: 'west' }
  expect(validatePlacement(tile, ep, 180).valid).toBe(true)
})

test('validatePlacement valid rotation 180 at east endpoint when right matches', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const ep = { value: 'red', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tile, ep, 180).valid).toBe(true)
})

test('validatePlacement invalid rotation 180 when right does not match endpoint', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const ep = { value: 'green', col: 2, row: 0, direction: 'east' }
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

test('ROTATION_GEOMETRY 45 has correct offsets and anchorLeft false', () => {
  const g = ROTATION_GEOMETRY[45]
  expect(g.colOff).toBe(0)
  expect(g.rowOff).toBe(0)
  expect(g.epColOff).toBe(2)
  expect(g.epRowOff).toBe(0)
  expect(g.epDir).toBe('east')
  expect(g.anchorLeft).toBe(false)
})

test('ROTATION_GEOMETRY 135 has correct offsets and anchorLeft false', () => {
  const g = ROTATION_GEOMETRY[135]
  expect(g.colOff).toBe(0)
  expect(g.rowOff).toBe(0)
  expect(g.epColOff).toBe(0)
  expect(g.epRowOff).toBe(2)
  expect(g.epDir).toBe('south')
  expect(g.anchorLeft).toBe(false)
})

test('ROTATION_GEOMETRY 225 has correct offsets and anchorLeft true', () => {
  const g = ROTATION_GEOMETRY[225]
  expect(g.colOff).toBe(-1)
  expect(g.rowOff).toBe(0)
  expect(g.epColOff).toBe(-2)
  expect(g.epRowOff).toBe(0)
  expect(g.epDir).toBe('west')
  expect(g.anchorLeft).toBe(true)
})

test('ROTATION_GEOMETRY 315 has correct offsets and anchorLeft true', () => {
  const g = ROTATION_GEOMETRY[315]
  expect(g.colOff).toBe(0)
  expect(g.rowOff).toBe(-1)
  expect(g.epColOff).toBe(0)
  expect(g.epRowOff).toBe(-2)
  expect(g.epDir).toBe('north')
  expect(g.anchorLeft).toBe(true)
})

test('validatePlacement valid rotation 45 when right matches endpoint', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const ep = { value: 'red', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tile, ep, 45).valid).toBe(true)
})

test('validatePlacement valid rotation 135 when right matches south endpoint', () => {
  const tile = { id: 'b-r', left: 'blue', right: 'red' }
  const ep = { value: 'red', col: 0, row: 2, direction: 'south' }
  expect(validatePlacement(tile, ep, 135).valid).toBe(true)
})

test('validatePlacement valid rotation 225 when left matches west endpoint', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'red', col: -1, row: 0, direction: 'west' }
  expect(validatePlacement(tile, ep, 225).valid).toBe(true)
})

test('validatePlacement valid rotation 315 when left matches north endpoint', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'red', col: 0, row: -2, direction: 'north' }
  expect(validatePlacement(tile, ep, 315).valid).toBe(true)
})

// ---- validatePlacement collision detection ----

test('validatePlacement skips collision check when boardTiles not provided', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'red', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tile, ep, 0).valid).toBe(true)
})

test('validatePlacement returns false when tile overlaps existing tile', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileB = { id: 'red-green', left: 'red', right: 'green', orientation: 'horizontal' }
  const boardTiles = [{ tile: tileA, col: 0, row: 0, rotation: 0 }]
  const ep = { value: 'red', col: -1, row: 0, direction: 'west' }
  expect(validatePlacement(tileB, ep, 0, boardTiles).valid).toBe(false)
})

test('validatePlacement returns false when tile touches non-connecting tile', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileB = { id: 'blue-green', left: 'blue', right: 'green', orientation: 'horizontal' }
  const tileC = { id: 'green-yellow', left: 'green', right: 'yellow', orientation: 'horizontal' }
  const boardTiles = [
    { tile: tileA, col: 0, row: 0, rotation: 0 },
    { tile: tileC, col: 3, row: 1, rotation: 0 }
  ]
  const ep = { value: 'blue', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tileB, ep, 0, boardTiles).valid).toBe(false)
})

test('validatePlacement returns true when tile only touches connecting tile', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileB = { id: 'blue-green', left: 'blue', right: 'green', orientation: 'horizontal' }
  const boardTiles = [{ tile: tileA, col: 0, row: 0, rotation: 0 }]
  const ep = { value: 'blue', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tileB, ep, 0, boardTiles).valid).toBe(true)
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

test('initial board endpoint columns are exact', () => {
  const tile = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const board = createInitialBoard(tile)
  const west = board.endpoints.find(ep => ep.direction === 'west')
  const east = board.endpoints.find(ep => ep.direction === 'east')
  expect(west.col).toBe(-1)
  expect(west.row).toBe(0)
  expect(east.col).toBe(2)
  expect(east.row).toBe(0)
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

test('advanceTurn sets phase complete when pile empty and no player can place', () => {
  const unmatchable = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = makeState({ drawPile: [], hands: { p0: [unmatchable], p1: [unmatchable] } })
  advanceTurn(state)
  expect(state.phase).toBe('complete')
})

test('advanceTurn skips blocked player and lands on player who can place', () => {
  const playable = { id: 'p-p', left: 'purple', right: 'purple', orientation: 'horizontal' }
  const blocked  = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = makeState({ drawPile: [], hands: { p0: [blocked], p1: [playable] } })
  advanceTurn(state)
  expect(state.turnIndex).toBe(1)
  expect(state.phase).toBe('playing')
})

test('advanceTurn does not skip player when draw pile has tiles', () => {
  const state = makeState({ drawPile: [{ id: 'x', left: 'red', right: 'blue' }], hands: { p0: [], p1: [] } })
  advanceTurn(state)
  expect(state.turnIndex).toBe(1)
  expect(state.phase).toBe('playing')
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
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
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
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
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
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
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
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
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
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
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
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
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
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
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

test('getPreviewPlacement returns valid placement for west endpoint', () => {
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
  expect(preview).not.toBeNull()
  expect(preview.tile.id).toBe('green-red')
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
  expect(state.stats['p0']).toEqual({ tilesPlaced: 0, tilesDrawn: 0 })
  expect(state.stats['p1']).toEqual({ tilesPlaced: 0, tilesDrawn: 0 })
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

// ---- getPreviewPlacement: value-free preview ----

test('getPreviewPlacement returns non-null for value-mismatched tile at endpoint', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const mismatch = { id: 'purple-yellow', left: 'purple', right: 'yellow', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [mismatch] },
    board: {
      tiles: [{ tile: tileA, col: 0, row: 0, rotation: 0 }],
      endpoints: [
        { value: 'red',  col: -1, row: 0, direction: 'west' },
        { value: 'blue', col:  2, row: 0, direction: 'east' }
      ]
    }
  }
  expect(getPreviewPlacement(state, 'purple-yellow', 1)).not.toBeNull()
})

// ---- NEXT_ROTATION ----

test('NEXT_ROTATION covers all 8 rotations', () => {
  expect(Object.keys(NEXT_ROTATION)).toHaveLength(8)
  const rots = [0, 90, 180, 270, 45, 135, 225, 315]
  rots.forEach(r => expect(NEXT_ROTATION).toHaveProperty(String(r)))
})

// ---- findNextPreviewRotation ----

function makeStateForRotation(boardTiles, endpoints) {
  return {
    players: [{ id: 'p0' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [] },
    board: { tiles: boardTiles, endpoints }
  }
}

test('findNextPreviewRotation returns a rotation different from current', () => {
  const state = makeStateForRotation([], [{ value: 'red', col: 2, row: 0, direction: 'east' }])
  const next = findNextPreviewRotation(0, 'any', 0, state)
  expect(next).not.toBe(0)
})

test('findNextPreviewRotation returns a valid rotation from NEXT_ROTATION cycle', () => {
  const state = makeStateForRotation([], [{ value: 'red', col: 2, row: 0, direction: 'east' }])
  const next = findNextPreviewRotation(0, 'any', 0, state)
  expect([0, 90, 180, 270, 45, 135, 225, 315]).toContain(next)
})

test('findNextPreviewRotation skips colliding rotation', () => {
  const startTile = { id: 'start', left: 'x', right: 'y', orientation: 'horizontal' }
  const blocker  = { id: 'block', left: 'a', right: 'b', orientation: 'horizontal' }
  // start tile occupies {0,0} and {1,0}; blocker at {4,0} and {5,0}
  // rotation 0 at east endpoint {2,0} places tile at {2,0}-{3,0}; {3,0} is adjacent to blocker {4,0} → collision
  // rotation 90 at east endpoint {2,0} places tile at {2,0}-{2,1}; no adjacency to blocker → no collision
  const boardTiles = [
    { tile: startTile, col: 0, row: 0, rotation: 0 },
    { tile: blocker,   col: 4, row: 0, rotation: 0 }
  ]
  const endpoints = [{ value: 'y', col: 2, row: 0, direction: 'east' }]
  const state = makeStateForRotation(boardTiles, endpoints)
  const next = findNextPreviewRotation(0, 'any', 0, state)
  expect(next).not.toBe(0)
})

test('findNextPreviewRotation returns current rotation when all rotations collide', () => {
  const makeTile = (id, col, row) => ({ tile: { id, left: 'x', right: 'y', orientation: 'horizontal' }, col, row, rotation: 0 })
  const boardTiles = [
    makeTile('t1', 2, 0), makeTile('t2', 2, 0), makeTile('t3', -2, 0),
    makeTile('t4', 0, 2), makeTile('t5', 0, -2)
  ]
  const endpoints = [{ value: 'x', col: 0, row: 0, direction: 'east' }]
  const state = makeStateForRotation(boardTiles, endpoints)
  const next = findNextPreviewRotation(0, 'any', 0, state)
  expect(next).toBe(0)
})

// ---- DOMINO_VALUES exact content ----

test('DOMINO_VALUES has exact values for each match type', () => {
  expect(DOMINO_VALUES.colours).toEqual(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'])
  expect(DOMINO_VALUES.shapes).toEqual(['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'cross'])
  expect(DOMINO_VALUES.numbers).toEqual(['0', '1', '2', '3', '4', '5', '6'])
})

// ---- generateTiles: exact id and orientation ----

test('generateTiles first tile is the self-pair of the first value', () => {
  expect(generateTiles('colours')[0].id).toBe('red-red')
})

test('generateTiles builds every id from left and right joined with a hyphen', () => {
  generateTiles('colours').forEach(t => {
    expect(t.id).toBe(t.left + '-' + t.right)
  })
})

test('generateTiles orientation is exactly horizontal', () => {
  generateTiles('colours').forEach(t => {
    expect(t.orientation).toBe('horizontal')
  })
})

test('generateTiles never produces an out-of-range value pair', () => {
  const values = DOMINO_VALUES.colours
  generateTiles('colours').forEach(t => {
    expect(values).toContain(t.left)
    expect(values).toContain(t.right)
  })
  const ids = generateTiles('colours').map(t => t.id)
  expect(ids).not.toContain('undefined-undefined')
})

// ---- validatePlacement default rotation ----

test('validatePlacement defaults rotation to 0 when omitted entirely', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue' }
  const ep = { value: 'red', col: 2, row: 0, direction: 'east' }
  expect(validatePlacement(tile, ep).valid).toBe(true)
})

// ---- advanceTurn: multi-player skip chain ----

test('advanceTurn skips multiple blocked players before landing on one who can place', () => {
  const blocked = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const playable = { id: 'p-p', left: 'purple', right: 'purple', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }, { id: 'p2' }],
    turnIndex: 2,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [blocked], p1: [blocked], p2: [playable] },
    board: { endpoints: [{ value: 'purple', col: -1, row: 0, direction: 'west' }, { value: 'purple', col: 2, row: 0, direction: 'east' }], tiles: [] }
  }
  advanceTurn(state)
  expect(state.turnIndex).toBe(2)
  expect(state.phase).toBe('playing')
})

// ---- dealHands: fallback path when no shuffle produces an all-playable start ----

function makeUnplayableTileSet(n) {
  const tiles = []
  for (let k = 0; k < n; k++) {
    tiles.push({ id: 'u' + k, left: 'L' + k, right: 'R' + k, orientation: 'horizontal' })
  }
  return tiles
}

test('dealHands falls back to a raw deal when no shuffle produces an all-playable start', () => {
  // every tile has a value unique to itself, so no hand tile can ever match
  // the starting tile's endpoints — every one of the 100 shuffle attempts fails
  const tiles = makeUnplayableTileSet(15) // 2 players * 7 + 1 starting tile
  const result = dealHands(tiles, 2)
  expect(Object.keys(result.hands)).toHaveLength(2)
  expect(result.hands['p0']).toHaveLength(7)
  expect(result.hands['p1']).toHaveLength(7)
  expect(result.startingTile).toBeDefined()
  expect(result.drawPile).toHaveLength(0)
})

// ---- placeTile: a rotation with non-zero row offset (270 / north) ----

test('placeTile with rotation 270 places at correct row and updates the north endpoint', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileC = { id: 'green-red', left: 'green', right: 'red', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [tileC], p1: [] },
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
    board: {
      tiles: [{ tile: tileA, col: 0, row: 0, rotation: 0 }],
      endpoints: [
        { value: 'red',  col: 0, row: -2, direction: 'north' },
        { value: 'blue', col: 2, row: 0,  direction: 'east' }
      ]
    }
  }
  placeTile(state, 'green-red', 0, 270)
  expect(state.board.endpoints).toHaveLength(2)
  const placed = state.board.tiles.find(pt => pt.tile.id === 'green-red')
  expect(placed.col).toBe(0)
  expect(placed.row).toBe(-3)
  const northEp = state.board.endpoints.find(ep => ep.direction === 'north')
  expect(northEp.col).toBe(0)
  expect(northEp.row).toBe(-4)
  const eastEp = state.board.endpoints.find(ep => ep.direction === 'east')
  expect(eastEp.value).toBe('blue')
  expect(eastEp.col).toBe(2)
})

// ---- getPreviewPlacement: explicit-rotation collision, and auto-search ----

test('getPreviewPlacement returns null for an explicit rotation that collides', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileB = { id: 'blue-green', left: 'blue', right: 'green', orientation: 'horizontal' }
  const tileC = { id: 'red-green', left: 'red', right: 'green', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [tileC] },
    board: {
      tiles: [
        { tile: tileA, col: 0, row: 0, rotation: 0 },
        { tile: tileB, col: 3, row: 1, rotation: 0 }
      ],
      endpoints: [{ value: 'red', col: 2, row: 0, direction: 'east' }]
    }
  }
  expect(getPreviewPlacement(state, 'red-green', 0, 0)).toBeNull()
})

test('getPreviewPlacement auto-search skips non-matching rotations to find a valid one further down the list', () => {
  const state = {
    players: [{ id: 'p0' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [{ id: 'z-r', left: 'zzz', right: 'red', orientation: 'horizontal' }] },
    board: { tiles: [], endpoints: [{ value: 'red', col: 2, row: 0, direction: 'east' }] }
  }
  const preview = getPreviewPlacement(state, 'z-r', 0)
  expect(preview.rotation).toBe(180)
})

test('getPreviewPlacement falls back to the first non-colliding rotation when none validly match', () => {
  const state = {
    players: [{ id: 'p0' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [{ id: 'q-z', left: 'qqq', right: 'zzz', orientation: 'horizontal' }] },
    board: { tiles: [], endpoints: [{ value: 'red', col: 2, row: 0, direction: 'east' }] }
  }
  const preview = getPreviewPlacement(state, 'q-z', 0)
  expect(preview).not.toBeNull()
  expect(preview.rotation).toBe(0)
})

// ---- cellKey / placedTileCells / hasCollision (exported for direct testing) ----

test('cellKey joins col and row with a comma', () => {
  expect(cellKey(3, 5)).toBe('3,5')
  expect(cellKey(-1, 0)).toBe('-1,0')
})

test('placedTileCells returns two cells right of a horizontal tile', () => {
  expect(placedTileCells({ col: 2, row: 3, rotation: 0 })).toEqual([{ col: 2, row: 3 }, { col: 3, row: 3 }])
})

test('placedTileCells returns two cells below a vertical tile', () => {
  expect(placedTileCells({ col: 2, row: 3, rotation: 90 })).toEqual([{ col: 2, row: 3 }, { col: 2, row: 4 }])
})

test('hasCollision vertical placement checks the second (row+1) cell for adjacency too', () => {
  const endpoint = { col: 2, row: 2, direction: 'south' }
  // horizontal board tile at {2,4}/{3,4}: adjacent to the vertical tile's row+1 cell {2,3}, not to {2,2}
  const boardTiles = [{ col: 2, row: 4, rotation: 0 }]
  expect(hasCollision(endpoint, 90, boardTiles)).toBe(true)
})

test('hasCollision uses rotation 270 row offset to place the mutant tile', () => {
  const endpoint = { col: 0, row: 5, direction: 'north' }
  // rotation 270: colOff 0, rowOff -1 -> tileRow = 5 + (-1) = 4; vertical cells {0,4},{0,5}
  const boardTiles = [{ col: 0, row: 4, rotation: 90 }] // occupies {0,4},{0,5} — direct overlap
  expect(hasCollision(endpoint, 270, boardTiles)).toBe(true)
})

test('hasCollision excludes the connecting tile itself when placing south', () => {
  const endpoint = { col: 5, row: 5, direction: 'south' }
  const connectingBoardTile = { col: 5, row: 4, rotation: 0 } // horizontal: {5,4},{6,4}
  expect(hasCollision(endpoint, 90, [connectingBoardTile])).toBe(false)
})

// ---- buildDominoShapeSvg: exact output per shape ----

test('buildDominoShapeSvg circle', () => {
  expect(buildDominoShapeSvg('circle')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><circle cx="16" cy="16" r="13" fill="#444"/></svg>')
})

test('buildDominoShapeSvg square', () => {
  expect(buildDominoShapeSvg('square')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><rect x="3" y="3" width="26" height="26" rx="4" fill="#444"/></svg>')
})

test('buildDominoShapeSvg triangle', () => {
  expect(buildDominoShapeSvg('triangle')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><polygon points="16,3 29,29 3,29" fill="#444"/></svg>')
})

test('buildDominoShapeSvg star', () => {
  expect(buildDominoShapeSvg('star')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><polygon points="16,2 19.5,11.5 29.5,11.5 21.5,17.5 24.5,27 16,21 7.5,27 10.5,17.5 2.5,11.5 12.5,11.5" fill="#444"/></svg>')
})

test('buildDominoShapeSvg heart', () => {
  expect(buildDominoShapeSvg('heart')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><path d="M16,28 C4,18 2,8 8,5 C11,3.5 14,6 16,10 C18,6 21,3.5 24,5 C30,8 28,18 16,28 Z" fill="#444"/></svg>')
})

test('buildDominoShapeSvg diamond', () => {
  expect(buildDominoShapeSvg('diamond')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><polygon points="16,2 30,16 16,30 2,16" fill="#444"/></svg>')
})

test('buildDominoShapeSvg cross', () => {
  expect(buildDominoShapeSvg('cross')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><path d="M11,3 L21,3 L21,11 L29,11 L29,21 L21,21 L21,29 L11,29 L11,21 L3,21 L3,11 L11,11 Z" fill="#444"/></svg>')
})

test('buildDominoShapeSvg unknown shape returns just the base svg wrapper', () => {
  expect(buildDominoShapeSvg('nope')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"></svg>')
})

// ---- buildDominoNumberSvg: exact output per value ----

test('buildDominoNumberSvg 0 has no dots', () => {
  expect(buildDominoNumberSvg('0')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"></svg>')
})

test('buildDominoNumberSvg 1 has exact single dot', () => {
  expect(buildDominoNumberSvg('1')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><circle cx="16" cy="16" r="4" fill="#333"/></svg>')
})

test('buildDominoNumberSvg 2 has exact two dots', () => {
  expect(buildDominoNumberSvg('2')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><circle cx="8" cy="8" r="4" fill="#333"/><circle cx="24" cy="24" r="4" fill="#333"/></svg>')
})

test('buildDominoNumberSvg 3 has exact three dots', () => {
  expect(buildDominoNumberSvg('3')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><circle cx="8" cy="8" r="4" fill="#333"/><circle cx="16" cy="16" r="4" fill="#333"/><circle cx="24" cy="24" r="4" fill="#333"/></svg>')
})

test('buildDominoNumberSvg 4 has exact four dots', () => {
  expect(buildDominoNumberSvg('4')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><circle cx="8" cy="8" r="4" fill="#333"/><circle cx="24" cy="8" r="4" fill="#333"/><circle cx="8" cy="24" r="4" fill="#333"/><circle cx="24" cy="24" r="4" fill="#333"/></svg>')
})

test('buildDominoNumberSvg 5 has exact five dots', () => {
  expect(buildDominoNumberSvg('5')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><circle cx="8" cy="8" r="4" fill="#333"/><circle cx="24" cy="8" r="4" fill="#333"/><circle cx="16" cy="16" r="4" fill="#333"/><circle cx="8" cy="24" r="4" fill="#333"/><circle cx="24" cy="24" r="4" fill="#333"/></svg>')
})

test('buildDominoNumberSvg 6 has exact six dots', () => {
  expect(buildDominoNumberSvg('6')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"><circle cx="8" cy="8" r="4" fill="#333"/><circle cx="24" cy="8" r="4" fill="#333"/><circle cx="8" cy="16" r="4" fill="#333"/><circle cx="24" cy="16" r="4" fill="#333"/><circle cx="8" cy="24" r="4" fill="#333"/><circle cx="24" cy="24" r="4" fill="#333"/></svg>')
})

test('buildDominoNumberSvg unknown value falls back to no dots', () => {
  expect(buildDominoNumberSvg('9')).toBe('<svg viewBox="0 0 32 32" style="width:26px;height:26px;"></svg>')
})

// ---- DOMINO_STATIC_MATCH_TYPES_CORE ----

test('DOMINO_STATIC_MATCH_TYPES_CORE marks colours, shapes and numbers as static', () => {
  expect(DOMINO_STATIC_MATCH_TYPES_CORE).toEqual({ colours: true, shapes: true, numbers: true })
})

// ---- getDominoMatchTypes ----

test('getDominoMatchTypes returns the 3 static types plus discovered tag types', () => {
  const prev = global.getAvailableTags
  global.getAvailableTags = (entries) => entries.map(e => e.tag)
  const result = getDominoMatchTypes([{ tag: 'animals' }, { tag: 'vehicles' }])
  global.getAvailableTags = prev
  expect(result).toEqual([
    { value: 'colours', label: 'Colours' },
    { value: 'shapes', label: 'Shapes' },
    { value: 'numbers', label: 'Numbers' },
    { value: 'animals', label: 'Animals' },
    { value: 'vehicles', label: 'Vehicles' }
  ])
})

test('getDominoMatchTypes returns just the 3 static types when no tags are available', () => {
  const prev = global.getAvailableTags
  global.getAvailableTags = () => []
  const result = getDominoMatchTypes([])
  global.getAvailableTags = prev
  expect(result).toEqual([
    { value: 'colours', label: 'Colours' },
    { value: 'shapes', label: 'Shapes' },
    { value: 'numbers', label: 'Numbers' }
  ])
})

// ---- dominoShuffle (exported for direct testing) ----

test('dominoShuffle does not mutate the input array', () => {
  const arr = [1, 2, 3, 4, 5]
  dominoShuffle(arr)
  expect(arr).toEqual([1, 2, 3, 4, 5])
})

test('dominoShuffle returns an array with the same elements', () => {
  const arr = [1, 2, 3, 4, 5]
  const shuffled = dominoShuffle(arr)
  expect(shuffled).toHaveLength(5)
  expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5])
})

test('dominoShuffle uses a rigged rng of 0 to swap every element toward the front', () => {
  const original = Math.random
  Math.random = () => 0
  const arr = [1, 2, 3, 4, 5]
  const shuffled = dominoShuffle(arr)
  Math.random = original
  expect(shuffled).toEqual([2, 3, 4, 5, 1])
})

test('dominoShuffle bounds the swap index by i+1, not i-1 or a division', () => {
  const original = Math.random
  Math.random = () => 0.99999
  const arr = [1, 2, 3]
  const shuffled = dominoShuffle(arr)
  Math.random = original
  expect(shuffled).toEqual([1, 2, 3])
})

// ---- HORIZONTAL_ROT: every horizontal rotation, not just 0 ----

test('placedTileCells treats rotation 45 as horizontal', () => {
  expect(placedTileCells({ col: 1, row: 1, rotation: 45 })).toEqual([{ col: 1, row: 1 }, { col: 2, row: 1 }])
})

test('placedTileCells treats rotation 180 as horizontal', () => {
  expect(placedTileCells({ col: 1, row: 1, rotation: 180 })).toEqual([{ col: 1, row: 1 }, { col: 2, row: 1 }])
})

test('placedTileCells treats rotation 225 as horizontal', () => {
  expect(placedTileCells({ col: 1, row: 1, rotation: 225 })).toEqual([{ col: 1, row: 1 }, { col: 2, row: 1 }])
})

// ---- hasCollision: north-direction connecting tile exclusion ----

test('hasCollision excludes the connecting tile itself when placing north', () => {
  const endpoint = { col: 5, row: 5, direction: 'north' }
  const connectingBoardTile = { col: 5, row: 6, rotation: 0 } // horizontal: {5,6},{6,6}
  expect(hasCollision(endpoint, 180, [connectingBoardTile])).toBe(false)
})

test('hasCollision detects a board tile directly west of the placement', () => {
  const endpoint = { col: 10, row: 10, direction: 'south' }
  const boardTiles = [{ col: 9, row: 10, rotation: 90 }] // vertical: {9,10},{9,11}, west of {10,10}
  expect(hasCollision(endpoint, 0, boardTiles)).toBe(true)
})

// ---- advanceTurn: degenerate zero-player fallthrough ----

test('advanceTurn with zero players falls through to complete', () => {
  const state = { players: [], turnIndex: 0, phase: 'playing', drawPile: [], hands: {}, board: { endpoints: [], tiles: [] } }
  advanceTurn(state)
  expect(state.phase).toBe('complete')
})

// ---- placeTile: not-found sentinel and invalid endpoint index ----

test('placeTile returns failure for an out-of-range endpoint index', () => {
  const state = makePlayingState()
  expect(placeTile(state, 'blue-green', 99).success).toBe(false)
})

test('placeTile initial tileIdx sentinel correctly signals not-found', () => {
  const tileA = { id: 'red-blue', left: 'red', right: 'blue', orientation: 'horizontal' }
  const tileX = { id: 'filler', left: 'zzz', right: 'zzz', orientation: 'horizontal' }
  const tileY = { id: 'blue-green', left: 'blue', right: 'green', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [tileX, tileY], p1: [] },
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
    board: {
      tiles: [{ tile: tileA, col: 0, row: 0, rotation: 0 }],
      endpoints: [
        { value: 'red',  col: -1, row: 0, direction: 'west' },
        { value: 'blue', col:  2, row: 0, direction: 'east' }
      ]
    }
  }
  // 'does-not-exist' is never in hand[0..1] — tileIdx must stay at its
  // not-found sentinel, not fall through to treat hand[1] (tileY, which
  // would otherwise validly place) as the target.
  expect(placeTile(state, 'does-not-exist', 1).success).toBe(false)
})

// ---- getPreviewPlacement: explicit-rotation col/row use geom offsets ----

test('getPreviewPlacement explicit rotation computes col/row from geom offsets, not the endpoint alone', () => {
  const state = {
    players: [{ id: 'p0' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [],
    hands: { p0: [{ id: 'x-y', left: 'x', right: 'y', orientation: 'horizontal' }] },
    board: { tiles: [], endpoints: [{ value: 'red', col: 5, row: 5, direction: 'west' }] }
  }
  const preview180 = getPreviewPlacement(state, 'x-y', 0, 180)
  expect(preview180.col).toBe(4) // endpoint.col(5) + geom180.colOff(-1)
  expect(preview180.row).toBe(5) // endpoint.row(5) + geom180.rowOff(0)

  const preview270 = getPreviewPlacement(state, 'x-y', 0, 270)
  expect(preview270.row).toBe(4) // endpoint.row(5) + geom270.rowOff(-1)
})

// ---- drawTile: tilesDrawn stat increments, not decrements ----

test('drawTile increments tilesDrawn stat', () => {
  const tile = { id: 'r-b', left: 'red', right: 'blue', orientation: 'horizontal' }
  const state = {
    players: [{ id: 'p0' }, { id: 'p1' }],
    turnIndex: 0,
    phase: 'playing',
    drawPile: [tile],
    hands: { p0: [], p1: [] },
    stats: { p0: { tilesPlaced: 0, tilesDrawn: 0 }, p1: { tilesPlaced: 0, tilesDrawn: 0 } },
    board: { endpoints: [{ value: 'purple', col: -1, row: 0, direction: 'west' }, { value: 'purple', col: 2, row: 0, direction: 'east' }], tiles: [] }
  }
  drawTile(state)
  expect(state.stats['p0'].tilesDrawn).toBe(1)
})
