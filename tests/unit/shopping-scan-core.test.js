import { buildCatalogItems } from '../../core/shopping-scan/shopping-scan-core.js';

const CATALOGS = [
  { name: 'Fruit', tags: ['food'], items: [{ name: 'Apple', barcode: '001', icon: '🍎' }, { name: 'Banana', barcode: '002', icon: '🍌' }] },
  { name: 'Veg', tags: ['food', 'healthy'], items: [{ name: 'Carrot', barcode: '003', icon: '🥕' }] }
];

describe('buildCatalogItems', () => {
  it('returns all items from matching catalogs', () => {
    const result = buildCatalogItems(CATALOGS, CATALOGS);
    expect(result).toHaveLength(3);
  });

  it('each item has name, barcode, icon, tags, catalog', () => {
    const result = buildCatalogItems(CATALOGS, CATALOGS);
    result.forEach(it => {
      ['name', 'barcode', 'icon', 'tags', 'catalog'].forEach(k => expect(it).toHaveProperty(k));
    });
  });

  it('tags are inherited from catalog', () => {
    const result = buildCatalogItems([CATALOGS[1]], CATALOGS);
    expect(result[0].tags).toEqual(['food', 'healthy']);
    expect(result[0].catalog).toBe('Veg');
  });

  it('filters to only matching catalog names', () => {
    const result = buildCatalogItems([CATALOGS[0]], CATALOGS);
    expect(result).toHaveLength(2);
    result.forEach(it => expect(it.catalog).toBe('Fruit'));
  });

  it('returns empty array when filtered list is empty', () => {
    expect(buildCatalogItems([], CATALOGS)).toHaveLength(0);
  });
});
