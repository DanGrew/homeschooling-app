import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { SHOPPING_GRID_SIZES, shoppingListSize, shoppingGridCols, createShoppingGame, flipShoppingCard, resolveShoppingFlip, getShoppingScores, shoppingNextTurn } = require('../../../core/shopping-game/shopping-game-core.js')

const CONTENT = ['apple','banana','carrot','date','egg','fig','grape','honey','ice','jam','kale','lime']

describe('SHOPPING_GRID_SIZES', () => {
  it('is a non-empty array of numbers', () => {
    expect(Array.isArray(SHOPPING_GRID_SIZES)).toBe(true)
    expect(SHOPPING_GRID_SIZES.length).toBeGreaterThan(0)
    SHOPPING_GRID_SIZES.forEach(n => expect(typeof n).toBe('number'))
  })
})

describe('shoppingListSize', () => {
  it('does not exceed 10', () => {
    expect(shoppingListSize(64, 1)).toBeLessThanOrEqual(10)
  })
  it('is smaller with more players', () => {
    expect(shoppingListSize(36, 3)).toBeLessThanOrEqual(shoppingListSize(36, 1))
  })
  it('divides the grid by playerCount + 1, floored (pins the exact formula)', () => {
    expect(shoppingListSize(9, 2)).toBe(3)
  })
})

describe('shoppingGridCols', () => {
  it('returns 4 for grid 16', () => { expect(shoppingGridCols(16)).toBe(4) })
  it('returns 5 for grid 25', () => { expect(shoppingGridCols(25)).toBe(5) })
  it('returns 6 for grid 36', () => { expect(shoppingGridCols(36)).toBe(6) })
  it('returns 7 for grid 49', () => { expect(shoppingGridCols(49)).toBe(7) })
  it('returns 8 for grid 64', () => { expect(shoppingGridCols(64)).toBe(8) })
})

describe('createShoppingGame', () => {
  const players = [{id:'p1',name:'Alice'},{id:'p2',name:'Bob'}]

  it('creates a game with correct player count', () => {
    const g = createShoppingGame(players, 16, CONTENT)
    expect(g.players.length).toBe(2)
  })
  it('each player has a list and found array', () => {
    const g = createShoppingGame(players, 16, CONTENT)
    g.players.forEach(p => {
      expect(Array.isArray(p.list)).toBe(true)
      expect(Array.isArray(p.found)).toBe(true)
      expect(p.found).toEqual([])
    })
  })
  it('cards count matches content set size', () => {
    const g = createShoppingGame(players, 16, CONTENT)
    expect(g.cards.length).toBe(CONTENT.length)
  })
  it('starts in waiting phase', () => {
    expect(createShoppingGame(players, 16, CONTENT).phase).toBe('waiting')
  })
})

