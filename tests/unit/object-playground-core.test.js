import { createRequire } from 'module';
import { vi, afterEach } from 'vitest';
const require = createRequire(import.meta.url);
const {
  OBJ_SHAPES, OBJ_COLOURS, OBJ_SIZES, OBJ_ROTATIONS, OBJ_SIZE_MAP,
  OBJ_BASE_R, OBJ_MAX_COUNT, OBJ_SPAWN_RADIUS, OBJ_MOVE_STEP, objPick, initObjectState,
  PAN_THRESHOLD, buildGesture, getDragMoves, updateDragPosition, getDragCancelMoves, applyToolboxClick,
  getPanMoves, getTapFlag, applyPan,
  objectsAtPoint, bringToFront, applyStackPick,
  cycleProperty, selectObject, deselectAll, handleTap, handlePropertyCycle, buildStackHTML, buildToolboxHTML,
  canAddObject, addObject, removeObject, restoreDeleted, moveSelectedObject,
  gridSpawn, OBJ_SPAWN_CELL, rotationCue,
  renderObjectShape, easeOutQuad, objTransform, getVisualPos, OBJ_ANIM_DURATION
} = require('../../core/object-playground/object-playground-core.js');

describe('gridSpawn', () => {
  const vp = { x: 100, y: 200, width: 900, height: 600 };

  it('fills left to right at a constant y on the first row', () => {
    const a = gridSpawn(vp, 0);
    const b = gridSpawn(vp, 1);
    const c = gridSpawn(vp, 2);
    expect(b.x).toBe(a.x + OBJ_SPAWN_CELL);
    expect(c.x).toBe(b.x + OBJ_SPAWN_CELL);
    expect(a.y).toBe(b.y);
    expect(b.y).toBe(c.y);
  });

  it('is offset by the viewport origin', () => {
    const margin = OBJ_BASE_R * 2 + 8;
    const a = gridSpawn(vp, 0);
    expect(a.x).toBe(vp.x + margin);
    expect(a.y).toBe(vp.y + margin);
  });

  it('wraps to a new row once a row is full', () => {
    const margin = OBJ_BASE_R * 2 + 8;
    const cols = Math.floor((vp.width - margin * 2) / OBJ_SPAWN_CELL) + 1;
    const first = gridSpawn(vp, 0);
    const wrapped = gridSpawn(vp, cols);
    expect(wrapped.x).toBe(first.x);
    expect(wrapped.y).toBe(first.y + OBJ_SPAWN_CELL);
  });

  it('keeps at least one column on a narrow viewport', () => {
    const narrow = { x: 0, y: 0, width: 10, height: 600 };
    const a = gridSpawn(narrow, 0);
    const b = gridSpawn(narrow, 1);
    expect(a.x).toBe(b.x);
    expect(b.y).toBe(a.y + OBJ_SPAWN_CELL);
  });
});

describe('constants', () => {
  it('OBJ_SHAPES has 7 entries', () => {
    expect(OBJ_SHAPES).toEqual(['circle', 'square', 'triangle', 'rectangle', 'pentagon', 'star', 'heart']);
  });

  it('OBJ_COLOURS has 6 entries', () => {
    expect(OBJ_COLOURS).toEqual(['red', 'yellow', 'blue', 'orange', 'green', 'purple']);
  });

  it('OBJ_SPAWN_RADIUS is double the base radius', () => {
    expect(OBJ_SPAWN_RADIUS).toBe(OBJ_BASE_R * 2);
  });

  it('OBJ_SIZES has 5 entries including x-large and xx-large', () => {
    expect(OBJ_SIZES).toHaveLength(5);
    expect(OBJ_SIZES).toContain('x-large');
    expect(OBJ_SIZES).toContain('xx-large');
  });

  it('OBJ_ROTATIONS has 8 entries at 45 degree increments', () => {
    expect(OBJ_ROTATIONS).toHaveLength(8);
    OBJ_ROTATIONS.forEach(r => expect(r % 45).toBe(0));
  });
});

describe('OBJ_SIZE_MAP', () => {
  it('maps all 5 tiers correctly', () => {
    expect(OBJ_SIZE_MAP.small).toBe(1.0);
    expect(OBJ_SIZE_MAP.medium).toBe(2.0);
    expect(OBJ_SIZE_MAP.large).toBe(3.0);
    expect(OBJ_SIZE_MAP['x-large']).toBe(4.0);
    expect(OBJ_SIZE_MAP['xx-large']).toBe(5.0);
  });
});

describe('objPick', () => {
  it('returns element from array', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 30; i++) {
      expect(arr).toContain(objPick(arr));
    }
  });

  it('picks by index using Math.random multiplied by the array length', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      expect(objPick(['a', 'b', 'c', 'd'])).toBe('c');
    } finally {
      randomSpy.mockRestore();
    }
  });
});

describe('initObjectState', () => {
  const state = initObjectState(800, 600);

  it('produces 10 objects', () => {
    expect(state.objects).toHaveLength(10);
  });

  it('all objects have valid shape', () => {
    state.objects.forEach(obj => expect(OBJ_SHAPES).toContain(obj.shape));
  });

  it('all objects have valid colour', () => {
    state.objects.forEach(obj => expect(OBJ_COLOURS).toContain(obj.colour));
  });

  it('all objects spawn with size up to large only', () => {
    const spawnSizes = OBJ_SIZES.slice(0, 3);
    state.objects.forEach(obj => expect(spawnSizes).toContain(obj.size));
  });

  it('all objects have valid rotation', () => {
    state.objects.forEach(obj => expect(OBJ_ROTATIONS).toContain(obj.rotation));
  });

  it('all objects start unselected', () => {
    state.objects.forEach(obj => expect(obj.selected).toBe(false));
  });

  it('objects have unique zIndex values 0–9', () => {
    const zIndices = state.objects.map(o => o.zIndex).sort((a, b) => a - b);
    expect(zIndices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('all objects positioned within center viewport region', () => {
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP['xx-large']) + 4;
    state.objects.forEach(obj => {
      expect(obj.x).toBeGreaterThanOrEqual(800 + margin);
      expect(obj.x).toBeLessThanOrEqual(800 * 2 - margin);
      expect(obj.y).toBeGreaterThanOrEqual(600 + margin);
      expect(obj.y).toBeLessThanOrEqual(600 * 2 - margin);
    });
  });

  it('world dimensions are larger than viewport', () => {
    expect(state.world.width).toBeGreaterThan(800);
    expect(state.world.height).toBeGreaterThan(600);
  });

  it('viewport starts centered in world', () => {
    expect(state.viewport).toMatchObject({ x: 800, y: 600 });
  });

  it('viewport stores dimensions', () => {
    expect(state.viewport.width).toBe(800);
    expect(state.viewport.height).toBe(600);
  });

  it('stackObjects starts empty', () => {
    expect(state.stackObjects).toEqual([]);
  });
});

describe('initObjectState — deterministic spawn maths', () => {
  it('spawns at exactly viewport+margin when Math.random is 0', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const s = initObjectState(800, 600);
      const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP['xx-large']) + 4;
      s.objects.forEach(obj => {
        expect(obj.x).toBe(800 + margin);
        expect(obj.y).toBe(600 + margin);
      });
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('spreads spawn position multiplicatively across the viewport range', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      const s = initObjectState(800, 600);
      const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP['xx-large']) + 4;
      const expectedX = 800 + margin + 0.5 * (800 - margin * 2);
      const expectedY = 600 + margin + 0.5 * (600 - margin * 2);
      s.objects.forEach(obj => {
        expect(obj.x).toBeCloseTo(expectedX, 6);
        expect(obj.y).toBeCloseTo(expectedY, 6);
      });
    } finally {
      randomSpy.mockRestore();
    }
  });
});

