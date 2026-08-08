import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PIANO_CONFIG, generateNotes, scoreMessage, simpleNoteInfo, noteInfo, isNoteHit, noteTimingDistance } = require('../../core/piano/piano-core.js');

describe('PIANO_CONFIG exact values', () => {
  it('NOTES is the exact expected sequence', () => {
    expect(PIANO_CONFIG.NOTES).toEqual(['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5']);
  });
  it('NOTE_LABELS is the exact expected sequence', () => {
    expect(PIANO_CONFIG.NOTE_LABELS).toEqual(['C','D','E','F','G','A','B','↑C','↑D','↑E','↑F','↑G']);
  });
  it('KEY_COLORS is the exact expected sequence', () => {
    expect(PIANO_CONFIG.KEY_COLORS).toEqual(['#FFB3B3','#FFCBA4','#FFF0A3','#B3FFB3','#A3D9FF','#B3C6FF','#E0B3FF','#FFB3E6','#B3FFEE','#D4FFB3','#FFCCF2','#C5F2CC']);
  });
  it('BLACK_KEYS colours are the exact expected values', () => {
    expect(PIANO_CONFIG.BLACK_KEYS.map(bk => bk.color)).toEqual(['#D4D4FF', '#CCBBFF', '#D4FFEE']);
  });
});

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

  it('first note keyIndex and hitTime follow the seeded rng exactly', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    expect(notes[0].keyIndex).toBe(0);
    expect(notes[0].hitTime).toBe(PIANO_CONFIG.LOOKAHEAD_MS + 600);
  });

  it('second note keyIndex and hitTime follow the seeded rng and gap formula exactly', () => {
    const notes = generateNotes(PIANO_CONFIG, seededRng);
    expect(notes[1].keyIndex).toBe(1);
    expect(notes[1].hitTime).toBe(6000);
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
  it('7 → exact emoji and sub', () => {
    expect(scoreMessage(7).emoji).toBe('🎉');
    expect(scoreMessage(7).sub).toBe('7 out of 10!');
  });
  it('4 → exact emoji and sub', () => {
    expect(scoreMessage(4).emoji).toBe('⭐');
    expect(scoreMessage(4).sub).toBe('4 out of 10!');
  });
  it('0 → exact emoji and sub', () => {
    expect(scoreMessage(0).emoji).toBe('🎵');
    expect(scoreMessage(0).sub).toBe('0 out of 10');
  });
});

describe('isNoteHit', () => {
  it('true when elapsed exactly at hitTime', () => expect(isNoteHit(1000, 1000, 400)).toBe(true));
  it('true within the window before hitTime', () => expect(isNoteHit(700, 1000, 400)).toBe(true));
  it('true within the window after hitTime', () => expect(isNoteHit(1300, 1000, 400)).toBe(true));
  it('true exactly at the window boundary', () => expect(isNoteHit(600, 1000, 400)).toBe(true));
  it('false just outside the window before', () => expect(isNoteHit(599, 1000, 400)).toBe(false));
  it('false just outside the window after', () => expect(isNoteHit(1401, 1000, 400)).toBe(false));
});

describe('noteTimingDistance', () => {
  it('returns the gap when elapsed is before hitTime', () => expect(noteTimingDistance(700, 1000)).toBe(300));
  it('returns the gap when elapsed is after hitTime', () => expect(noteTimingDistance(1300, 1000)).toBe(300));
  it('returns 0 when elapsed equals hitTime', () => expect(noteTimingDistance(1000, 1000)).toBe(0));
});

describe('simpleNoteInfo', () => {
  const noteMap = {
    'C': {note: 'C4', color: '#FFB3B3'},
    'D': {note: 'D4', color: '#FFCBA4'}
  };
  const simplifications = {'Do': 'C', 'Re': 'D', 'Unknown': 'ZZZ'};

  it('returns correct object when token maps to a known note', () => {
    const result = simpleNoteInfo('Do', noteMap, simplifications);
    expect(result).toEqual({note: 'C4', color: '#FFB3B3', simplified: true, displayToken: 'C'});
  });

  it('returns correct object for another token', () => {
    const result = simpleNoteInfo('Re', noteMap, simplifications);
    expect(result).toEqual({note: 'D4', color: '#FFCBA4', simplified: true, displayToken: 'D'});
  });

  it('returns undefined when simplified token not in noteMap', () => {
    const result = simpleNoteInfo('Unknown', noteMap, simplifications);
    expect(result).toBeUndefined();
  });

  it('returns undefined when token not in simplifications', () => {
    const result = simpleNoteInfo('X', noteMap, simplifications);
    expect(result).toBeUndefined();
  });
});

describe('noteInfo', () => {
  const noteMap = {
    'C': {note: 'C4', color: '#FFB3B3'},
    'D': {note: 'D4', color: '#FFCBA4'},
    'noNote': {note: null, color: '#aaa'}
  };
  const simplifications = {'X': 'C'};
  const noNoteInfo = {note: null, color: '#ccc'};

  it('returns direct note info when token is in noteMap with a note', () => {
    const result = noteInfo('C', noteMap, simplifications, noNoteInfo);
    expect(result).toEqual({note: 'C4', color: '#FFB3B3'});
  });

  it('falls back to simpleNoteInfo when token not directly in noteMap', () => {
    const result = noteInfo('X', noteMap, simplifications, noNoteInfo);
    expect(result).toEqual({note: 'C4', color: '#FFB3B3', simplified: true, displayToken: 'C'});
  });

  it('returns noNoteInfo for completely unknown token', () => {
    const result = noteInfo('ZZZ', noteMap, simplifications, noNoteInfo);
    expect(result).toBe(noNoteInfo);
  });

  it('skips direct entry with null note and falls back to simplified', () => {
    const result = noteInfo('noNote', noteMap, simplifications, noNoteInfo);
    expect(result).toBe(noNoteInfo);
  });
});


describe('pianoSortByTitle', () => {
  const { pianoSortByTitle } = require('../../core/piano/piano-core.js');
  it('sorts songs alphabetically by title', () => {
    const songs = [{ title: 'Twinkle' }, { title: 'Baa Baa' }, { title: 'Old MacDonald' }];
    expect(pianoSortByTitle(songs).map(s => s.title)).toEqual(['Baa Baa', 'Old MacDonald', 'Twinkle']);
  });
  it('does not mutate the input array', () => {
    const songs = [{ title: 'B' }, { title: 'A' }];
    pianoSortByTitle(songs);
    expect(songs.map(s => s.title)).toEqual(['B', 'A']);
  });
  it('returns empty array for empty input', () => {
    expect(pianoSortByTitle([])).toEqual([]);
  });
});
