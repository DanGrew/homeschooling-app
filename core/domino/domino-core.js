var DOMINO_VALUES = {
  colours: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'],
  shapes:  ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'cross'],
  icons:   ['cat', 'dog', 'bird', 'fish', 'rabbit', 'bear', 'frog'],
  numbers: ['0', '1', '2', '3', '4', '5', '6']
};

var ROTATION_GEOMETRY = {
  0:   { colOff: 0,  rowOff: 0,  epColOff: 2,  epRowOff: 0,  epDir: 'east',  blockDir: 'west',  anchorLeft: true  },
  90:  { colOff: 0,  rowOff: 0,  epColOff: 0,  epRowOff: 2,  epDir: 'south', blockDir: 'north', anchorLeft: true  },
  180: { colOff: -1, rowOff: 0,  epColOff: -2, epRowOff: 0,  epDir: 'west',  blockDir: 'east',  anchorLeft: false },
  270: { colOff: 0,  rowOff: -1, epColOff: 0,  epRowOff: -2, epDir: 'north', blockDir: 'south', anchorLeft: false }
};

var OPPOSITE_DIR = { east: 'west', west: 'east', north: 'south', south: 'north' };

function dominoShuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function generateTiles(matchType) {
  var values = DOMINO_VALUES[matchType];
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

function validatePlacement(tile, endpoint, rotation) {
  var geom = ROTATION_GEOMETRY[rotation === undefined ? 0 : rotation];
  if (OPPOSITE_DIR[geom.blockDir] !== endpoint.direction) return { valid: false };
  var connectValue = geom.anchorLeft ? tile.left : tile.right;
  return { valid: connectValue === endpoint.value };
}

function playerHasValidPlacement(hand, endpoints) {
  var rotations = [0, 90, 180, 270];
  for (var i = 0; i < hand.length; i++) {
    for (var e = 0; e < endpoints.length; e++) {
      for (var r = 0; r < rotations.length; r++) {
        if (validatePlacement(hand[i], endpoints[e], rotations[r]).valid) return true;
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
    return !playerHasValidPlacement(state.hands[p.id], state.board.endpoints);
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
  state.turnIndex = (state.turnIndex + 1) % state.players.length;
  if (checkCompletion(state)) state.phase = 'complete';
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

  var result = validatePlacement(tile, endpoint, rot);
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
  var rot = rotation !== undefined ? rotation : ([0, 90, 180, 270].find(function(r) {
    return validatePlacement(tile, endpoint, r).valid;
  }) || 0);
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
  var tiles = generateTiles(setupState.matchType);
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
  DOMINO_VALUES,
  ROTATION_GEOMETRY
};
