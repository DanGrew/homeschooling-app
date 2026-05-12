import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { bestVoice, extractWordTags, filterWordsByTag, wrapIdx, resolveWordEntry } = require('../../core/word-lesson/word-lesson-core.js');

describe('bestVoice', () => {
  const make = (lang, name) => ({ lang, name });
  it('prefers en-GB female voice', () => {
    const voices = [make('en-US', 'Karen'), make('en-GB', 'Serena'), make('en-GB', 'Daniel')];
    expect(bestVoice(voices).name).toBe('Serena');
  });
  it('falls back to any en-GB', () => {
    const voices = [make('en-US', 'Alex'), make('en-GB', 'Daniel')];
    expect(bestVoice(voices).name).toBe('Daniel');
  });
  it('falls back to any en', () => {
    const voices = [make('en-US', 'Alex'), make('fr-FR', 'Amelie')];
    expect(bestVoice(voices).name).toBe('Alex');
  });
  it('returns null when no match', () => {
    expect(bestVoice([make('fr-FR', 'Amelie')])).toBeNull();
  });
  it('returns null for empty voices', () => {
    expect(bestVoice([])).toBeNull();
  });
});

describe('extractWordTags', () => {
  const words = [
    { tags: ['animals', 'easy'] },
    { tags: ['food'] },
    { tags: ['animals'] },
    {},
  ];
  it('starts with "all"', () => expect(extractWordTags(words)[0]).toBe('all'));
  it('ends with "custom"', () => { const t = extractWordTags(words); expect(t[t.length - 1]).toBe('custom'); });
  it('includes unique tags', () => {
    const t = extractWordTags(words);
    expect(t).toContain('animals');
    expect(t).toContain('food');
    expect(t).toContain('easy');
  });
  it('no duplicate tags', () => {
    const t = extractWordTags(words);
    expect(t.length).toBe(new Set(t).size);
  });
  it('empty words returns ["all", "custom"]', () => {
    expect(extractWordTags([])).toEqual(['all', 'custom']);
  });
  it('tags sorted a-z between "all" and "custom"', () => {
    const t = extractWordTags(words);
    const middle = t.slice(1, -1);
    expect(middle).toEqual([...middle].sort());
  });
});

describe('filterWordsByTag', () => {
  const words = [
    { word: 'cat', tags: ['animals'] },
    { word: 'dog', tags: ['animals', 'easy'] },
    { word: 'apple', tags: ['food'] },
  ];
  it('"all" returns all words', () => expect(filterWordsByTag(words, 'all')).toHaveLength(3));
  it('"custom" returns all words', () => expect(filterWordsByTag(words, 'custom')).toHaveLength(3));
  it('specific tag filters correctly', () => {
    expect(filterWordsByTag(words, 'animals')).toHaveLength(2);
  });
  it('no matching tag returns empty', () => {
    expect(filterWordsByTag(words, 'sport')).toHaveLength(0);
  });
});

describe('wrapIdx', () => {
  it('wraps negative index', () => expect(wrapIdx(-1, 5)).toBe(4));
  it('wraps past end', () => expect(wrapIdx(5, 5)).toBe(0));
  it('stays within range', () => expect(wrapIdx(3, 5)).toBe(3));
  it('handles zero', () => expect(wrapIdx(0, 5)).toBe(0));
});

describe('resolveWordEntry', () => {
  it('lowercases the word', () => {
    expect(resolveWordEntry({ name: 'Cat', tags: [] }).word).toBe('cat');
  });
  it('preserves tags', () => {
    expect(resolveWordEntry({ name: 'cat', tags: ['animals'] }).tags).toEqual(['animals']);
  });
  it('defaults missing tags to []', () => {
    expect(resolveWordEntry({ name: 'cat' }).tags).toEqual([]);
  });
  it('preserves id', () => {
    expect(resolveWordEntry({ name: 'cat', id: 'cat-1', tags: [] }).id).toBe('cat-1');
  });
  it('strips spaces from multi-word names for tracing', () => {
    expect(resolveWordEntry({ name: 'First Aid', tags: [] }).word).toBe('firstaid');
  });
  it('preserves displayName as original name', () => {
    expect(resolveWordEntry({ name: 'First Aid', tags: [] }).displayName).toBe('First Aid');
  });
});
