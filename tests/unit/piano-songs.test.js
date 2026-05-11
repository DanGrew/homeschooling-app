import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PIANO_CONFIG } = require('../../core/piano/piano-core.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = resolve(__dirname, '../../assets/audio/songs');

function loadJson(file) {
  return JSON.parse(readFileSync(resolve(SONGS_DIR, file), 'utf8'));
}

const VALID_TOKENS = new Set([
  'C','D','E','F','G','A','B',
  '^C','^D','^E','^F','^G','^A',
  'F#','Bb','^C#'
]);

const BLACK_KEY_TOKENS = new Set(['F#', 'Bb', '^C#']);

const index = loadJson('index.json');
const songs  = index.map(f => Object.assign({ _file: f }, loadJson(f)));

function allTokens(song) {
  const tokens = [];
  song.verses.forEach(v => v.forEach(l => l.forEach(g => g.n.forEach(t => tokens.push(t)))));
  return tokens;
}

describe('song index', () => {
  it('is non-empty', () => expect(index.length).toBeGreaterThan(0));
  it('all listed files exist and parse', () => {
    index.forEach(f => expect(() => loadJson(f)).not.toThrow());
  });
});

describe('song structure', () => {
  songs.forEach(song => {
    it(`${song._file}: has title string`, () => expect(typeof song.title).toBe('string'));
    it(`${song._file}: has verses array`, () => expect(Array.isArray(song.verses)).toBe(true));
    it(`${song._file}: has at least one verse`, () => expect(song.verses.length).toBeGreaterThan(0));
    it(`${song._file}: all groups have n array and t string`, () => {
      song.verses.forEach(v => v.forEach(l => l.forEach(g => {
        expect(Array.isArray(g.n)).toBe(true);
        expect(typeof g.t).toBe('string');
        expect(g.n.length).toBeGreaterThan(0);
      })));
    });
    it(`${song._file}: all tokens are recognised`, () => {
      allTokens(song).forEach(t => expect(VALID_TOKENS.has(t)).toBe(true));
    });
  });
});

describe('accidental coverage', () => {
  const blackNotes = new Set(PIANO_CONFIG.BLACK_KEYS.map(bk => bk.note));

  it('F# covered by Gb4 black key', () => expect(blackNotes.has('Gb4')).toBe(true));
  it('Bb covered by Bb4 black key', () => expect(blackNotes.has('Bb4')).toBe(true));
  it('^C# covered by Cs5 black key', () => expect(blackNotes.has('Cs5')).toBe(true));

  it('every song token needing a black key has one', () => {
    const covered = new Set(PIANO_CONFIG.BLACK_KEYS.map(bk => bk.label.replace('\u2191', '^')));
    songs.forEach(song => {
      allTokens(song)
        .filter(t => BLACK_KEY_TOKENS.has(t))
        .forEach(t => expect(covered.has(t)).toBe(true));
    });
  });
});

describe('simplifications', () => {
  const simplifications = loadJson('simplifications.json');

  it('simplifications file parses as object', () => expect(typeof simplifications).toBe('object'));
  it('no remaining simplifications (all accidentals have direct audio)', () => {
    expect(Object.keys(simplifications)).toHaveLength(0);
  });
});
