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
  it('moves leftward (decreasing column)', () => expect(bfs(4, 0, 0, 0, 4, 4)).toBe(4));
  it('moves upward (decreasing row)', () => expect(bfs(0, 4, 0, 0, 4, 4)).toBe(4));
  it('moves downward (increasing row)', () => expect(bfs(0, 0, 0, 4, 4, 4)).toBe(4));
  it('reaches a cell in column 0 from column 1', () => expect(bfs(1, 0, 0, 0, 4, 4)).toBe(1));
  it('reaches a cell in row 0 from row 1', () => expect(bfs(0, 1, 0, 0, 4, 4)).toBe(1));
  it('obstacle blocks only its own cell, not the rest of its row', () => {
    expect(bfs(1, 2, 3, 2, 2, 2)).toBe(4);
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

  // A queue of exact rng() outputs, consumed one call at a time. floor(v * 5)
  // maps: 0.01→0, 0.21→1, 0.41→2, 0.61→3, 0.81→4. Pins the exact position and
  // obstacle-candidate math rather than just shape/bounds.
  const queueRng = (values, fallback = 0.5) => {
    const q = values.slice();
    return () => (q.length ? q.shift() : fallback);
  };

  it('picks exact px/py/tx/ty from rng, and the first valid obstacle candidate', () => {
    // px=1,py=1,tx=3,ty=3 (mDist=4); candidate (1,0) sits exactly on the
    // dp+dt <= mDist+2 boundary (dp=1, dt=5, sum=6=mDist+2) and is the first
    // non-excluded cell in scan order once the filter is correct.
    const p = generatePuzzle(queueRng([0.21, 0.21, 0.61, 0.61, 0.01]));
    expect(p).toEqual({ px: 1, py: 1, tx: 3, ty: 3, bx: 1, by: 0 });
  });

  it('picks exact px/py/tx/ty and obstacle on a second, unrelated draw', () => {
    const p = generatePuzzle(queueRng([0.81, 0.61, 0.21, 0.01, 0.01]));
    expect(p).toEqual({ px: 4, py: 3, tx: 1, ty: 0, bx: 0, by: 0 });
  });

  it('rejects a too-close pair (dx only) before drawing the next candidate', () => {
    // px=1,py=0,tx=3,ty=0: real Manhattan distance 2 (<4) must be skipped.
    const p = generatePuzzle(queueRng([
      0.21, 0.01, 0.61, 0.01,
      0.21, 0.21, 0.61, 0.61, 0.01,
    ]));
    expect(p).toEqual({ px: 1, py: 1, tx: 3, ty: 3, bx: 1, by: 0 });
  });

  it('rejects a too-close pair (dy only) before drawing the next candidate', () => {
    // px=0,py=1,tx=0,ty=3: real Manhattan distance 2 (<4) must be skipped.
    const p = generatePuzzle(queueRng([
      0.01, 0.21, 0.01, 0.61,
      0.21, 0.21, 0.61, 0.61, 0.01,
    ]));
    expect(p).toEqual({ px: 1, py: 1, tx: 3, ty: 3, bx: 1, by: 0 });
  });

  it('gives up after exactly 300 tries, never a 301st', () => {
    // First 1200 rng() calls (300 attempts of 4 calls each) all draw the same
    // cell for player and target, forcing a reject every time. A rng that
    // would succeed on a 301st attempt must never be consulted.
    let n = 0;
    const rng = () => {
      n += 1;
      if (n <= 1200) return 0;
      const tail = [0, 0, 0.81, 0.81, 0.01];
      return tail[n - 1201] !== undefined ? tail[n - 1201] : 0.01;
    };
    expect(generatePuzzle(rng)).toBeNull();
  });

  it('picks the last valid candidate, not a phantom row/col N cell', () => {
    // px=0,py=0,tx=4,ty=4 (mDist=8); the real candidate scan (row/col 0..4)
    // has 23 entries, last is (3,4). Picking with rng≈1 pins that last index,
    // catching an off-by-one loop bound and a flipped sign in the dp/dt maths
    // (both would shift or grow the candidate set and change this result).
    const p = generatePuzzle(queueRng([0.01, 0.01, 0.81, 0.81, 0.99]));
    expect(p).toEqual({ px: 0, py: 0, tx: 4, ty: 4, bx: 3, by: 4 });
  });

  it('never places the obstacle on the player or target cell (many draws)', () => {
    for (let i = 0; i < 500; i++) {
      const p = generatePuzzle();
      expect(p.bx === p.px && p.by === p.py).toBe(false);
      expect(p.bx === p.tx && p.by === p.ty).toBe(false);
    }
  });

  it('can place the obstacle in the player\'s row, elsewhere in that row', () => {
    let found = false;
    for (let i = 0; i < 500 && !found; i++) {
      const p = generatePuzzle();
      if (p.by === p.py && p.bx !== p.px) found = true;
    }
    expect(found).toBe(true);
  });

  it('can place the obstacle in the target\'s column, elsewhere in that column', () => {
    let found = false;
    for (let i = 0; i < 500 && !found; i++) {
      const p = generatePuzzle();
      if (p.bx === p.tx && p.by !== p.ty) found = true;
    }
    expect(found).toBe(true);
  });
});