describe('selectObject', () => {
  const state = initObjectState(800, 600);

  it('selects the target object', () => {
    const next = selectObject(state, 'obj-3');
    expect(next.objects.find(o => o.id === 'obj-3').selected).toBe(true);
  });

  it('deselects all other objects', () => {
    const next = selectObject(state, 'obj-3');
    next.objects.filter(o => o.id !== 'obj-3').forEach(o => expect(o.selected).toBe(false));
  });

  it('does not mutate original state', () => {
    selectObject(state, 'obj-3');
    expect(state.objects.find(o => o.id === 'obj-3').selected).toBe(false);
  });
});

describe('deselectAll', () => {
  it('sets all objects to unselected', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-2');
    const next = deselectAll(state);
    next.objects.forEach(o => expect(o.selected).toBe(false));
  });
});

describe('objectsAtPoint', () => {
  it('returns object whose center is at the point', () => {
    const state = initObjectState(800, 600);
    const obj = state.objects[0];
    const result = objectsAtPoint(state, obj.x, obj.y);
    expect(result.map(o => o.id)).toContain(obj.id);
  });

  it('returns empty when point is far from all objects', () => {
    const state = initObjectState(800, 600);
    expect(objectsAtPoint(state, -9999, -9999)).toHaveLength(0);
  });

  it('returns objects sorted by zIndex descending', () => {
    const base = initObjectState(800, 600);
    const x = 400, y = 300;
    const state = Object.assign({}, base, {
      objects: base.objects.map((o, i) => Object.assign({}, o, { x, y, zIndex: i }))
    });
    const result = objectsAtPoint(state, x, y);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].zIndex).toBeGreaterThan(result[i].zIndex);
    }
  });
});

describe('bringToFront', () => {
  it('gives target object the highest zIndex', () => {
    const state = initObjectState(800, 600);
    const next = bringToFront(state, 'obj-0');
    const maxZ = Math.max(...next.objects.map(o => o.zIndex));
    expect(next.objects.find(o => o.id === 'obj-0').zIndex).toBe(maxZ);
  });

  it('normalizes all zIndex values to 0–9', () => {
    const state = bringToFront(bringToFront(initObjectState(800, 600), 'obj-3'), 'obj-7');
    const zIndices = state.objects.map(o => o.zIndex).sort((a, b) => a - b);
    expect(zIndices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('preserves relative order of other objects', () => {
    const state = initObjectState(800, 600);
    const before = state.objects.filter(o => o.id !== 'obj-0').sort((a, b) => a.zIndex - b.zIndex).map(o => o.id);
    const next = bringToFront(state, 'obj-0');
    const after = next.objects.filter(o => o.id !== 'obj-0').sort((a, b) => a.zIndex - b.zIndex).map(o => o.id);
    expect(after).toEqual(before);
  });

  it('does not mutate original state', () => {
    const state = initObjectState(800, 600);
    const origZ = state.objects.find(o => o.id === 'obj-0').zIndex;
    bringToFront(state, 'obj-9');
    expect(state.objects.find(o => o.id === 'obj-0').zIndex).toBe(origZ);
  });
});

describe('applyStackPick', () => {
  it('selects the picked object', () => {
    const state = initObjectState(800, 600);
    const next = applyStackPick(state, 'obj-3');
    expect(next.objects.find(o => o.id === 'obj-3').selected).toBe(true);
  });

  it('brings the picked object to front', () => {
    const state = initObjectState(800, 600);
    const next = applyStackPick(state, 'obj-0');
    const maxZ = Math.max(...next.objects.map(o => o.zIndex));
    expect(next.objects.find(o => o.id === 'obj-0').zIndex).toBe(maxZ);
  });

  it('deselects all other objects', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-5');
    const next = applyStackPick(state, 'obj-3');
    next.objects.filter(o => o.id !== 'obj-3').forEach(o => expect(o.selected).toBe(false));
  });
});

describe('handleTap', () => {
  // Place obj-0 far from all others to guarantee exactly 1 hit
  const makeIsolatedState = () => {
    const base = initObjectState(800, 600);
    return Object.assign({}, base, {
      objects: base.objects.map((o, i) =>
        i === 0 ? Object.assign({}, o, { x: 5000, y: 5000 }) : Object.assign({}, o, { x: 100 + i * 200, y: 100 })
      )
    });
  };

  it('selects object when exactly one at point', () => {
    const state = makeIsolatedState();
    const next = handleTap(state, 5000, 5000);
    expect(next.objects.find(o => o.id === 'obj-0').selected).toBe(true);
  });

  it('brings object to front when exactly one at point', () => {
    const state = makeIsolatedState();
    const next = handleTap(state, 5000, 5000);
    const maxZ = Math.max(...next.objects.map(o => o.zIndex));
    expect(next.objects.find(o => o.id === 'obj-0').zIndex).toBe(maxZ);
  });

  it('sets stackObjects to the object id when one hit', () => {
    const state = makeIsolatedState();
    const next = handleTap(state, 5000, 5000);
    expect(next.stackObjects).toContain('obj-0');
  });

  it('deselects all when no objects at point', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-0');
    const next = handleTap(state, -9999, -9999);
    next.objects.forEach(o => expect(o.selected).toBe(false));
  });

  it('clears stackObjects when no objects at point', () => {
    const state = initObjectState(800, 600);
    const next = handleTap(state, -9999, -9999);
    expect(next.stackObjects).toEqual([]);
  });

  it('sets stack without auto-selecting when multiple objects at point', () => {
    const base = initObjectState(800, 600);
    const x = 400, y = 300;
    const state = Object.assign({}, base, {
      objects: base.objects.map(o => Object.assign({}, o, { x, y }))
    });
    const next = handleTap(state, x, y);
    expect(next.stackObjects).toHaveLength(10);
    next.objects.forEach(o => expect(o.selected).toBe(false));
  });
});

describe('cycleProperty', () => {
  it('cycles shape to next value', () => {
    const obj = { shape: OBJ_SHAPES[0], colour: 'red', size: 'small', rotation: 0, selected: false };
    const next = cycleProperty(obj, 'shape');
    expect(next.shape).toBe(OBJ_SHAPES[1]);
  });

  it('wraps shape back to first', () => {
    const last = OBJ_SHAPES[OBJ_SHAPES.length - 1];
    const obj = { shape: last, colour: 'red', size: 'small', rotation: 0, selected: false };
    const next = cycleProperty(obj, 'shape');
    expect(next.shape).toBe(OBJ_SHAPES[0]);
  });

  it('cycles rotation', () => {
    const obj = { shape: 'circle', colour: 'red', size: 'small', rotation: 0, selected: false };
    const next = cycleProperty(obj, 'rotation');
    expect(next.rotation).toBe(45);
  });

  it('cycles rotation backwards with dir -1, wrapping past zero', () => {
    const obj = { shape: 'circle', colour: 'red', size: 'small', rotation: 0, selected: false };
    const next = cycleProperty(obj, 'rotation', -1);
    expect(next.rotation).toBe(OBJ_ROTATIONS[OBJ_ROTATIONS.length - 1]);
  });
});

describe('handlePropertyCycle', () => {
  it('cycles property on the selected object', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-1');
    const selObj = state.objects.find(o => o.id === 'obj-1');
    const expectedShape = OBJ_SHAPES[(OBJ_SHAPES.indexOf(selObj.shape) + 1) % OBJ_SHAPES.length];
    const next = handlePropertyCycle(state, 'shape');
    expect(next.objects.find(o => o.id === 'obj-1').shape).toBe(expectedShape);
  });

  it('does not change unselected objects', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-1');
    const before = state.objects.find(o => o.id === 'obj-0').shape;
    const next = handlePropertyCycle(state, 'shape');
    expect(next.objects.find(o => o.id === 'obj-0').shape).toBe(before);
  });
});

