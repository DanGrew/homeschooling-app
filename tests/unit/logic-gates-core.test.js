import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { goalText, cellCenter, tagCategory } = require('../../core/logic-gates/logic-gates-core.js');

describe('cellCenter', () => {
  test('[0,0] with 90x65 → {x:45, y:32.5}', () => {
    expect(cellCenter([0, 0], 90, 65)).toEqual({ x: 45, y: 32.5 });
  });
  test('[1,0] with 90x65 → {x:135, y:32.5}', () => {
    expect(cellCenter([1, 0], 90, 65)).toEqual({ x: 135, y: 32.5 });
  });
  test('[0,1] with 90x65 → {x:45, y:97.5}', () => {
    expect(cellCenter([0, 1], 90, 65)).toEqual({ x: 45, y: 97.5 });
  });
  test('[2,3] with 90x65 → {x:225, y:227.5}', () => {
    expect(cellCenter([2, 3], 90, 65)).toEqual({ x: 225, y: 227.5 });
  });
});

describe('goalText', () => {
  const outputs = [
    { id: 'O1', type: 'lamp' },
    { id: 'O2', type: 'fan' },
    { id: 'O3', type: 'fountain' }
  ];

  test('lamp OFF goal', () => {
    expect(goalText([{ id: 'O1', value: false }], outputs)).toBe('Turn the light OFF');
  });
  test('lamp ON goal', () => {
    expect(goalText([{ id: 'O1', value: true }], outputs)).toBe('Turn the light ON');
  });
  test('fan ON goal', () => {
    expect(goalText([{ id: 'O2', value: true }], outputs)).toBe('Turn the fan ON');
  });
  test('fountain OFF goal', () => {
    expect(goalText([{ id: 'O3', value: false }], outputs)).toBe('Turn the fountain OFF');
  });
});

describe('tagCategory', () => {
  test('adds category to each item', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    expect(tagCategory(items, 'primitive')).toEqual([
      { id: 'a', category: 'primitive' },
      { id: 'b', category: 'primitive' }
    ]);
  });
  test('does not mutate the input items', () => {
    const items = [{ id: 'a' }];
    tagCategory(items, 'primitive');
    expect(items[0]).toEqual({ id: 'a' });
  });
  test('overwrites an existing category', () => {
    expect(tagCategory([{ id: 'a', category: 'old' }], 'new')).toEqual([{ id: 'a', category: 'new' }]);
  });
  test('returns empty array for empty input', () => {
    expect(tagCategory([], 'primitive')).toEqual([]);
  });
});
