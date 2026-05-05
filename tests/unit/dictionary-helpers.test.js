import { vi, beforeEach } from 'vitest';

async function loadHelpers(mockDictionary) {
  vi.doMock('../../core/dictionary/dictionary-core.js', () => ({ default: mockDictionary }));
  vi.resetModules();
  return await import('../../core/dictionary/dictionary-helpers-core.js');
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

describe('loadConnectDots', () => {
  it('pushes items with correct shape and calls callback on success', async () => {
    const item = makeItem({ name: 'Star', level: 2, dots: [{ cx: 1, cy: 2 }], guides: ['g'], decor: ['d'] });
    const { loadConnectDots } = await loadHelpers({ loadManifest: () => Promise.resolve([item]) });
    const shapes = [];
    await call(loadConnectDots, shapes);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].name).toBe('Star');
    expect(shapes[0].level).toBe(2);
    expect(shapes[0].dots).toEqual([{ cx: 1, cy: 2 }]);
  });

  it('sorts by level then name', async () => {
    const items = [
      makeItem({ name: 'Zebra', level: 1 }),
      makeItem({ name: 'Apple', level: 1 }),
      makeItem({ name: 'Mango', level: 2 }),
    ];
    const { loadConnectDots } = await loadHelpers({ loadManifest: () => Promise.resolve(items) });
    const shapes = [];
    await call(loadConnectDots, shapes);
    expect(shapes.map(s => s.name)).toEqual(['Apple', 'Zebra', 'Mango']);
  });

  it('calls callback on failure', async () => {
    const { loadConnectDots } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const shapes = [];
    await call(loadConnectDots, shapes);
    expect(shapes).toHaveLength(0);
  });
});

describe('loadDrawingDots', () => {
  it('pushes items with correct shape and calls callback on success', async () => {
    const item = makeItem({ name: 'Cat', level: 1, dots: [{ cx: 0, cy: 0 }], edges: [[0, 1]], decor: [] });
    const { loadDrawingDots } = await loadHelpers({ loadManifest: () => Promise.resolve([item]) });
    const shapes = [];
    await call(loadDrawingDots, shapes, 1);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].name).toBe('Cat');
    expect(shapes[0].edges).toEqual([[0, 1]]);
  });

  it('passes level to loadManifest', async () => {
    const mockFn = vi.fn().mockResolvedValue([makeItem({ name: 'X', level: 2 })]);
    const { loadDrawingDots } = await loadHelpers({ loadManifest: mockFn });
    const shapes = [];
    await call(loadDrawingDots, shapes, 2);
    expect(mockFn).toHaveBeenCalledWith('drawingDots', 2);
  });

  it('calls callback on failure', async () => {
    const { loadDrawingDots } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const shapes = [];
    await call(loadDrawingDots, shapes, 1);
    expect(shapes).toHaveLength(0);
  });
});

describe('loadImages', () => {
  it('pushes items and calls callback on success', async () => {
    const item = makeItem({ name: 'Dog' });
    const { loadImages } = await loadHelpers({ loadManifest: () => Promise.resolve([item]) });
    const items = [];
    await call(loadImages, items);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Dog');
  });

  it('calls callback on failure', async () => {
    const { loadImages } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const items = [];
    await call(loadImages, items);
    expect(items).toHaveLength(0);
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
