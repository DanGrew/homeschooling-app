export function edgeKey(a, b) {
  return Math.min(a, b) + ',' + Math.max(a, b);
}

export function buildAdj(shape) {
  var a = shape.dots.map(function () { return []; });
  shape.edges.forEach(function (e) { a[e[0]].push(e[1]); a[e[1]].push(e[0]); });
  return a;
}

export function computeR(shape, dotScale) {
  var scale = dotScale !== undefined ? dotScale : 0.055;
  var vbP = shape.vb.split(' ').map(Number);
  var baseR = Math.max(2, Math.round(vbP[2] * scale));
  if (!shape.edges.length) return baseR;
  var lens = shape.edges.map(function (e) {
    var a = shape.dots[e[0]], b = shape.dots[e[1]];
    return Math.sqrt((b.cx - a.cx) * (b.cx - a.cx) + (b.cy - a.cy) * (b.cy - a.cy));
  }).sort(function (a, b) { return a - b; });
  var p25 = lens[Math.floor(lens.length * 0.25)];
  return Math.max(2, Math.min(baseR, Math.floor(p25 * 0.28)));
}

export function formatTitle(shape) {
  return shape.name + (shape.level !== undefined ? ' [Level ' + shape.level + ']' : '');
}

export function getDotStyleIndex(allDone, isSel) {
  return allDone ? 2 : isSel ? 1 : 0;
}

export function isDotDone(adj, i, completedEdges) {
  return adj[i].length > 0 && adj[i].every(function(n) { return completedEdges.has(edgeKey(i, n)); });
}

export function getInstruction(selectedDot, completedEdges, dots) {
  if (selectedDot !== null) return { text: 'Now tap a dot connected to <b>' + dots[selectedDot].id + '</b>!', isHtml: true };
  if (completedEdges.size > 0) return { text: 'Keep going \u2014 tap any dot!', isHtml: false };
  return { text: 'Tap any dot to start!', isHtml: false };
}

export function tapResult(state, tapIdx, adj, totalEdges) {
  var selectedDot = state.selectedDot;
  var completedEdges = state.completedEdges;
  var complete = state.complete;

  if (complete) return { selectedDot: selectedDot, completedEdges: completedEdges, complete: true, action: 'none' };

  if (selectedDot === null) {
    return { selectedDot: tapIdx, completedEdges: completedEdges, complete: false, action: 'none' };
  }

  if (selectedDot === tapIdx) {
    return { selectedDot: null, completedEdges: completedEdges, complete: false, action: 'none' };
  }

  var key = edgeKey(selectedDot, tapIdx);
  if (completedEdges.has(key)) {
    return { selectedDot: null, completedEdges: completedEdges, complete: false, action: 'none' };
  }

  if (adj[selectedDot].indexOf(tapIdx) >= 0) {
    var newEdges = new Set(completedEdges);
    newEdges.add(key);
    if (newEdges.size === totalEdges) {
      return { selectedDot: null, completedEdges: newEdges, complete: true, action: 'reveal' };
    }
    var iDone = adj[tapIdx].length > 0 && adj[tapIdx].every(function (n) { return newEdges.has(edgeKey(tapIdx, n)); });
    return { selectedDot: iDone ? null : tapIdx, completedEdges: newEdges, complete: false, action: 'draw' };
  }

  return { selectedDot: selectedDot, completedEdges: completedEdges, complete: false, action: 'flash' };
}
