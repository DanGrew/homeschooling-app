import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
  OBJ_SHAPES, OBJ_COLOURS, OBJ_SIZES, OBJ_ROTATIONS, OBJ_SIZE_MAP,
  OBJ_BASE_R, objPick, initObjectState,
  PAN_THRESHOLD, buildGesture, getDragMoves, updateDragPosition, getDragCancelMoves, applyToolboxClick,
  getPanMoves, getTapFlag, applyPan,
  objectsAtPoint, bringToFront, applyStackPick,
  cycleProperty, selectObject, deselectAll, handleTap, handlePropertyCycle, buildStackHTML, buildToolboxHTML
} = require('../../core/object-playground/object-playground-core.js');

describe('constants', () => {
  it('OBJ_SHAPES has 7 entries', () => {
    expect(OBJ_SHAPES).toHaveLength(7);
    expect(OBJ_SHAPES).toContain('circle');
    expect(OBJ_SHAPES).toContain('heart');
  });

  it('OBJ_COLOURS has 6 entries', () => {
    expect(OBJ_COLOURS).toHaveLength(6);
    expect(OBJ_COLOURS).toContain('orange');
    expect(OBJ_COLOURS).toContain('purple');
  });

  it('OBJ_SIZES has 4 entries including x-large', () => {
    expect(OBJ_SIZES).toHaveLength(4);
    expect(OBJ_SIZES).toContain('x-large');
  });

  it('OBJ_ROTATIONS has 8 entries at 45 degree increments', () => {
    expect(OBJ_ROTATIONS).toHaveLength(8);
    OBJ_ROTATIONS.forEach(r => expect(r % 45).toBe(0));
  });
});

describe('OBJ_SIZE_MAP', () => {
  it('maps small/medium/large correctly', () => {
    expect(OBJ_SIZE_MAP.small).toBe(0.6);
    expect(OBJ_SIZE_MAP.medium).toBe(1.0);
    expect(OBJ_SIZE_MAP.large).toBe(1.4);
  });

  it('maps x-large to 1.8', () => {
    expect(OBJ_SIZE_MAP['x-large']).toBe(1.8);
  });
});

describe('objPick', () => {
  it('returns element from array', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 30; i++) {
      expect(arr).toContain(objPick(arr));
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

  it('all objects have valid size', () => {
    state.objects.forEach(obj => expect(OBJ_SIZES).toContain(obj.size));
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

  it('all objects positioned within viewport bounds', () => {
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP['x-large']) + 4;
    state.objects.forEach(obj => {
      expect(obj.x).toBeGreaterThanOrEqual(margin);
      expect(obj.x).toBeLessThanOrEqual(800 - margin);
      expect(obj.y).toBeGreaterThanOrEqual(margin);
      expect(obj.y).toBeLessThanOrEqual(600 - margin);
    });
  });

  it('world dimensions are larger than viewport', () => {
    expect(state.world.width).toBeGreaterThan(800);
    expect(state.world.height).toBeGreaterThan(600);
  });

  it('viewport starts at origin', () => {
    expect(state.viewport).toMatchObject({ x: 0, y: 0 });
  });

  it('viewport stores dimensions', () => {
    expect(state.viewport.width).toBe(800);
    expect(state.viewport.height).toBe(600);
  });

  it('stackObjects starts empty', () => {
    expect(state.stackObjects).toEqual([]);
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
  it('selects object when exactly one at point', () => {
    const base = initObjectState(800, 600);
    const obj = base.objects[0];
    const next = handleTap(base, obj.x, obj.y);
    expect(next.objects.find(o => o.id === obj.id).selected).toBe(true);
  });

  it('brings object to front when exactly one at point', () => {
    const base = initObjectState(800, 600);
    const obj = base.objects[0];
    const next = handleTap(base, obj.x, obj.y);
    const maxZ = Math.max(...next.objects.map(o => o.zIndex));
    expect(next.objects.find(o => o.id === obj.id).zIndex).toBe(maxZ);
  });

  it('sets stackObjects to the object id when one hit', () => {
    const base = initObjectState(800, 600);
    const obj = base.objects[0];
    const next = handleTap(base, obj.x, obj.y);
    expect(next.stackObjects).toContain(obj.id);
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
    applyPan(state, 100, 50);
    expect(state.viewport.x).toBe(0);
    expect(state.viewport.y).toBe(0);
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
});
