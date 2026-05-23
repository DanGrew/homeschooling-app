import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
  OBJ_SHAPES, OBJ_COLOURS, OBJ_SIZES, OBJ_ROTATIONS, OBJ_SIZE_MAP,
  OBJ_BASE_R, objPick, initObjectState
} = require('../../core/object-playground/object-playground-core.js');

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
    const margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP.large) + 4;
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

describe('OBJ_SIZE_MAP', () => {
  it('maps small/medium/large correctly', () => {
    expect(OBJ_SIZE_MAP.small).toBe(0.6);
    expect(OBJ_SIZE_MAP.medium).toBe(1.0);
    expect(OBJ_SIZE_MAP.large).toBe(1.4);
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
