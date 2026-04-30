class TraceEngine {
  constructor(svg, path, ball, progressPath, opts) {
    this.svg = svg;
    this.path = path;
    this.ball = ball;
    this.totalLen = path.getTotalLength();
    this.currentDist = 0;
    this.active = false;
    this.done = false;

    const o = opts || {};
    this.tolerance = o.tolerance !== undefined ? o.tolerance : 30;
    this.maxStep = o.maxStep !== undefined ? o.maxStep : 0.04;
    this.completionAt = o.completionAt !== undefined ? o.completionAt : 0.96;
    this.onComplete = o.onComplete || null;

    // Accept explicit progressPath or clone base path as overlay
    if (progressPath) {
      this.progressPath = progressPath;
    } else {
      this.progressPath = path.cloneNode(false);
      this.progressPath.setAttribute('stroke', o.progressStroke || '#FFD700');
      if (o.progressWidth) this.progressPath.setAttribute('stroke-width', o.progressWidth);
      if (o.progressStyle) this.progressPath.setAttribute('style', o.progressStyle);
      path.parentNode.insertBefore(this.progressPath, path.nextSibling);
    }

    const N = 400;
    this.samples = [];
    for (let i = 0; i <= N; i++) {
      const d = (i / N) * this.totalLen;
      const p = path.getPointAtLength(d);
      this.samples.push({ d, x: p.x, y: p.y });
    }
    this.sampleStep = this.totalLen / N;

    this.progressPath.setAttribute('stroke-dasharray', this.totalLen + ' ' + this.totalLen);
    this.progressPath.setAttribute('stroke-dashoffset', this.totalLen);

    this._reset();
    this._bind();
  }

  restart() {
    this.done = false;
    this._reset();
  }

  _reset() {
    this.currentDist = 0;
    this.active = false;
    const p = this.path.getPointAtLength(0);
    this.ball.setAttribute('cx', p.x);
    this.ball.setAttribute('cy', p.y);
    this.progressPath.setAttribute('stroke-dashoffset', this.totalLen);
  }

  _svgPoint(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  _coarseNearest(pt) {
    let bestIdx = 0, bestD2 = Infinity;
    for (let i = 0; i < this.samples.length; i++) {
      const s = this.samples[i];
      const d2 = (s.x - pt.x) ** 2 + (s.y - pt.y) ** 2;
      if (d2 < bestD2) { bestD2 = d2; bestIdx = i; }
    }
    return this.samples[bestIdx].d;
  }

  _localNearest(pt, center) {
    const RADIUS = 15;
    let best = center, bestD2 = Infinity;
    for (let i = -RADIUS; i <= RADIUS; i++) {
      const d = Math.max(0, Math.min(this.totalLen, center + i * this.sampleStep * 0.5));
      const p = this.path.getPointAtLength(d);
      const d2 = (p.x - pt.x) ** 2 + (p.y - pt.y) ** 2;
      if (d2 < bestD2) { bestD2 = d2; best = d; }
    }
    return best;
  }

  _updatePosition(clientX, clientY) {
    const pt = this._svgPoint(clientX, clientY);
    const ballPt = this.path.getPointAtLength(this.currentDist);
    const distFromBall = Math.sqrt((ballPt.x - pt.x) ** 2 + (ballPt.y - pt.y) ** 2);
    if (distFromBall > this.tolerance) return;

    let d = this._localNearest(pt, this.currentDist);
    d = Math.max(this.currentDist, d);
    d = Math.min(d, this.currentDist + this.totalLen * this.maxStep);
    this.currentDist = d;

    const snap = this.path.getPointAtLength(d);
    this.ball.setAttribute('cx', snap.x);
    this.ball.setAttribute('cy', snap.y);
    this.progressPath.setAttribute('stroke-dashoffset', this.totalLen - d);

    if (d / this.totalLen >= this.completionAt) this._complete();
  }

  _bind() {
    this.svg.addEventListener('pointerdown', (e) => {
      if (this.done) return;
      const pt = this._svgPoint(e.clientX, e.clientY);
      const start = this.path.getPointAtLength(0);
      if ((pt.x - start.x) ** 2 + (pt.y - start.y) ** 2 > this.tolerance ** 2) return;
      e.preventDefault();
      this.active = true;
      this.svg.setPointerCapture(e.pointerId);
    });

    this.svg.addEventListener('pointermove', (e) => {
      if (!this.active || this.done) return;
      e.preventDefault();
      this._updatePosition(e.clientX, e.clientY);
    });

    const stop = () => {
      if (!this.active || this.done) return;
      this.active = false;
      this._reset();
    };
    this.svg.addEventListener('pointerup', stop);
    this.svg.addEventListener('pointercancel', stop);
  }

  _complete() {
    this.done = true;
    this.active = false;
    const p = this.path.getPointAtLength(this.totalLen);
    this.ball.setAttribute('cx', p.x);
    this.ball.setAttribute('cy', p.y);
    this.progressPath.setAttribute('stroke-dashoffset', 0);
    if (this.onComplete) this.onComplete();
  }
}
