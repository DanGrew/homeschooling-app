import { describe, it, expect } from 'vitest';
import { tightVB, tapKey } from '../../core/connect-the-dots/connect-the-dots-core.js';

describe('tightVB', () => {
  const shape = {
    vb: '0 0 500 500',
    dots: [{ cx: 100, cy: 100 }, { cx: 300, cy: 400 }]
  };

  it('returns a string of 4 space-separated numbers', () => {
    const parts = tightVB(shape).split(' ').map(Number);
    expect(parts).toHaveLength(4);
    parts.forEach(p => expect(isNaN(p)).toBe(false));
  });

  it('minX is 0 when dots are close to left edge', () => {
    const s = { vb: '0 0 500 500', dots: [{ cx: 10, cy: 200 }] };
    const parts = tightVB(s).split(' ').map(Number);
    expect(parts[0]).toBe(0);
  });

  it('width shrinks when dots are far from right edge', () => {
    const wide = { vb: '0 0 1000 500', dots: [{ cx: 100, cy: 200 }, { cx: 200, cy: 200 }] };
    const narrow = { vb: '0 0 500 500', dots: [{ cx: 100, cy: 200 }, { cx: 200, cy: 200 }] };
    const wParts = tightVB(wide).split(' ').map(Number);
    const nParts = tightVB(narrow).split(' ').map(Number);
    expect(wParts[2]).toBe(nParts[2]);
  });
});

describe('tapKey', () => {
  it('returns correct when n equals nextDot', () => expect(tapKey(3, 3)).toBe('correct'));
  it('returns wrong when n is greater than nextDot', () => expect(tapKey(5, 3)).toBe('wrong'));
  it('returns early when n is less than nextDot', () => expect(tapKey(1, 3)).toBe('early'));
  it('returns early for n=0 (never a valid dot)', () => expect(tapKey(0, 1)).toBe('early'));
});
