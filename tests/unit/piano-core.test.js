import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PIANO_CONFIG, generateNotes, scoreMessage, once } = require('../../core/piano/piano-core.js');

describe('PIANO_CONFIG', () => {
  it('has 10 notes', () => expect(PIANO_CONFIG.NOTES).toHaveLength(10));
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

describe('once', () => {
  it('calls fn only on first invocation', () => {
    let calls = 0;
    const f = once(() => { calls++; return 42; });
    f(); f(); f();
    expect(calls).toBe(1);
  });
  it('returns same value on every call', () => {
    const f = once(() => ({ x: 1 }));
    expect(f()).toBe(f());
  });
  it('returns the fn return value', () => {
    expect(once(() => 99)()).toBe(99);
  });
});
