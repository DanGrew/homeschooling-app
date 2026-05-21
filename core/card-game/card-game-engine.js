function cardGameShuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function cardGameCreateGame(players, gridSize, buildDeck, initPlayerExtra) {
  var extra = initPlayerExtra || function() { return {}; };
  return {
    phase: 'waiting',
    cards: buildDeck(),
    players: players.map(function(p, i) {
      return Object.assign({
        id: p.id || ('player-' + i),
        name: p.name || ('Player ' + (i + 1)),
        icon: p.icon || null,
        role: p.role || null
      }, extra(p, i, players));
    }),
    turnIndex: 0,
    flipped: [],
    gridSize: gridSize
  };
}

function cardGameFlipCard(state, cardIndex, rules) {
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

  if (newFlipped.length < rules.flipsPerTurn) {
    return {
      state: Object.assign({}, state, { cards: newCards, flipped: newFlipped, phase: 'one_flipped' }),
      events: events
    };
  }

  return rules.evaluate(Object.assign({}, state, { cards: newCards, flipped: newFlipped }), events);
}

function cardGameResolveFlip(state) {
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

function cgGameLayoutKey(state, mode) {
  var countMap = { 1: '1p' };
  var modeIs2p = state.players.length === 2;
  var keyMap = { passplay: 'passplay', 'true': '2p', 'false': '3p' };
  return [countMap[state.players.length]].filter(Boolean)
    .concat([[keyMap[mode]].filter(Boolean).concat([keyMap[String(modeIs2p)]])[0]])[0];
}

if (typeof module !== 'undefined') module.exports = { cardGameShuffle, cardGameCreateGame, cardGameFlipCard, cardGameResolveFlip, cgGameLayoutKey };
