import { describe, it, expect } from 'vitest';
import { buildCatalogItems } from '../../core/shopping-scan/shopping-scan-core.js';

const catalogs = [
  {
    name: 'Fruit',
    tags: ['food'],
    items: [
      { name: 'Apple', barcode: '123', icon: '🍎' },
      { name: 'Banana', barcode: '456', icon: '🍌' },
    ],
  },
  {
    name: 'Veg',
    tags: ['food', 'healthy'],
    items: [
      { name: 'Carrot', barcode: '789', icon: '🥕' },
    ],
  },
];

describe('buildCatalogItems', () => {
  it('returns all items when all catalogs selected', () => {
    const filtered = [{ name: 'Fruit' }, { name: 'Veg' }];
    const result = buildCatalogItems(filtered, catalogs);
    expect(result).toHaveLength(3);
  });

  it('returns only items from the selected catalog', () => {
    const filtered = [{ name: 'Fruit' }];
    const result = buildCatalogItems(filtered, catalogs);
    expect(result).toHaveLength(2);
    result.forEach(it => expect(it.catalog).toBe('Fruit'));
  });

  it('attaches tags from catalog', () => {
    const filtered = [{ name: 'Veg' }];
    const result = buildCatalogItems(filtered, catalogs);
    expect(result[0].tags).toContain('food');
    expect(result[0].tags).toContain('healthy');
  });

  it('item has name, barcode, icon, catalog fields', () => {
    const filtered = [{ name: 'Fruit' }];
    const [item] = buildCatalogItems(filtered, catalogs);
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('barcode');
    expect(item).toHaveProperty('icon');
    expect(item).toHaveProperty('catalog');
  });

  it('returns empty array when no catalogs match', () => {
    const filtered = [{ name: 'Dairy' }];
    expect(buildCatalogItems(filtered, catalogs)).toHaveLength(0);
  });

  it('returns empty array for empty filtered list', () => {
    expect(buildCatalogItems([], catalogs)).toHaveLength(0);
  });
});
