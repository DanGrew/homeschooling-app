import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { makeDistractors } = require('../../core/match-colour-shape/match-colour-shape-core.js');

const COLOURS = ['#E74C3C', '#3498DB', '#2ECC71'];
const TYPES = ['circle', 'square', 'triangle'];

describe('makeDistractors', () => {
  it('returns at most 5 items', () => {
    expect(makeDistractors('#E74C3C', 'circle', COLOURS, TYPES).length).toBeLessThanOrEqual(5);
  });

  it('does not include the target combination', () => {
    const result = makeDistractors('#E74C3C', 'circle', COLOURS, TYPES);
    result.forEach(o => expect(o.col === '#E74C3C' && o.type === 'circle').toBe(false));
  });

  it('includes at least one col-wrong distractor (same type, different colour)', () => {
    const result = makeDistractors('#E74C3C', 'circle', COLOURS, TYPES);
    const colWrong = result.filter(o => o.col !== '#E74C3C' && o.type === 'circle');
    expect(colWrong.length).toBeGreaterThanOrEqual(1);
  });

  it('includes at least one type-wrong distractor (same colour, different type)', () => {
    const result = makeDistractors('#E74C3C', 'circle', COLOURS, TYPES);
    const typeWrong = result.filter(o => o.col === '#E74C3C' && o.type !== 'circle');
    expect(typeWrong.length).toBeGreaterThanOrEqual(1);
  });

  it('all returned items have col and type properties', () => {
    makeDistractors('#3498DB', 'square', COLOURS, TYPES).forEach(o => {
      expect(o).toHaveProperty('col');
      expect(o).toHaveProperty('type');
    });
  });

  it('returns every non-target combination when the pool fits within 5 (2x2)', () => {
    const result = makeDistractors('red', 'circle', ['red', 'blue'], ['circle', 'square']);
    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining([
      { col: 'red', type: 'square' },
      { col: 'blue', type: 'circle' },
      { col: 'blue', type: 'square' },
    ]));
  });

  it('never returns undefined when there is no col-wrong candidate (single colour)', () => {
    const result = makeDistractors('red', 'circle', ['red'], ['circle', 'square']);
    expect(result).toEqual([{ col: 'red', type: 'square' }]);
  });

  it('never returns undefined when there is no type-wrong candidate (single type)', () => {
    const result = makeDistractors('red', 'circle', ['red', 'blue'], ['circle']);
    expect(result).toEqual([{ col: 'blue', type: 'circle' }]);
  });

  it('calls the injected rng to shuffle a multi-item pool', () => {
    let calls = 0;
    const countingRng = () => { calls += 1; return Math.random(); };
    makeDistractors('#E74C3C', 'circle', COLOURS, TYPES, countingRng);
    expect(calls).toBeGreaterThan(0);
  });

  it('shuffles the pool using the injected rng (pins the exact order)', () => {
    let n = 0;
    const seededRng = () => { n += 1; return (n % 10) / 10; };
    const result = makeDistractors('#E74C3C', 'circle', COLOURS, TYPES, seededRng);
    expect(result).toEqual([
      { col: '#3498DB', type: 'circle' },
      { col: '#E74C3C', type: 'triangle' },
      { col: '#2ECC71', type: 'triangle' },
      { col: '#3498DB', type: 'triangle' },
      { col: '#3498DB', type: 'square' },
    ]);
  });

  it('works with Math.random when rng not provided', () => {
    const result = makeDistractors('#E74C3C', 'circle', COLOURS, TYPES);
    expect(result.length).toBeGreaterThan(0);
  });
});
