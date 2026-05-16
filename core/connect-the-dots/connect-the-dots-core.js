export function tightVB(shape) {
  var pad = 60;
  var xs = shape.dots.map(function(d) { return d.cx; });
  var ys = shape.dots.map(function(d) { return d.cy; });
  var parts = shape.vb.split(' ').map(Number);
  var minX = Math.max(0, Math.min.apply(null, xs) - pad);
  var maxX = Math.min(parts[2], Math.max.apply(null, xs) + pad);
  var vbW = maxX - minX;
  var r = Math.round(vbW * 0.055);
  var minY = Math.min(0, Math.min.apply(null, ys) - r);
  var maxY = Math.max(parts[3], Math.max.apply(null, ys) + r);
  return minX + ' ' + minY + ' ' + vbW + ' ' + (maxY - minY);
}

export function tapKey(n, nextDot) {
  return [['correct', n === nextDot], ['wrong', n > nextDot], ['early', true]]
    .filter(function(e) { return e[1]; }).map(function(e) { return e[0]; })[0];
}
