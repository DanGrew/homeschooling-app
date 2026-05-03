import { vi, beforeEach } from 'vitest';

async function freshDictionary() {
  vi.resetModules();
  return (await import('../../app/dictionary/dictionary.js')).default;
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
    await expect(D.loadManifest('colouring', 1)).rejects.toThrow('404');
  });

  it('rejects on network failure', async () => {
    vi.stubGlobal('fetch', networkError());
    const D = await freshDictionary();
    D.init('/base/');
    await expect(D.loadManifest('colouring', 1)).rejects.toThrow('network');
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
    const items = await D.loadManifest('colouring', 1);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Cat');
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
    const [item] = await D.loadManifest('colouring', 1);
    expect(item.name).toBe('Dog');
    expect(item.viewBox).toBe('0 0 50 50');
    expect(item.concept).toBeUndefined();
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
    await D.loadManifest('colouring', 1);
    await D.loadManifest('colouring', 2); // same rep path — should use repCache
    const repFetches = fetchMock.mock.calls.filter(c => c[0].includes('rep.json') && !c[0].includes('manifests'));
    expect(repFetches).toHaveLength(1);
  });
});
