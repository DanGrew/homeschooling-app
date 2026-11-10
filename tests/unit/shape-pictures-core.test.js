import fs from 'fs';
import path from 'path';
import {
  trianglePoints, partShape, paintShape, partBounds, pointInPart, partSamples, overlapProblems, indexPieces, pictureViewBox, pieceCounts,
  unknownPieces, overusedPieces, pieceChecklist, setSize, pieceIcon, levelDots, pictureId,
} from '../../core/shape-pictures/shape-pictures-core.js';

const CIRCLE = { id: 'C', kind: 'circle', r: 0.5 };
const RECT = { id: 'R', kind: 'rect', w: 2, h: 1 };
const BAR = { id: 'B', kind: 'bar', len: 2, thick: 0.5 };
const SEMI = { id: 'S', kind: 'semi', r: 0.5 };
const BIG_SEMI = { id: 'S2', kind: 'semi', r: 1 };
const ARC = { id: 'A', kind: 'arc', r: 1, inner: 0.5 };
const TRI = { id: 'T', kind: 'tri', leg: Math.SQRT2 };
const BIG_TRI = { id: 'T2', kind: 'tri', leg: 2 };

describe('trianglePoints', () => {
  it('long-edge form, point up', () => expect(trianglePoints(TRI, { mx: 2, my: 2, dir: 'up' })).toEqual([[1, 2], [3, 2], [2, 1]]));
  it('long-edge form, point down', () => expect(trianglePoints(TRI, { mx: 2, my: 2, dir: 'down' })).toEqual([[1, 2], [3, 2], [2, 3]]));
  it('long-edge form, point left', () => expect(trianglePoints(TRI, { mx: 2, my: 2, dir: 'left' })).toEqual([[2, 1], [2, 3], [1, 2]]));
  it('long-edge form, point right', () => expect(trianglePoints(TRI, { mx: 2, my: 2, dir: 'right' })).toEqual([[2, 1], [2, 3], [3, 2]]));
  it('right-angle corner form runs legs along sx and sy', () => expect(trianglePoints(BIG_TRI, { rx: 1, ry: 3, sx: 1, sy: -1 })).toEqual([[1, 3], [3, 3], [1, 1]]));
  it('corner form honours negative sx', () => expect(trianglePoints(BIG_TRI, { rx: 4, ry: 1, sx: -1, sy: 1 })).toEqual([[4, 1], [2, 1], [4, 3]]));
});

describe('partShape', () => {
  it('circle', () => expect(partShape(CIRCLE, { cx: 1, cy: 2 })).toEqual({ tag: 'circle', attrs: { cx: 1, cy: 2, r: 0.5 } }));
  it('rect upright', () => expect(partShape(RECT, { x: 1, y: 2 })).toEqual({ tag: 'rect', attrs: { x: 1, y: 2, width: 2, height: 1 } }));
  it('rect turned swaps width and height', () => expect(partShape(RECT, { x: 1, y: 2, turn: true })).toEqual({ tag: 'rect', attrs: { x: 1, y: 2, width: 1, height: 2 } }));
  it('bar stands upright by default', () => expect(partShape(BAR, { x: 1, y: 1 })).toEqual({ tag: 'rect', attrs: { x: 1, y: 1, width: 0.5, height: 2 } }));
  it('bar lies flat', () => expect(partShape(BAR, { x: 1, y: 1, flat: true })).toEqual({ tag: 'rect', attrs: { x: 1, y: 1, width: 2, height: 0.5 } }));
  it('semi up', () => expect(partShape(SEMI, { cx: 1, cy: 1, dir: 'up' })).toEqual({ tag: 'path', attrs: { d: 'M0.5,1 A0.5 0.5 0 0 1 1.5,1 Z' } }));
  it('semi down', () => expect(partShape(SEMI, { cx: 1, cy: 1, dir: 'down' }).attrs.d).toBe('M1.5,1 A0.5 0.5 0 0 1 0.5,1 Z'));
  it('semi left', () => expect(partShape(SEMI, { cx: 1, cy: 1, dir: 'left' }).attrs.d).toBe('M1,1.5 A0.5 0.5 0 0 1 1,0.5 Z'));
  it('semi right', () => expect(partShape(SEMI, { cx: 1, cy: 1, dir: 'right' }).attrs.d).toBe('M1,0.5 A0.5 0.5 0 0 1 1,1.5 Z'));
  it('arc is a quarter ring from its start angle', () => expect(partShape(ARC, { cx: 2, cy: 2, angle: 0 })).toEqual({
    tag: 'path', attrs: { d: 'M3,2 A1 1 0 0 1 2,3 L2,2.5 A0.5 0.5 0 0 0 2.5,2 Z' },
  }));
  it('arc at 180 sweeps left to up', () => expect(partShape(ARC, { cx: 2, cy: 2, angle: 180 }).attrs.d).toBe('M1,2 A1 1 0 0 1 2,1 L2,1.5 A0.5 0.5 0 0 0 1.5,2 Z'));
  it('triangle polygon points are rounded', () => expect(partShape({ kind: 'tri', leg: 1.4142 }, { mx: 2, my: 2, dir: 'up' })).toEqual({
    tag: 'polygon', attrs: { points: '1,2 3,2 2,1' },
  }));
});

