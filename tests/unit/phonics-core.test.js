import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { buildSoundIndex, getAssetPath, deriveLetterSounds, graphemeIdForChar, getShapesForChar } = require('../../core/phonics/phonics-core.js');

const GRAPHEMES = {
  'lower-a': { type: 'letter', characters: 'a', asset: 'assets/language-characters/lower-a.svg', sounds: [{ id: 'a-short', label: 'short a', example: 'apple', clip: 'alpha-a' }, { id: 'a-long', label: 'long a', example: 'cake', clip: 'bt-a-long' }], defaultSound: 'a-short', shapes: ['curve', 'straight line'] },
  'lower-c': { type: 'letter', characters: 'c', asset: 'assets/language-characters/lower-c.svg', sounds: [{ id: 'k', label: 'kuh', example: 'cat', clip: 'alpha-k' }, { id: 's-ss', label: 'ss', example: 'city', clip: 'alpha-s' }], defaultSound: 'k', shapes: ['curve'] },
  'lower-o': { type: 'letter', characters: 'o', asset: 'assets/language-characters/lower-o.svg', sounds: [], defaultSound: null, shapes: ['circle'] },
  'lower-s': { type: 'letter', characters: 's', asset: 'assets/language-characters/lower-s.svg', sounds: [{ id: 's-ss', label: 'ss', example: 'sun', clip: 'alpha-s' }], defaultSound: 's-ss' },
  'upper-a': { type: 'letter', characters: 'A', asset: 'assets/language-characters/upper-a.svg', sounds: [], defaultSound: null },
  'digit-1': { type: 'digit', characters: '1', asset: null, sounds: [], defaultSound: null, shapes: ['straight line'] },
  'digraph-sh': { type: 'digraph', characters: 'sh', asset: null, sounds: [{ id: 'sh', label: 'sh', example: 'shop', clip: 'bt-sh' }], defaultSound: 'sh' },
};

describe('buildSoundIndex', function() {
  it('maps each sound ID to its clipId and grapheme characters', function() {
    var index = buildSoundIndex(GRAPHEMES);
    expect(index['a-short']).toEqual({ clipId: 'alpha-a', characters: 'a' });
    expect(index['k']).toEqual({ clipId: 'alpha-k', characters: 'c' });
    expect(index['sh']).toEqual({ clipId: 'bt-sh', characters: 'sh' });
  });

  it('first-owner wins when multiple graphemes share a sound ID', function() {
    var index = buildSoundIndex(GRAPHEMES);
    expect(index['s-ss'].characters).toBe('c');
  });

  it('skips graphemes with empty sounds array', function() {
    var index = buildSoundIndex(GRAPHEMES);
    expect(Object.keys(index)).not.toContain('');
  });
});

describe('getAssetPath', function() {
  it('returns asset path for known grapheme', function() {
    expect(getAssetPath(GRAPHEMES, 'lower-a')).toBe('assets/language-characters/lower-a.svg');
  });

  it('returns null for asset-less grapheme', function() {
    expect(getAssetPath(GRAPHEMES, 'digraph-sh')).toBeNull();
  });

  it('returns null for unknown grapheme ID', function() {
    expect(getAssetPath(GRAPHEMES, 'lower-z')).toBeNull();
  });
});

describe('deriveLetterSounds', function() {
  it('maps each character to defaultSound', function() {
    expect(deriveLetterSounds(GRAPHEMES, 'ac')).toEqual(['a-short', 'k']);
  });

  it('returns null for characters not in registry', function() {
    expect(deriveLetterSounds(GRAPHEMES, 'a1')).toEqual(['a-short', null]);
  });

  it('lowercases input before lookup', function() {
    expect(deriveLetterSounds(GRAPHEMES, 'AC')).toEqual(['a-short', 'k']);
  });

  it('returns null for digits and other non-letter characters', function() {
    expect(deriveLetterSounds(GRAPHEMES, '1')).toEqual([null]);
  });
});

describe('graphemeIdForChar', function() {
  it('maps lowercase to lower-X', function() {
    expect(graphemeIdForChar('a')).toBe('lower-a');
    expect(graphemeIdForChar('z')).toBe('lower-z');
  });

  it('maps uppercase to upper-x (lowercased)', function() {
    expect(graphemeIdForChar('A')).toBe('upper-a');
    expect(graphemeIdForChar('Z')).toBe('upper-z');
  });

  it('maps digits to digit-N', function() {
    expect(graphemeIdForChar('0')).toBe('digit-0');
    expect(graphemeIdForChar('9')).toBe('digit-9');
  });

  it('returns null for non-alphanumeric', function() {
    expect(graphemeIdForChar('!')).toBeNull();
    expect(graphemeIdForChar(' ')).toBeNull();
  });
});

describe('getShapesForChar', function() {
  it('returns shapes array for known char with shapes', function() {
    expect(getShapesForChar(GRAPHEMES, 'a')).toEqual(['curve', 'straight line']);
    expect(getShapesForChar(GRAPHEMES, 'c')).toEqual(['curve']);
    expect(getShapesForChar(GRAPHEMES, 'o')).toEqual(['circle']);
  });

  it('returns shapes for digit', function() {
    expect(getShapesForChar(GRAPHEMES, '1')).toEqual(['straight line']);
  });

  it('returns undefined when grapheme has no shapes field', function() {
    expect(getShapesForChar(GRAPHEMES, 's')).toBeUndefined();
  });

  it('returns undefined for char not in registry', function() {
    expect(getShapesForChar(GRAPHEMES, 'z')).toBeUndefined();
  });

  it('returns undefined for non-alphanumeric', function() {
    expect(getShapesForChar(GRAPHEMES, '!')).toBeUndefined();
  });
});
