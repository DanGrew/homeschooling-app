var DOMINO_VALUES = {
  colours: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'],
  shapes:  ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'cross'],
  icons:   ['cat', 'dog', 'bird', 'fish', 'rabbit', 'bear', 'frog'],
  numbers: ['0', '1', '2', '3', '4', '5', '6']
};

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

function validatePlacement(tile, endpoint) {
  if (tile.left === endpoint) return { valid: true, orientation: 'horizontal' };
  if (tile.right === endpoint) return { valid: true, orientation: 'vertical' };
  return { valid: false, orientation: null };
}

function playerHasValidPlacement(hand, endpoints) {
  for (var i = 0; i < hand.length; i++) {
    for (var e = 0; e < endpoints.length; e++) {
      if (validatePlacement(hand[i], endpoints[e]).valid) return true;
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
    var endpoints = [startingTile.left, startingTile.right];

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
  var endpointValues = state.board.endpoints.map(function(ep) { return ep.value; });
  return state.players.every(function(p) {
    return !playerHasValidPlacement(state.hands[p.id], endpointValues);
  });
}

function createInitialBoard(startingTile) {
  return {
    tiles: [{ tile: startingTile, col: 0, row: 0, flipped: false }],
    endpoints: [
      { value: startingTile.left,  col: -1, row: 0, side: 'left' },
      { value: startingTile.right, col:  2, row: 0, side: 'right' }
    ]
  };
}

function advanceTurn(state) {
  state.turnIndex = (state.turnIndex + 1) % state.players.length;
  if (checkCompletion(state)) state.phase = 'complete';
}

function placeTile(state, tileId, endpointIndex) {
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

  var result = validatePlacement(tile, endpoint.value);
  if (!result.valid) return { success: false };

  var isRight = endpoint.side === 'right';
  var placedCol = isRight ? endpoint.col : endpoint.col - 1;
  var newEndpointCol = isRight ? endpoint.col + 2 : endpoint.col - 2;
  var flipped = isRight ? result.orientation === 'vertical' : result.orientation === 'horizontal';
  var newValue = tile.left === endpoint.value ? tile.right : tile.left;

  state.board.tiles.push({ tile: tile, col: placedCol, row: 0, flipped: flipped });
  state.stats[player.id].tilesPlaced += 1;

  var newEndpoints = [];
  for (var e = 0; e < state.board.endpoints.length; e++) {
    if (e === endpointIndex) {
      newEndpoints.push({ value: newValue, col: newEndpointCol, row: 0, side: endpoint.side });
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

function getPreviewPlacement(state, tileId, endpointIndex) {
  var player = state.players[state.turnIndex];
  var hand = state.hands[player.id];
  var tile = null;
  for (var i = 0; i < hand.length; i++) {
    if (hand[i].id === tileId) { tile = hand[i]; break; }
  }
  if (!tile) return null;
  var endpoint = state.board.endpoints[endpointIndex];
  if (!endpoint) return null;
  var result = validatePlacement(tile, endpoint.value);
  var isRight = endpoint.side === 'right';
  var placedCol = isRight ? endpoint.col : endpoint.col - 1;
  var flipped = result.valid
    ? (isRight ? result.orientation === 'vertical' : result.orientation === 'horizontal')
    : false;
  return { tile: tile, col: placedCol, row: 0, flipped: flipped };
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
  checkCompletion,
  createInitialBoard,
  createDominoGame,
  advanceTurn,
  placeTile,
  drawTile,
  getPreviewPlacement,
  DOMINO_VALUES
};
