class TraceEngine {
  constructor(svg, path, ball, progressPath, opts) {
    this.svg = svg;
    this.path = path;
    this.ball = ball;
    this.done = false;
    this.active = false;
    this._strokeJustCompleted = false;

    const o = opts || {};
    this.tolerance = o.tolerance !== undefined ? o.tolerance : 45;
    this.maxStep = o.maxStep !== undefined ? o.maxStep : 0.04;
    this.completionAt = o.completionAt !== undefined ? o.completionAt : 0.96;
    this.onComplete = o.onComplete || null;

    this.strokes = this._parseStrokes();
    this.currentStrokeIdx = 0;
    this.currentDist = 0;

    this.progressPaths = this.strokes.map(stroke => {
      const pp = path.cloneNode(false);
      pp.setAttribute('d', stroke.d);
      pp.setAttribute('stroke', o.progressStroke || '#FFD700');
      if (o.progressWidth) pp.setAttribute('stroke-width', o.progressWidth);
      if (o.progressStyle) pp.setAttribute('style', o.progressStyle);
      pp.setAttribute('stroke-dasharray', stroke.totalLen + ' ' + stroke.totalLen);
      pp.setAttribute('stroke-dashoffset', stroke.totalLen);
      path.parentNode.insertBefore(pp, path.nextSibling);
      return pp;
    });

    this._reset();
    if (o.interactive !== false) this._bind();
  }

  _parseStrokes() {
    const d = this.path.getAttribute('d');
    const subDs = d.match(/M[^Mm]*/g).map(s => s.trim());
    return subDs.map(subD => {
      const mp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      mp.setAttribute('d', subD);
      mp.setAttribute('fill', 'none');
      mp.setAttribute('stroke', 'none');
      this.svg.appendChild(mp);
      const totalLen = mp.getTotalLength();
      const N = 400;
      const samples = [];
      for (let i = 0; i <= N; i++) {
        const dist = (i / N) * totalLen;
        const p = mp.getPointAtLength(dist);
        samples.push({ d: dist, x: p.x, y: p.y });
      }
      return { d: subD, totalLen, samples, sampleStep: totalLen / N, mp };
    });
  }

  restart() {
    this.done = false;
    this._reset();
  }

  _reset() {
    this.currentStrokeIdx = 0;
    this.currentDist = 0;
    this.active = false;
    this._strokeJustCompleted = false;
    this.progressPaths.forEach((pp, i) => {
      pp.setAttribute('stroke-dashoffset', this.strokes[i].totalLen);
    });
    const p = this.strokes[0].mp.getPointAtLength(0);
    this.ball.setAttribute('cx', p.x);
    this.ball.setAttribute('cy', p.y);
  }

  _resetCurrentStroke() {
    this.currentDist = 0;
    this.active = false;
    const stroke = this.strokes[this.currentStrokeIdx];
    this.progressPaths[this.currentStrokeIdx].setAttribute('stroke-dashoffset', stroke.totalLen);
    const p = stroke.mp.getPointAtLength(0);
    this.ball.setAttribute('cx', p.x);
    this.ball.setAttribute('cy', p.y);
  }

