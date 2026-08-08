import { parseWord, buildTileSet, validateLetter, isWordComplete, pickWord, slotKey } from '../../core/word-builder/word-builder-core.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

describe('parseWord', () => {
  test('single word', () => {
    const result = parseWord('CAT');
    expect(result).toEqual([
      { char: 'C', type: 'letter' },
      { char: 'A', type: 'letter' },
      { char: 'T', type: 'letter' },
    ]);
  });

  test('uppercases input', () => {
    const result = parseWord('dog');
    expect(result.every(t => t.char === t.char.toUpperCase())).toBe(true);
  });

  test('space becomes decorative', () => {
    const result = parseWord('FIRE TRUCK');
    const space = result.find(t => t.char === ' ');
    expect(space).toBeDefined();
    expect(space.type).toBe('space');
  });

  test('apostrophe becomes decorative', () => {
    const result = parseWord("CAN'T");
    const apos = result.find(t => t.char === "'");
    expect(apos).toBeDefined();
    expect(apos.type).toBe('apostrophe');
  });

  test('empty string', () => {
    expect(parseWord('')).toEqual([]);
  });
});

describe('buildTileSet', () => {
  test('alphabet mode returns A-Z', () => {
    const tiles = buildTileSet('CAT', 'alphabet');
    expect(tiles.sort()).toEqual(ALPHABET);
  });

  test('distractors mode contains all correct letters', () => {
    const tiles = buildTileSet('CAT', 'distractors');
    expect(tiles).toContain('C');
    expect(tiles).toContain('A');
    expect(tiles).toContain('T');
  });

  test('distractors mode has extras beyond unique letters', () => {
    const tiles = buildTileSet('CAT', 'distractors');
    expect(tiles.length).toBeGreaterThan(3);
  });

  test('distractors mode - repeated letters in word counted once', () => {
    const tiles = buildTileSet('MUM', 'distractors');
    expect(tiles).toContain('M');
    expect(tiles).toContain('U');
    const mCount = tiles.filter(t => t === 'M').length;
    expect(mCount).toBe(1);
  });

  test('distractors mode - multi-word skips spaces', () => {
    const tiles = buildTileSet('FIRE TRUCK', 'distractors');
    expect(tiles).not.toContain(' ');
  });

  test('distractors mode - apostrophe word skips apostrophe', () => {
    const tiles = buildTileSet("CAN'T", 'distractors');
    expect(tiles).not.toContain("'");
  });

  test('alphabet mode ignores mode-adjacent input (mode must equal exactly "alphabet")', () => {
    const tiles = buildTileSet('CAT', 'not-alphabet');
    expect(tiles.length).toBeLessThan(26);
  });

  test('distractors mode pins the exact tile set with a seeded rng (noise excludes unique letters)', () => {
    let n = 0; const seededRng = () => { n += 1; return (n % 10) / 10; };
    expect(buildTileSet('CAT', 'distractors', seededRng)).toEqual(['C', 'A', 'R', 'S', 'U', 'Q', 'T']);
  });

  test('distractors mode never duplicates a unique letter as noise', () => {
    const tiles = buildTileSet('CAT', 'distractors');
    expect(new Set(tiles).size).toBe(tiles.length);
  });
});

describe('validateLetter', () => {
  test('correct letter', () => expect(validateLetter('C', 'C')).toBe(true));
  test('case insensitive', () => expect(validateLetter('C', 'c')).toBe(true));
  test('wrong letter', () => expect(validateLetter('C', 'X')).toBe(false));
});

describe('isWordComplete', () => {
  test('all letters locked', () => {
    const slots = [
      { type: 'letter', locked: true },
      { type: 'letter', locked: true },
    ];
    expect(isWordComplete(slots)).toBe(true);
  });

  test('one letter unlocked', () => {
    const slots = [
      { type: 'letter', locked: true },
      { type: 'letter', locked: false },
    ];
    expect(isWordComplete(slots)).toBe(false);
  });

  test('decorative slots ignored', () => {
    const slots = [
      { type: 'letter', locked: true },
      { type: 'space' },
      { type: 'letter', locked: true },
    ];
    expect(isWordComplete(slots)).toBe(true);
  });

  test('empty slots', () => {
    expect(isWordComplete([])).toBe(true);
  });
});

describe('pickWord', () => {
  test('returns item from list', () => {
    const items = [{ label: 'CAT' }, { label: 'DOG' }];
    const result = pickWord(items);
    expect(items).toContain(result);
  });

  test('null on empty list', () => expect(pickWord([])).toBeNull());
  test('null on null', () => expect(pickWord(null)).toBeNull());
  test('pins the exact pick with a seeded rng', () => {
    let n = 4; const seededRng = () => { n += 1; return (n % 10) / 10; };
    const items = [{ label: 'A' }, { label: 'B' }, { label: 'C' }];
    expect(pickWord(items, seededRng)).toBe(items[1]);
  });
});

describe('slotKey', () => {
  test('locked takes priority over everything', () => {
    expect(slotKey({ locked: true, error: true }, true)).toBe('locked');
  });
  test('error takes priority over target', () => {
    expect(slotKey({ locked: false, error: true }, true)).toBe('error');
  });
  test('target when not locked or errored', () => {
    expect(slotKey({ locked: false, error: false }, true)).toBe('target');
  });
  test('default when none apply', () => {
    expect(slotKey({ locked: false, error: false }, false)).toBe('default');
  });
});