describe('paintShape', () => {
  it('fills the shape with its piece colour and keeps its geometry', () => expect(paintShape(
    { colour: 'G' }, { tag: 'circle', attrs: { cx: 1, cy: 2, r: 0.5 } }, { G: '#7fb02b', R: '#e4312b' },
  )).toEqual({ tag: 'circle', attrs: { fill: '#7fb02b', cx: 1, cy: 2, r: 0.5 } }));
});

describe('partBounds', () => {
  it('circle', () => expect(partBounds(CIRCLE, { cx: 2, cy: 3 })).toEqual([1.5, 2.5, 2.5, 3.5]));
  it('rect', () => expect(partBounds(RECT, { x: 1, y: 2 })).toEqual([1, 2, 3, 3]));
  it('rect turned', () => expect(partBounds(RECT, { x: 1, y: 2, turn: true })).toEqual([1, 2, 2, 4]));
  it('bar upright', () => expect(partBounds(BAR, { x: 1, y: 1 })).toEqual([1, 1, 1.5, 3]));
  it('bar flat', () => expect(partBounds(BAR, { x: 1, y: 1, flat: true })).toEqual([1, 1, 3, 1.5]));
  it('semi up', () => expect(partBounds(BIG_SEMI, { cx: 2, cy: 2, dir: 'up' })).toEqual([1, 1, 3, 2]));
  it('semi down', () => expect(partBounds(BIG_SEMI, { cx: 2, cy: 2, dir: 'down' })).toEqual([1, 2, 3, 3]));
  it('semi left', () => expect(partBounds(BIG_SEMI, { cx: 2, cy: 2, dir: 'left' })).toEqual([1, 1, 2, 3]));
  it('semi right', () => expect(partBounds(BIG_SEMI, { cx: 2, cy: 2, dir: 'right' })).toEqual([2, 1, 3, 3]));
  it('arc at 0', () => expect(partBounds(ARC, { cx: 2, cy: 2, angle: 0 })).toEqual([2, 2, 3, 3]));
  it('arc at 180', () => expect(partBounds(ARC, { cx: 2, cy: 2, angle: 180 })).toEqual([1, 1, 2, 2]));
  it('triangle', () => expect(partBounds(BIG_TRI, { rx: 1, ry: 3, sx: 1, sy: -1 })).toEqual([1, 1, 3, 3]));
});

