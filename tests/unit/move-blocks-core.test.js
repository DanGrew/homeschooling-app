import { N, bfs, generatePuzzle } from '../../core/move-blocks/move-blocks-core.js';

describe('N', () => {
  it('is 5', () => expect(N).toBe(5));
});

describe('bfs', () => {
  it('adjacent cells have distance 1', () => expect(bfs(0, 0, 1, 0, 4, 4)).toBe(1));
  it('same start and end returns 0', () => expect(bfs(2, 2, 2, 2, 4, 4)).toBe(0));
  it('returns -1 when obstacle is on the target cell', () => {
    expect(bfs(0, 0, 1, 0, 1, 0)).toBe(-1);
  });
  it('obstacle forces longer path', () => {
    const direct = bfs(0, 2, 4, 2, 4, 4);
    const blocked = bfs(0, 2, 4, 2, 2, 2);
    expect(blocked).toBeGreaterThan(direct);
  });
  it('returns exact Manhattan distance when no obstacle in way', () => {
    expect(bfs(0, 0, 3, 0, 4, 4)).toBe(3);
  });
  it('diagonal target requires Manhattan distance', () => {
    expect(bfs(0, 0, 2, 2, 4, 4)).toBe(4);
  });
});

describe('generatePuzzle', () => {
  let counter;
  const seededRng = () => { counter = (counter + 1) % 100; return counter / 100; };
  beforeEach(() => { counter = 0; });

  it('returns an object with all position fields', () => {
    const p = generatePuzzle(seededRng);
    expect(p).not.toBeNull();
    ['px', 'py', 'tx', 'ty', 'bx', 'by'].forEach(k => expect(p).toHaveProperty(k));
  });

  it('all positions are within grid bounds', () => {
    const p = generatePuzzle(seededRng);
    [p.px, p.py, p.tx, p.ty, p.bx, p.by].forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(N);
    });
  });

  it('player and target are different cells', () => {
    const p = generatePuzzle(seededRng);
    expect(p.px === p.tx && p.py === p.ty).toBe(false);
  });

  it('bfs distance from player to target is at least 4', () => {
    const p = generatePuzzle(seededRng);
    expect(bfs(p.px, p.py, p.tx, p.ty, p.bx, p.by)).toBeGreaterThanOrEqual(4);
  });

  it('works with Math.random', () => {
    const p = generatePuzzle();
    expect(p).not.toBeNull();
    expect(bfs(p.px, p.py, p.tx, p.ty, p.bx, p.by)).toBeGreaterThanOrEqual(4);
  });

  it('returns null when rng always produces same cell (player==target)', () => {
    const p = generatePuzzle(() => 0);
    expect(p).toBeNull();
  });
});
