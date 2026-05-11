import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PIANO_CONFIG, generateNotes, scoreMessage } = require('../../core/piano/piano-core.js');

describe('PIANO_CONFIG', () => {
  it('has 12 notes', () => expect(PIANO_CONFIG.NOTES).toHaveLength(12));
  it('includes F5', () => expect(PIANO_CONFIG.NOTES).toContain('F5'));
  it('includes G5', () => expect(PIANO_CONFIG.NOTES).toContain('G5'));
  it('upper octave labels marked with ↑', () => {
    const upper = PIANO_CONFIG.NOTE_LABELS.filter(l => l.startsWith('\u2191'));
    expect(upper.length).toBe(5);
  });
  it('KEY_COUNT matches NOTES length', () => expect(PIANO_CONFIG.KEY_COUNT).toBe(PIANO_CONFIG.NOTES.length));
  it('NOTE_LABELS same length as NOTES', () => expect(PIANO_CONFIG.NOTE_LABELS).toHaveLength(PIANO_CONFIG.NOTES.length));
  it('KEY_COLORS same length as NOTES', () => expect(PIANO_CONFIG.KEY_COLORS).toHaveLength(PIANO_CONFIG.NOTES.length));
  it('HIT_WINDOW_MS positive', () => expect(PIANO_CONFIG.HIT_WINDOW_MS).toBeGreaterThan(0));
  it('MIN_NOTE_GAP_MS < MAX_NOTE_GAP_MS', () => expect(PIANO_CONFIG.MIN_NOTE_GAP_MS).toBeLessThan(PIANO_CONFIG.MAX_NOTE_GAP_MS));
});

describe('generateNotes', () => {
  let counter = 0;
  const seededRng = () => (counter++ % 10) / 10;

  beforeEach(() => { counter = 0; });

  it('returns NOTE_COUNT notes', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    expect(notes).toHaveLength(PIANO_CONFIG.NOTE_COUNT);
  });

  it('each note has required fields', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    notes.forEach(n => {
      expect(n).toHaveProperty('id');
      expect(n).toHaveProperty('keyIndex');
      expect(n).toHaveProperty('note');
      expect(n).toHaveProperty('spawnTime');
      expect(n).toHaveProperty('hitTime');
      expect(n.state).toBe('active');
    });
  });

  it('keyIndex within valid range', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    notes.forEach(n => {
      expect(n.keyIndex).toBeGreaterThanOrEqual(0);
      expect(n.keyIndex).toBeLessThan(PIANO_CONFIG.KEY_COUNT);
    });
  });

  it('note matches NOTES[keyIndex]', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    notes.forEach(n => expect(n.note).toBe(PIANO_CONFIG.NOTES[n.keyIndex]));
  });

  it('hitTimes are strictly increasing', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i].hitTime).toBeGreaterThan(notes[i - 1].hitTime);
    }
  });

  it('spawnTime = hitTime - LOOKAHEAD_MS', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    notes.forEach(n => expect(n.hitTime - n.spawnTime).toBe(PIANO_CONFIG.LOOKAHEAD_MS));
  });

  it('ids are sequential from 0', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    notes.forEach((n, i) => expect(n.id).toBe(i));
  });

  it('uses Math.random when rng not provided', () => {
    const notes = generateNotes(PIANO_CONFIG);
    expect(notes).toHaveLength(PIANO_CONFIG.NOTE_COUNT);
    notes.forEach(n => expect(typeof n.keyIndex).toBe('number'));
  });
});

describe('PIANO_CONFIG BLACK_KEYS', () => {
  it('has 3 black keys', () => expect(PIANO_CONFIG.BLACK_KEYS).toHaveLength(3));
  it('includes Gb4 (F#)', () => expect(PIANO_CONFIG.BLACK_KEYS.map(b => b.note)).toContain('Gb4'));
  it('includes Bb4', () => expect(PIANO_CONFIG.BLACK_KEYS.map(b => b.note)).toContain('Bb4'));
  it('includes Cs5 (C#)', () => expect(PIANO_CONFIG.BLACK_KEYS.map(b => b.note)).toContain('Cs5'));
  it('WHITE_KEY_COUNT equals NOTES length', () => expect(PIANO_CONFIG.WHITE_KEY_COUNT).toBe(PIANO_CONFIG.NOTES.length));
  it('each has required fields', () => {
    PIANO_CONFIG.BLACK_KEYS.forEach(bk => {
      expect(bk).toHaveProperty('note');
      expect(bk).toHaveProperty('label');
      expect(bk).toHaveProperty('color');
      expect(bk).toHaveProperty('position');
      expect(bk).toHaveProperty('sourceNote');
      expect(bk).toHaveProperty('semitones');
    });
  });
  it('all sourceNotes are in NOTES', () => {
    PIANO_CONFIG.BLACK_KEYS.forEach(bk => expect(PIANO_CONFIG.NOTES).toContain(bk.sourceNote));
  });
  it('all semitones are positive', () => {
    PIANO_CONFIG.BLACK_KEYS.forEach(bk => expect(bk.semitones).toBeGreaterThan(0));
  });
  it('positions within WHITE_KEY_COUNT range', () => {
    PIANO_CONFIG.BLACK_KEYS.forEach(bk => {
      expect(bk.position).toBeGreaterThan(0);
      expect(bk.position).toBeLessThan(PIANO_CONFIG.WHITE_KEY_COUNT);
    });
  });
  it('positions are strictly increasing', () => {
    for (let i = 1; i < PIANO_CONFIG.BLACK_KEYS.length; i++) {
      expect(PIANO_CONFIG.BLACK_KEYS[i].position).toBeGreaterThan(PIANO_CONFIG.BLACK_KEYS[i - 1].position);
    }
  });
});

describe('scoreMessage', () => {
  it('10 → Amazing', () => expect(scoreMessage(10).text).toBe('Amazing!'));
  it('10 → Perfect score sub', () => expect(scoreMessage(10).sub).toBe('Perfect score!'));
  it('7 → Well done', () => expect(scoreMessage(7).text).toBe('Well done!'));
  it('9 → Well done', () => expect(scoreMessage(9).text).toBe('Well done!'));
  it('4 → Good try', () => expect(scoreMessage(4).text).toBe('Good try!'));
  it('6 → Good try', () => expect(scoreMessage(6).text).toBe('Good try!'));
  it('0 → Keep playing', () => expect(scoreMessage(0).text).toBe('Keep playing!'));
  it('3 → Keep playing', () => expect(scoreMessage(3).text).toBe('Keep playing!'));
  it('returns emoji', () => expect(scoreMessage(10).emoji).toBeTruthy());
  it('sub includes count for non-perfect', () => expect(scoreMessage(7).sub).toContain('7'));
});