describe('pointInPart', () => {
  const UNIT = { kind: 'circle', r: 1 };
  it('circle inside', () => expect(pointInPart(UNIT, { cx: 0, cy: 0 }, 0.5, 0, 0)).toBe(true));
  it('circle margin shrinks the edge', () => expect(pointInPart(UNIT, { cx: 0, cy: 0 }, 0.95, 0, 0.1)).toBe(false));
  it('circle outside', () => expect(pointInPart(UNIT, { cx: 0, cy: 0 }, 1.1, 0, 0)).toBe(false));
  it('rect inside', () => expect(pointInPart(RECT, { x: 0, y: 0 }, 1, 0.5, 0)).toBe(true));
  it('rect margin', () => expect(pointInPart(RECT, { x: 0, y: 0 }, 1.95, 0.5, 0.1)).toBe(false));
  it('rect margin on top edge', () => expect(pointInPart(RECT, { x: 0, y: 0 }, 1, 0.05, 0.1)).toBe(false));
  it('rect margin on bottom edge', () => expect(pointInPart(RECT, { x: 0, y: 0 }, 1, 0.95, 0.1)).toBe(false));
  it('rect margin on left edge', () => expect(pointInPart(RECT, { x: 0, y: 0 }, 0.05, 0.5, 0.1)).toBe(false));
  it('bar follows its lie', () => expect(pointInPart(BAR, { x: 0, y: 0, flat: true }, 1.5, 0.25, 0)).toBe(true));
  it('bar upright excludes the flat area', () => expect(pointInPart(BAR, { x: 0, y: 0 }, 1.5, 0.25, 0)).toBe(false));
  it('semi up holds the bulge', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'up' }, 1, 0.8, 0)).toBe(true));
  it('semi up excludes below the flat edge', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'up' }, 1, 1.2, 0)).toBe(false));
  it('semi up margin on the flat edge', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'up' }, 1, 0.95, 0.1)).toBe(false));
  it('semi up excludes beyond the curve', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'up' }, 1, 0.45, 0.1)).toBe(false));
  it('semi down', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'down' }, 1, 1.2, 0)).toBe(true));
  it('semi down margin', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'down' }, 1, 1.05, 0.1)).toBe(false));
  it('semi left', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'left' }, 0.8, 1, 0)).toBe(true));
  it('semi left margin', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'left' }, 0.95, 1, 0.1)).toBe(false));
  it('semi left excludes the right side', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'left' }, 1.2, 1, 0)).toBe(false));
  it('semi right', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'right' }, 1.2, 1, 0)).toBe(true));
  it('semi right margin', () => expect(pointInPart(SEMI, { cx: 1, cy: 1, dir: 'right' }, 1.05, 1, 0.1)).toBe(false));
  it('arc at 0 holds its quarter ring', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 0 }, 2.53, 2.53, 0)).toBe(true));
  it('arc excludes its hole', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 0 }, 2.2, 2.2, 0)).toBe(false));
  it('arc excludes beyond its rim', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 0 }, 2.75, 2.75, 0)).toBe(false));
  it('arc inner margin', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 0 }, 2.38, 2.38, 0.1)).toBe(false));
  it('arc outer margin', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 0 }, 2.66, 2.66, 0.1)).toBe(false));
  it('arc excludes other quarters', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 90 }, 2.53, 2.53, 0)).toBe(false));
  it('arc at 90', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 90 }, 1.47, 2.53, 0)).toBe(true));
  it('arc at 180', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 180 }, 1.47, 1.47, 0)).toBe(true));
  it('arc at 270', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 270 }, 2.53, 1.47, 0)).toBe(true));
  it('arc at 0 margin on the radial edges', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 0 }, 2.75, 2.05, 0.1)).toBe(false));
  it('arc at 0 margin on the other radial edge', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 0 }, 2.05, 2.75, 0.1)).toBe(false));
  it('arc at 90 margin', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 90 }, 1.95, 2.75, 0.1)).toBe(false));
  it('arc at 90 margin on the other edge', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 90 }, 1.25, 2.05, 0.1)).toBe(false));
  it('arc at 180 margin', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 180 }, 1.95, 1.25, 0.1)).toBe(false));
  it('arc at 180 margin on the other edge', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 180 }, 1.25, 1.95, 0.1)).toBe(false));
  it('arc at 270 margin', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 270 }, 2.05, 1.25, 0.1)).toBe(false));
  it('arc at 270 margin on the other edge', () => expect(pointInPart(ARC, { cx: 2, cy: 2, angle: 270 }, 2.75, 1.95, 0.1)).toBe(false));
  it('triangle inside', () => expect(pointInPart(BIG_TRI, { rx: 1, ry: 3, sx: 1, sy: -1 }, 1.5, 2.5, 0)).toBe(true));
  it('triangle excludes past the long edge', () => expect(pointInPart(BIG_TRI, { rx: 1, ry: 3, sx: 1, sy: -1 }, 2.6, 1.6, 0)).toBe(false));
  it('triangle margin', () => expect(pointInPart(BIG_TRI, { rx: 1, ry: 3, sx: 1, sy: -1 }, 1.05, 2.5, 0.1)).toBe(false));
  it('triangle margin on the long edge is a true distance', () => expect(pointInPart(BIG_TRI, { rx: 1, ry: 3, sx: 1, sy: -1 }, 2.05, 2.1, 0.1)).toBe(false));
  it('triangle long edge just inside the margin', () => expect(pointInPart(BIG_TRI, { rx: 1, ry: 3, sx: 1, sy: -1 }, 2, 2.2, 0.1)).toBe(true));
  it('triangle wound the other way', () => expect(pointInPart(BIG_TRI, { rx: 4, ry: 1, sx: -1, sy: 1 }, 3.5, 1.5, 0)).toBe(true));
});

