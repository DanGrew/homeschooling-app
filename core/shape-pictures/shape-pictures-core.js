var round = (n) => +n.toFixed(3);
var pointsAttr = (pts) => pts.map((p) => p.map(round).join(',')).join(' ');
var polar = (cx, cy, r, deg) => [round(cx + r * Math.cos(deg * Math.PI / 180)), round(cy + r * Math.sin(deg * Math.PI / 180))];

var SEMI_ENDS = {
  up: (cx, cy, r) => [[cx - r, cy], [cx + r, cy]],
  down: (cx, cy, r) => [[cx + r, cy], [cx - r, cy]],
  left: (cx, cy, r) => [[cx, cy + r], [cx, cy - r]],
  right: (cx, cy, r) => [[cx, cy - r], [cx, cy + r]],
};

var SEMI_BOUNDS = {
  up: (cx, cy, r) => [cx - r, cy - r, cx + r, cy],
  down: (cx, cy, r) => [cx - r, cy, cx + r, cy + r],
  left: (cx, cy, r) => [cx - r, cy - r, cx, cy + r],
  right: (cx, cy, r) => [cx, cy - r, cx + r, cy + r],
};

var TRI_POINTS = {
  up: (mx, my, h) => [[mx - h, my], [mx + h, my], [mx, my - h]],
  down: (mx, my, h) => [[mx - h, my], [mx + h, my], [mx, my + h]],
  left: (mx, my, h) => [[mx, my - h], [mx, my + h], [mx - h, my]],
  right: (mx, my, h) => [[mx, my - h], [mx, my + h], [mx + h, my]],
};

var CORNER_TRI = (piece, part) => [
  [part.rx, part.ry],
  [part.rx + part.sx * piece.leg, part.ry],
  [part.rx, part.ry + part.sy * piece.leg],
];
var EDGE_TRI = (piece, part) => TRI_POINTS[part.dir](part.mx, part.my, piece.leg / Math.SQRT2);
var TRI_FORM = { 'true': CORNER_TRI, 'false': EDGE_TRI };

export function trianglePoints(piece, part) {
  return TRI_FORM[String('rx' in part)](piece, part);
}

var rectSize = (piece, part) => ({ 'true': [piece.h, piece.w], 'false': [piece.w, piece.h] })[String(!!part.turn)];
var barSize = (piece, part) => ({ 'true': [piece.len, piece.thick], 'false': [piece.thick, piece.len] })[String(!!part.flat)];

function arcPoints(piece, part) {
  var a1 = part.angle + 90;
  return [
    polar(part.cx, part.cy, piece.r, part.angle),
    polar(part.cx, part.cy, piece.r, a1),
    polar(part.cx, part.cy, piece.inner, a1),
    polar(part.cx, part.cy, piece.inner, part.angle),
  ];
}

var boxAttrs = (part, size) => ({ x: part.x, y: part.y, width: size[0], height: size[1] });

var SHAPE = {
  circle: (piece, part) => ({ tag: 'circle', attrs: { cx: part.cx, cy: part.cy, r: piece.r } }),
  rect: (piece, part) => ({ tag: 'rect', attrs: boxAttrs(part, rectSize(piece, part)) }),
  bar: (piece, part) => ({ tag: 'rect', attrs: boxAttrs(part, barSize(piece, part)) }),
  semi: (piece, part) => {
    var e = SEMI_ENDS[part.dir](part.cx, part.cy, piece.r);
    return { tag: 'path', attrs: { d: 'M' + e[0].join(',') + ' A' + piece.r + ' ' + piece.r + ' 0 0 1 ' + e[1].join(',') + ' Z' } };
  },
  arc: (piece, part) => {
    var p = arcPoints(piece, part);
    return { tag: 'path', attrs: { d: 'M' + p[0] + ' A' + piece.r + ' ' + piece.r + ' 0 0 1 ' + p[1] + ' L' + p[2] + ' A' + piece.inner + ' ' + piece.inner + ' 0 0 0 ' + p[3] + ' Z' } };
  },
  tri: (piece, part) => ({ tag: 'polygon', attrs: { points: pointsAttr(trianglePoints(piece, part)) } }),
};

