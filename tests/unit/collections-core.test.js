import { describe, it, expect } from 'vitest'
import { notNull, firstIndexAfter, sortByName } from '../../core/collections/collections-core.js'

describe('notNull', () => {
  it('is true for defined values', () => {
    expect(notNull(0)).toBe(true)
    expect(notNull('')).toBe(true)
    expect(notNull(false)).toBe(true)
  })
  it('is false for null', () => {
    expect(notNull(null)).toBe(false)
  })
  it('is true for undefined (only null is filtered)', () => {
    expect(notNull(undefined)).toBe(true)
  })
})

describe('firstIndexAfter', () => {
  it('returns the position of the first value greater than target', () => {
    expect(firstIndexAfter([1, 3, 5, 7], 4)).toBe(2)
  })
  it('returns 0 when the first value already exceeds target', () => {
    expect(firstIndexAfter([5, 6, 7], 2)).toBe(0)
  })
  it('returns -1 when no value exceeds target', () => {
    expect(firstIndexAfter([1, 2, 3], 3)).toBe(-1)
  })
  it('returns -1 for empty input', () => {
    expect(firstIndexAfter([], 0)).toBe(-1)
  })
  it('respects array order, not numeric order', () => {
    expect(firstIndexAfter([2, 9, 1], 5)).toBe(1)
  })
})

describe('sortByName', () => {
  it('sorts items alphabetically by name', () => {
    const items = [{ name: 'Zebra' }, { name: 'Apple' }, { name: 'Mango' }]
    expect(sortByName(items).map(i => i.name)).toEqual(['Apple', 'Mango', 'Zebra'])
  })
  it('sorts in place and returns the same array reference', () => {
    const items = [{ name: 'B' }, { name: 'A' }]
    expect(sortByName(items)).toBe(items)
    expect(items.map(i => i.name)).toEqual(['A', 'B'])
  })
  it('returns empty array for empty input', () => {
    expect(sortByName([])).toEqual([])
  })
})