describe('partSamples', () => {
  const Q = { kind: 'rect', w: 1, h: 1 };
  it('grid points inside the part', () => expect(partSamples(Q, { x: 0, y: 0 }, 0.5, 0)).toEqual([[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]]));
  it('margin drops edge points', () => expect(partSamples(Q, { x: 0, y: 0 }, 0.5, 0.3)).toEqual([]));
  it('covers a non-square part', () => expect(partSamples(RECT, { x: 0, y: 0 }, 1, 0)).toEqual([[0.5, 0.5], [1.5, 0.5]]));
  it('drops points outside a circle', () => expect(partSamples({ kind: 'circle', r: 1 }, { cx: 1, cy: 1 }, 0.5, 0).length).toBe(12));
});

describe('overlapProblems', () => {
  const byId = indexPieces([
    { id: 'Q', kind: 'rect', w: 1, h: 1 },
    { id: 'BIG', kind: 'rect', w: 2, h: 2 },
  ]);
  const pic = (...parts) => ({ parts });
  it('pieces that only touch are fine', () => expect(overlapProblems(pic({ piece: 'Q', x: 0, y: 0 }, { piece: 'Q', x: 1, y: 0 }), byId)).toEqual([]));
  it('pieces apart are fine', () => expect(overlapProblems(pic({ piece: 'Q', x: 0, y: 0 }, { piece: 'Q', x: 3, y: 0 }), byId)).toEqual([]));
  it('a piece wholly on top of another is fine', () => expect(overlapProblems(pic({ piece: 'BIG', x: 0, y: 0 }, { piece: 'Q', x: 0.5, y: 0.5 }), byId)).toEqual([]));
  it('a big piece over a small one is fine, whichever is listed first', () => expect(overlapProblems(pic({ piece: 'Q', x: 0.5, y: 0.5 }, { piece: 'BIG', x: 0, y: 0 }), byId)).toEqual([]));
  it('a flush piece sitting wholly on top is fine', () => expect(overlapProblems(pic({ piece: 'BIG', x: 0, y: 0 }, { piece: 'Q', x: 0, y: 0 }), byId)).toEqual([]));
  it('a corner overlap is a problem', () => expect(overlapProblems(pic({ piece: 'Q', x: 0, y: 0 }, { piece: 'Q', x: 0.5, y: 0.5 }), byId)).toEqual([[0, 1]]));
  it('a thin overlap is still a problem', () => expect(overlapProblems(pic({ piece: 'Q', x: 0, y: 0 }, { piece: 'Q', x: 0.95, y: 0 }), byId)).toEqual([[0, 1]]));
  it('names every clashing pair by position', () => expect(overlapProblems(pic(
    { piece: 'Q', x: 5, y: 5 }, { piece: 'Q', x: 0, y: 0 }, { piece: 'BIG', x: 0.5, y: 0.5 },
  ), byId)).toEqual([[1, 2]]));
});

describe('indexPieces', () => {
  it('keys pieces by id', () => expect(indexPieces([CIRCLE, RECT])).toEqual({ C: CIRCLE, R: RECT }));
});

describe('pictureViewBox', () => {
  it('fits every part plus padding', () => {
    const byId = indexPieces([CIRCLE, { id: 'Q', kind: 'rect', w: 1, h: 1 }]);
    const pic = { parts: [{ piece: 'C', cx: 2, cy: 3 }, { piece: 'Q', x: 4, y: 4 }] };
    expect(pictureViewBox(pic, byId, 0.25)).toBe('1.25 2.25 4 3');
  });
  it('with no padding is the tight box', () => {
    const pic = { parts: [{ piece: 'C', cx: 2, cy: 3 }] };
    expect(pictureViewBox(pic, indexPieces([CIRCLE]), 0)).toBe('1.5 2.5 1 1');
  });
});

const PIECES = [
  { id: 'B', name: 'Bee', count: 1 },
  { id: 'A', name: 'Ant', count: 2 },
  { id: 'C', name: 'Cat', count: 1 },
];
const PIC = { parts: [{ piece: 'A' }, { piece: 'A' }, { piece: 'B' }] };

describe('pieceCounts', () => {
  it('counts uses of each piece', () => expect(pieceCounts(PIC)).toEqual({ A: 2, B: 1 }));
});