describe('getPanMoves', () => {
  const base = { active: true, onObj: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 };

  it('returns empty when gesture not active', () => {
    expect(getPanMoves({ active: false }, 50, 50)).toHaveLength(0);
  });

  it('returns empty when gesture started on object', () => {
    expect(getPanMoves(Object.assign({}, base, { onObj: true }), 50, 50)).toHaveLength(0);
  });

  it('returns empty when below threshold and not yet moved', () => {
    expect(getPanMoves(base, PAN_THRESHOLD - 1, 0)).toHaveLength(0);
  });

  it('returns pan target when movement exceeds threshold', () => {
    const moves = getPanMoves(base, 50, 30);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({ x: -50, y: -30 });
  });

  it('returns pan target when already marked moved (even below threshold)', () => {
    const moved = Object.assign({}, base, { moved: true });
    expect(getPanMoves(moved, 1, 1)).toHaveLength(1);
  });

  it('offsets pan from gesture origin', () => {
    const g = Object.assign({}, base, { originX: 100, originY: 200 });
    const moves = getPanMoves(g, 50, 30);
    expect(moves[0]).toEqual({ x: 50, y: 170 });
  });
});

describe('getTapFlag', () => {
  it('returns empty when not active', () => {
    expect(getTapFlag({ active: false })).toHaveLength(0);
  });

  it('returns empty when gesture moved', () => {
    expect(getTapFlag({ active: true, moved: true })).toHaveLength(0);
  });

  it('returns [true] for a clean tap', () => {
    expect(getTapFlag({ active: true, moved: false })).toEqual([true]);
  });
});

describe('applyPan', () => {
  const state = initObjectState(800, 600);

  it('updates viewport position', () => {
    const next = applyPan(state, 100, 50);
    expect(next.viewport.x).toBe(100);
    expect(next.viewport.y).toBe(50);
  });

  it('clamps to minimum 0', () => {
    const next = applyPan(state, -100, -100);
    expect(next.viewport.x).toBe(0);
    expect(next.viewport.y).toBe(0);
  });

  it('clamps to max world minus viewport', () => {
    const maxX = state.world.width - state.viewport.width;
    const maxY = state.world.height - state.viewport.height;
    const next = applyPan(state, 99999, 99999);
    expect(next.viewport.x).toBe(maxX);
    expect(next.viewport.y).toBe(maxY);
  });

  it('does not mutate original state', () => {
    const origX = state.viewport.x;
    const origY = state.viewport.y;
    applyPan(state, origX + 100, origY + 50);
    expect(state.viewport.x).toBe(origX);
    expect(state.viewport.y).toBe(origY);
  });

  it('preserves viewport dimensions', () => {
    const next = applyPan(state, 100, 50);
    expect(next.viewport.width).toBe(state.viewport.width);
    expect(next.viewport.height).toBe(state.viewport.height);
  });
});

