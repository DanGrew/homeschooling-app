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
  return { name: 'Item', tags: [], viewBox: '0 0 10 10', shapes: [], dots: [], edges: [], guides: [], decor: [], ...overrides };
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
    const item = makeItem({ name: 'Star', dots: [{ cx: 1, cy: 2 }], guides: ['g'], decor: ['d'] });
    const { loadConnectDots } = await loadHelpers({ loadManifest: () => Promise.resolve([item]) });
    const shapes = [];
    await call(loadConnectDots, shapes);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].name).toBe('Star');
    expect(shapes[0].dots).toEqual([{ cx: 1, cy: 2 }]);
  });

  it('sorts by name', async () => {
    const items = [
      makeItem({ name: 'Zebra' }),
      makeItem({ name: 'Apple' }),
      makeItem({ name: 'Mango' }),
    ];
    const { loadConnectDots } = await loadHelpers({ loadManifest: () => Promise.resolve(items) });
    const shapes = [];
    await call(loadConnectDots, shapes);
    expect(shapes.map(s => s.name)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('calls callback on failure', async () => {
    const { loadConnectDots } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const shapes = [];
    await call(loadConnectDots, shapes);
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
