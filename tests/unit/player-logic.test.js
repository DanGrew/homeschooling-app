import { activeIndex } from '../../app/activities/story-time/player-logic.js';

const words = [
  { t: 0.0, w: 'In' },
  { t: 0.5, w: 'the' },
  { t: 1.0, w: 'beginning' },
  { t: 1.8, w: 'there' },
  { t: 2.5, w: 'was' },
];

describe('activeIndex', () => {
  it('returns -1 before first word', () => {
    expect(activeIndex(-0.1, words)).toBe(-1);
  });

  it('returns 0 at exact first word timestamp', () => {
    expect(activeIndex(0.0, words)).toBe(0);
  });

  it('returns 0 between first and second word', () => {
    expect(activeIndex(0.3, words)).toBe(0);
  });

  it('returns correct index at exact timestamp', () => {
    expect(activeIndex(1.0, words)).toBe(2);
    expect(activeIndex(1.8, words)).toBe(3);
    expect(activeIndex(2.5, words)).toBe(4);
  });

  it('returns correct index between timestamps', () => {
    expect(activeIndex(1.4, words)).toBe(2);
    expect(activeIndex(2.1, words)).toBe(3);
  });

  it('returns last index when past final word', () => {
    expect(activeIndex(99, words)).toBe(4);
  });

  it('returns -1 for empty words array', () => {
    expect(activeIndex(1.0, [])).toBe(-1);
  });

  it('returns 0 for single word at t=0', () => {
    expect(activeIndex(0.5, [{ t: 0.0, w: 'Hello' }])).toBe(0);
  });
});
