import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { cardGameShuffle, cardGameCreateGame, cardGameFlipCard, cardGameResolveFlip } = require('../../core/card-game/card-game-engine.js')

const PLAYERS = [{ id: 'p0', name: 'Alice', icon: 'cat', role: 'child' }, { id: 'p1', name: 'Bob', icon: 'dog', role: 'adult' }]

function makeCards(ids) {
  return ids.map(function(id) { return { contentId: id, state: 'hidden' }; })
}

function makeState(overrides) {
  return Object.assign({
    phase: 'waiting',
    cards: makeCards(['a','b','c','d']),
    players: PLAYERS,
    turnIndex: 0,
    flipped: [],
    gridSize: 16
  }, overrides)
}

const stubRules = {
  flipsPerTurn: 2,
  evaluate: function(state, events) {
    events.push({ type: 'stub_eval' })
    return { state: Object.assign({}, state, { phase: 'resolving' }), events: events }
  }
}

import { describe, test, expect } from 'vitest'

describe('cardGameShuffle', function() {
  test('returns same length array', function() {
    var arr = [1,2,3,4,5]
    expect(cardGameShuffle(arr).length).toBe(5)
  })
  test('does not mutate original', function() {
    var arr = [1,2,3]
    cardGameShuffle(arr)
    expect(arr).toEqual([1,2,3])
  })
  test('contains same elements', function() {
    var arr = ['a','b','c','d']
    var result = cardGameShuffle(arr)
    expect(result.sort()).toEqual(['a','b','c','d'])
  })
})

describe('cardGameCreateGame', function() {
  test('creates correct structure', function() {
    var game = cardGameCreateGame(PLAYERS, 16, function() { return makeCards(['a','b']); }, function() { return { pairs: [] }; })
    expect(game.phase).toBe('waiting')
    expect(game.turnIndex).toBe(0)
    expect(game.flipped).toEqual([])
    expect(game.gridSize).toBe(16)
  })
  test('maps players with extra fields', function() {
    var game = cardGameCreateGame(PLAYERS, 16, function() { return []; }, function() { return { pairs: [] }; })
    expect(game.players[0].id).toBe('p0')
    expect(game.players[0].pairs).toEqual([])
  })
  test('uses default extra when not provided', function() {
    var game = cardGameCreateGame(PLAYERS, 16, function() { return []; })
    expect(game.players[0].id).toBe('p0')
  })
})

describe('cardGameFlipCard', function() {
  test('rejects flip when phase resolving', function() {
    var state = makeState({ phase: 'resolving' })
    var result = cardGameFlipCard(state, 0, stubRules)
    expect(result.events[0].type).toBe('invalid_action')
    expect(result.events[0].data.reason).toBe('locked')
  })
  test('rejects flip when phase complete', function() {
    var state = makeState({ phase: 'complete' })
    var result = cardGameFlipCard(state, 0, stubRules)
    expect(result.events[0].type).toBe('invalid_action')
  })
  test('rejects flip of non-hidden card', function() {
    var state = makeState({ cards: [{ contentId: 'a', state: 'revealed' }, { contentId: 'b', state: 'hidden' }] })
    var result = cardGameFlipCard(state, 0, stubRules)
    expect(result.events[0].data.reason).toBe('already_visible')
  })
  test('emits card_reveal on first flip', function() {
    var state = makeState()
    var result = cardGameFlipCard(state, 0, stubRules)
    expect(result.events[0].type).toBe('card_reveal')
    expect(result.events[0].data.cardIndex).toBe(0)
  })
  test('card moves to revealed state after flip', function() {
    var state = makeState()
    var result = cardGameFlipCard(state, 0, stubRules)
    expect(result.state.cards[0].state).toBe('revealed')
  })
  test('calls rules.evaluate when flipsPerTurn reached', function() {
    var state = makeState({ flipped: [1] })
    var result = cardGameFlipCard(state, 0, stubRules)
    expect(result.events.some(function(e) { return e.type === 'stub_eval'; })).toBe(true)
  })
  test('does not call evaluate before flipsPerTurn reached', function() {
    var state = makeState()
    var result = cardGameFlipCard(state, 0, stubRules)
    expect(result.events.some(function(e) { return e.type === 'stub_eval'; })).toBe(false)
  })
})

describe('cardGameResolveFlip', function() {
  test('no-op when not resolving', function() {
    var state = makeState()
    var result = cardGameResolveFlip(state)
    expect(result.events).toEqual([])
    expect(result.state).toBe(state)
  })
  test('hides flipped cards', function() {
    var state = makeState({
      phase: 'resolving',
      cards: [{ contentId: 'a', state: 'revealed' }, { contentId: 'b', state: 'revealed' }, { contentId: 'c', state: 'hidden' }],
      flipped: [0, 1]
    })
    var result = cardGameResolveFlip(state)
    expect(result.state.cards[0].state).toBe('hidden')
    expect(result.state.cards[1].state).toBe('hidden')
    expect(result.state.cards[2].state).toBe('hidden')
  })
  test('advances turn index', function() {
    var state = makeState({ phase: 'resolving', flipped: [0] })
    var result = cardGameResolveFlip(state)
    expect(result.state.turnIndex).toBe(1)
  })
  test('wraps turn index', function() {
    var state = makeState({ phase: 'resolving', flipped: [0], turnIndex: 1 })
    var result = cardGameResolveFlip(state)
    expect(result.state.turnIndex).toBe(0)
  })
  test('emits turn_start event', function() {
    var state = makeState({ phase: 'resolving', flipped: [0] })
    var result = cardGameResolveFlip(state)
    expect(result.events[0].type).toBe('turn_start')
  })
  test('resets flipped to empty', function() {
    var state = makeState({ phase: 'resolving', flipped: [0, 1] })
    var result = cardGameResolveFlip(state)
    expect(result.state.flipped).toEqual([])
  })
})
