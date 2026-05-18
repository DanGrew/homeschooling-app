var GRID_SIZES = [16, 36, 64];
var GRID_PAIRS = { 16: 8, 36: 18, 64: 32 };

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function createDeck(contentSet) {
  var cards = [];
  contentSet.forEach(function(id) {
    cards.push({ contentId: id, state: 'hidden' });
    cards.push({ contentId: id, state: 'hidden' });
  });
  return shuffle(cards);
}

function createGame(players, gridSize, contentSet) {
  return {
    phase: 'waiting',
    cards: createDeck(contentSet),
    players: players.map(function(p, i) {
      return {
        id: p.id || ('player-' + i),
        name: p.name || ('Player ' + (i + 1)),
        icon: p.icon || null,
        role: p.role || null,
        pairs: []
      };
    }),
    turnIndex: 0,
    flipped: [],
    gridSize: gridSize
  };
}

function flipCard(state, cardIndex) {
  var card = state.cards[cardIndex];

  if (state.phase === 'resolving' || state.phase === 'complete') {
    return { state: state, events: [{ type: 'invalid_action', data: { reason: 'locked' } }] };
  }
  if (card.state !== 'hidden') {
    return { state: state, events: [{ type: 'invalid_action', data: { reason: 'already_visible' } }] };
  }
  if (state.flipped.indexOf(cardIndex) !== -1) {
    return { state: state, events: [{ type: 'invalid_action', data: { reason: 'same_card' } }] };
  }

  var newCards = state.cards.map(function(c, i) {
    return i === cardIndex ? { contentId: c.contentId, state: 'revealed' } : c;
  });
  var newFlipped = state.flipped.concat([cardIndex]);
  var events = [{ type: 'card_reveal', data: { cardIndex: cardIndex } }];

  if (newFlipped.length === 1) {
    return {
      state: Object.assign({}, state, { cards: newCards, flipped: newFlipped, phase: 'one_flipped' }),
      events: events
    };
  }

  var idx0 = newFlipped[0], idx1 = newFlipped[1];
  var id0 = newCards[idx0].contentId, id1 = newCards[idx1].contentId;
  var currentPlayer = state.players[state.turnIndex];
  var nextTurnIndex = (state.turnIndex + 1) % state.players.length;

  if (id0 === id1) {
    var matchedCards = newCards.map(function(c, i) {
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
    state: Object.assign({}, state, { cards: newCards, flipped: newFlipped, phase: 'resolving' }),
    events: events
  };
}

function resolveFlip(state) {
  if (state.phase !== 'resolving') return { state: state, events: [] };
  var newCards = state.cards.map(function(c, i) {
    return state.flipped.indexOf(i) !== -1 ? { contentId: c.contentId, state: 'hidden' } : c;
  });
  var nextTurnIndex = (state.turnIndex + 1) % state.players.length;
  return {
    state: Object.assign({}, state, { cards: newCards, flipped: [], turnIndex: nextTurnIndex, phase: 'waiting' }),
    events: [{ type: 'turn_start', data: { playerId: state.players[nextTurnIndex].id } }]
  };
}

function getPairCounts(state) {
  return state.players.map(function(p) {
    return { id: p.id, name: p.name, icon: p.icon, count: p.pairs.length };
  });
}

if (typeof module !== 'undefined') module.exports = { GRID_SIZES, GRID_PAIRS, createDeck, createGame, flipCard, resolveFlip, getPairCounts };