describe('createShoppingGame — list-size math', () => {
  it('dedupes the content set before building shopping lists', () => {
    const players = [{ id: 'p1' }, { id: 'p2' }]
    const contentSet = ['apple', 'apple', 'apple', 'apple', 'banana']
    const g = createShoppingGame(players, 16, contentSet)
    expect(g.players[0].list.length).toBe(1)
    expect(g.players[1].list.length).toBe(1)
  })

  it('safe list size is floor(unique/players) capped by listSize, not multiplied', () => {
    const players = [{ id: 'p1' }, { id: 'p2' }]
    const contentSet = ['a', 'b', 'c', 'd', 'e', 'f']
    const g = createShoppingGame(players, 64, contentSet)
    expect(g.players[0].list.length).toBe(3)
    expect(g.players[1].list.length).toBe(3)
    const allAssigned = g.players[0].list.concat(g.players[1].list)
    expect(new Set(allAssigned).size).toBe(6)
  })

  it('safe list size never drops below 1 even when unique items are scarce', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({ id: 'p' + i }))
    const contentSet = ['a', 'b']
    const g = createShoppingGame(players, 64, contentSet)
    expect(g.players[0].list.length).toBe(1)
  })

  it('list slices are contiguous and non-overlapping across three players', () => {
    const players = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]
    const contentSet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
    const g = createShoppingGame(players, 64, contentSet)
    const all = g.players.flatMap(p => p.list)
    expect(g.players.map(p => p.list.length)).toEqual([3, 3, 3])
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('flipShoppingCard + resolveShoppingFlip', () => {
  const players = [{id:'p1',name:'Alice'},{id:'p2',name:'Bob'}]

  it('emits card_reveal on valid flip', () => {
    const g = createShoppingGame(players, 16, CONTENT)
    const r = flipShoppingCard(g, 0)
    expect(r.events.some(e => e.type === 'card_reveal')).toBe(true)
  })

  it('resolveShoppingFlip advances turn', () => {
    const g = createShoppingGame(players, 16, CONTENT)
    const flipped = flipShoppingCard(g, 0)
    const resolved = resolveShoppingFlip(flipped.state)
    expect([0,1]).toContain(resolved.state.turnIndex)
  })
})

describe('shoppingRules.evaluate — found item, game continues', () => {
  it('pins exact events, cards, players, phase and turn on a mid-game find', () => {
    const state = {
      cards: [
        { contentId: 'apple', state: 'hidden' },
        { contentId: 'banana', state: 'hidden' }
      ],
      players: [
        { id: 'p1', name: 'Alice', list: ['cherry', 'apple'], found: [] },
        { id: 'p2', name: 'Bob', list: ['banana'], found: [] }
      ],
      turnIndex: 0,
      phase: 'waiting',
      flipped: []
    }
    const r = flipShoppingCard(state, 0)
    expect(r.state.cards).toEqual([
      { contentId: 'apple', state: 'found' },
      { contentId: 'banana', state: 'hidden' }
    ])
    expect(r.state.players[0].found).toEqual(['apple'])
    expect(r.state.players[1].found).toEqual([])
    expect(r.state.flipped).toEqual([])
    expect(r.state.turnIndex).toBe(1)
    expect(r.state.phase).toBe('waiting')
    expect(r.events).toEqual([
      { type: 'card_reveal', data: { cardIndex: 0 } },
      { type: 'item_found', data: { contentId: 'apple', playerId: 'p1', cardIndex: 0 } },
      { type: 'tray_update', data: { playerId: 'p1', contentId: 'apple' } },
      { type: 'turn_start', data: { playerId: 'p2' } }
    ])
  })
})

describe('shoppingRules.evaluate — one player finishing does not end the game for the rest', () => {
  it('requires every player complete, not just one (every, not some)', () => {
    const state = {
      cards: [{ contentId: 'apple', state: 'hidden' }],
      players: [
        { id: 'p1', name: 'Alice', list: ['apple'], found: [] },
        { id: 'p2', name: 'Bob', list: ['banana', 'fig'], found: ['banana'] }
      ],
      turnIndex: 0,
      phase: 'waiting',
      flipped: []
    }
    const r = flipShoppingCard(state, 0)
    expect(r.state.phase).toBe('waiting')
    expect(r.events.some(e => e.type === 'game_complete')).toBe(false)
    expect(r.events).toContainEqual({ type: 'turn_start', data: { playerId: 'p2' } })
  })
})

describe('shoppingRules.evaluate — found item completes the game', () => {
  it('ends the game instead of starting the next turn', () => {
    const state = {
      cards: [
        { contentId: 'apple', state: 'hidden' },
        { contentId: 'banana', state: 'found' }
      ],
      players: [
        { id: 'p1', name: 'Alice', list: ['apple'], found: [] },
        { id: 'p2', name: 'Bob', list: ['banana'], found: ['banana'] }
      ],
      turnIndex: 0,
      phase: 'waiting',
      flipped: []
    }
    const r = flipShoppingCard(state, 0)
    expect(r.state.phase).toBe('complete')
    expect(r.events).toContainEqual({ type: 'game_complete' })
    expect(r.events.some(e => e.type === 'turn_start')).toBe(false)
  })
})

describe('shoppingRules.evaluate — misses', () => {
  it('flipping an item already found this game is a miss, not a re-find', () => {
    const state = {
      cards: [{ contentId: 'apple', state: 'hidden' }],
      players: [
        { id: 'p1', name: 'Alice', list: ['apple'], found: ['apple'] },
        { id: 'p2', name: 'Bob', list: ['banana'], found: [] }
      ],
      turnIndex: 0,
      phase: 'waiting',
      flipped: []
    }
    const r = flipShoppingCard(state, 0)
    expect(r.events).toEqual([
      { type: 'card_reveal', data: { cardIndex: 0 } },
      { type: 'not_found', data: { contentId: 'apple', cardIndex: 0 } }
    ])
    expect(r.state.phase).toBe('resolving')
  })

  it('flipping an item not on the list is a miss with exact event data', () => {
    const state = {
      cards: [{ contentId: 'cherry', state: 'hidden' }],
      players: [
        { id: 'p1', name: 'Alice', list: ['apple'], found: [] }
      ],
      turnIndex: 0,
      phase: 'waiting',
      flipped: []
    }
    const r = flipShoppingCard(state, 0)
    expect(r.events).toEqual([
      { type: 'card_reveal', data: { cardIndex: 0 } },
      { type: 'not_found', data: { contentId: 'cherry', cardIndex: 0 } }
    ])
    expect(r.state.cards).toEqual([{ contentId: 'cherry', state: 'revealed' }])
    expect(r.state.flipped).toEqual([0])
    expect(r.state.phase).toBe('resolving')
  })
})

describe('resolveShoppingFlip', () => {
  it('is a no-op outside the resolving phase, returning the same state', () => {
    const state = { phase: 'waiting', cards: [], players: [], turnIndex: 0, flipped: [] }
    const r = resolveShoppingFlip(state)
    expect(r.state).toBe(state)
    expect(r.events).toEqual([])
  })

  it('hides the flipped card, leaves other cards untouched, advances turn, and emits turn_start', () => {
    const state = {
      cards: [
        { contentId: 'apple', state: 'revealed' },
        { contentId: 'banana', state: 'found' }
      ],
      players: [
        { id: 'p1', name: 'Alice', list: ['apple'], found: [] },
        { id: 'p2', name: 'Bob', list: ['banana'], found: [] }
      ],
      turnIndex: 0,
      phase: 'resolving',
      flipped: [0]
    }
    const r = resolveShoppingFlip(state)
    expect(r.state.cards).toEqual([
      { contentId: 'apple', state: 'hidden' },
      { contentId: 'banana', state: 'found' }
    ])
    expect(r.state.flipped).toEqual([])
    expect(r.state.turnIndex).toBe(1)
    expect(r.state.phase).toBe('waiting')
    expect(r.events).toEqual([{ type: 'turn_start', data: { playerId: 'p2' } }])
  })
})

describe('shoppingNextTurn', () => {
  it('advances to the next player when they still have items to find', () => {
    const players = [
      { found: [], list: ['a'] },
      { found: [], list: ['b'] }
    ]
    expect(shoppingNextTurn(players, 0)).toBe(1)
  })

  it('skips a player who has already completed their list', () => {
    const players = [
      { found: ['a'], list: ['a'] },
      { found: ['b'], list: ['b'] },
      { found: [], list: ['c'] }
    ]
    expect(shoppingNextTurn(players, 0)).toBe(2)
  })

  it('excludes an exactly-complete player at the boundary (found.length === list.length)', () => {
    const players = [
      { found: [], list: ['a'] },
      { found: ['b'], list: ['b'] },
      { found: [], list: ['c', 'd'] }
    ]
    expect(shoppingNextTurn(players, 0)).toBe(2)
  })

  it('wraps forward around the end of the player list', () => {
    const players = [
      { found: [], list: ['a'] },
      { found: [], list: ['b'] },
      { found: [], list: ['c'] }
    ]
    expect(shoppingNextTurn(players, 2)).toBe(0)
  })

  it('falls back to the plain next index when every player has finished', () => {
    const players = [
      { found: ['a'], list: ['a'] },
      { found: ['b'], list: ['b'] },
      { found: ['c'], list: ['c'] }
    ]
    expect(shoppingNextTurn(players, 1)).toBe(2)
  })
})

describe('turn skipping', () => {
  it('skips a completed player in the rotation', () => {
    const state = {
      cards: [
        { contentId: 'banana', state: 'hidden' },
        { contentId: 'apple',  state: 'found'  },
        { contentId: 'cherry', state: 'hidden' }
      ],
      players: [
        { id: 'p1', name: 'Alice', list: ['apple'],  found: ['apple'] },
        { id: 'p2', name: 'Bob',   list: ['banana'], found: [] },
        { id: 'p3', name: 'Carol', list: ['cherry'], found: [] }
      ],
      turnIndex: 1,
      phase: 'waiting',
      flipped: []
    }
    const r = flipShoppingCard(state, 0)
    expect(r.events.some(e => e.type === 'item_found')).toBe(true)
    expect(r.state.turnIndex).toBe(2)
  })

  it('skips a completed player on miss (resolve path)', () => {
    const state = {
      cards: [
        { contentId: 'cherry', state: 'hidden' },
        { contentId: 'apple',  state: 'found'  },
        { contentId: 'banana', state: 'hidden' }
      ],
      players: [
        { id: 'p1', name: 'Alice', list: ['apple'],  found: ['apple'] },
        { id: 'p2', name: 'Bob',   list: ['banana'], found: [] },
        { id: 'p3', name: 'Carol', list: ['cherry'], found: [] }
      ],
      turnIndex: 1,
      phase: 'resolving',
      flipped: [0]
    }
    const r = resolveShoppingFlip(state)
    expect(r.state.turnIndex).toBe(2)
  })

  it('advances normally when next player still has items', () => {
    const state = {
      cards: [{ contentId: 'banana', state: 'hidden' }, { contentId: 'apple', state: 'hidden' }],
      players: [
        { id: 'p1', name: 'Alice', list: ['apple'],  found: [] },
        { id: 'p2', name: 'Bob',   list: ['banana'], found: [] }
      ],
      turnIndex: 1,
      phase: 'waiting',
      flipped: []
    }
    const r = flipShoppingCard(state, 0)
    expect(r.state.turnIndex).toBe(0)
  })
})

describe('getShoppingScores', () => {
  it('returns score entry per player', () => {
    const g = createShoppingGame([{id:'p1',name:'Alice'}], 16, CONTENT)
    const scores = getShoppingScores(g)
    expect(scores.length).toBe(1)
    expect(scores[0].id).toBe('p1')
    expect(scores[0].found).toBe(0)
  })
})
