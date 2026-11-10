import fs from 'fs';
import path from 'path';
import {
  trianglePoints, partShape, partBounds, indexPieces, pictureViewBox, pieceCounts,
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
  });
});
