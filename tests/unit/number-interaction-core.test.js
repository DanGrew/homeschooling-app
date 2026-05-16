import { describe, it, expect } from 'vitest'
import { comparisonColor, pickFruitPair, clamp, pluralize, makeImg, labelState, computeChange } from '../../core/number-interaction/number-interaction-core.js'

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

describe('pluralize', () => {
  it('adds s for regular words', () => expect(pluralize('apple')).toBe('apples'));
  it('converts y to ies', () => expect(pluralize('cherry')).toBe('cherries'));
  it('adds es for words ending in h (removes h, appends es)', () => expect(pluralize('peach')).toBe('peaces'));
  it('lowercase input works', () => expect(pluralize('strawberry')).toBe('strawberries'));
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
  it('returns img tag string', () => expect(makeImg({ url: '/img.png' }, '60px')).toMatch(/^<img /));
  it('includes url', () => expect(makeImg({ url: '/img.png' }, '60px')).toContain('src="/img.png"'));
  it('includes size in style', () => expect(makeImg({ url: '/x.png' }, '80px')).toContain('80px'));
})

describe('labelState', () => {
  it('empty when both zero', () => expect(labelState(0, 0)).toBe('empty'));
  it('same when equal non-zero', () => expect(labelState(3, 3)).toBe('same'));
  it('bigger when self > other', () => expect(labelState(5, 3)).toBe('bigger'));
  it('smaller when self < other', () => expect(labelState(2, 4)).toBe('smaller'));
})

describe('computeChange', () => {
  it('increments side a', () => {
    const r = computeChange('a', 1, 2, 3, 10);
    expect(r.newA).toBe(3);
    expect(r.newB).toBe(3);
    expect(r.changed).toBe(true);
  });
  it('increments side b', () => {
    const r = computeChange('b', 1, 2, 3, 10);
    expect(r.newA).toBe(2);
    expect(r.newB).toBe(4);
  });
  it('clamps at max', () => {
    const r = computeChange('a', 1, 10, 0, 10);
    expect(r.newA).toBe(10);
    expect(r.changed).toBe(false);
  });
  it('clamps at 0', () => {
    const r = computeChange('a', -1, 0, 0, 10);
    expect(r.newA).toBe(0);
    expect(r.changed).toBe(false);
  });
})