  _svgPoint(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  _localNearest(pt, center, stroke) {
    const RADIUS = 30;
    let best = center, bestD2 = Infinity;
    for (let i = 0; i <= RADIUS; i++) {
      const d = Math.min(stroke.totalLen, center + i * stroke.sampleStep);
      const p = stroke.mp.getPointAtLength(d);
      const d2 = (p.x - pt.x) ** 2 + (p.y - pt.y) ** 2;
      if (d2 < bestD2) { bestD2 = d2; best = d; }
    }
    return best;
  }

  _updatePosition(clientX, clientY) {
    const stroke = this.strokes[this.currentStrokeIdx];
    const pt = this._svgPoint(clientX, clientY);
    const ballPt = stroke.mp.getPointAtLength(this.currentDist);
    const distFromBall = Math.sqrt((ballPt.x - pt.x) ** 2 + (ballPt.y - pt.y) ** 2);
    if (distFromBall > this.tolerance) return;

    let d = this._localNearest(pt, this.currentDist, stroke);
    d = Math.max(this.currentDist, d);
    d = Math.min(d, this.currentDist + stroke.totalLen * this.maxStep);
    this.currentDist = d;

    const snap = stroke.mp.getPointAtLength(d);
    this.ball.setAttribute('cx', snap.x);
    this.ball.setAttribute('cy', snap.y);
    this.progressPaths[this.currentStrokeIdx].setAttribute('stroke-dashoffset', stroke.totalLen - d);

    if (d / stroke.totalLen >= this.completionAt) this._completeStroke();
  }

  _completeStroke() {
    this.progressPaths[this.currentStrokeIdx].setAttribute('stroke-dashoffset', 0);
    this._strokeJustCompleted = true;
    this.active = false;

    if (this.currentStrokeIdx < this.strokes.length - 1) {
      this.currentStrokeIdx++;
      this.currentDist = 0;
      const p = this.strokes[this.currentStrokeIdx].mp.getPointAtLength(0);
      this.ball.setAttribute('cx', p.x);
      this.ball.setAttribute('cy', p.y);
    } else {
      this.done = true;
      if (this.onComplete) this.onComplete();
    }
  }

  startAnimation(durationMs) {
    if (this._animating) return;
    this.done = false;
    this._reset();
    this._animating = true;
    const totalLen = this.strokes.reduce((s, str) => s + str.totalLen, 0);
    let startTime = null;

    const tick = (ts) => {
      if (!startTime) startTime = ts;
      const t = Math.min((ts - startTime) / durationMs, 1);
      let rem = t * totalLen;
      let si = 0;
      for (let i = 0; i < this.strokes.length; i++) {
        if (rem <= this.strokes[i].totalLen) { si = i; break; }
        rem -= this.strokes[i].totalLen;
        si = i + 1;
      }
      si = Math.min(si, this.strokes.length - 1);
      rem = Math.min(rem, this.strokes[si].totalLen);

      for (let i = 0; i < si; i++) {
        this.progressPaths[i].setAttribute('stroke-dashoffset', 0);
      }
      this.currentStrokeIdx = si;
      this.currentDist = rem;
      const pt = this.strokes[si].mp.getPointAtLength(rem);
      this.ball.setAttribute('cx', pt.x);
      this.ball.setAttribute('cy', pt.y);
      this.progressPaths[si].setAttribute('stroke-dashoffset', this.strokes[si].totalLen - rem);

      if (t < 1) {
        this._rafId = requestAnimationFrame(tick);
      } else {
        this._animating = false;
        this.done = true;
        if (this.onComplete) this.onComplete();
      }
    };
    this._rafId = requestAnimationFrame(tick);
  }

  stopAnimation() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._animating = false;
  }

  _bind() {
    this.activePointerId = null;

    this.svg.addEventListener('pointerdown', (e) => {
      if (this.done || this.active) return;
      const pt = this._svgPoint(e.clientX, e.clientY);
      const stroke = this.strokes[this.currentStrokeIdx];
      const start = stroke.mp.getPointAtLength(0);
      if ((pt.x - start.x) ** 2 + (pt.y - start.y) ** 2 > this.tolerance ** 2) return;
      e.preventDefault();
      this._strokeJustCompleted = false;
      this.active = true;
      this.activePointerId = e.pointerId;
      this.svg.setPointerCapture(e.pointerId);
    });

    this.svg.addEventListener('pointermove', (e) => {
      if (!this.active || this.done || e.pointerId !== this.activePointerId) return;
      e.preventDefault();
      this._updatePosition(e.clientX, e.clientY);
    });

    const stop = (e) => {
      if (e.pointerId !== this.activePointerId) return;
      if (this.done) return;
      if (this._strokeJustCompleted) { this._strokeJustCompleted = false; return; }
      if (!this.active) return;
      this.active = false;
      this.activePointerId = null;
      this._resetCurrentStroke();
    };
    this.svg.addEventListener('pointerup', stop);
    this.svg.addEventListener('pointercancel', stop);
  }
}