export function partShape(piece, part) {
  return SHAPE[piece.kind](piece, part);
}

var pointsBounds = (pts) => [
  Math.min(...pts.map((p) => p[0])),
  Math.min(...pts.map((p) => p[1])),
  Math.max(...pts.map((p) => p[0])),
  Math.max(...pts.map((p) => p[1])),
];
var sizeBounds = (part, size) => [part.x, part.y, part.x + size[0], part.y + size[1]];

var BOUNDS = {
  circle: (piece, part) => [part.cx - piece.r, part.cy - piece.r, part.cx + piece.r, part.cy + piece.r],
  rect: (piece, part) => sizeBounds(part, rectSize(piece, part)),
  bar: (piece, part) => sizeBounds(part, barSize(piece, part)),
  semi: (piece, part) => SEMI_BOUNDS[part.dir](part.cx, part.cy, piece.r),
  arc: (piece, part) => pointsBounds(arcPoints(piece, part)),
  tri: (piece, part) => pointsBounds(trianglePoints(piece, part)),
};

export function paintShape(piece, shape, colours) {
  return { tag: shape.tag, attrs: Object.assign({ fill: colours[piece.colour] }, shape.attrs) };
}

export function partBounds(piece, part) {
  return BOUNDS[piece.kind](piece, part);
}

var SEMI_SIDE = {
  up: (part, x, y, m) => y < part.cy - m,
  down: (part, x, y, m) => y > part.cy + m,
  left: (part, x, y, m) => x < part.cx - m,
  right: (part, x, y, m) => x > part.cx + m,
};

var QUADRANT = {
  0: (dx, dy, m) => dx > m && dy > m,
  90: (dx, dy, m) => dx < -m && dy > m,
  180: (dx, dy, m) => dx < -m && dy < -m,
  270: (dx, dy, m) => dx > m && dy < -m,
};

var inBox = (b, x, y, m) => x > b[0] + m && x < b[2] - m && y > b[1] + m && y < b[3] - m;
var dist = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);

function inTriangle(pts, x, y, m) {
  var area = (pts[1][0] - pts[0][0]) * (pts[2][1] - pts[0][1]) - (pts[1][1] - pts[0][1]) * (pts[2][0] - pts[0][0]);
  var sign = Math.sign(area);
  return [0, 1, 2].every((i) => {
    var a = pts[i];
    var b = pts[(i + 1) % 3];
    var cross = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    return sign * cross / Math.hypot(b[0] - a[0], b[1] - a[1]) > m;
  });
}

var INSIDE = {
  circle: (piece, part, x, y, m) => dist(x, y, part.cx, part.cy) < piece.r - m,
  rect: (piece, part, x, y, m) => inBox(partBounds(piece, part), x, y, m),
  bar: (piece, part, x, y, m) => inBox(partBounds(piece, part), x, y, m),
  semi: (piece, part, x, y, m) => dist(x, y, part.cx, part.cy) < piece.r - m && SEMI_SIDE[part.dir](part, x, y, m),
  arc: (piece, part, x, y, m) => {
    var d = dist(x, y, part.cx, part.cy);
    return d > piece.inner + m && d < piece.r - m && QUADRANT[part.angle](x - part.cx, y - part.cy, m);
  },
  tri: (piece, part, x, y, m) => inTriangle(trianglePoints(piece, part), x, y, m),
};

export function pointInPart(piece, part, x, y, margin) {
  return INSIDE[piece.kind](piece, part, x, y, margin);
}

export function partSamples(piece, part, step, margin) {
  var b = partBounds(piece, part);
  var nx = Math.ceil((b[2] - b[0]) / step);
  var ny = Math.ceil((b[3] - b[1]) / step);
  var pts = [];
  for (var i = 0; i < nx; i++) {
    for (var j = 0; j < ny; j++) pts.push([b[0] + (i + 0.5) * step, b[1] + (j + 0.5) * step]);
  }
  return pts.filter((p) => pointInPart(piece, part, p[0], p[1], margin));
}

