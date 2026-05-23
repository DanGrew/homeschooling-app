import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
  OBJ_SHAPES, OBJ_COLOURS, OBJ_SIZES, OBJ_ROTATIONS, OBJ_SIZE_MAP,
  OBJ_BASE_R, objPick, initObjectState,
  cycleProperty, selectObject, deselectAll, handleTap, handlePropertyCycle, buildToolboxHTML
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
    expect(state.viewport).toEqual({ x: 0, y: 0 });
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

describe('handleTap', () => {
  it('selects an unselected object', () => {
    const state = initObjectState(800, 600);
    const next = handleTap(state, 'obj-0');
    expect(next.objects.find(o => o.id === 'obj-0').selected).toBe(true);
  });

  it('deselects a selected object', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-0');
    const next = handleTap(state, 'obj-0');
    expect(next.objects.find(o => o.id === 'obj-0').selected).toBe(false);
  });

  it('switches selection from one object to another', () => {
    const state = selectObject(initObjectState(800, 600), 'obj-0');
    const next = handleTap(state, 'obj-5');
    expect(next.objects.find(o => o.id === 'obj-5').selected).toBe(true);
    expect(next.objects.find(o => o.id === 'obj-0').selected).toBe(false);
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
