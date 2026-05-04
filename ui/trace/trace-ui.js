function buildStrokes(path, svg) {
  return parseSubPaths(path.getAttribute('d')).map(subD => {
    const mp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mp.setAttribute('d', subD); mp.setAttribute('fill', 'none');
    mp.setAttribute('stroke', 'none'); mp.style.pointerEvents = 'none'; svg.appendChild(mp);
    const totalLen = mp.getTotalLength(), N = 400;
    const samples = Array.from({length: N+1}, (_, i) => { const p = mp.getPointAtLength(i/N*totalLen); return {d: i/N*totalLen, x: p.x, y: p.y}; });
    return {d: subD, totalLen, samples, sampleStep: totalLen/N, mp};
  });
}

function buildProgressPath(path, stroke, o) {
  const pp = path.cloneNode(false);
  pp.setAttribute('d', stroke.d); pp.setAttribute('stroke', o.progressStroke);
  o.applyProgressAttrs(pp);
  pp.setAttribute('stroke-dasharray', stroke.totalLen+' '+stroke.totalLen);
  pp.setAttribute('stroke-dashoffset', stroke.totalLen);
  path.parentNode.insertBefore(pp, path.nextSibling); return pp;
}

const DOWN_CMDS = {
  true:  (eng, e) => { e.preventDefault(); eng.svg.setPointerCapture(e.pointerId); },
  false: () => {}
};
const MOVE_CMDS = {
  move: (eng, cmd, e) => { e.preventDefault(); eng.ball.setAttribute('cx', cmd.cx); eng.ball.setAttribute('cy', cmd.cy); eng.progressPaths[cmd.strokeIdx].setAttribute('stroke-dashoffset', cmd.dashOffset); },
  'complete-stroke': (eng, cmd, e) => { e.preventDefault(); eng.progressPaths[cmd.prevStrokeIdx].setAttribute('stroke-dashoffset', 0); eng.ball.setAttribute('cx', cmd.cx); eng.ball.setAttribute('cy', cmd.cy); },
  noop: () => {}
};
const UP_CMDS = {
  'reset-stroke': (eng, cmd) => { eng.ball.setAttribute('cx', cmd.cx); eng.ball.setAttribute('cy', cmd.cy); eng.progressPaths[cmd.strokeIdx].setAttribute('stroke-dashoffset', cmd.totalLen); },
  noop: () => {}
};
const ANIM_START = {
  true:  (eng, ms) => { eng._applyReset(eng.state.reset()); eng._rafId = requestAnimationFrame(ts => eng._tick(ts, ms)); },
  false: () => {}
};
const TICK_END = {
  false: (eng, ms) => { eng._rafId = requestAnimationFrame(ts => eng._tick(ts, ms)); },
  true:  () => {}
};

class TraceEngine {
  constructor(svg, path, ball, _u, opts) {
    const o = resolveOpts(opts);
    this.svg = svg; this.ball = ball;
    this.strokes = buildStrokes(path, svg);
    this.state = new TraceState(this.strokes, o);
    this.progressPaths = this.strokes.map(s => buildProgressPath(path, s, o));
    this._applyReset(this.state.reset());
    this._bind();
  }
  get done() { return this.state.done; }
  set done(v) { this.state.done = v; }
  get onComplete() { return this.state.opts.onComplete; }
  set onComplete(fn) { this.state.opts.onComplete = fn; }
  _applyReset(r) {
    this.ball.setAttribute('cx', r.cx); this.ball.setAttribute('cy', r.cy);
    r.dashOffsets.forEach((off, i) => this.progressPaths[i].setAttribute('stroke-dashoffset', off));
  }
  _bind() {
    const pt = e => { const p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(this.svg.getScreenCTM().inverse()); };
    this.svg.addEventListener('pointerdown', e => { const p = pt(e); DOWN_CMDS[this.state.tryActivate(p.x, p.y, e.pointerId).activated](this, e); });
    this.svg.addEventListener('pointermove', e => { const p = pt(e); const cmd = this.state.advance(p.x, p.y, e.pointerId); MOVE_CMDS[cmd.type](this, cmd, e); });
    const stop = e => { const cmd = this.state.pointerUp(e.pointerId); UP_CMDS[cmd.type](this, cmd); };
    this.svg.addEventListener('pointerup', stop);
    this.svg.addEventListener('pointercancel', stop);
  }
  _tick(ts, ms) {
    const cmd = this.state.animationTick(ts, ms);
    cmd.completedIdxs.forEach(i => this.progressPaths[i].setAttribute('stroke-dashoffset', 0));
    this.progressPaths[cmd.strokeIdx].setAttribute('stroke-dashoffset', cmd.dashOffset);
    this.ball.setAttribute('cx', cmd.cx); this.ball.setAttribute('cy', cmd.cy);
    TICK_END[cmd.done](this, ms);
  }
  startAnimation(ms) { ANIM_START[this.state.beginAnimation()](this, ms); }
  stopAnimation() { cancelAnimationFrame(this._rafId); this.state.stopAnimation(); }
  restart() { this._applyReset(this.state.reset()); }
}
