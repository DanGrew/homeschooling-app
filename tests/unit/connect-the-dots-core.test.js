import { describe, it, expect } from 'vitest';
import { tightVB, tapKey } from '../../core/connect-the-dots/connect-the-dots-core.js';

const makeShape = (dots, vb) => ({ dots, vb });

describe('tightVB', () => {
  it('returns a space-separated viewBox string', () => {
    const shape = makeShape([{cx:100,cy:100},{cx:200,cy:200}], '0 0 300 300');
    const result = tightVB(shape);
    expect(typeof result).toBe('string');
    expect(result.split(' ')).toHaveLength(4);
  });

  it('pads 60px around dot extents', () => {
    const shape = makeShape([{cx:100,cy:100},{cx:200,cy:200}], '0 0 300 300');
    const [minX] = tightVB(shape).split(' ').map(Number);
    expect(minX).toBe(Math.max(0, 100 - 60));
  });

  it('clamps minX to 0', () => {
    const shape = makeShape([{cx:10,cy:50}], '0 0 300 300');
    const [minX] = tightVB(shape).split(' ').map(Number);
    expect(minX).toBeGreaterThanOrEqual(0);
  });

  it('height covers full original vb height when dots fit inside', () => {
    const shape = makeShape([{cx:100,cy:100}], '0 0 300 300');
    const parts = tightVB(shape).split(' ').map(Number);
    expect(parts[3]).toBeGreaterThanOrEqual(300);
  });
});

describe('tapKey', () => {
  it('returns "correct" when n equals nextDot', () => {
    expect(tapKey(3, 3)).toBe('correct');
  });

  it('returns "wrong" when n is ahead of nextDot', () => {
    expect(tapKey(5, 3)).toBe('wrong');
  });

  it('returns "early" when n is behind nextDot', () => {
    expect(tapKey(2, 3)).toBe('early');
  });

  it('returns "early" for dot 1 when nextDot is 3', () => {
    expect(tapKey(1, 3)).toBe('early');
  });
});
