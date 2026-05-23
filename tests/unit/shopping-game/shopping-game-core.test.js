import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { SHOPPING_GRID_SIZES, shoppingListSize, shoppingGridCols, createShoppingGame, flipShoppingCard, resolveShoppingFlip, getShoppingScores } = require('../../../core/shopping-game/shopping-game-core.js')

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
})

describe('shoppingGridCols', () => {
  it('returns 4 for grid 16', () => { expect(shoppingGridCols(16)).toBe(4) })
  it('returns 5 for grid 25', () => { expect(shoppingGridCols(25)).toBe(5) })
  it('returns 6 for grid 36', () => { expect(shoppingGridCols(36)).toBe(6) })
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
