import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { GRID_SIZES, GRID_PAIRS, createDeck, createGame, flipCard, resolveFlip, getPairCounts } = require('../../../core/pairs/pairs-core.js');

const TWO_PLAYERS = [{ id: 'p0', name: 'Alice' }, { id: 'p1', name: 'Bob' }];

function game(contentSet, players) {
  return createGame(players || TWO_PLAYERS, 16, contentSet || ['apple', 'banana']);
}

function matchingPair(state) {
  var id = state.cards[0].contentId;
  var first = 0;
  var second = state.cards.findIndex(function(c, i) { return i > 0 && c.contentId === id; });
  return [first, second];
}

function mismatchedPair(state) {
  var first = state.cards.findIndex(function(c) { return c.contentId === 'apple'; });
  var second = state.cards.findIndex(function(c) { return c.contentId === 'banana'; });
  return [first, second];
}

describe('GRID_SIZES', () => {
  it('includes 16, 36, 64', () => {
    expect(GRID_SIZES).toContain(16);
    expect(GRID_SIZES).toContain(36);
    expect(GRID_SIZES).toContain(64);
  });
});

describe('GRID_PAIRS', () => {
  it('maps grid sizes to pair counts', () => {
    expect(GRID_PAIRS[16]).toBe(8);
    expect(GRID_PAIRS[36]).toBe(18);
    expect(GRID_PAIRS[64]).toBe(32);
  });
});

describe('createDeck', () => {
  it('creates two cards per content ID', () => {
    const deck = createDeck(['cat', 'dog']);
    const counts = {};
    deck.forEach(function(c) { counts[c.contentId] = (counts[c.contentId] || 0) + 1; });
    expect(counts['cat']).toBe(2);
    expect(counts['dog']).toBe(2);
  });

  it('all cards start hidden', () => {
    createDeck(['cat']).forEach(function(c) { expect(c.state).toBe('hidden'); });
  });
});

describe('createGame', () => {
  it('creates correct number of cards for content set', () => {
    expect(game(['apple', 'banana']).cards).toHaveLength(4);
  });

  it('starts with phase waiting', () => {
    expect(game().phase).toBe('waiting');
  });

  it('starts with player 0 active', () => {
    expect(game().turnIndex).toBe(0);
  });

  it('all cards hidden initially', () => {
    game().cards.forEach(function(c) { expect(c.state).toBe('hidden'); });
  });

  it('uses default player names when not provided', () => {
    const state = createGame([{}], 16, ['apple']);
    expect(state.players[0].name).toBe('Player 1');
  });

  it('uses default player IDs when not provided', () => {
    const state = createGame([{}], 16, ['apple']);
    expect(state.players[0].id).toBe('player-0');
  });

  it('players start with empty pairs', () => {
    game().players.forEach(function(p) { expect(p.pairs).toHaveLength(0); });
  });
});

describe('flipCard — first flip', () => {
  it('reveals the card', () => {
    const s = game();
    expect(flipCard(s, 0).state.cards[0].state).toBe('revealed');
  });

  it('emits card_reveal with cardIndex', () => {
    const { events } = flipCard(game(), 0);
    expect(events[0]).toEqual({ type: 'card_reveal', data: { cardIndex: 0 } });
  });

  it('phase becomes one_flipped', () => {
    expect(flipCard(game(), 0).state.phase).toBe('one_flipped');
  });

  it('adds index to flipped array', () => {
    expect(flipCard(game(), 0).state.flipped).toEqual([0]);
  });
});

describe('flipCard — invalid actions', () => {
  it('ignores tap when phase is resolving', () => {
    const s = Object.assign({}, game(), { phase: 'resolving' });
    expect(flipCard(s, 0).events[0].type).toBe('invalid_action');
    expect(flipCard(s, 0).state).toBe(s);
  });

  it('ignores tap when phase is complete', () => {
    const s = Object.assign({}, game(), { phase: 'complete' });
    expect(flipCard(s, 0).events[0].type).toBe('invalid_action');
  });

  it('ignores tap on revealed card', () => {
    const s1 = flipCard(game(), 0).state;
    expect(flipCard(s1, 0).events[0].type).toBe('invalid_action');
  });

  it('ignores tap on matched card', () => {
    const base = game();
    const s = Object.assign({}, base, {
      cards: base.cards.map(function(c, i) { return i === 0 ? Object.assign({}, c, { state: 'matched' }) : c; })
    });
    expect(flipCard(s, 0).events[0].type).toBe('invalid_action');
  });

  it('does not mutate state on invalid action', () => {
    const s = Object.assign({}, game(), { phase: 'resolving' });
    expect(flipCard(s, 0).state).toBe(s);
  });
});

