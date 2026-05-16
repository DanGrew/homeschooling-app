import { N, bfs, generatePuzzle, posKey, inBounds, isObstacle, isTarget } from '../../core/move-blocks/move-blocks-core.js';

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

describe('posKey', () => {
  it('encodes position as string', () => expect(posKey(2, 3)).toBe('2,3'));
  it('origin', () => expect(posKey(0, 0)).toBe('0,0'));
});

describe('inBounds', () => {
  it('centre is in bounds', () => expect(inBounds(2, 2)).toBe(true));
  it('origin is in bounds', () => expect(inBounds(0, 0)).toBe(true));
  it('max corner is in bounds', () => expect(inBounds(N - 1, N - 1)).toBe(true));
  it('negative x is out of bounds', () => expect(inBounds(-1, 2)).toBe(false));
  it('x === N is out of bounds', () => expect(inBounds(N, 2)).toBe(false));
  it('negative y is out of bounds', () => expect(inBounds(2, -1)).toBe(false));
});

describe('isObstacle', () => {
  it('matches obstacle position', () => expect(isObstacle(2, 3, 2, 3)).toBe(true));
  it('non-match returns false', () => expect(isObstacle(1, 1, 2, 3)).toBe(false));
});

describe('isTarget', () => {
  it('matches target position', () => expect(isTarget(4, 1, 4, 1)).toBe(true));
  it('non-match returns false', () => expect(isTarget(0, 0, 4, 1)).toBe(false));
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
