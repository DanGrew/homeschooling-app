if (typeof module !== 'undefined') {
  var _cge = require('../card-game/card-game-engine.js');
  var cardGameShuffle    = _cge.cardGameShuffle;
  var cardGameCreateGame = _cge.cardGameCreateGame;
  var cardGameFlipCard   = _cge.cardGameFlipCard;
  var cardGameResolveFlip = _cge.cardGameResolveFlip;
}

var SHOPPING_GRID_SIZES = [16, 25, 36, 49, 64];

function shoppingListSize(gridSize, playerCount) {
  return Math.min(10, Math.floor(gridSize / (playerCount + 1)));
}

function shoppingGridCols(gridSize) {
  return Math.round(Math.sqrt(gridSize));
}

var shoppingRules = {
  flipsPerTurn: 1,
  evaluate: function(state, events) {
    var cardIndex = state.flipped[0];
    var revealedId = state.cards[cardIndex].contentId;
    var currentPlayer = state.players[state.turnIndex];
    var isOnList = currentPlayer.list.indexOf(revealedId) !== -1;
    var alreadyFound = currentPlayer.found.indexOf(revealedId) !== -1;

    if (isOnList && !alreadyFound) {
      var foundCards = state.cards.map(function(c, i) {
        return i === cardIndex ? { contentId: c.contentId, state: 'found' } : c;
      });
      var newPlayers = state.players.map(function(p, i) {
        return i === state.turnIndex
          ? Object.assign({}, p, { found: p.found.concat([revealedId]) })
          : p;
      });
      var allComplete = newPlayers.every(function(p) { return p.found.length === p.list.length; });

      var n = newPlayers.length;
      var rotated = newPlayers.map(function(_, i) { return (state.turnIndex + 1 + i) % n; });
      var nextTurnIndex = rotated.filter(function(i) { return newPlayers[i].found.length < newPlayers[i].list.length; }).concat([(state.turnIndex + 1) % n])[0];

      events.push({ type: 'item_found', data: { contentId: revealedId, playerId: currentPlayer.id, cardIndex: cardIndex } });
      events.push({ type: 'tray_update', data: { playerId: currentPlayer.id, contentId: revealedId } });

      var nextState = Object.assign({}, state, {
        cards: foundCards,
        players: newPlayers,
        flipped: [],
        turnIndex: nextTurnIndex,
        phase: allComplete ? 'complete' : 'waiting'
      });

      if (allComplete) {
        events.push({ type: 'game_complete' });
      } else {
        events.push({ type: 'turn_start', data: { playerId: state.players[nextTurnIndex].id } });
      }

      return { state: nextState, events: events };
    }

    events.push({ type: 'not_found', data: { contentId: revealedId, cardIndex: cardIndex } });
    return {
      state: Object.assign({}, state, { phase: 'resolving' }),
      events: events
    };
  }
};

function createShoppingGame(players, gridSize, contentSet) {
  var listSize = shoppingListSize(gridSize, players.length);
  var seen = {};
  var uniqueIds = contentSet.filter(function(id) {
    return seen[id] ? false : (seen[id] = true);
  });
  var safeListSize = Math.max(1, Math.min(listSize, Math.floor(uniqueIds.length / players.length)));
  var shuffledForLists = cardGameShuffle(uniqueIds);

  return cardGameCreateGame(players, gridSize,
    function() {
      return cardGameShuffle(contentSet.map(function(id) { return { contentId: id, state: 'hidden' }; }));
    },
    function(p, i) {
      return {
        list: shuffledForLists.slice(i * safeListSize, (i + 1) * safeListSize),
        found: []
      };
    }
  );
}

function flipShoppingCard(state, cardIndex) {
  return cardGameFlipCard(state, cardIndex, shoppingRules);
}

function resolveShoppingFlip(state) {
  return cardGameResolveFlip(state);
}

function getShoppingScores(state) {
  return state.players.map(function(p) {
    return { id: p.id, name: p.name, icon: p.icon, found: p.found.length, total: p.list.length };
  });
}

if (typeof module !== 'undefined') module.exports = {
  SHOPPING_GRID_SIZES, shoppingListSize, shoppingGridCols,
  createShoppingGame, flipShoppingCard, resolveShoppingFlip, getShoppingScores
};
