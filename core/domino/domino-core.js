var DOMINO_VALUES = {
  colours: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'],
  shapes:  ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'cross'],
  numbers: ['0', '1', '2', '3', '4', '5', '6']
};

var ROTATION_GEOMETRY = {
  0:   { colOff: 0,  rowOff: 0,  epColOff: 2,  epRowOff: 0,  epDir: 'east',  anchorLeft: true  },
  90:  { colOff: 0,  rowOff: 0,  epColOff: 0,  epRowOff: 2,  epDir: 'south', anchorLeft: true  },
  180: { colOff: -1, rowOff: 0,  epColOff: -2, epRowOff: 0,  epDir: 'west',  anchorLeft: false },
  270: { colOff: 0,  rowOff: -1, epColOff: 0,  epRowOff: -2, epDir: 'north', anchorLeft: false },
  45:  { colOff: 0,  rowOff: 0,  epColOff: 2,  epRowOff: 0,  epDir: 'east',  anchorLeft: false },
  135: { colOff: 0,  rowOff: 0,  epColOff: 0,  epRowOff: 2,  epDir: 'south', anchorLeft: false },
  225: { colOff: -1, rowOff: 0,  epColOff: -2, epRowOff: 0,  epDir: 'west',  anchorLeft: true  },
  315: { colOff: 0,  rowOff: -1, epColOff: 0,  epRowOff: -2, epDir: 'north', anchorLeft: true  }
};

var HORIZONTAL_ROT = { 0: true, 45: true, 180: true, 225: true };
var NEXT_ROTATION = { 0: 90, 90: 180, 180: 270, 270: 45, 45: 135, 135: 225, 225: 315, 315: 0 };
var CONNECT_DELTA = { east: { dc: -1, dr: 0 }, west: { dc: 1, dr: 0 }, south: { dc: 0, dr: -1 }, north: { dc: 0, dr: 1 } };
var NEIGHBOR_DIRS = [{ dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }];

function cellKey(col, row) { return col + ',' + row; }

function placedTileCells(pt) {
  if (HORIZONTAL_ROT[pt.rotation]) return [{ col: pt.col, row: pt.row }, { col: pt.col + 1, row: pt.row }];
  return [{ col: pt.col, row: pt.row }, { col: pt.col, row: pt.row + 1 }];
}

function hasCollision(endpoint, rotation, boardTiles) {
  var geom = ROTATION_GEOMETRY[rotation];
  var tileCol = endpoint.col + geom.colOff;
  var tileRow = endpoint.row + geom.rowOff;
  var newCells = HORIZONTAL_ROT[rotation]
    ? [{ col: tileCol, row: tileRow }, { col: tileCol + 1, row: tileRow }]
    : [{ col: tileCol, row: tileRow }, { col: tileCol, row: tileRow + 1 }];

  var cellToTile = {};
  for (var bi = 0; bi < boardTiles.length; bi++) {
    var bCells = placedTileCells(boardTiles[bi]);
    for (var ci = 0; ci < bCells.length; ci++) {
      cellToTile[cellKey(bCells[ci].col, bCells[ci].row)] = boardTiles[bi];
    }
  }

  for (var oi = 0; oi < newCells.length; oi++) {
    if (cellToTile[cellKey(newCells[oi].col, newCells[oi].row)]) return true;
  }

  var cd = CONNECT_DELTA[endpoint.direction];
  var connectingTile = cellToTile[cellKey(endpoint.col + cd.dc, endpoint.row + cd.dr)];

  var newCellKeys = {};
  for (var nki = 0; nki < newCells.length; nki++) {
    newCellKeys[cellKey(newCells[nki].col, newCells[nki].row)] = true;
  }

  for (var ai = 0; ai < newCells.length; ai++) {
    for (var di = 0; di < NEIGHBOR_DIRS.length; di++) {
      var nc = newCells[ai].col + NEIGHBOR_DIRS[di].dc;
      var nr = newCells[ai].row + NEIGHBOR_DIRS[di].dr;
      var nk = cellKey(nc, nr);
      if (newCellKeys[nk]) continue;
      var adjTile = cellToTile[nk];
      if (adjTile && adjTile !== connectingTile) return true;
    }
  }
  return false;
}

function dominoShuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function generateTiles(matchType, customValues) {
  var values = customValues || DOMINO_VALUES[matchType];
  var tiles = [];
  for (var i = 0; i < values.length; i++) {
    for (var j = i; j < values.length; j++) {
      tiles.push({
        id: values[i] + '-' + values[j],
        left: values[i],
        right: values[j],
        orientation: 'horizontal'
      });
    }
  }
  return tiles;
}

function validatePlacement(tile, endpoint, rotation, boardTiles) {
  var rot = rotation === undefined ? 0 : rotation;
  var geom = ROTATION_GEOMETRY[rot];
  var connectValue = geom.anchorLeft ? tile.left : tile.right;
  if (connectValue !== endpoint.value) return { valid: false };
  if (!boardTiles) return { valid: true };
  return { valid: !hasCollision(endpoint, rot, boardTiles) };
}

function playerHasValidPlacement(hand, endpoints, boardTiles) {
  var rotations = [0, 90, 180, 270, 45, 135, 225, 315];
  for (var i = 0; i < hand.length; i++) {
    for (var e = 0; e < endpoints.length; e++) {
      for (var r = 0; r < rotations.length; r++) {
        if (validatePlacement(hand[i], endpoints[e], rotations[r], boardTiles).valid) return true;
      }
    }
  }
  return false;
}

function dealHands(tiles, playerCount) {
  var MAX_ATTEMPTS = 100;

  for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    var shuffled = dominoShuffle(tiles);
    var handSize = 7;
    var hands = {};
    var playerIds = [];

    for (var p = 0; p < playerCount; p++) {
      var pid = 'p' + p;
      playerIds.push(pid);
      hands[pid] = shuffled.slice(p * handSize, (p + 1) * handSize);
    }

    var remaining = shuffled.slice(playerCount * handSize);
    var startingTile = remaining[0];
    var drawPile = remaining.slice(1);
    var endpoints = [
      { value: startingTile.left,  col: -1, row: 0, direction: 'west' },
      { value: startingTile.right, col:  2, row: 0, direction: 'east' }
    ];

    var allPlayable = playerIds.every(function(pid) {
      return playerHasValidPlacement(hands[pid], endpoints);
    });

    if (allPlayable) {
      return { hands: hands, startingTile: startingTile, drawPile: drawPile };
    }
  }

  var fallback = dominoShuffle(tiles);
  var fallbackHands = {};
  for (var fp = 0; fp < playerCount; fp++) {
    fallbackHands['p' + fp] = fallback.slice(fp * 7, (fp + 1) * 7);
  }
  return {
    hands: fallbackHands,
    startingTile: fallback[playerCount * 7],
    drawPile: fallback.slice(playerCount * 7 + 1)
  };
}

function checkCompletion(state) {
  if (state.drawPile.length > 0) return false;
  return state.players.every(function(p) {
    return !playerHasValidPlacement(state.hands[p.id], state.board.endpoints, state.board.tiles);
  });
}

function createInitialBoard(startingTile) {
  return {
    tiles: [{ tile: startingTile, col: 0, row: 0, rotation: 0 }],
    endpoints: [
      { value: startingTile.left,  col: -1, row: 0, direction: 'west' },
      { value: startingTile.right, col:  2, row: 0, direction: 'east' }
    ]
  };
}

function advanceTurn(state) {
  var n = state.players.length;
  for (var i = 0; i < n; i++) {
    state.turnIndex = (state.turnIndex + 1) % n;
    if (checkCompletion(state)) { state.phase = 'complete'; return; }
    var cur = state.players[state.turnIndex];
    if (state.drawPile.length > 0 || playerHasValidPlacement(state.hands[cur.id], state.board.endpoints, state.board.tiles)) return;
  }
  state.phase = 'complete';
}