describe('buildGesture', () => {
  const state = initObjectState(800, 600);

  it('onObj=false when no target id', () => {
    const g = buildGesture(state, undefined, 0, 0, 0, 0, 0, 0);
    expect(g.onObj).toBe(false);
    expect(g.isSelected).toBe(false);
  });

  it('onObj=true, isSelected=false for unselected target', () => {
    const g = buildGesture(state, 'obj-0', 0, 0, 0, 0, 0, 0);
    expect(g.onObj).toBe(true);
    expect(g.isSelected).toBe(false);
  });

  it('isSelected=true for selected target', () => {
    const sel = selectObject(state, 'obj-0');
    const g = buildGesture(sel, 'obj-0', 0, 0, 0, 0, 0, 0);
    expect(g.isSelected).toBe(true);
  });

  it('records originObjX/Y from object position', () => {
    const obj = state.objects.find(o => o.id === 'obj-2');
    const g = buildGesture(state, 'obj-2', 50, 60, 10, 20, 0, 0);
    expect(g.originObjX).toBe(obj.x);
    expect(g.originObjY).toBe(obj.y);
  });

  it('records viewport origin and client position', () => {
    const g = buildGesture(state, undefined, 50, 60, 10, 20, 0, 0);
    expect(g.startX).toBe(50);
    expect(g.startY).toBe(60);
    expect(g.originX).toBe(10);
    expect(g.originY).toBe(20);
  });

  it('records tap world coordinates', () => {
    const g = buildGesture(state, undefined, 0, 0, 0, 0, 123, 456);
    expect(g.tapWorldX).toBe(123);
    expect(g.tapWorldY).toBe(456);
  });

  it('starts with active=true, moved=false', () => {
    const g = buildGesture(state, undefined, 0, 0, 0, 0, 0, 0);
    expect(g.active).toBe(true);
    expect(g.moved).toBe(false);
  });
});

describe('getDragMoves', () => {
  const base = { active: true, onObj: true, isSelected: true, moved: false, originObjX: 100, originObjY: 200 };

  it('returns empty when not active', () => {
    expect(getDragMoves({ active: false }, 50, 50)).toHaveLength(0);
  });

  it('returns empty when not onObj', () => {
    expect(getDragMoves(Object.assign({}, base, { onObj: false }), 50, 50)).toHaveLength(0);
  });

  it('returns empty when not isSelected', () => {
    expect(getDragMoves(Object.assign({}, base, { isSelected: false }), 50, 50)).toHaveLength(0);
  });

  it('returns empty when below threshold and not yet moved', () => {
    expect(getDragMoves(base, PAN_THRESHOLD - 1, 0)).toHaveLength(0);
  });

  it('returns new position when threshold exceeded', () => {
    const moves = getDragMoves(base, 50, 30);
    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({ x: 150, y: 230 });
  });

  it('returns position when already moved (even below threshold)', () => {
    const moved = Object.assign({}, base, { moved: true });
    expect(getDragMoves(moved, 1, 1)).toHaveLength(1);
  });
});

describe('updateDragPosition', () => {
  const state = selectObject(initObjectState(800, 600), 'obj-0');

  it('moves selected object to new position', () => {
    const next = updateDragPosition(state, 300, 400);
    expect(next.objects.find(o => o.id === 'obj-0').x).toBe(300);
    expect(next.objects.find(o => o.id === 'obj-0').y).toBe(400);
  });

  it('clamps position to world bounds', () => {
    const obj = state.objects.find(o => o.id === 'obj-0');
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP[obj.size]);
    const next = updateDragPosition(state, 99999, 99999);
    expect(next.objects.find(o => o.id === 'obj-0').x).toBe(state.world.width - margin);
    expect(next.objects.find(o => o.id === 'obj-0').y).toBe(state.world.height - margin);
  });

  it('clamps to minimum margin', () => {
    const obj = state.objects.find(o => o.id === 'obj-0');
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP[obj.size]);
    const next = updateDragPosition(state, 0, 0);
    expect(next.objects.find(o => o.id === 'obj-0').x).toBe(margin);
    expect(next.objects.find(o => o.id === 'obj-0').y).toBe(margin);
  });

  it('does not affect unselected objects', () => {
    const before = state.objects.find(o => o.id === 'obj-5');
    const next = updateDragPosition(state, 300, 400);
    const after = next.objects.find(o => o.id === 'obj-5');
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
  });

  it('does not mutate original state', () => {
    const orig = state.objects.find(o => o.id === 'obj-0').x;
    updateDragPosition(state, 300, 400);
    expect(state.objects.find(o => o.id === 'obj-0').x).toBe(orig);
  });
});

describe('getDragCancelMoves', () => {
  const base = { active: true, isSelected: true, moved: true, originObjX: 50, originObjY: 60 };

  it('returns empty when not active', () => {
    expect(getDragCancelMoves({ active: false })).toHaveLength(0);
  });

  it('returns empty when not isSelected', () => {
    expect(getDragCancelMoves(Object.assign({}, base, { isSelected: false }))).toHaveLength(0);
  });

  it('returns empty when not moved', () => {
    expect(getDragCancelMoves(Object.assign({}, base, { moved: false }))).toHaveLength(0);
  });

  it('returns origin when active+isSelected+moved', () => {
    const result = getDragCancelMoves(base);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 50, y: 60 });
  });
});

describe('applyToolboxClick', () => {
  it('cycles property when no drag active', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-1');
    const sel = state.objects.find(o => o.id === 'obj-1');
    const expected = OBJ_SHAPES[(OBJ_SHAPES.indexOf(sel.shape) + 1) % OBJ_SHAPES.length];
    const result = applyToolboxClick(state, { active: false }, 'shape');
    expect(result.objects.find(o => o.id === 'obj-1').shape).toBe(expected);
  });

  it('restores position and cycles property when drag active', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-1');
    const sel = state.objects.find(o => o.id === 'obj-1');
    const dragged = updateDragPosition(state, sel.x + 100, sel.y + 50);
    const gesture = { active: true, isSelected: true, moved: true, originObjX: sel.x, originObjY: sel.y };
    const result = applyToolboxClick(dragged, gesture, 'shape');
    expect(result.objects.find(o => o.id === 'obj-1').x).toBe(sel.x);
    expect(result.objects.find(o => o.id === 'obj-1').y).toBe(sel.y);
    const expected = OBJ_SHAPES[(OBJ_SHAPES.indexOf(sel.shape) + 1) % OBJ_SHAPES.length];
    expect(result.objects.find(o => o.id === 'obj-1').shape).toBe(expected);
  });
});

describe('buildStackHTML', () => {
  const state = initObjectState(800, 600);

  it('returns empty string for empty stack', () => {
    expect(buildStackHTML([], state.objects)).toBe('');
  });

  it('produces a data-pick row for each id', () => {
    const html = buildStackHTML(['obj-2', 'obj-5'], state.objects);
    expect(html).toContain('data-pick="obj-2"');
    expect(html).toContain('data-pick="obj-5"');
  });

  it('includes inline SVG preview', () => {
    const html = buildStackHTML(['obj-0'], state.objects);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="-36 -36 72 72"');
  });
});

