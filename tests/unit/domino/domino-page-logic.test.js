const {
  dominoIsNotNull,
  dominoIsPhaseComplete,
  dominoIsPhaseIncomplete,
  dominoResultSucceeded,
  dominoIsDynamicMatchType,
  dominoPluckId,
  dominoFindTileById,
  dominoIsTileId,
  dominoPlayerSummary,
  dominoPerPlayerSummary,
  dominoPickRandomSample
} = require('../../../core/domino/domino-page-logic.js')

// ---- dominoIsNotNull ----

test('dominoIsNotNull is false for null, true otherwise', () => {
  expect(dominoIsNotNull(null)).toBe(false)
  expect(dominoIsNotNull(0)).toBe(true)
  expect(dominoIsNotNull(undefined)).toBe(true)
  expect(dominoIsNotNull('')).toBe(true)
})

test('dominoIsNotNull as a filter drops only null', () => {
  expect([0, null, 2, null].filter(dominoIsNotNull)).toEqual([0, 2])
})

// ---- phase predicates ----

test('dominoIsPhaseComplete matches only complete phase', () => {
  expect(dominoIsPhaseComplete({ phase: 'complete' })).toBe(true)
  expect(dominoIsPhaseComplete({ phase: 'playing' })).toBe(false)
})

test('dominoIsPhaseIncomplete is the inverse of complete', () => {
  expect(dominoIsPhaseIncomplete({ phase: 'complete' })).toBe(false)
  expect(dominoIsPhaseIncomplete({ phase: 'playing' })).toBe(true)
})

// ---- dominoResultSucceeded ----

test('dominoResultSucceeded reflects the success flag', () => {
  expect(dominoResultSucceeded({ success: true })).toBe(true)
  expect(dominoResultSucceeded({ success: false })).toBe(false)
})

// ---- dominoIsDynamicMatchType ----

test('dominoIsDynamicMatchType is false for a static type, true for a tag type', () => {
  const staticTypes = { colours: true, shapes: true, numbers: true }
  expect(dominoIsDynamicMatchType({ matchType: 'colours' }, staticTypes)).toBe(false)
  expect(dominoIsDynamicMatchType({ matchType: 'animals' }, staticTypes)).toBe(true)
})

// ---- dominoPluckId ----

test('dominoPluckId returns the id field', () => {
  expect(dominoPluckId({ id: 'cat' })).toBe('cat')
  expect([{ id: 'a' }, { id: 'b' }].map(dominoPluckId)).toEqual(['a', 'b'])
})

// ---- dominoFindTileById / dominoIsTileId ----

test('dominoFindTileById returns the matching tile', () => {
  const tiles = [{ id: 't1' }, { id: 't2' }, { id: 't3' }]
  expect(dominoFindTileById(tiles, 't2')).toEqual({ id: 't2' })
})

test('dominoFindTileById returns undefined when no tile matches', () => {
  expect(dominoFindTileById([{ id: 't1' }], 'nope')).toBeUndefined()
})

test('dominoIsTileId builds a predicate bound to one id', () => {
  const isT2 = dominoIsTileId('t2')
  expect(isT2({ id: 't2' })).toBe(true)
  expect(isT2({ id: 't1' })).toBe(false)
})

// ---- dominoPlayerSummary / dominoPerPlayerSummary ----

test('dominoPlayerSummary shapes one player row from stats', () => {
  const stats = { p1: { tilesPlaced: 3, tilesDrawn: 1 } }
  expect(dominoPlayerSummary({ id: 'p1' }, stats)).toEqual({
    player_id: 'p1',
    tiles_placed: 3,
    tiles_drawn: 1
  })
})

test('dominoPerPlayerSummary maps every player', () => {
  const players = [{ id: 'p1' }, { id: 'p2' }]
  const stats = {
    p1: { tilesPlaced: 2, tilesDrawn: 0 },
    p2: { tilesPlaced: 5, tilesDrawn: 4 }
  }
  expect(dominoPerPlayerSummary(players, stats)).toEqual([
    { player_id: 'p1', tiles_placed: 2, tiles_drawn: 0 },
    { player_id: 'p2', tiles_placed: 5, tiles_drawn: 4 }
  ])
})

// ---- dominoPickRandomSample ----

test('dominoPickRandomSample returns count items, all from input', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const sample = dominoPickRandomSample(items, 3)
  expect(sample).toHaveLength(3)
  sample.forEach(x => expect(items).toContain(x))
})

test('dominoPickRandomSample does not mutate the input array', () => {
  const items = ['a', 'b', 'c']
  dominoPickRandomSample(items, 2)
  expect(items).toEqual(['a', 'b', 'c'])
})

test('dominoPickRandomSample keeps order with a neutral rng (comparator 0)', () => {
  const items = ['a', 'b', 'c', 'd']
  expect(dominoPickRandomSample(items, 4, () => 0.5)).toEqual(['a', 'b', 'c', 'd'])
})

test('dominoPickRandomSample caps at count even when more available', () => {
  const items = ['a', 'b', 'c', 'd', 'e']
  expect(dominoPickRandomSample(items, 2, () => 0.5)).toEqual(['a', 'b'])
})
