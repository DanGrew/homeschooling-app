import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { filterByTag, buildContentSet } = require('../../../core/pairs/pairs-content.js');

describe('filterByTag', () => {
  it('returns entries matching tag', () => {
    const entries = [
      { id: 'apple', tags: ['fruit'] },
      { id: 'cat', tags: ['animal'] },
      { id: 'banana', tags: ['fruit'] }
    ];
    expect(filterByTag(entries, 'fruit')).toEqual([
      { id: 'apple', tags: ['fruit'] },
      { id: 'banana', tags: ['fruit'] }
    ]);
  });

  it('returns empty array when no matches', () => {
    expect(filterByTag([{ id: 'cat', tags: ['animal'] }], 'fruit')).toEqual([]);
  });

  it('handles missing tags field', () => {
    expect(filterByTag([{ id: 'cat' }], 'fruit')).toEqual([]);
  });

  it('returns all matching entries', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({ id: 'f' + i, tags: ['fruit'] }));
    expect(filterByTag(entries, 'fruit')).toHaveLength(10);
  });
});

describe('buildContentSet', () => {
  const entries = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('returns exactly pairCount IDs', () => {
    expect(buildContentSet(entries, 2)).toHaveLength(2);
    expect(buildContentSet(entries, 5)).toHaveLength(5);
  });

  it('uses entry IDs in order when pairCount <= entries length', () => {
    expect(buildContentSet(entries, 3)).toEqual(['a', 'b', 'c']);
  });

  it('slices when pairCount less than entries length', () => {
    expect(buildContentSet(entries, 2)).toEqual(['a', 'b']);
  });

  it('cycles when pairCount exceeds entries length', () => {
    const result = buildContentSet(entries, 4);
    expect(result).toHaveLength(4);
    expect(result[3]).toBe('a');
  });

  it('cycles correctly across multiple full rotations', () => {
    const result = buildContentSet(entries, 7);
    expect(result).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a']);
  });
});