describe('buildToolboxHTML', () => {
  const obj = { shape: 'circle', colour: 'red', size: 'medium', rotation: 90 };
  const html = buildToolboxHTML(obj);

  it('contains all four property rows', () => {
    expect(html).toContain('data-prop="shape"');
    expect(html).toContain('data-prop="colour"');
    expect(html).toContain('data-prop="size"');
    expect(html).toContain('data-prop="rotation"');
  });

  it('shows current values', () => {
    expect(html).toContain('circle');
    expect(html).toContain('red');
    expect(html).toContain('medium');
    expect(html).toContain('90');
  });

  it('includes clockwise and anticlockwise rotation rows', () => {
    expect(html).toContain('data-prop="rotation" data-rot-dir="cw"');
    expect(html).toContain('data-prop="rotation" data-rot-dir="acw"');
  });

  it('includes delete row with data-action="delete"', () => {
    expect(html).toContain('data-action="delete"');
  });

  it('includes all four direction action buttons', () => {
    expect(html).toContain('data-action="move-left"');
    expect(html).toContain('data-action="move-right"');
    expect(html).toContain('data-action="move-up"');
    expect(html).toContain('data-action="move-down"');
  });

  it('renders the exact markup for every row, in order', () => {
    const expected =
      '<div class="obj-tool-row" data-prop="shape"><span class="obj-tool-label">Shape</span><span class="obj-tool-val">circle</span></div>' +
      '<div class="obj-tool-row" data-prop="colour"><span class="obj-tool-label">Colour</span><span class="obj-tool-val">red</span></div>' +
      '<div class="obj-tool-row" data-prop="size"><span class="obj-tool-label">Size</span><span class="obj-tool-val">medium</span></div>' +
      '<div class="obj-tool-row" data-prop="rotation" data-rot-dir="cw"><span class="obj-tool-label">↻ Spin</span><span class="obj-tool-val">90°</span></div>' +
      '<div class="obj-tool-row" data-prop="rotation" data-rot-dir="acw"><span class="obj-tool-label">↺ Spin back</span><span class="obj-tool-val">90°</span></div>' +
      '<div class="obj-tool-row" data-action="move-left"><span class="obj-tool-label">⬅</span><span class="obj-tool-val">Left</span></div>' +
      '<div class="obj-tool-row" data-action="move-right"><span class="obj-tool-label">➡</span><span class="obj-tool-val">Right</span></div>' +
      '<div class="obj-tool-row" data-action="move-up"><span class="obj-tool-label">⬆</span><span class="obj-tool-val">Up</span></div>' +
      '<div class="obj-tool-row" data-action="move-down"><span class="obj-tool-label">⬇</span><span class="obj-tool-val">Down</span></div>' +
      '<div class="obj-tool-row obj-tool-delete" data-action="delete"><span class="obj-tool-label">Delete</span><span class="obj-tool-val">✕</span></div>';
    expect(html).toBe(expected);
  });
});

describe('canAddObject', () => {
  it('returns true when count below max', () => {
    const state = initObjectState(800, 600);
    expect(canAddObject(state)).toBe(true);
  });

  it('returns false when count at max', () => {
    let state = initObjectState(800, 600);
    const toAdd = OBJ_MAX_COUNT - state.objects.length;
    for (let i = 0; i < toAdd; i++) {
      state = addObject(state, i * 1000, i * 1000);
    }
    expect(state.objects.length).toBe(OBJ_MAX_COUNT);
    expect(canAddObject(state)).toBe(false);
  });

  it('returns true regardless of proximity when below max', () => {
    const state = initObjectState(800, 600);
    const s1 = addObject(state, 0, 0);
    const s2 = addObject(s1, 0, 0);
    expect(canAddObject(s2)).toBe(true);
  });
});

describe('addObject', () => {
  const state = initObjectState(800, 600);
  const next = addObject(state, 400, 300);

  it('increases object count by 1', () => {
    expect(next.objects.length).toBe(state.objects.length + 1);
  });

  it('new object has given x/y', () => {
    const added = next.objects[next.objects.length - 1];
    expect(added.x).toBe(400);
    expect(added.y).toBe(300);
  });

  it('new object has spawn-range size (small/medium/large)', () => {
    const added = next.objects[next.objects.length - 1];
    expect(OBJ_SIZES.slice(0, 3)).toContain(added.size);
  });

  it('new object has highest zIndex', () => {
    const added = next.objects[next.objects.length - 1];
    const maxZ = Math.max(...state.objects.map(o => o.zIndex));
    expect(added.zIndex).toBe(maxZ + 1);
  });

  it('increments nextId', () => {
    expect(next.nextId).toBe(state.nextId + 1);
  });

  it('does not mutate original state', () => {
    expect(state.objects.length).toBe(10);
  });

  it('assigns the new object an obj-<nextId> id', () => {
    const added = next.objects[next.objects.length - 1];
    expect(added.id).toBe('obj-' + state.nextId);
  });

  it('spawns unselected', () => {
    const added = next.objects[next.objects.length - 1];
    expect(added.selected).toBe(false);
  });

  it('starts zIndex counting from -1 when there are no existing objects', () => {
    const empty = Object.assign({}, state, { objects: [] });
    const added = addObject(empty, 10, 20);
    expect(added.objects[0].zIndex).toBe(0);
  });

  it('picks the new object size only from the small/medium/large slice', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.7);
    try {
      const withSize = addObject(initObjectState(800, 600), 400, 300);
      const added = withSize.objects[withSize.objects.length - 1];
      expect(added.size).toBe('large');
    } finally {
      randomSpy.mockRestore();
    }
  });
});