function placeTile(state, tileId, endpointIndex, rotation) {
  var rot = rotation === undefined ? 0 : rotation;
  var player = state.players[state.turnIndex];
  var hand = state.hands[player.id];
  var tileIdx = -1;
  for (var i = 0; i < hand.length; i++) {
    if (hand[i].id === tileId) { tileIdx = i; break; }
  }
  if (tileIdx === -1) return { success: false };

  var tile = hand[tileIdx];
  var endpoint = state.board.endpoints[endpointIndex];
  if (!endpoint) return { success: false };

  var result = validatePlacement(tile, endpoint, rot, state.board.tiles);
  if (!result.valid) return { success: false };

  var geom = ROTATION_GEOMETRY[rot];
  var placedCol = endpoint.col + geom.colOff;
  var placedRow = endpoint.row + geom.rowOff;
  var newEndpointCol = endpoint.col + geom.epColOff;
  var newEndpointRow = endpoint.row + geom.epRowOff;
  var newValue = geom.anchorLeft ? tile.right : tile.left;

  state.board.tiles.push({ tile: tile, col: placedCol, row: placedRow, rotation: rot });
  state.stats[player.id].tilesPlaced += 1;

  var newEndpoints = [];
  for (var e = 0; e < state.board.endpoints.length; e++) {
    if (e === endpointIndex) {
      newEndpoints.push({ value: newValue, col: newEndpointCol, row: newEndpointRow, direction: geom.epDir });
    } else {
      newEndpoints.push(state.board.endpoints[e]);
    }
  }
  state.board.endpoints = newEndpoints;

  var newHand = [];
  for (var h = 0; h < hand.length; h++) {
    if (h !== tileIdx) newHand.push(hand[h]);
  }
  state.hands[player.id] = newHand;

  if (newHand.length === 0) {
    state.phase = 'complete';
  } else {
    advanceTurn(state);
  }
  return { success: true };
}

function getPreviewPlacement(state, tileId, endpointIndex, rotation) {
  var player = state.players[state.turnIndex];
  var hand = state.hands[player.id];
  var tile = null;
  for (var i = 0; i < hand.length; i++) {
    if (hand[i].id === tileId) { tile = hand[i]; break; }
  }
  if (!tile) return null;
  var endpoint = state.board.endpoints[endpointIndex];
  if (!endpoint) return null;
  var rot;
  if (rotation !== undefined) {
    rot = rotation;
    if (hasCollision(endpoint, rot, state.board.tiles)) return null;
  } else {
    var ALL_ROTS = [0, 90, 180, 270, 45, 135, 225, 315];
    var fallback;
    for (var ri = 0; ri < ALL_ROTS.length; ri++) {
      if (!hasCollision(endpoint, ALL_ROTS[ri], state.board.tiles)) {
        if (validatePlacement(tile, endpoint, ALL_ROTS[ri]).valid) { rot = ALL_ROTS[ri]; break; }
        if (fallback === undefined) fallback = ALL_ROTS[ri];
      }
    }
    if (rot === undefined) rot = fallback;
    if (rot === undefined) return null;
  }
  var geom = ROTATION_GEOMETRY[rot];
  return { tile: tile, col: endpoint.col + geom.colOff, row: endpoint.row + geom.rowOff, rotation: rot };
}

function drawTile(state) {
  if (state.drawPile.length === 0) return { success: false };
  var player = state.players[state.turnIndex];
  var drawn = state.drawPile[0];
  state.drawPile = state.drawPile.slice(1);
  state.hands[player.id] = state.hands[player.id].concat([drawn]);
  advanceTurn(state);
  return { success: true, tile: drawn };
}

function createDominoGame(setupState) {
  var tiles = generateTiles(setupState.matchType, setupState.values);
  var dealt = dealHands(tiles, setupState.players.length);
  var players = setupState.players.map(function(p, i) {
    return { id: 'p' + i, name: p.name, icon: p.icon, role: p.role };
  });
  var stats = {};
  players.forEach(function(p) { stats[p.id] = { tilesPlaced: 0 }; });
  return {
    players: players,
    matchType: setupState.matchType,
    hands: dealt.hands,
    drawPile: dealt.drawPile,
    board: createInitialBoard(dealt.startingTile),
    stats: stats,
    turnIndex: 0,
    phase: 'playing'
  };
}

