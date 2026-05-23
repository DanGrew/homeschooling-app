import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildCatalogItems, loadCatalog } from '../../core/shopping-scan/shopping-scan-core.js';

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

  it('returns empty array when no catalogs match', () => {
    expect(buildCatalogItems([{ name: 'Dairy' }], CATALOGS)).toHaveLength(0);
  });

  it('returns empty array when filtered list is empty', () => {
    expect(buildCatalogItems([], CATALOGS)).toHaveLength(0);
  });
});

describe('loadCatalog', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns catalog from valid JSON', async () => {
    const catalog = { name: 'Groceries', tags: ['food'], items: [{ name: 'Milk', barcode: '001', icon: '🥛' }] };
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: true, json: () => Promise.resolve(catalog) }));
    const result = await loadCatalog('/catalog.json');
    expect(result).toEqual(catalog);
  });

  it('throws when items is missing', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'Empty' }) }));
    await expect(loadCatalog('/catalog.json')).rejects.toThrow();
  });

  it('throws when items is empty', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'Empty', items: [] }) }));
    await expect(loadCatalog('/catalog.json')).rejects.toThrow();
  });

  it('throws when fetch fails', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: false, status: 404 }));
    await expect(loadCatalog('/catalog.json')).rejects.toThrow();
  });
});