describe('removeObject', () => {
  const state = selectObject(initObjectState(800, 600), 'obj-3');
  const next = removeObject(state, 'obj-3');

  it('removes the object from state', () => {
    expect(next.objects.find(o => o.id === 'obj-3')).toBeUndefined();
  });

  it('stores removed object in deletedObject', () => {
    expect(next.deletedObject).not.toBeNull();
    expect(next.deletedObject.id).toBe('obj-3');
  });

  it('stores all properties in deletedObject', () => {
    const orig = state.objects.find(o => o.id === 'obj-3');
    expect(next.deletedObject.shape).toBe(orig.shape);
    expect(next.deletedObject.x).toBe(orig.x);
    expect(next.deletedObject.zIndex).toBe(orig.zIndex);
  });

  it('removes id from stackObjects', () => {
    const withStack = Object.assign({}, state, { stackObjects: ['obj-3', 'obj-5'] });
    const result = removeObject(withStack, 'obj-3');
    expect(result.stackObjects).not.toContain('obj-3');
  });

  it('does not mutate original state', () => {
    expect(state.objects.find(o => o.id === 'obj-3')).toBeDefined();
  });

  it('keeps other objects untouched when removing one', () => {
    expect(next.objects).toHaveLength(9);
    expect(next.objects.find(o => o.id === 'obj-5')).toBeDefined();
  });

  it('keeps other stackObjects entries when removing one', () => {
    const withStack = Object.assign({}, state, { stackObjects: ['obj-3', 'obj-5'] });
    const result = removeObject(withStack, 'obj-3');
    expect(result.stackObjects).toEqual(['obj-5']);
  });
});

describe('restoreDeleted', () => {
  it('restores deleted object back into objects', () => {
    const state = removeObject(initObjectState(800, 600), 'obj-5');
    const next = restoreDeleted(state);
    expect(next.objects.find(o => o.id === 'obj-5')).toBeDefined();
  });

  it('clears deletedObject after restore', () => {
    const state = removeObject(initObjectState(800, 600), 'obj-5');
    const next = restoreDeleted(state);
    expect(next.deletedObject).toBeNull();
  });

  it('restored object is unselected', () => {
    const state = removeObject(selectObject(initObjectState(800, 600), 'obj-5'), 'obj-5');
    const next = restoreDeleted(state);
    expect(next.objects.find(o => o.id === 'obj-5').selected).toBe(false);
  });

  it('is a no-op when deletedObject is null', () => {
    const state = initObjectState(800, 600);
    const next = restoreDeleted(state);
    expect(next.objects.length).toBe(state.objects.length);
  });

  it('does not mutate original state', () => {
    const state = removeObject(initObjectState(800, 600), 'obj-5');
    restoreDeleted(state);
    expect(state.deletedObject).not.toBeNull();
  });
});

describe('moveSelectedObject', () => {
  const makeState = () => {
    const base = initObjectState(800, 600);
    const withSel = selectObject(base, 'obj-0');
    return Object.assign({}, withSel, {
      objects: withSel.objects.map(o =>
        o.id === 'obj-0' ? Object.assign({}, o, { x: 800, y: 600, size: 'medium' }) : o
      )
    });
  };

  it('moves selected object left by OBJ_MOVE_STEP', () => {
    const state = makeState();
    const next = moveSelectedObject(state, 'left');
    expect(next.objects.find(o => o.id === 'obj-0').x).toBe(800 - OBJ_MOVE_STEP);
  });

  it('moves selected object right by OBJ_MOVE_STEP', () => {
    const state = makeState();
    const next = moveSelectedObject(state, 'right');
    expect(next.objects.find(o => o.id === 'obj-0').x).toBe(800 + OBJ_MOVE_STEP);
  });

  it('moves selected object up by OBJ_MOVE_STEP', () => {
    const state = makeState();
    const next = moveSelectedObject(state, 'up');
    expect(next.objects.find(o => o.id === 'obj-0').y).toBe(600 - OBJ_MOVE_STEP);
  });

  it('moves selected object down by OBJ_MOVE_STEP', () => {
    const state = makeState();
    const next = moveSelectedObject(state, 'down');
    expect(next.objects.find(o => o.id === 'obj-0').y).toBe(600 + OBJ_MOVE_STEP);
  });

  it('clamps to world left boundary', () => {
    const base = initObjectState(800, 600);
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP['medium']);
    const state = Object.assign({}, selectObject(base, 'obj-0'), {
      objects: selectObject(base, 'obj-0').objects.map(o =>
        o.id === 'obj-0' ? Object.assign({}, o, { x: margin, y: 600, size: 'medium' }) : o
      )
    });
    const next = moveSelectedObject(state, 'left');
    expect(next.objects.find(o => o.id === 'obj-0').x).toBe(margin);
  });

  it('clamps to world right boundary', () => {
    const base = initObjectState(800, 600);
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP['medium']);
    const maxX = base.world.width - margin;
    const state = Object.assign({}, selectObject(base, 'obj-0'), {
      objects: selectObject(base, 'obj-0').objects.map(o =>
        o.id === 'obj-0' ? Object.assign({}, o, { x: maxX, y: 600, size: 'medium' }) : o
      )
    });
    const next = moveSelectedObject(state, 'right');
    expect(next.objects.find(o => o.id === 'obj-0').x).toBe(maxX);
  });

  it('does not move unselected objects', () => {
    const state = makeState();
    const before = state.objects.find(o => o.id === 'obj-5').x;
    const next = moveSelectedObject(state, 'right');
    expect(next.objects.find(o => o.id === 'obj-5').x).toBe(before);
  });

  it('is a no-op when no object selected', () => {
    const state = deselectAll(makeState());
    const next = moveSelectedObject(state, 'right');
    next.objects.forEach((o, i) => {
      expect(o.x).toBe(state.objects[i].x);
    });
  });

  it('returns state unchanged for unknown direction', () => {
    const state = makeState();
    const next = moveSelectedObject(state, 'diagonal');
    expect(next).toBe(state);
  });

  it('does not mutate original state', () => {
    const state = makeState();
    const origX = state.objects.find(o => o.id === 'obj-0').x;
    moveSelectedObject(state, 'right');
    expect(state.objects.find(o => o.id === 'obj-0').x).toBe(origX);
  });
});

describe('rotationCue', () => {
  it('maps clockwise (cw) to "clockwise"', () => {
    expect(rotationCue('cw')).toBe('clockwise');
  });

  it('maps anticlockwise (acw) to "anticlockwise"', () => {
    expect(rotationCue('acw')).toBe('anticlockwise');
  });

  it('gives the two directions distinct cues', () => {
    expect(rotationCue('cw')).not.toBe(rotationCue('acw'));
  });
});

