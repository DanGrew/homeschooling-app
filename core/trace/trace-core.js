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

if (typeof module !== 'undefined') module.exports = { parseSubPaths, pointAtDist, nearestOnPath, advanceDist, animationProgress };