describe('flipCard — match', () => {
  it('both cards become matched', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    const s2 = flipCard(s, first).state;
    const s3 = flipCard(s2, second).state;
    expect(s3.cards[first].state).toBe('matched');
    expect(s3.cards[second].state).toBe('matched');
  });

  it('emits match_success with contentId, playerId, cardIndices', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    const { events } = flipCard(flipCard(s, first).state, second);
    const ev = events.find(function(e) { return e.type === 'match_success'; });
    expect(ev).toBeDefined();
    expect(ev.data.contentId).toBe('apple');
    expect(ev.data.playerId).toBe('p0');
    expect(ev.data.cardIndices).toEqual([first, second]);
  });

  it('emits tray_update', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    const { events } = flipCard(flipCard(s, first).state, second);
    expect(events.map(function(e) { return e.type; })).toContain('tray_update');
  });

  it('adds pair to current player', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    const s3 = flipCard(flipCard(s, first).state, second).state;
    expect(s3.players[0].pairs).toContain('apple');
  });

  it('advances turn after match', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    const s3 = flipCard(flipCard(s, first).state, second).state;
    expect(s3.turnIndex).toBe(1);
  });

  it('clears flipped after match', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    expect(flipCard(flipCard(s, first).state, second).state.flipped).toEqual([]);
  });

  it('phase becomes complete when all cards matched', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    expect(flipCard(flipCard(s, first).state, second).state.phase).toBe('complete');
  });

  it('emits game_complete when all matched', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    const { events } = flipCard(flipCard(s, first).state, second);
    expect(events.map(function(e) { return e.type; })).toContain('game_complete');
  });

  it('phase stays waiting when pairs remain', () => {
    const s = game(['apple', 'banana']);
    const [first, second] = matchingPair(s);
    expect(flipCard(flipCard(s, first).state, second).state.phase).toBe('waiting');
  });

  it('emits turn_start when game continues', () => {
    const s = game(['apple', 'banana']);
    const [first, second] = matchingPair(s);
    const { events } = flipCard(flipCard(s, first).state, second);
    expect(events.map(function(e) { return e.type; })).toContain('turn_start');
  });
});

describe('flipCard — mismatch', () => {
  it('emits match_fail with contentIds and cardIndices', () => {
    const s = game();
    const [first, second] = mismatchedPair(s);
    const { events } = flipCard(flipCard(s, first).state, second);
    const ev = events.find(function(e) { return e.type === 'match_fail'; });
    expect(ev).toBeDefined();
    expect(ev.data.cardIndices).toEqual([first, second]);
  });

  it('phase becomes resolving on mismatch', () => {
    const s = game();
    const [first, second] = mismatchedPair(s);
    expect(flipCard(flipCard(s, first).state, second).state.phase).toBe('resolving');
  });

  it('mismatched cards remain revealed during resolving', () => {
    const s = game();
    const [first, second] = mismatchedPair(s);
    const s3 = flipCard(flipCard(s, first).state, second).state;
    expect(s3.cards[first].state).toBe('revealed');
    expect(s3.cards[second].state).toBe('revealed');
  });
});

describe('resolveFlip', () => {
  function getResolvingState() {
    const s = game();
    const [first, second] = mismatchedPair(s);
    return { state: flipCard(flipCard(s, first).state, second).state, first, second };
  }

  it('flips revealed cards back to hidden', () => {
    const { state, first, second } = getResolvingState();
    const resolved = resolveFlip(state).state;
    expect(resolved.cards[first].state).toBe('hidden');
    expect(resolved.cards[second].state).toBe('hidden');
  });

  it('advances turn', () => {
    const { state } = getResolvingState();
    expect(resolveFlip(state).state.turnIndex).toBe(1);
  });

  it('phase becomes waiting', () => {
    const { state } = getResolvingState();
    expect(resolveFlip(state).state.phase).toBe('waiting');
  });

  it('clears flipped array', () => {
    const { state } = getResolvingState();
    expect(resolveFlip(state).state.flipped).toEqual([]);
  });

  it('emits turn_start', () => {
    const { state } = getResolvingState();
    expect(resolveFlip(state).events[0].type).toBe('turn_start');
  });

  it('no-ops when not in resolving phase', () => {
    const s = game();
    const result = resolveFlip(s);
    expect(result.state).toBe(s);
    expect(result.events).toHaveLength(0);
  });

  it('turn_start event has next player ID', () => {
    const { state } = getResolvingState();
    expect(resolveFlip(state).events[0].data.playerId).toBe('p1');
  });

  it('wraps turn index for 3 players', () => {
    const players3 = [{ id: 'p0' }, { id: 'p1' }, { id: 'p2' }];
    const s = createGame(players3, 16, ['apple', 'banana']);
    const [first, second] = mismatchedPair(s);
    const resolving = flipCard(flipCard(s, first).state, second).state;
    const s2 = resolveFlip(resolving).state;
    const s3 = resolveFlip(Object.assign({}, s2, { phase: 'resolving', flipped: [first, second] })).state;
    const s4 = resolveFlip(Object.assign({}, s3, { phase: 'resolving', flipped: [first, second] })).state;
    expect(s4.turnIndex).toBe(0);
  });
});

describe('getPairCounts', () => {
  it('returns 0 pairs initially', () => {
    getPairCounts(game()).forEach(function(c) { expect(c.count).toBe(0); });
  });

  it('reflects matched pairs', () => {
    const s = game(['apple']);
    const [first, second] = matchingPair(s);
    const s3 = flipCard(flipCard(s, first).state, second).state;
    expect(getPairCounts(s3)[0].count).toBe(1);
    expect(getPairCounts(s3)[1].count).toBe(0);
  });

  it('includes player name and icon', () => {
    const counts = getPairCounts(game());
    expect(counts[0].name).toBe('Alice');
    expect(counts[0].id).toBe('p0');
  });
});
