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
  trianglePoints, partShape, paintShape, partBounds, indexPieces, pictureViewBox, pieceCounts,
  unknownPieces, overusedPieces, pieceChecklist, setSize, pieceIcon, levelDots, pictureId,
};
