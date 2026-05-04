import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { parseSubPaths, pointAtDist, nearestOnPath, advanceDist, animationProgress } = require('../../core/trace/trace-core.js');

function makeStroke(totalLen, n = 100) {
  const sampleStep = totalLen / n;
  const samples = [];
  for (let i = 0; i <= n; i++) {
    const d = (i / n) * totalLen;
    samples.push({ d, x: d, y: 0 });
  }
  return { totalLen, samples, sampleStep };
}

describe('parseSubPaths', () => {
  it('splits two M commands', () => {
    expect(parseSubPaths('M0 0 L10 10 M20 20 L30 30')).toEqual(['M0 0 L10 10', 'M20 20 L30 30']);
  });
  it('handles single subpath', () => {
    expect(parseSubPaths('M0 0 L10 10')).toEqual(['M0 0 L10 10']);
  });
  it('trims whitespace', () => {
    const result = parseSubPaths('M0 0 L5 5  M10 10 L20 20');
    expect(result[0]).toBe('M0 0 L5 5');
    expect(result[1]).toBe('M10 10 L20 20');
  });
});

describe('pointAtDist', () => {
  const stroke = makeStroke(100);
  it('returns start at dist 0', () => {
    expect(pointAtDist(stroke.samples, stroke.sampleStep, 0).x).toBe(0);
  });
  it('returns end at totalLen', () => {
    expect(pointAtDist(stroke.samples, stroke.sampleStep, 100).x).toBe(100);
  });
  it('returns nearest sample at midpoint', () => {
    expect(pointAtDist(stroke.samples, stroke.sampleStep, 50).x).toBeCloseTo(50, 0);
  });
  it('clamps beyond totalLen', () => {
    expect(pointAtDist(stroke.samples, stroke.sampleStep, 999).x).toBe(100);
  });
});

describe('nearestOnPath', () => {
  const stroke = makeStroke(100);
  it('returns distance at least as large as center', () => {
    expect(nearestOnPath({ x: 30, y: 0 }, 20, stroke)).toBeGreaterThanOrEqual(20);
  });
  it('finds closest point ahead', () => {
    expect(nearestOnPath({ x: 50, y: 0 }, 40, stroke)).toBeCloseTo(50, 0);
  });
  it('does not look behind center', () => {
    expect(nearestOnPath({ x: 5, y: 0 }, 40, stroke)).toBeGreaterThanOrEqual(40);
  });
});

describe('advanceDist', () => {
  const stroke = makeStroke(100);
  it('returns null when point exceeds tolerance', () => {
    expect(advanceDist({ x: 0, y: 100 }, stroke, 0, 45, 0.04)).toBeNull();
  });
  it('returns new dist when within tolerance', () => {
    const d = advanceDist({ x: 10, y: 0 }, stroke, 0, 45, 0.04);
    expect(d).not.toBeNull();
    expect(d).toBeGreaterThanOrEqual(0);
  });
  it('does not move backwards', () => {
    expect(advanceDist({ x: 5, y: 0 }, stroke, 20, 45, 0.04)).toBeGreaterThanOrEqual(20);
  });
  it('caps advance by maxStep * totalLen', () => {
    const d = advanceDist({ x: 99, y: 0 }, stroke, 0, 999, 0.04);
    expect(d).toBeLessThanOrEqual(100 * 0.04 + 1);
  });
});

describe('animationProgress', () => {
  const strokes = [{ totalLen: 50 }, { totalLen: 50 }];
  const totalLen = 100;

  it('t=0 returns start of first stroke', () => {
    expect(animationProgress(0, totalLen, strokes)).toEqual({ strokeIdx: 0, rem: 0 });
  });
  it('t=1 returns end of last stroke', () => {
    expect(animationProgress(1, totalLen, strokes)).toEqual({ strokeIdx: 1, rem: 50 });
  });
  it('t=0.25 stays in first stroke', () => {
    const { strokeIdx, rem } = animationProgress(0.25, totalLen, strokes);
    expect(strokeIdx).toBe(0);
    expect(rem).toBeCloseTo(25);
  });
  it('t=0.6 advances to second stroke', () => {
    const { strokeIdx, rem } = animationProgress(0.6, totalLen, strokes);
    expect(strokeIdx).toBe(1);
    expect(rem).toBeCloseTo(10);
  });
});
