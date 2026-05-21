if (typeof module !== 'undefined') {
  var _cge = require('../card-game/card-game-engine.js');
  var cardGameShuffle     = _cge.cardGameShuffle;
  var cardGameCreateGame  = _cge.cardGameCreateGame;
  var cardGameFlipCard    = _cge.cardGameFlipCard;
  var cardGameResolveFlip = _cge.cardGameResolveFlip;
}

var GRID_SIZES = [16, 36, 64];
var GRID_PAIRS = { 16: 8, 36: 18, 64: 32 };

var pairsRules = {
  flipsPerTurn: 2,
  evaluate: function(state, events) {
    var newFlipped = state.flipped;
    var idx0 = newFlipped[0], idx1 = newFlipped[1];
    var id0 = state.cards[idx0].contentId, id1 = state.cards[idx1].contentId;
    var currentPlayer = state.players[state.turnIndex];
    var nextTurnIndex = (state.turnIndex + 1) % state.players.length;

    if (id0 === id1) {
      var matchedCards = state.cards.map(function(c, i) {
        return (i === idx0 || i === idx1) ? { contentId: c.contentId, state: 'matched' } : c;
      });
      var newPlayers = state.players.map(function(p, i) {
        return i === state.turnIndex ? Object.assign({}, p, { pairs: p.pairs.concat([id0]) }) : p;
      });
      var allMatched = matchedCards.every(function(c) { return c.state === 'matched'; });

      events.push({ type: 'match_success', data: { contentId: id0, playerId: currentPlayer.id, cardIndices: [idx0, idx1] } });
      events.push({ type: 'tray_update', data: { playerId: currentPlayer.id, contentId: id0 } });

      var nextState = Object.assign({}, state, {
        cards: matchedCards,
        players: newPlayers,
        flipped: [],
        turnIndex: nextTurnIndex,
        phase: allMatched ? 'complete' : 'waiting'
      });

      if (allMatched) {
        events.push({ type: 'game_complete' });
      } else {
        events.push({ type: 'turn_start', data: { playerId: state.players[nextTurnIndex].id } });
      }

      return { state: nextState, events: events };
    }

    events.push({ type: 'match_fail', data: { contentIds: [id0, id1], cardIndices: [idx0, idx1] } });
    return {
      state: Object.assign({}, state, { phase: 'resolving' }),
      events: events
    };
  }
};

function createDeck(contentSet) {
  var cards = [];
  contentSet.forEach(function(id) {
    cards.push({ contentId: id, state: 'hidden' });
    cards.push({ contentId: id, state: 'hidden' });
  });
  return cardGameShuffle(cards);
}

function createGame(players, gridSize, contentSet) {
  return cardGameCreateGame(players, gridSize,
    function() { return createDeck(contentSet); },
    function() { return { pairs: [] }; }
  );
}

function flipCard(state, cardIndex) {
  return cardGameFlipCard(state, cardIndex, pairsRules);
}

function resolveFlip(state) {
  return cardGameResolveFlip(state);
}

function getPairCounts(state) {
  return state.players.map(function(p) {
    return { id: p.id, name: p.name, icon: p.icon, count: p.pairs.length };
  });
}

if (typeof module !== 'undefined') module.exports = { GRID_SIZES, GRID_PAIRS, createDeck, createGame, flipCard, resolveFlip, getPairCounts };
