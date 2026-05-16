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

  it('includes one col-wrong distractor (same type, different colour)', () => {
    const result = makeDistractors('#E74C3C', 'circle', COLOURS, TYPES);
    const colWrong = result.filter(o => o.col !== '#E74C3C' && o.type === 'circle');
    expect(colWrong.length).toBeGreaterThanOrEqual(1);
  });

  it('includes one type-wrong distractor (same colour, different type)', () => {
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
});
