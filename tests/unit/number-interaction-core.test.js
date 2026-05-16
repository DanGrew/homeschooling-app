import { describe, it, expect } from 'vitest'
import { comparisonColor, pickFruitPair, clamp, makeImg, labelState, pluralize } from '../../core/number-interaction/number-interaction-core.js'

describe('comparisonColor', () => {
  it('returns green when a > b', () => {
    expect(comparisonColor(5, 3)).toBe('#2ECC71')
    expect(comparisonColor(1, 0)).toBe('#2ECC71')
    expect(comparisonColor(10, 9)).toBe('#2ECC71')
  })

  it('returns red when a < b', () => {
    expect(comparisonColor(3, 5)).toBe('#E74C3C')
    expect(comparisonColor(0, 1)).toBe('#E74C3C')
    expect(comparisonColor(9, 10)).toBe('#E74C3C')
  })

  it('returns blue when a === b', () => {
    expect(comparisonColor(0, 0)).toBe('#3498DB')
    expect(comparisonColor(5, 5)).toBe('#3498DB')
    expect(comparisonColor(10, 10)).toBe('#3498DB')
  })
})

describe('pickFruitPair', () => {
  const FRUITS = ['apple','avocado','banana','blueberry','cherry','coconut','kiwi','lemon','mango','melon','orange','peach','pear','pineapple','raspberry','strawberry','watermelon']

  it('returns two fruits', () => {
    const [a, b] = pickFruitPair(FRUITS)
    expect(typeof a).toBe('string')
    expect(typeof b).toBe('string')
  })

  it('both fruits are in the list', () => {
    const [a, b] = pickFruitPair(FRUITS)
    expect(FRUITS).toContain(a)
    expect(FRUITS).toContain(b)
  })

  it('returns two different fruits', () => {
    for (let i = 0; i < 50; i++) {
      const [a, b] = pickFruitPair(FRUITS)
      expect(a).not.toBe(b)
    }
  })

  it('works with minimal two-item list', () => {
    const [a, b] = pickFruitPair(['apple', 'lemon'])
    expect(a).not.toBe(b)
    expect(['apple', 'lemon']).toContain(a)
    expect(['apple', 'lemon']).toContain(b)
  })
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it('clamps to min', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(-100, 0, 10)).toBe(0)
  })

  it('clamps to max', () => {
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(100, 0, 10)).toBe(10)
  })
})

describe('makeImg', () => {
  it('returns an img tag string', () => {
    const result = makeImg({ url: 'apple.png' }, 'width:60px')
    expect(result).toContain('<img')
    expect(result).toContain('apple.png')
    expect(result).toContain('width:60px')
  })

  it('sets draggable false', () => {
    expect(makeImg({ url: 'x.png' }, 'w')).toContain('draggable="false"')
  })
})

describe('labelState', () => {
  it('returns "empty" when both are 0', () => {
    expect(labelState(0, 0)).toBe('empty')
  })

  it('returns "same" when equal and non-zero', () => {
    expect(labelState(3, 3)).toBe('same')
  })

  it('returns "bigger" when self > other', () => {
    expect(labelState(5, 3)).toBe('bigger')
  })

  it('returns "smaller" when self < other', () => {
    expect(labelState(2, 4)).toBe('smaller')
  })

  it('returns "empty" when other is 0 but self too', () => {
    expect(labelState(0, 0)).toBe('empty')
  })
})

describe('pluralize', () => {
  it('appends s for regular words', () => {
    expect(pluralize('apple')).toBe('apples')
  })

  it('handles -y ending: cherry → cherries', () => {
    expect(pluralize('cherry')).toBe('cherries')
  })

  it('handles -h ending: strips last char and adds es', () => {
    expect(pluralize('peach')).toBe('peaces')
  })

  it('handles regular ending: orange → oranges', () => {
    expect(pluralize('orange')).toBe('oranges')
  })
})