describe('renderObjectShape', () => {
  it('renders a circle with fill, stroke and orientation dot', () => {
    const svg = renderObjectShape('circle', 'red');
    expect(svg).toContain('<circle r="32" fill="#E74C3C" stroke="#C0392B" stroke-width="3"/>');
    expect(svg).toContain('<circle cx="0" cy="-25" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>');
  });

  it('renders a square with a rounded rect and the shared orientation dot', () => {
    const svg = renderObjectShape('square', 'blue');
    expect(svg).toContain('<rect x="-32" y="-32" width="64" height="64" rx="6" fill="#3498DB" stroke="#2980B9" stroke-width="3"/>');
    expect(svg).toContain('<circle cx="0" cy="-25" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>');
  });

  it('renders a triangle with its own orientation dot at cy=-22', () => {
    const svg = renderObjectShape('triangle', 'green');
    expect(svg).toContain('<polygon points="0,-32 27.7,16 -27.7,16" fill="#2ECC71" stroke="#27AE60" stroke-width="3"/>');
    expect(svg).toContain('<circle cx="0" cy="-22" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>');
  });

  it('renders a rectangle with its own orientation dot at cy=-17', () => {
    const svg = renderObjectShape('rectangle', 'yellow');
    expect(svg).toContain('<rect x="-38.4" y="-20.8" width="76.8" height="41.6" rx="6" fill="#F1C40F" stroke="#D4AC0D" stroke-width="3"/>');
    expect(svg).toContain('<circle cx="0" cy="-17" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>');
  });

  it('renders a pentagon with fill, stroke and the shared orientation dot', () => {
    const svg = renderObjectShape('pentagon', 'purple');
    expect(svg).toContain('<polygon points="0,-32 30.4,-9.9 18.8,25.9 -18.8,25.9 -30.4,-9.9" fill="#9B59B6" stroke="#7D3C98" stroke-width="3"/>');
    expect(svg).toContain('<circle cx="0" cy="-25" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>');
  });

  it('renders a star with its own orientation dot at cy=-24', () => {
    const svg = renderObjectShape('star', 'orange');
    expect(svg).toContain('<polygon points="0,-32 7.9,-10.9 30.4,-9.9 12.8,4.2 18.8,25.9 0,13.4 -18.8,25.9 -12.8,4.2 -30.4,-9.9 -7.9,-10.9" fill="#F39C12" stroke="#D68910" stroke-width="3"/>');
    expect(svg).toContain('<circle cx="0" cy="-24" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>');
  });

  it('renders any unmatched shape name as a heart with its own orientation dot', () => {
    const svg = renderObjectShape('heart', 'red');
    expect(svg).toContain('fill="#E74C3C" stroke="#C0392B" stroke-width="3"/>');
    expect(svg).toContain('<circle cx="14" cy="-14" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>');
    expect(svg).not.toContain('<circle r="32"');
  });
});

describe('easeOutQuad', () => {
  it('returns 0 at t=0', () => {
    expect(easeOutQuad(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeOutQuad(1)).toBe(1);
  });

  it('returns 0.75 at t=0.5', () => {
    expect(easeOutQuad(0.5)).toBe(0.75);
  });

  it('is monotonically increasing between 0 and 1', () => {
    expect(easeOutQuad(0.25)).toBeLessThan(easeOutQuad(0.75));
  });
});

describe('objTransform', () => {
  it('formats a translate/rotate/scale transform string', () => {
    const result = objTransform({ x: 10, y: 20 }, 90, 1.5);
    expect(result).toBe('translate(10.0,20.0) rotate(90) scale(1.5)');
  });
});

describe('getVisualPos', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the object position directly when there is no animation entry', () => {
    const obj = { id: 'obj-0', x: 50, y: 60 };
    expect(getVisualPos(obj, {})).toEqual({ x: 50, y: 60 });
  });

  it('returns the end position and clears the animation once the duration has elapsed', () => {
    vi.useFakeTimers();
    const start = Date.now();
    const obj = { id: 'obj-0', x: 300, y: 400 };
    const animMap = { 'obj-0': { startTime: start, fromX: 100, fromY: 100, toX: 300, toY: 400 } };
    vi.advanceTimersByTime(OBJ_ANIM_DURATION);
    const pos = getVisualPos(obj, animMap);
    expect(pos).toEqual({ x: 300, y: 400 });
    expect(animMap['obj-0']).toBeUndefined();
  });

  it('interpolates position partway through the animation using easeOutQuad', () => {
    vi.useFakeTimers();
    const start = Date.now();
    const obj = { id: 'obj-0', x: 999, y: 999 };
    const animMap = { 'obj-0': { startTime: start, fromX: 10, fromY: 20, toX: 110, toY: 220 } };
    const elapsed = Math.floor(OBJ_ANIM_DURATION / 2);
    vi.advanceTimersByTime(elapsed);
    const pos = getVisualPos(obj, animMap);
    const t = elapsed / OBJ_ANIM_DURATION;
    const e = easeOutQuad(t);
    expect(pos.x).toBeCloseTo(10 + (110 - 10) * e, 5);
    expect(pos.y).toBeCloseTo(20 + (220 - 20) * e, 5);
    expect(animMap['obj-0']).toBeDefined();
  });
});

describe('getDragMoves — active gating', () => {
  it('returns empty when not active even when onObj/isSelected/moved are all true', () => {
    const g = { active: false, onObj: true, isSelected: true, moved: true, originObjX: 100, originObjY: 200 };
    expect(getDragMoves(g, 50, 30)).toHaveLength(0);
  });
});

describe('getDragMoves / getPanMoves — threshold boundary is exclusive', () => {
  const dragBase = { active: true, onObj: true, isSelected: true, moved: false, originObjX: 100, originObjY: 200 };
  const panBase = { active: true, onObj: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 };

  it('getDragMoves returns a move when dx is exactly at the threshold', () => {
    expect(getDragMoves(dragBase, PAN_THRESHOLD, 0)).toHaveLength(1);
  });

  it('getDragMoves returns a move when dy is exactly at the threshold', () => {
    expect(getDragMoves(dragBase, 0, PAN_THRESHOLD)).toHaveLength(1);
  });

  it('getPanMoves returns a pan target when dx is exactly at the threshold', () => {
    expect(getPanMoves(panBase, PAN_THRESHOLD, 0)).toHaveLength(1);
  });

  it('getPanMoves returns a pan target when dy is exactly at the threshold', () => {
    expect(getPanMoves(panBase, 0, PAN_THRESHOLD)).toHaveLength(1);
  });
});

describe('getDragCancelMoves — active gating', () => {
  it('returns empty when not active even when isSelected/moved are true', () => {
    const g = { active: false, isSelected: true, moved: true, originObjX: 50, originObjY: 60 };
    expect(getDragCancelMoves(g)).toHaveLength(0);
  });
});

