import { describe, it, expect } from 'vitest'
import { derivePieces, shufflePieces, checkPlacement, isComplete } from '../../core/puzzle/puzzle-core.js'

describe('derivePieces', () => {
  it('generates correct count for 1x1', () => {
    expect(derivePieces({ rows: 1, cols: 1 })).toHaveLength(1)
  })

  it('generates correct count for 3x3', () => {
    expect(derivePieces({ rows: 3, cols: 3 })).toHaveLength(9)
  })

  it('generates pieces with correct ids and positions', () => {
    const pieces = derivePieces({ rows: 2, cols: 2 })
    expect(pieces[0]).toEqual({ id: 'p_r0_c0', correct: { row: 0, col: 0 } })
    expect(pieces[1]).toEqual({ id: 'p_r0_c1', correct: { row: 0, col: 1 } })
    expect(pieces[2]).toEqual({ id: 'p_r1_c0', correct: { row: 1, col: 0 } })
    expect(pieces[3]).toEqual({ id: 'p_r1_c1', correct: { row: 1, col: 1 } })
  })

  it('pieces have no src property', () => {
    const pieces = derivePieces({ rows: 1, cols: 1 })
    expect(pieces[0]).not.toHaveProperty('src')
  })

  it('uses row-major order for non-square grid', () => {
    const pieces = derivePieces({ rows: 2, cols: 3 })
    expect(pieces).toHaveLength(6)
    expect(pieces[0].correct).toEqual({ row: 0, col: 0 })
    expect(pieces[2].correct).toEqual({ row: 0, col: 2 })
    expect(pieces[3].correct).toEqual({ row: 1, col: 0 })
  })
})

describe('shufflePieces', () => {
  it('returns array with same pieces', () => {
    const pieces = derivePieces({ rows: 2, cols: 2 })
    const shuffled = shufflePieces(pieces)
    expect(shuffled).toHaveLength(pieces.length)
    expect(shuffled).toEqual(expect.arrayContaining(pieces))
  })

  it('does not mutate original array', () => {
    const pieces = derivePieces({ rows: 2, cols: 2 })
    const copy = [...pieces]
    shufflePieces(pieces)
    expect(pieces).toEqual(copy)
  })

  it('returns a new array reference', () => {
    const pieces = derivePieces({ rows: 2, cols: 2 })
    expect(shufflePieces(pieces)).not.toBe(pieces)
  })

  it('handles single-element array without error', () => {
    const pieces = derivePieces({ rows: 1, cols: 1 })
    const shuffled = shufflePieces(pieces)
    expect(shuffled).toHaveLength(1)
    expect(shuffled[0]).toEqual(pieces[0])
  })
})

describe('checkPlacement', () => {
  const piece = { id: 'p_r1_c2', correct: { row: 1, col: 2 } }

  it('returns true when row and col both match', () => {
    expect(checkPlacement(piece, { row: 1, col: 2 })).toBe(true)
  })

  it('returns false when row is wrong', () => {
    expect(checkPlacement(piece, { row: 0, col: 2 })).toBe(false)
  })

  it('returns false when col is wrong', () => {
    expect(checkPlacement(piece, { row: 1, col: 0 })).toBe(false)
  })

  it('returns false when both wrong', () => {
    expect(checkPlacement(piece, { row: 0, col: 0 })).toBe(false)
  })
})

describe('isComplete', () => {
  it('returns true when all placements correct and count matches total', () => {
    const placements = {
      '0_0': { correct: true },
      '0_1': { correct: true },
      '1_0': { correct: true },
    }
    expect(isComplete(placements, 3)).toBe(true)
  })

  it('returns false when some placements incorrect', () => {
    const placements = {
      '0_0': { correct: true },
      '0_1': { correct: false },
    }
    expect(isComplete(placements, 2)).toBe(false)
  })

  it('returns false when correct count is less than total', () => {
    expect(isComplete({ '0_0': { correct: true } }, 3)).toBe(false)
  })

  it('returns false when no placements exist', () => {
    expect(isComplete({}, 4)).toBe(false)
  })

  it('returns true for empty puzzle with total 0', () => {
    expect(isComplete({}, 0)).toBe(true)
  })
})
