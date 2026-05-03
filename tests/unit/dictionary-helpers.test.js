import { vi, beforeEach } from 'vitest';

async function loadHelpers(mockDictionary) {
  vi.doMock('../../app/dictionary/dictionary.js', () => ({ default: mockDictionary }));
  vi.resetModules();
  return await import('../../app/dictionary/dictionary-helpers.js');
}

function call(fn, ...args) {
  return new Promise(resolve => fn(...args, resolve));
}

function makeItem(overrides) {
  return { name: 'Item', tags: [], viewBox: '0 0 10 10', shapes: [], level: 1, dots: [], edges: [], guides: [], decor: [], ...overrides };
}

beforeEach(() => { vi.unstubAllGlobals(); });

describe('loadColouringPictures', () => {
  it('pushes items and calls callback on success', async () => {
    const { loadColouringPictures } = await loadHelpers({ loadManifest: () => Promise.resolve([makeItem({ name: 'Cat' })]) });
    const pictures = [];
    await call(loadColouringPictures, pictures);
    expect(pictures).toHaveLength(1);
    expect(pictures[0].name).toBe('Cat');
  });

  it('calls callback with empty array on failure', async () => {
    const { loadColouringPictures } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const pictures = [];
    await call(loadColouringPictures, pictures);
    expect(pictures).toHaveLength(0);
  });
});

describe('loadAllDrawingDots', () => {
  it('merges level 1 and level 2 items', async () => {
    const l1 = [makeItem({ name: 'A', level: 1 })];
    const l2 = [makeItem({ name: 'B', level: 2 })];
    const { loadAllDrawingDots } = await loadHelpers({
      loadManifest: vi.fn().mockResolvedValueOnce(l1).mockResolvedValueOnce(l2),
    });
    const shapes = [];
    await call(loadAllDrawingDots, shapes);
    expect(shapes.map(s => s.name)).toEqual(['A', 'B']);
  });

  it('sorts by level then name', async () => {
    const l1 = [makeItem({ name: 'Zebra', level: 1 }), makeItem({ name: 'Apple', level: 1 })];
    const l2 = [makeItem({ name: 'Mango', level: 2 })];
    const { loadAllDrawingDots } = await loadHelpers({
      loadManifest: vi.fn().mockResolvedValueOnce(l1).mockResolvedValueOnce(l2),
    });
    const shapes = [];
    await call(loadAllDrawingDots, shapes);
    expect(shapes.map(s => s.name)).toEqual(['Apple', 'Zebra', 'Mango']);
  });

  it('calls callback on failure', async () => {
    const { loadAllDrawingDots } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const shapes = [];
    await call(loadAllDrawingDots, shapes);
    expect(shapes).toHaveLength(0);
  });
});
