import { vi, beforeEach } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

function freshService() {
  vi.resetModules();
  return require('../../core/dictionary/image-service.js');
}

beforeEach(() => { vi.unstubAllGlobals(); });

describe('ImageService.getUrl', () => {
  it('returns null for unknown id before load', () => {
    const S = freshService();
    expect(S.getUrl('unknown')).toBeNull();
  });
});

describe('ImageService.load', () => {
  it('populates cache from manifest and image entries', async () => {
    const manifest = ['entries/chase/image.json'];
    const imageJson = { concept: 'chase', src: 'entries/chase/chase.png' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(manifest) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(imageJson) });
    vi.stubGlobal('fetch', fetchMock);
    const S = freshService();
    await new Promise(function(resolve) { S.load('/dict/', resolve); });
    expect(S.getUrl('chase')).toBe('/dict/entries/chase/chase.png');
  });

  it('calls callback on fetch failure without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const S = freshService();
    await expect(new Promise(function(resolve) { S.load('/dict/', resolve); })).resolves.toBeUndefined();
  });

  it('returns null for id not in manifest', async () => {
    const manifest = ['entries/chase/image.json'];
    const imageJson = { concept: 'chase', src: 'entries/chase/chase.png' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(manifest) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(imageJson) });
    vi.stubGlobal('fetch', fetchMock);
    const S = freshService();
    await new Promise(function(resolve) { S.load('/dict/', resolve); });
    expect(S.getUrl('zuma')).toBeNull();
  });
});
