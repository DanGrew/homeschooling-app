import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { parseSubPaths, pointAtDist, nearestOnPath, advanceDist, animationProgress, resolveOpts, TraceState } = require('../../core/trace/trace-core.js');

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

describe('resolveOpts', () => {
  it('applies defaults', () => {
    const o = resolveOpts();
    expect(o.tolerance).toBe(45);
    expect(o.maxStep).toBe(0.04);
    expect(o.completionAt).toBe(0.96);
    expect(o.onComplete).toBeNull();
    expect(o.interactive).toBe(true);
    expect(o.progressStroke).toBe('#FFD700');
  });
  it('overrides defaults', () => {
    const cb = () => {};
    const o = resolveOpts({ tolerance: 30, interactive: false, onComplete: cb });
    expect(o.tolerance).toBe(30);
    expect(o.interactive).toBe(false);
    expect(o.onComplete).toBe(cb);
  });
  it('applyProgressAttrs sets attributes when provided', () => {
    const o = resolveOpts({ progressWidth: 20, progressStyle: 'filter:blur(1px)' });
    const el = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
    o.applyProgressAttrs(el);
    expect(el.attrs['stroke-width']).toBe(20);
    expect(el.attrs['style']).toBe('filter:blur(1px)');
  });
  it('applyProgressAttrs skips unset attrs', () => {
    const o = resolveOpts({});
    const el = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
    o.applyProgressAttrs(el);
    expect(el.attrs['stroke-width']).toBeUndefined();
    expect(el.attrs['style']).toBeUndefined();
  });
});

function makeState(opts = {}, strokeCount = 1, totalLen = 100) {
  const strokes = Array.from({ length: strokeCount }, () => makeStroke(totalLen));
  return new TraceState(strokes, resolveOpts(opts));
}

describe('TraceState.reset', () => {
  it('returns cx/cy of first stroke start', () => {
    const r = makeState().reset();
    expect(r.cx).toBe(0);
    expect(r.cy).toBe(0);
  });
  it('returns dashOffsets equal to totalLen per stroke', () => {
    expect(makeState({}, 2).reset().dashOffsets).toEqual([100, 100]);
  });
  it('clears state flags', () => {
    const state = makeState();
    state.done = true; state.active = true; state.currentDist = 50;
    state.reset();
    expect(state.done).toBe(false);
    expect(state.active).toBe(false);
    expect(state.currentDist).toBe(0);
  });
});

describe('TraceState.tryActivate', () => {
  it('activates when pointer near start', () => {
    const state = makeState();
    expect(state.tryActivate(0, 0, 1)).toEqual({ activated: true });
    expect(state.active).toBe(true);
    expect(state.activePointerId).toBe(1);
  });
  it('rejects when out of tolerance', () => {
    expect(makeState().tryActivate(50, 0, 1)).toEqual({ activated: false });
  });
  it('rejects when already active', () => {
    const state = makeState();
    state.active = true;
    expect(state.tryActivate(0, 0, 1)).toEqual({ activated: false });
  });
  it('rejects when done', () => {
    const state = makeState();
    state.done = true;
    expect(state.tryActivate(0, 0, 1)).toEqual({ activated: false });
  });
  it('rejects when not interactive', () => {
    expect(makeState({ interactive: false }).tryActivate(0, 0, 1)).toEqual({ activated: false });
  });
});

