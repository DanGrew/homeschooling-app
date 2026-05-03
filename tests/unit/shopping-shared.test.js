import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { flattenCatalogs, escHtml, byName } = require('../../app/shared/shopping-shared.js');

const FRUIT = {
  name: 'Fruit & Veg', tags: ['food', 'healthy'],
  items: [
    { name: 'Apple', barcode: '001', icon: '🍎' },
    { name: 'Banana', barcode: '002', icon: '🍌' },
  ],
};
const DAIRY = {
  name: 'Dairy', tags: ['food', 'cold'],
  items: [
    { name: 'Milk', barcode: '003', icon: '🥛' },
  ],
};

describe('flattenCatalogs', () => {
  it('flattens single catalog', () => {
    const result = flattenCatalogs([FRUIT]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Apple', barcode: '001', icon: '🍎', tags: ['food', 'healthy'], catalog: 'Fruit & Veg' });
  });

  it('flattens multiple catalogs', () => {
    const result = flattenCatalogs([FRUIT, DAIRY]);
    expect(result).toHaveLength(3);
    expect(result.map(i => i.name)).toEqual(['Apple', 'Banana', 'Milk']);
  });

  it('returns empty array for empty input', () => {
    expect(flattenCatalogs([])).toEqual([]);
  });

  it('returns empty array for catalog with no items', () => {
    const result = flattenCatalogs([{ name: 'Empty', tags: [], items: [] }]);
    expect(result).toEqual([]);
  });

  it('attaches catalog name and tags to each item', () => {
    const result = flattenCatalogs([DAIRY]);
    expect(result[0].catalog).toBe('Dairy');
    expect(result[0].tags).toEqual(['food', 'cold']);
  });
});

describe('escHtml', () => {
  it('escapes ampersand', () => expect(escHtml('a & b')).toBe('a &amp; b'));
  it('escapes less-than', () => expect(escHtml('<script>')).toBe('&lt;script&gt;'));
  it('escapes greater-than', () => expect(escHtml('a > b')).toBe('a &gt; b'));
  it('leaves plain text unchanged', () => expect(escHtml('hello')).toBe('hello'));
  it('escapes multiple chars', () => expect(escHtml('<a & b>')).toBe('&lt;a &amp; b&gt;'));
});

describe('byName', () => {
  it('sorts alphabetically', () => {
    const items = [{ name: 'Milk' }, { name: 'Apple' }, { name: 'Banana' }];
    items.sort(byName);
    expect(items.map(i => i.name)).toEqual(['Apple', 'Banana', 'Milk']);
  });

  it('returns 0 for equal names', () => {
    expect(byName({ name: 'Apple' }, { name: 'Apple' })).toBe(0);
  });
});