var OVERLAP_STEP = 0.02;
var OVERLAP_MARGIN = 0.01;

export function overlapProblems(picture, byId) {
  var parts = picture.parts.map((part) => ({ piece: byId[part.piece], part: part }));
  var samples = parts.map((p) => partSamples(p.piece, p.part, OVERLAP_STEP, OVERLAP_MARGIN));
  var hits = (pts, q, m) => pts.some((p) => pointInPart(q.piece, q.part, p[0], p[1], m));
  var allIn = (pts, q) => pts.every((p) => pointInPart(q.piece, q.part, p[0], p[1], 0));
  var clash = (i, j) => hits(samples[i], parts[j], OVERLAP_MARGIN) && !allIn(samples[i], parts[j]) && !allIn(samples[j], parts[i]);
  return parts.flatMap((_, i) => parts.map((__, j) => [i, j]).filter((pair) => pair[1] > i && clash(i, pair[1])));
}

export function indexPieces(pieces) {
  return Object.fromEntries(pieces.map((p) => [p.id, p]));
}

export function pictureViewBox(picture, byId, pad) {
  var b = pointsBounds(picture.parts.flatMap((part) => {
    var r = partBounds(byId[part.piece], part);
    return [[r[0], r[1]], [r[2], r[3]]];
  }));
  return [b[0] - pad, b[1] - pad, b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad].map(round).join(' ');
}

export function pieceCounts(picture) {
  return picture.parts.reduce((acc, part) => {
    acc[part.piece] = (acc[part.piece] || 0) + 1;
    return acc;
  }, {});
}

export function unknownPieces(picture, byId) {
  return Object.keys(pieceCounts(picture)).filter((id) => !(id in byId));
}

export function overusedPieces(picture, byId) {
  var counts = pieceCounts(picture);
  return Object.keys(counts)
    .filter((id) => id in byId)
    .filter((id) => counts[id] > byId[id].count)
    .map((id) => ({ id: id, used: counts[id], have: byId[id].count }));
}

export function pieceChecklist(picture, pieces) {
  var counts = pieceCounts(picture);
  return pieces
    .filter((p) => p.id in counts)
    .map((p) => ({ id: p.id, name: p.name, count: counts[p.id], label: p.name + ' ×' + counts[p.id] }));
}

export function setSize(pieces) {
  return pieces.reduce((n, p) => n + p.count, 0);
}

var ICON_PART = {
  circle: (piece) => ({ cx: piece.r, cy: piece.r }),
  rect: () => ({ x: 0, y: 0 }),
  bar: () => ({ x: 0, y: 0 }),
  semi: (piece) => ({ cx: piece.r, cy: piece.r, dir: 'up' }),
  arc: (piece) => ({ cx: 0, cy: piece.r, angle: 270 }),
  tri: (piece) => ({ mx: piece.leg / Math.SQRT2, my: piece.leg / Math.SQRT2, dir: 'up' }),
};

export function pieceIcon(piece) {
  var part = ICON_PART[piece.kind](piece);
  var b = partBounds(piece, part);
  var side = Math.max(b[2] - b[0], b[3] - b[1]);
  var viewBox = [b[0] - (side - (b[2] - b[0])) / 2, b[1] - (side - (b[3] - b[1])) / 2, side, side].map(round).join(' ');
  return { viewBox: viewBox, shape: partShape(piece, part) };
}

export function levelDots(level, max) {
  return '●'.repeat(level) + '○'.repeat(max - level);
}

export function pictureId(picture) {
  return picture.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

if (typeof module !== 'undefined') module.exports = {
  trianglePoints, partShape, paintShape, partBounds, pointInPart, partSamples, overlapProblems, indexPieces, pictureViewBox, pieceCounts,
  unknownPieces, overusedPieces, pieceChecklist, setSize, pieceIcon, levelDots, pictureId,
};
