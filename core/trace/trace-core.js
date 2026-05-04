function parseSubPaths(d) {
  return d.match(/M[^Mm]*/g).map(s => s.trim());
}

function pointAtDist(samples, sampleStep, dist) {
  const idx = Math.min(samples.length - 1, Math.round(dist / sampleStep));
  return samples[idx];
}

function nearestOnPath(pt, center, stroke) {
  const RADIUS = 30;
  const centerIdx = Math.min(stroke.samples.length - 1, Math.round(center / stroke.sampleStep));
  let best = center, bestD2 = Infinity;
  for (let i = 0; i <= RADIUS; i++) {
    const idx = Math.min(stroke.samples.length - 1, centerIdx + i);
    const s = stroke.samples[idx];
    const d2 = (s.x - pt.x) ** 2 + (s.y - pt.y) ** 2;
    if (d2 < bestD2) { bestD2 = d2; best = s.d; }
  }
  return best;
}

function advanceDist(pt, stroke, currentDist, tolerance, maxStep) {
  const ballPt = pointAtDist(stroke.samples, stroke.sampleStep, currentDist);
  const distFromBall = Math.sqrt((ballPt.x - pt.x) ** 2 + (ballPt.y - pt.y) ** 2);
  if (distFromBall > tolerance) return null;
  let d = nearestOnPath(pt, currentDist, stroke);
  d = Math.max(currentDist, d);
  d = Math.min(d, currentDist + stroke.totalLen * maxStep);
  return d;
}

function animationProgress(t, totalLen, strokes) {
  let rem = t * totalLen;
  let si = 0;
  for (let i = 0; i < strokes.length; i++) {
    if (rem <= strokes[i].totalLen) { si = i; break; }
    rem -= strokes[i].totalLen;
    si = i + 1;
  }
  si = Math.min(si, strokes.length - 1);
  rem = Math.min(rem, strokes[si].totalLen);
  return { strokeIdx: si, rem };
}

function resolveOpts(o) {
  const r = o || {};
  return {
    tolerance:    r.tolerance    ?? 45,
    maxStep:      r.maxStep      ?? 0.04,
    completionAt: r.completionAt ?? 0.96,
    onComplete:   r.onComplete   || null,
    interactive:  r.interactive  !== false,
    progressStroke: r.progressStroke || '#FFD700',
    applyProgressAttrs: pp => {
      if (r.progressWidth) pp.setAttribute('stroke-width', r.progressWidth);
      if (r.progressStyle) pp.setAttribute('style', r.progressStyle);
    },
  };
}

class TraceState {
  constructor(strokes, opts) {
    this.strokes = strokes; this.opts = opts;
    this.done = false; this.active = false; this.activePointerId = null;
    this._strokeJustCompleted = false; this._animating = false; this._startTime = null;
    this.currentStrokeIdx = 0; this.currentDist = 0;
  }
  reset() {
    this.currentStrokeIdx = 0; this.currentDist = 0;
    this.done = false; this.active = false; this.activePointerId = null;
    this._strokeJustCompleted = false;
    const p = this.strokes[0].samples[0];
    return { cx: p.x, cy: p.y, dashOffsets: this.strokes.map(s => s.totalLen) };
  }
  tryActivate(svgX, svgY, pointerId) {
    if (this.done || this.active || !this.opts.interactive) return { activated: false };
    const s = this.strokes[this.currentStrokeIdx].samples[0];
    if ((svgX - s.x) ** 2 + (svgY - s.y) ** 2 > this.opts.tolerance ** 2) return { activated: false };
    this._strokeJustCompleted = false; this.active = true; this.activePointerId = pointerId;
    return { activated: true };
  }
  advance(svgX, svgY, pointerId) {
    if (!this.active || this.done || pointerId !== this.activePointerId) return { type: 'noop' };
    const stroke = this.strokes[this.currentStrokeIdx];
    const d = advanceDist({ x: svgX, y: svgY }, stroke, this.currentDist, this.opts.tolerance, this.opts.maxStep);
    if (d === null) return { type: 'noop' };
    this.currentDist = d;
    const snap = pointAtDist(stroke.samples, stroke.sampleStep, d);
    if (d / stroke.totalLen < this.opts.completionAt) return { type: 'move', cx: snap.x, cy: snap.y, strokeIdx: this.currentStrokeIdx, dashOffset: stroke.totalLen - d };
    return this._completeStroke(snap);
  }
  _completeStroke(snap) {
    const prev = this.currentStrokeIdx;
    this._strokeJustCompleted = true; this.active = false;
    if (prev < this.strokes.length - 1) {
      this.currentStrokeIdx++; this.currentDist = 0;
      const p = this.strokes[this.currentStrokeIdx].samples[0];
      return { type: 'complete-stroke', prevStrokeIdx: prev, cx: p.x, cy: p.y };
    }
    this.done = true;
    this.opts.onComplete && this.opts.onComplete();
    return { type: 'complete-stroke', prevStrokeIdx: prev, cx: snap.x, cy: snap.y };
  }
  pointerUp(pointerId) {
    if (pointerId !== this.activePointerId || this.done) return { type: 'noop' };
    if (this._strokeJustCompleted) { this._strokeJustCompleted = false; return { type: 'noop' }; }
    if (!this.active) return { type: 'noop' };
    this.active = false; this.activePointerId = null;
    const s = this.strokes[this.currentStrokeIdx];
    this.currentDist = 0;
    return { type: 'reset-stroke', strokeIdx: this.currentStrokeIdx, totalLen: s.totalLen, cx: s.samples[0].x, cy: s.samples[0].y };
  }
  beginAnimation() {
    if (this._animating) return false;
    this._animating = true; this._startTime = null; this.done = false; return true;
  }
  stopAnimation() { this._animating = false; }
  animationTick(ts, durationMs) {
    this._startTime = this._startTime ?? ts;
    const t = Math.min((ts - this._startTime) / durationMs, 1);
    const totalLen = this.strokes.reduce((s, str) => s + str.totalLen, 0);
    const { strokeIdx: si, rem } = animationProgress(t, totalLen, this.strokes);
    const pt = pointAtDist(this.strokes[si].samples, this.strokes[si].sampleStep, rem);
    const done = t >= 1;
    if (done) { this._animating = false; this.done = true; this.opts.onComplete && this.opts.onComplete(); }
    return { completedIdxs: Array.from({ length: si }, (_, i) => i), strokeIdx: si, cx: pt.x, cy: pt.y, dashOffset: this.strokes[si].totalLen - rem, done };
  }
}

if (typeof module !== 'undefined') module.exports = { parseSubPaths, pointAtDist, nearestOnPath, advanceDist, animationProgress, resolveOpts, TraceState };