describe('updateDragPosition — margin uses OBJ_SIZE_MAP multiplicatively', () => {
  it('clamps a large object using the multiplied (not divided) margin', () => {
    const base = initObjectState(800, 600);
    const large = Object.assign({}, base, {
      objects: base.objects.map(o => o.id === 'obj-0' ? Object.assign({}, o, { size: 'large' }) : o)
    });
    const state = selectObject(large, 'obj-0');
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP.large);
    const next = updateDragPosition(state, 99999, 99999);
    expect(next.objects.find(o => o.id === 'obj-0').x).toBe(state.world.width - margin);
    expect(next.objects.find(o => o.id === 'obj-0').y).toBe(state.world.height - margin);
  });
});

describe('objectsAtPoint — radius uses OBJ_SIZE_MAP multiplicatively, boundary inclusive', () => {
  const isolate = (size) => {
    const base = initObjectState(800, 600);
    return Object.assign({}, base, {
      objects: base.objects.map((o, i) =>
        i === 0 ? Object.assign({}, o, { size, x: 400, y: 300 }) : Object.assign({}, o, { x: -9999, y: -9999 })
      )
    });
  };

  it('hits a large object just inside its multiplied radius', () => {
    const state = isolate('large');
    const r = OBJ_BASE_R * OBJ_SIZE_MAP.large;
    const result = objectsAtPoint(state, 400 + r - 1, 300);
    expect(result.map(o => o.id)).toContain('obj-0');
  });

  it('includes an object exactly at the hit-radius boundary', () => {
    const state = isolate('small');
    const r = OBJ_BASE_R * OBJ_SIZE_MAP.small;
    const result = objectsAtPoint(state, 400 + r, 300);
    expect(result.map(o => o.id)).toContain('obj-0');
  });
});

describe('bringToFront — comparator and mutation safety', () => {
  it('assigns ascending zIndex by real numeric rank, not by pairwise sum', () => {
    const base = initObjectState(800, 600);
    const zIndices = [40, 10, 30, 20, 0, 1, 2, 3, 4, 5];
    const state = Object.assign({}, base, {
      objects: base.objects.map((o, i) => Object.assign({}, o, { zIndex: zIndices[i] }))
    });
    const next = bringToFront(state, 'obj-9');
    const expectedRank = ['obj-4', 'obj-5', 'obj-6', 'obj-7', 'obj-8', 'obj-1', 'obj-3', 'obj-2', 'obj-0'];
    expectedRank.forEach((id, rank) => {
      expect(next.objects.find(o => o.id === id).zIndex).toBe(rank);
    });
    expect(next.objects.find(o => o.id === 'obj-9').zIndex).toBe(9);
  });

  it('does not mutate the order of the original objects array', () => {
    const base = initObjectState(800, 600);
    const zIndices = [40, 10, 30, 20, 0, 1, 2, 3, 4, 5];
    const state = Object.assign({}, base, {
      objects: base.objects.map((o, i) => Object.assign({}, o, { zIndex: zIndices[i] }))
    });
    const idsBefore = state.objects.map(o => o.id);
    bringToFront(state, 'obj-5');
    expect(state.objects.map(o => o.id)).toEqual(idsBefore);
  });
});

describe('removeObject — stackObjects filter keeps other ids', () => {
  it('keeps other stackObjects entries when removing one', () => {
    const state = Object.assign({}, selectObject(initObjectState(800, 600), 'obj-3'), {
      stackObjects: ['obj-3', 'obj-5']
    });
    const next = removeObject(state, 'obj-3');
    expect(next.stackObjects).toEqual(['obj-5']);
  });
});

describe('moveSelectedObject — up/down clamp to world bounds', () => {
  const clampState = (y) => {
    const base = initObjectState(800, 600);
    const withSel = selectObject(base, 'obj-0');
    return Object.assign({}, withSel, {
      objects: withSel.objects.map(o => o.id === 'obj-0' ? Object.assign({}, o, { x: 800, y, size: 'medium' }) : o)
    });
  };

  it('clamps to world top boundary', () => {
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP.medium);
    const state = clampState(margin);
    const next = moveSelectedObject(state, 'up');
    expect(next.objects.find(o => o.id === 'obj-0').y).toBe(margin);
  });

  it('clamps to world bottom boundary', () => {
    const base = initObjectState(800, 600);
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP.medium);
    const maxY = base.world.height - margin;
    const state = clampState(maxY);
    const next = moveSelectedObject(state, 'down');
    expect(next.objects.find(o => o.id === 'obj-0').y).toBe(maxY);
  });
});

describe('buildStackHTML — exact markup and picking the right object', () => {
  it('wraps a single preview svg in the expected markup', () => {
    const state = initObjectState(800, 600);
    const obj = state.objects.find(o => o.id === 'obj-2');
    const html = buildStackHTML(['obj-2'], state.objects);
    expect(html).toBe(
      '<div class="obj-stack-row" data-pick="obj-2"><svg width="36" height="36" viewBox="-36 -36 72 72">' +
      renderObjectShape(obj.shape, obj.colour) + '</svg></div>'
    );
  });

  it('joins multiple stack rows with no separator', () => {
    const state = initObjectState(800, 600);
    const html = buildStackHTML(['obj-2', 'obj-5'], state.objects);
    const row2 = buildStackHTML(['obj-2'], state.objects);
    const row5 = buildStackHTML(['obj-5'], state.objects);
    expect(html).toBe(row2 + row5);
  });

  it('renders the requested object, not just the first one in the array', () => {
    const state = initObjectState(800, 600);
    const objs = state.objects.map((o, i) => Object.assign({}, o, { shape: i === 3 ? 'star' : 'circle', colour: 'red' }));
    const html = buildStackHTML(['obj-3'], objs);
    expect(html).toContain(renderObjectShape('star', 'red'));
    expect(html).not.toContain(renderObjectShape('circle', 'red'));
  });
});

describe('buildGesture — no target id defaults origin to 0', () => {
  const state = initObjectState(800, 600);

  it('defaults originObjX/Y to 0 when no target id', () => {
    const g = buildGesture(state, undefined, 0, 0, 0, 0, 0, 0);
    expect(g.originObjX).toBe(0);
    expect(g.originObjY).toBe(0);
  });
});
