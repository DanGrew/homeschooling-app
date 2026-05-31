// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initAudio, loadGraphemes, loadRegistry, playSound, playSoundAsync, playSequence, getAssetPath, getAssetPathForChar, deriveLetterSounds, _reset } from '../../components/phonics/phonics-service.js';

const REGISTRY = {
  'lower-a': { type: 'letter', characters: 'a', asset: 'assets/language-characters/lower-a.svg', sounds: [{ id: 'a-short', label: 'short a', example: 'apple', clip: 'alpha-a' }], defaultSound: 'a-short' },
  'lower-b': { type: 'letter', characters: 'b', asset: 'assets/language-characters/lower-b.svg', sounds: [{ id: 'b', label: 'buh', example: 'ball', clip: 'alpha-b' }], defaultSound: 'b' },
  'upper-a': { type: 'letter', characters: 'A', asset: 'assets/language-characters/upper-a.svg', sounds: [], defaultSound: null },
};
const MANIFEST = { 'alpha-a': 'alphasounds-a.mp3', 'alpha-b': 'alphasounds-b.mp3' };

function makeFakeBuffer() { return new ArrayBuffer(8); }

var REGISTRY_URL = 'content/phonics/graphemes.json';
var MANIFEST_URL = 'content/phonics/manifest.json';
var AUDIO_BASE = 'assets/audio/phonics/';

function makeCtx() {
  var src = { buffer: null, connect: vi.fn(), start: vi.fn(function() { if (typeof src.onended === 'function') setTimeout(src.onended, 0); }) };
  var ctx = {
    state: 'running',
    resume: vi.fn(() => Promise.resolve()),
    createBufferSource: vi.fn(() => src),
    destination: {},
    decodeAudioData: vi.fn(function(_buf, resolve) { resolve({ type: 'AudioBuffer' }); }),
  };
  return { ctx, src };
}

function setupLoaded() {
  global.fetch = vi.fn().mockImplementation(function(url) {
    if (url === REGISTRY_URL) return Promise.resolve({ json: () => Promise.resolve(REGISTRY) });
    if (url === MANIFEST_URL) return Promise.resolve({ json: () => Promise.resolve(MANIFEST) });
    return Promise.resolve({ arrayBuffer: () => Promise.resolve(makeFakeBuffer()) });
  });
  var { ctx, src } = makeCtx();
  window.AudioContext = vi.fn(function() { return ctx; });
  return { ctx, src };
}

beforeEach(function() {
  _reset();
  vi.clearAllMocks();
  global.speechSynthesis = { speak: vi.fn() };
  global.SpeechSynthesisUtterance = vi.fn(function(text) { this.text = text; });
});

describe('loadGraphemes', function() {
  it('fetches registry, manifest, and all unique clip files', async function() {
    setupLoaded();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    var urls = global.fetch.mock.calls.map(function(c) { return c[0]; });
    expect(urls).toContain(REGISTRY_URL);
    expect(urls).toContain(MANIFEST_URL);
    expect(urls).toContain(AUDIO_BASE + 'alphasounds-a.mp3');
    expect(urls).toContain(AUDIO_BASE + 'alphasounds-b.mp3');
  });

  it('uses import.meta.url-derived URLs when called with no args', async function() {
    global.fetch = vi.fn().mockImplementation(function(url) {
      if (url.endsWith('graphemes.json')) return Promise.resolve({ json: () => Promise.resolve(REGISTRY) });
      if (url.endsWith('manifest.json')) return Promise.resolve({ json: () => Promise.resolve(MANIFEST) });
      return Promise.resolve({ arrayBuffer: () => Promise.resolve(makeFakeBuffer()) });
    });
    await loadGraphemes();
    var urls = global.fetch.mock.calls.map(function(c) { return c[0]; });
    expect(urls.some(function(u) { return u.endsWith('graphemes.json'); })).toBe(true);
    expect(urls.some(function(u) { return u.endsWith('manifest.json'); })).toBe(true);
  });

  it('deduplicates clip fetches when multiple sounds share a clip', async function() {
    var sharedManifest = { 'alpha-a': 'alphasounds-a.mp3', 'alpha-a2': 'alphasounds-a.mp3' };
    global.fetch = vi.fn().mockImplementation(function(url) {
      if (url === REGISTRY_URL) return Promise.resolve({ json: () => Promise.resolve(REGISTRY) });
      if (url === MANIFEST_URL) return Promise.resolve({ json: () => Promise.resolve(sharedManifest) });
      return Promise.resolve({ arrayBuffer: () => Promise.resolve(makeFakeBuffer()) });
    });
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    var audioCalls = global.fetch.mock.calls.filter(function(c) { return c[0].includes('alphasounds-a'); });
    expect(audioCalls.length).toBe(1);
  });
});

describe('playSound', function() {
  it('creates and starts BufferSourceNode for loaded sound', async function() {
    var { ctx, src } = setupLoaded();
    initAudio();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    playSound('a-short');
    await ctx.resume();
    await new Promise(function(r) { setTimeout(r, 0); });
    expect(ctx.decodeAudioData).toHaveBeenCalled();
  });

  it('calls speechSynthesis.speak with grapheme characters for unknown sound ID', function() {
    playSound('unknown-sound');
    expect(speechSynthesis.speak).toHaveBeenCalled();
    var utt = speechSynthesis.speak.mock.calls[0][0];
    expect(utt.text).toBe('unknown-sound');
  });

  it('falls back to grapheme characters when clip buffer missing', async function() {
    global.fetch = vi.fn().mockImplementation(function(url) {
      if (url === REGISTRY_URL) return Promise.resolve({ json: () => Promise.resolve(REGISTRY) });
      if (url === MANIFEST_URL) return Promise.resolve({ json: () => Promise.resolve(MANIFEST) });
      return Promise.reject(new Error('network'));
    });
    var { ctx } = makeCtx();
    window.AudioContext = vi.fn(function() { return ctx; });
    initAudio();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    playSound('a-short');
    expect(speechSynthesis.speak).toHaveBeenCalled();
    var utt = speechSynthesis.speak.mock.calls[0][0];
    expect(utt.text).toBe('a');
  });
});