function findNextPreviewRotation(currentRotation, tileId, endpointIndex, state) {
  var endpoint = state.board.endpoints[endpointIndex];
  var boardTiles = state.board.tiles;
  var rot = currentRotation;
  for (var i = 0; i < 8; i++) {
    rot = NEXT_ROTATION[rot];
    if (!hasCollision(endpoint, rot, boardTiles)) return rot;
  }
  return currentRotation;
}

var DOMINO_DICE_DOTS = {
  '0': [],
  '1': [[16,16]],
  '2': [[8,8],[24,24]],
  '3': [[8,8],[16,16],[24,24]],
  '4': [[8,8],[24,8],[8,24],[24,24]],
  '5': [[8,8],[24,8],[16,16],[8,24],[24,24]],
  '6': [[8,8],[24,8],[8,16],[24,16],[8,24],[24,24]]
};

function buildDominoShapeSvg(shape) {
  var s = '<svg viewBox="0 0 32 32" style="width:26px;height:26px;">';
  if (shape === 'circle')        s += '<circle cx="16" cy="16" r="13" fill="#444"/>';
  else if (shape === 'square')   s += '<rect x="3" y="3" width="26" height="26" rx="4" fill="#444"/>';
  else if (shape === 'triangle') s += '<polygon points="16,3 29,29 3,29" fill="#444"/>';
  else if (shape === 'star')     s += '<polygon points="16,2 19.5,11.5 29.5,11.5 21.5,17.5 24.5,27 16,21 7.5,27 10.5,17.5 2.5,11.5 12.5,11.5" fill="#444"/>';
  else if (shape === 'heart')    s += '<path d="M16,28 C4,18 2,8 8,5 C11,3.5 14,6 16,10 C18,6 21,3.5 24,5 C30,8 28,18 16,28 Z" fill="#444"/>';
  else if (shape === 'diamond')  s += '<polygon points="16,2 30,16 16,30 2,16" fill="#444"/>';
  else if (shape === 'cross')    s += '<path d="M11,3 L21,3 L21,11 L29,11 L29,21 L21,21 L21,29 L11,29 L11,21 L3,21 L3,11 L11,11 Z" fill="#444"/>';
  return s + '</svg>';
}

function buildDominoNumberSvg(value) {
  var dots = DOMINO_DICE_DOTS[value] || [];
  var s = '<svg viewBox="0 0 32 32" style="width:26px;height:26px;">';
  dots.forEach(function(d) { s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="4" fill="#333"/>'; });
  return s + '</svg>';
}

var DOMINO_STATIC_MATCH_TYPES_CORE = { colours: true, shapes: true, numbers: true };

function getDominoMatchTypes(allEntries) {
  var tagTypes = getAvailableTags(allEntries).map(function(tag) {
    return { value: tag, label: tag.charAt(0).toUpperCase() + tag.slice(1) };
  });
  return [
    { value: 'colours', label: 'Colours' },
    { value: 'shapes',  label: 'Shapes' },
    { value: 'numbers', label: 'Numbers' }
  ].concat(tagTypes);
}

if (typeof module !== 'undefined') module.exports = {
  generateTiles,
  dealHands,
  validatePlacement,
  playerHasValidPlacement,
  checkCompletion,
  createInitialBoard,
  createDominoGame,
  advanceTurn,
  placeTile,
  drawTile,
  getPreviewPlacement,
  getDominoMatchTypes,
  DOMINO_VALUES,
  DOMINO_STATIC_MATCH_TYPES_CORE,
  ROTATION_GEOMETRY,
  NEXT_ROTATION,
  findNextPreviewRotation,
  buildDominoShapeSvg,
  buildDominoNumberSvg
};