describe('TraceState.advance', () => {
  it('returns noop when not active', () => {
    expect(makeState().advance(10, 0, 1).type).toBe('noop');
  });
  it('returns noop with wrong pointerId', () => {
    const state = makeState();
    state.tryActivate(0, 0, 1);
    expect(state.advance(10, 0, 2).type).toBe('noop');
  });
  it('returns noop when out of tolerance', () => {
    const state = makeState();
    state.tryActivate(0, 0, 1);
    expect(state.advance(0, 200, 1).type).toBe('noop');
  });
  it('returns move command for normal advance', () => {
    const state = makeState({ completionAt: 0.99 });
    state.tryActivate(0, 0, 1);
    const cmd = state.advance(10, 0, 1);
    expect(cmd.type).toBe('move');
    expect(cmd.strokeIdx).toBe(0);
    expect(cmd.cx).toBeGreaterThan(0);
  });
  it('returns complete-stroke and done=true on single stroke', () => {
    const state = makeState({ completionAt: 0.5, tolerance: 999, maxStep: 1 });
    state.tryActivate(0, 0, 1);
    state.currentDist = 80;
    const cmd = state.advance(90, 0, 1);
    expect(cmd.type).toBe('complete-stroke');
    expect(cmd.prevStrokeIdx).toBe(0);
    expect(state.done).toBe(true);
  });
  it('calls onComplete on single stroke completion', () => {
    const onComplete = vi.fn();
    const state = makeState({ completionAt: 0.5, tolerance: 999, maxStep: 1, onComplete });
    state.tryActivate(0, 0, 1);
    state.currentDist = 80;
    state.advance(90, 0, 1);
    expect(onComplete).toHaveBeenCalledOnce();
  });
  it('advances to next stroke on multi-stroke completion, done remains false', () => {
    const state = makeState({ completionAt: 0.5, tolerance: 999, maxStep: 1 }, 2);
    state.tryActivate(0, 0, 1);
    state.currentDist = 80;
    const cmd = state.advance(90, 0, 1);
    expect(cmd.type).toBe('complete-stroke');
    expect(state.currentStrokeIdx).toBe(1);
    expect(state.done).toBe(false);
  });
});

describe('TraceState.pointerUp', () => {
  it('returns noop with wrong pointerId', () => {
    const state = makeState();
    state.tryActivate(0, 0, 1);
    expect(state.pointerUp(2).type).toBe('noop');
  });
  it('returns noop when done', () => {
    const state = makeState();
    state.done = true; state.activePointerId = 1;
    expect(state.pointerUp(1).type).toBe('noop');
  });
  it('clears _strokeJustCompleted flag and returns noop', () => {
    const state = makeState();
    state.activePointerId = 1; state._strokeJustCompleted = true;
    const cmd = state.pointerUp(1);
    expect(cmd.type).toBe('noop');
    expect(state._strokeJustCompleted).toBe(false);
  });
  it('resets stroke when active', () => {
    const state = makeState();
    state.tryActivate(0, 0, 1);
    state.currentDist = 40;
    const cmd = state.pointerUp(1);
    expect(cmd.type).toBe('reset-stroke');
    expect(cmd.strokeIdx).toBe(0);
    expect(state.currentDist).toBe(0);
    expect(state.active).toBe(false);
  });
});

describe('TraceState.beginAnimation / stopAnimation', () => {
  it('returns true first call, false when already animating', () => {
    const state = makeState();
    expect(state.beginAnimation()).toBe(true);
    expect(state.beginAnimation()).toBe(false);
  });
  it('resets done flag', () => {
    const state = makeState();
    state.done = true;
    state.beginAnimation();
    expect(state.done).toBe(false);
  });
  it('stopAnimation allows beginAnimation again', () => {
    const state = makeState();
    state.beginAnimation();
    state.stopAnimation();
    expect(state.beginAnimation()).toBe(true);
  });
});

describe('TraceState.animationTick', () => {
  it('done:false before durationMs elapses', () => {
    const state = makeState();
    const cmd = state.animationTick(0, 1000);
    expect(cmd.done).toBe(false);
    expect(cmd.completedIdxs).toEqual([]);
  });
  it('done:true at durationMs, sets state.done', () => {
    const state = makeState();
    state.animationTick(0, 1000);
    const cmd = state.animationTick(1000, 1000);
    expect(cmd.done).toBe(true);
    expect(state.done).toBe(true);
  });
  it('calls onComplete when done', () => {
    const onComplete = vi.fn();
    const state = makeState({ onComplete });
    state.animationTick(0, 1000);
    state.animationTick(1000, 1000);
    expect(onComplete).toHaveBeenCalledOnce();
  });
  it('completedIdxs lists strokes before current', () => {
    const state = new TraceState([makeStroke(50), makeStroke(50)], resolveOpts({}));
    state.animationTick(0, 1000);
    const cmd = state.animationTick(600, 1000);
    expect(cmd.completedIdxs).toEqual([0]);
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
