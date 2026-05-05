import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { charToFile, clamp, buildPattern } = require('../../core/character-worksheet/character-worksheet-core.js');

describe('charToFile', () => {
  it('lowercase maps to lower-x.svg', () => expect(charToFile('a')).toBe('lower-a.svg'));
  it('lowercase z', () => expect(charToFile('z')).toBe('lower-z.svg'));
  it('uppercase maps to upper-x.svg (lowercased)', () => expect(charToFile('A')).toBe('upper-a.svg'));
  it('uppercase Z', () => expect(charToFile('Z')).toBe('upper-z.svg'));
  it('digit maps to x.svg', () => expect(charToFile('0')).toBe('0.svg'));
  it('digit 9', () => expect(charToFile('9')).toBe('9.svg'));
  it('unknown char returns null', () => expect(charToFile('!')).toBeNull());
  it('space returns null', () => expect(charToFile(' ')).toBeNull());
  it('undefined returns null', () => expect(charToFile(undefined)).toBeNull());
});

describe('clamp', () => {
  it('returns value within range unchanged', () => expect(clamp(5, 1, 8)).toBe(5));
  it('clamps to min', () => expect(clamp(0, 1, 8)).toBe(1));
  it('clamps to max', () => expect(clamp(10, 1, 8)).toBe(8));
  it('allows min boundary', () => expect(clamp(1, 1, 8)).toBe(1));
  it('allows max boundary', () => expect(clamp(8, 1, 8)).toBe(8));
});

describe('buildPattern', () => {
  it('repeats pattern to fill total', () => {
    expect(buildPattern(['a', 'b'], 4)).toEqual(['a', 'b', 'a', 'b']);
  });
  it('single char fills all slots', () => {
    expect(buildPattern(['x'], 3)).toEqual(['x', 'x', 'x']);
  });
  it('pattern longer than total truncates', () => {
    expect(buildPattern(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });
  it('total zero returns empty array', () => {
    expect(buildPattern(['a'], 0)).toEqual([]);
  });
});
