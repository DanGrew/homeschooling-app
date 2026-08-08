import { vi, beforeEach } from 'vitest';

async function freshDictionary() {
  vi.resetModules();
  return (await import('../../core/dictionary/dictionary-core.js')).default;
}

function okJson(data) {
  return vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) });
}

function okText(text) {
  return vi.fn().mockResolvedValue({ ok: true, json: () => { throw new Error('not json'); }, text: () => Promise.resolve(text) });
}

function notOk(status) {
  return vi.fn().mockResolvedValue({ ok: false, status });
}

function networkError() {
  return vi.fn().mockRejectedValue(new Error('network'));
}

beforeEach(() => { vi.unstubAllGlobals(); });

describe('fetchJSON error handling', () => {
  it('rejects with status on non-ok response', async () => {
    vi.stubGlobal('fetch', notOk(404));
    const D = await freshDictionary();
    D.init('/base/');
    await expect(D.loadManifest('colouring')).rejects.toThrow('404');
  });

  it('rejects on network failure', async () => {
    vi.stubGlobal('fetch', networkError());
    const D = await freshDictionary();
    D.init('/base/');
    await expect(D.loadManifest('colouring')).rejects.toThrow('network');
  });

  it('uses an empty base path until init is called', async () => {
    const fetchMock = notOk(404);
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    await expect(D.loadManifest('colouring')).rejects.toThrow('404');
    expect(fetchMock.mock.calls[0][0]).toBe('manifests/colouring.json');
  });
});

describe('loadManifest', () => {
  it('fetches manifest then each rep', async () => {
    const concept = { name: 'Cat', tags: ['animal'] };
    const rep = { concept: 'cat', viewBox: '0 0 100 100', shapes: [] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/cat/rep.json']) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(rep) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(concept) });
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    D.init('/base/');
    const items = await D.loadManifest('colouring');
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Cat');
    expect(fetchMock.mock.calls[0][0]).toBe('/base/manifests/colouring.json');
    expect(fetchMock.mock.calls[1][0]).toBe('/base/entries/cat/rep.json');
    expect(fetchMock.mock.calls[2][0]).toBe('/base/entries/cat/concept.json');
  });

  it('merges concept and rep fields, drops concept key', async () => {
    const concept = { name: 'Dog', tags: ['animal'] };
    const rep = { concept: 'dog', viewBox: '0 0 50 50', shapes: ['circle'] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/dog/rep.json']) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(rep) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(concept) });
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    D.init('/base/');
    const [item] = await D.loadManifest('colouring');
    expect(item.name).toBe('Dog');
    expect(item.viewBox).toBe('0 0 50 50');
    expect(item.concept).toBeUndefined();
  });
});

describe('loadManifest — rep with src (SVG fetch)', () => {
  it('fetches SVG text and sets svg + url on item', async () => {
    const concept = { name: 'Star', tags: [] };
    const rep = { concept: 'star', src: 'entries/star/star.svg' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/star/rep.json']) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(rep) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(concept) })
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('<svg/>') });
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    D.init('/base/');
    const [item] = await D.loadManifest('image');
    expect(item.svg).toBe('<svg/>');
    expect(item.url).toBe('/base/entries/star/star.svg');
    expect(item.concept).toBeUndefined();
    expect(fetchMock.mock.calls[3][0]).toBe('/base/entries/star/star.svg');
  });

  it('fetches svg text when format is explicitly "svg"', async () => {
    const concept = { name: 'Moon', tags: [] };
    const rep = { concept: 'moon', src: 'entries/moon/moon.svg', format: 'svg' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/moon/rep.json']) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(rep) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(concept) })
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve('<svg/>') });
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    D.init('/base/');
    const [item] = await D.loadManifest('image');
    expect(item.svg).toBe('<svg/>');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('propagates the status when the svg text fetch fails', async () => {
    const concept = { name: 'Bad', tags: [] };
    const rep = { concept: 'bad', src: 'entries/bad/bad.svg' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/bad/rep.json']) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(rep) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(concept) })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    D.init('/base/');
    await expect(D.loadManifest('image')).rejects.toThrow('500');
  });
});

describe('concept caching', () => {
  it('fetches a shared concept only once across separate loadManifest calls', async () => {
    const concept = { name: 'Shared', tags: [] };
    const repA = { concept: 'shared', viewBox: '0 0 10 10', shapes: [] };
    const repB = { concept: 'shared', viewBox: '0 0 20 20', shapes: [] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/a/rep.json']) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(repA) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(concept) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/b/rep.json']) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(repB) });
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    D.init('/base/');
    await D.loadManifest('colouring');
    await D.loadManifest('connectDots');
    const conceptFetches = fetchMock.mock.calls.filter(c => c[0].includes('concept.json'));
    expect(conceptFetches).toHaveLength(1);
  });
});

describe('loadManifest — rep with src and format:png (no SVG fetch)', () => {
  it('sets url but skips svg text fetch for non-svg format', async () => {
    const concept = { name: 'Chase', tags: ['paw-patrol'] };
    const rep = { concept: 'chase', src: 'entries/chase/chase.png', format: 'png' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/chase/rep.json']) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(rep) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(concept) });
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    D.init('/base/');
    const [item] = await D.loadManifest('image');
    expect(item.url).toBe('/base/entries/chase/chase.png');
    expect(item.svg).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('caching', () => {
  it('does not re-fetch a rep already loaded', async () => {
    const concept = { name: 'Fish', tags: [] };
    const rep = { concept: 'fish', viewBox: '0 0 10 10', shapes: [] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/fish/rep.json']) }) // manifest 1
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(rep) })                       // rep fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(concept) })                   // concept fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['entries/fish/rep.json']) }); // manifest 2
    vi.stubGlobal('fetch', fetchMock);
    const D = await freshDictionary();
    D.init('/base/');
    await D.loadManifest('colouring');
    await D.loadManifest('colouring'); // same rep path — should use repCache
    const repFetches = fetchMock.mock.calls.filter(c => c[0].includes('rep.json') && !c[0].includes('manifests'));
    expect(repFetches).toHaveLength(1);
  });
});