describe('playSequence', function() {
  it('calls playSound for each ID in order with setTimeout gaps', function() {
    vi.useFakeTimers();
    var played = [];
    global.speechSynthesis = { speak: vi.fn(function(u) { played.push(u.text); }) };
    playSequence(['unknown-x', 'unknown-y', 'unknown-z'], 100);
    vi.advanceTimersByTime(300);
    expect(played).toEqual(['unknown-x', 'unknown-y', 'unknown-z']);
    vi.useRealTimers();
  });

  it('defaults to 200ms gap', function() {
    vi.useFakeTimers();
    var played = [];
    global.speechSynthesis = { speak: vi.fn(function(u) { played.push(u.text); }) };
    playSequence(['unknown-p', 'unknown-q']);
    vi.advanceTimersByTime(199);
    expect(played.length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(played.length).toBe(2);
    vi.useRealTimers();
  });
});

describe('playSoundAsync', function() {
  it('returns a Promise that resolves after buffer playback ends', async function() {
    var { ctx } = setupLoaded();
    initAudio();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    var resolved = false;
    var p = playSoundAsync('a-short').then(function() { resolved = true; });
    await ctx.resume();
    await new Promise(function(r) { setTimeout(r, 10); });
    await p;
    expect(resolved).toBe(true);
  });

  it('resolves immediately with TTS fallback for unknown sound', async function() {
    await playSoundAsync('unknown-xyz');
    expect(speechSynthesis.speak).toHaveBeenCalled();
  });

  it('resolves immediately with TTS fallback when no audio context', async function() {
    global.fetch = vi.fn().mockImplementation(function(url) {
      if (url === REGISTRY_URL) return Promise.resolve({ json: () => Promise.resolve(REGISTRY) });
      if (url === MANIFEST_URL) return Promise.resolve({ json: () => Promise.resolve(MANIFEST) });
      return Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    });
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    await playSoundAsync('a-short');
    expect(speechSynthesis.speak).toHaveBeenCalled();
  });
});

describe('getAssetPath', function() {
  it('returns asset path for known grapheme', async function() {
    setupLoaded();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    expect(getAssetPath('lower-a')).toBe('assets/language-characters/lower-a.svg');
  });

  it('returns null for unknown grapheme', async function() {
    setupLoaded();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    expect(getAssetPath('lower-z')).toBeNull();
  });
});

describe('loadRegistry', function() {
  it('fetches only the registry JSON', async function() {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(REGISTRY) });
    await loadRegistry(REGISTRY_URL, '../../../');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(REGISTRY_URL);
  });

  it('getAssetPath prepends assetBasePath after loadRegistry', async function() {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(REGISTRY) });
    await loadRegistry(REGISTRY_URL, '../../../');
    expect(getAssetPath('lower-a')).toBe('../../../assets/language-characters/lower-a.svg');
  });

  it('getAssetPath returns null for unknown grapheme after loadRegistry', async function() {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(REGISTRY) });
    await loadRegistry(REGISTRY_URL, '../../../');
    expect(getAssetPath('lower-z')).toBeNull();
  });

  it('uses import.meta.url-derived registry URL when called with no args', async function() {
    global.fetch = vi.fn().mockImplementation(function(url) {
      if (url.endsWith('graphemes.json')) return Promise.resolve({ json: () => Promise.resolve(REGISTRY) });
      return Promise.reject(new Error('unexpected: ' + url));
    });
    await loadRegistry();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toMatch(/graphemes\.json$/);
  });

  it('getAssetPath prepends import.meta.url-derived base when called with no args', async function() {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(REGISTRY) });
    await loadRegistry();
    var result = getAssetPath('lower-a');
    expect(result).not.toBeNull();
    expect(result).toMatch(/assets\/language-characters\/lower-a\.svg$/);
  });
});

describe('getAssetPathForChar', function() {
  async function setupRegistry() {
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(REGISTRY) });
    await loadRegistry(REGISTRY_URL, '../../../');
  }

  it('returns asset path for lowercase letter', async function() {
    await setupRegistry();
    expect(getAssetPathForChar('a')).toBe('../../../assets/language-characters/lower-a.svg');
  });

  it('returns asset path for uppercase letter', async function() {
    await setupRegistry();
    expect(getAssetPathForChar('A')).toBe('../../../assets/language-characters/upper-a.svg');
  });

  it('returns null for char not in registry (digit)', async function() {
    await setupRegistry();
    expect(getAssetPathForChar('0')).toBeNull();
  });

  it('returns null for non-alphanumeric', async function() {
    await setupRegistry();
    expect(getAssetPathForChar('!')).toBeNull();
  });
});

describe('deriveLetterSounds', function() {
  it('maps each character to defaultSound from registry', async function() {
    setupLoaded();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    expect(deriveLetterSounds('ab')).toEqual(['a-short', 'b']);
  });

  it('returns null for characters not in registry', async function() {
    setupLoaded();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    expect(deriveLetterSounds('a1')).toEqual(['a-short', null]);
  });

  it('lowercases input before lookup', async function() {
    setupLoaded();
    await loadGraphemes(REGISTRY_URL, MANIFEST_URL, AUDIO_BASE);
    expect(deriveLetterSounds('AB')).toEqual(['a-short', 'b']);
  });
});