describe('unknownPieces', () => {
  it('lists ids missing from the set', () => expect(unknownPieces({ parts: [{ piece: 'A' }, { piece: 'Z' }] }, indexPieces(PIECES))).toEqual(['Z']));
  it('is empty when all are known', () => expect(unknownPieces(PIC, indexPieces(PIECES))).toEqual([]));
});

describe('overusedPieces', () => {
  it('allows using exactly as many as the set has', () => expect(overusedPieces(PIC, indexPieces(PIECES))).toEqual([]));
  it('flags a piece used more times than the set has it', () => {
    const pic = { parts: [{ piece: 'B' }, { piece: 'B' }, { piece: 'A' }] };
    expect(overusedPieces(pic, indexPieces(PIECES))).toEqual([{ id: 'B', used: 2, have: 1 }]);
  });
  it('ignores unknown pieces', () => expect(overusedPieces({ parts: [{ piece: 'Z' }, { piece: 'Z' }] }, indexPieces(PIECES))).toEqual([]));
});

describe('pieceChecklist', () => {
  it('lists used pieces in set order with counts', () => expect(pieceChecklist(PIC, PIECES)).toEqual([
    { id: 'B', name: 'Bee', count: 1, label: 'Bee ×1' },
    { id: 'A', name: 'Ant', count: 2, label: 'Ant ×2' },
  ]));
});

describe('setSize', () => {
  it('sums piece counts', () => expect(setSize(PIECES)).toBe(4));
});

describe('pieceIcon', () => {
  it('circle fills a square box', () => expect(pieceIcon(CIRCLE)).toEqual({ viewBox: '0 0 1 1', shape: { tag: 'circle', attrs: { cx: 0.5, cy: 0.5, r: 0.5 } } }));
  it('rect is centred in a square box', () => expect(pieceIcon(RECT)).toEqual({ viewBox: '0 -0.5 2 2', shape: { tag: 'rect', attrs: { x: 0, y: 0, width: 2, height: 1 } } }));
  it('bar is centred sideways', () => expect(pieceIcon({ kind: 'bar', len: 1, thick: 0.5 }).viewBox).toBe('-0.25 0 1 1'));
  it('semi bulges up', () => expect(pieceIcon(SEMI)).toEqual({ viewBox: '0 -0.25 1 1', shape: { tag: 'path', attrs: { d: 'M0,0.5 A0.5 0.5 0 0 1 1,0.5 Z' } } }));
  it('arc sits in its quarter', () => expect(pieceIcon(ARC).viewBox).toBe('0 0 1 1'));
  it('triangle points up', () => expect(pieceIcon(TRI)).toEqual({ viewBox: '0 -0.5 2 2', shape: { tag: 'polygon', attrs: { points: '0,1 2,1 1,0' } } }));
});

describe('levelDots', () => {
  it('fills one dot per level', () => expect(levelDots(2, 3)).toBe('●●○'));
  it('all filled at max', () => expect(levelDots(3, 3)).toBe('●●●'));
});

describe('pictureId', () => {
  it('slugs the name', () => expect(pictureId({ name: 'Bunny Rabbit' })).toBe('bunny-rabbit'));
  it('collapses punctuation', () => expect(pictureId({ name: "Dog's  Ball!" })).toBe('dog-s-ball-'));
});

describe('shape-pictures content', () => {
  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../content/shape-pictures/shape-pictures.json'), 'utf8'));
  const byId = indexPieces(data.pieces);

  it('the set has 25 pieces', () => expect(setSize(data.pieces)).toBe(25));
  it('every piece colour is defined', () => data.pieces.forEach((p) => expect(data.colours[p.colour], p.id).toBeDefined()));
  it('piece ids are unique', () => expect(new Set(data.pieces.map((p) => p.id)).size).toBe(data.pieces.length));
  it('picture names are unique', () => expect(new Set(data.pictures.map(pictureId)).size).toBe(data.pictures.length));

  data.pictures.forEach((pic) => {
    it(`${pic.name} only uses pieces in the set`, () => expect(unknownPieces(pic, byId)).toEqual([]));
    it(`${pic.name} never uses a piece more times than the set has it`, () => expect(overusedPieces(pic, byId)).toEqual([]));
    it(`${pic.name} has no piece partly overlapping another — each only touches, or sits wholly on top`, () => expect(
      overlapProblems(pic, byId).map(([a, b]) => `${a}:${pic.parts[a].piece} × ${b}:${pic.parts[b].piece}`),
    ).toEqual([]));
  });
});
