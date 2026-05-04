import { edgeKey, buildAdj, computeR, tapResult } from '../../core/drawing-dots/drawing-dots-core.js';

// triangle: dots 0,1,2 connected 0-1, 1-2, 0-2
const triangle = {
  vb: '0 0 100 100',
  dots: [{ cx: 0, cy: 0 }, { cx: 60, cy: 0 }, { cx: 30, cy: 50 }],
  edges: [[0, 1], [1, 2], [0, 2]],
};

// line: dots 0-1 only (no edge back to make iDone simple)
const line = {
  vb: '0 0 100 100',
  dots: [{ cx: 0, cy: 0 }, { cx: 80, cy: 0 }],
  edges: [[0, 1]],
};

function state(selectedDot = null, completedEdges = new Set(), complete = false) {
  return { selectedDot, completedEdges, complete };
}

describe('edgeKey', () => {
  it('orders a < b', () => expect(edgeKey(2, 5)).toBe('2,5'));
  it('orders b < a', () => expect(edgeKey(5, 2)).toBe('2,5'));
  it('same dot', () => expect(edgeKey(3, 3)).toBe('3,3'));
});

describe('buildAdj', () => {
  it('builds correct adjacency for triangle', () => {
    const adj = buildAdj(triangle);
    expect(adj[0].sort()).toEqual([1, 2]);
    expect(adj[1].sort()).toEqual([0, 2]);
    expect(adj[2].sort()).toEqual([0, 1]);
  });

  it('builds correct adjacency for line', () => {
    const adj = buildAdj(line);
    expect(adj[0]).toEqual([1]);
    expect(adj[1]).toEqual([0]);
  });

  it('isolated dot has empty adjacency', () => {
    const shape = { dots: [{ cx: 0, cy: 0 }, { cx: 10, cy: 0 }], edges: [] };
    const adj = buildAdj(shape);
    expect(adj[0]).toEqual([]);
    expect(adj[1]).toEqual([]);
  });
});

describe('computeR', () => {
  it('returns baseR when no edges', () => {
    const shape = { vb: '0 0 200 200', dots: [{ cx: 0, cy: 0 }], edges: [] };
    expect(computeR(shape)).toBe(11); // Math.round(200 * 0.055) = 11
  });

  it('clamps to p25 * 0.28 when edges are short', () => {
    const shape = {
      vb: '0 0 1000 1000',
      dots: [{ cx: 0, cy: 0 }, { cx: 5, cy: 0 }, { cx: 10, cy: 0 }, { cx: 15, cy: 0 }],
      edges: [[0, 1], [1, 2], [2, 3]],
    };
    const r = computeR(shape);
    expect(r).toBeGreaterThanOrEqual(2);
    expect(r).toBeLessThanOrEqual(55); // baseR = Math.round(1000 * 0.055) = 55
  });

  it('never returns less than 2', () => {
    const shape = {
      vb: '0 0 10 10',
      dots: [{ cx: 0, cy: 0 }, { cx: 1, cy: 0 }],
      edges: [[0, 1]],
    };
    expect(computeR(shape)).toBeGreaterThanOrEqual(2);
  });

  it('respects custom dotScale', () => {
    const shape = { vb: '0 0 100 100', dots: [{ cx: 0, cy: 0 }], edges: [] };
    const r1 = computeR(shape, 0.1);
    const r2 = computeR(shape, 0.05);
    expect(r1).toBeGreaterThan(r2);
  });
});

describe('tapResult', () => {
  const adj = buildAdj(triangle);

  describe('when complete', () => {
    it('ignores tap', () => {
      const s = state(null, new Set(['0,1', '0,2', '1,2']), true);
      const r = tapResult(s, 0, adj, 3);
      expect(r.action).toBe('none');
      expect(r.complete).toBe(true);
    });
  });

  describe('first tap (no selection)', () => {
    it('selects the tapped dot', () => {
      const r = tapResult(state(), 1, adj, 3);
      expect(r.selectedDot).toBe(1);
      expect(r.action).toBe('none');
    });
  });

  describe('tap same dot twice', () => {
    it('deselects', () => {
      const r = tapResult(state(1), 1, adj, 3);
      expect(r.selectedDot).toBeNull();
      expect(r.action).toBe('none');
    });
  });

  describe('tap already-completed edge', () => {
    it('resets selection to null', () => {
      const done = new Set(['0,1']);
      const r = tapResult(state(0, done), 1, adj, 3);
      expect(r.selectedDot).toBeNull();
      expect(r.action).toBe('none');
    });
  });

  describe('valid adjacent tap', () => {
    it('draws edge and keeps new dot selected when not fully done', () => {
      const r = tapResult(state(0), 1, adj, 3);
      expect(r.action).toBe('draw');
      expect(r.completedEdges.has('0,1')).toBe(true);
      expect(r.selectedDot).toBe(1);
    });

    it('auto-clears selection when newly tapped dot is fully done', () => {
      // 4-dot shape: edges 0-1, 1-2, 1-3, 2-3 (dot 1 has 3 neighbours)
      const shape4 = {
        vb: '0 0 100 100',
        dots: [{ cx: 0, cy: 0 }, { cx: 50, cy: 0 }, { cx: 100, cy: 0 }, { cx: 100, cy: 100 }],
        edges: [[0, 1], [1, 2], [1, 3], [2, 3]],
      };
      const a4 = buildAdj(shape4);
      const done = new Set(['1,2', '1,3']); // dot 1 still needs edge to 0
      const r = tapResult(state(0, done), 1, a4, 4);
      expect(r.action).toBe('draw');
      expect(r.selectedDot).toBeNull(); // dot 1 now fully connected
    });

    it('reveals image when last edge completed', () => {
      const done = new Set(['0,1', '0,2']);
      const r = tapResult(state(1, done), 2, adj, 3);
      expect(r.action).toBe('reveal');
      expect(r.complete).toBe(true);
      expect(r.selectedDot).toBeNull();
    });
  });

  describe('non-adjacent tap', () => {
    it('flashes dot, state unchanged', () => {
      const shape = {
        vb: '0 0 100 100',
        dots: [{ cx: 0, cy: 0 }, { cx: 50, cy: 0 }, { cx: 100, cy: 0 }, { cx: 100, cy: 100 }],
        edges: [[0, 1], [1, 2], [2, 3]],
      };
      const a = buildAdj(shape);
      const r = tapResult(state(0), 3, a, 3); // 0 and 3 not adjacent
      expect(r.action).toBe('flash');
      expect(r.selectedDot).toBe(0);
    });
  });

  describe('line shape — full completion', () => {
    it('completes on single edge', () => {
      const a = buildAdj(line);
      const r = tapResult(state(0), 1, a, 1);
      expect(r.action).toBe('reveal');
      expect(r.complete).toBe(true);
    });
  });
});
