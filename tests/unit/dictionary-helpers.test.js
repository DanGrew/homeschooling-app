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
    const loadManifest = vi.fn(() => Promise.resolve([makeItem({ name: 'Cat' })]));
    const { loadColouringPictures } = await loadHelpers({ loadManifest });
    const pictures = [];
    await call(loadColouringPictures, pictures);
    expect(pictures).toHaveLength(1);
    expect(pictures[0].name).toBe('Cat');
    expect(loadManifest).toHaveBeenCalledWith('colouring');
  });

  it('calls callback with empty array on failure', async () => {
    const { loadColouringPictures } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const pictures = [];
    await call(loadColouringPictures, pictures);
    expect(pictures).toHaveLength(0);
  });

  it('calls onError instead of callback when onError is provided', async () => {
    const { loadColouringPictures } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const pictures = [];
    const onError = vi.fn();
    const callback = vi.fn();
    await new Promise(resolve => {
      loadColouringPictures(pictures, () => { callback(); resolve(); }, err => { onError(err); resolve(); });
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('loadConnectDots', () => {
  it('pushes items with correct shape and calls callback on success', async () => {
    const item = makeItem({ name: 'Star', dots: [{ cx: 1, cy: 2 }], guides: ['g'], decor: ['d'] });
    const loadManifest = vi.fn(() => Promise.resolve([item]));
    const { loadConnectDots } = await loadHelpers({ loadManifest });
    const shapes = [];
    await call(loadConnectDots, shapes);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].name).toBe('Star');
    expect(shapes[0].dots).toEqual([{ cx: 1, cy: 2 }]);
    expect(loadManifest).toHaveBeenCalledWith('connectDots');
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
    const loadManifest = vi.fn(() => Promise.resolve([item]));
    const { loadImages } = await loadHelpers({ loadManifest });
    const items = [];
    await call(loadImages, items);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Dog');
    expect(loadManifest).toHaveBeenCalledWith('image');
  });

  it('calls callback on failure', async () => {
    const { loadImages } = await loadHelpers({ loadManifest: () => Promise.reject(new Error('fail')) });
    const items = [];
    await call(loadImages, items);
    expect(items).toHaveLength(0);
  });
});
