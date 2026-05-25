import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PAINT_WORLD_SCALE, initPaintState, applyPaintPan } = require('../../core/paint-playground/paint-playground-core.js');

describe('initPaintState', () => {
  test('world is PAINT_WORLD_SCALE times viewport', () => {
    const state = initPaintState(400, 600);
    expect(state.world.width).toBe(400 * PAINT_WORLD_SCALE);
    expect(state.world.height).toBe(600 * PAINT_WORLD_SCALE);
  });

  test('initial viewport centred on world', () => {
    const state = initPaintState(400, 600);
    const expectedX = Math.floor((state.world.width - 400) / 2);
    const expectedY = Math.floor((state.world.height - 600) / 2);
    expect(state.viewport.x).toBe(expectedX);
    expect(state.viewport.y).toBe(expectedY);
  });

  test('viewport dimensions match input', () => {
    const state = initPaintState(320, 480);
    expect(state.viewport.width).toBe(320);
    expect(state.viewport.height).toBe(480);
  });
});

describe('applyPaintPan', () => {
  test('clamps x and y to valid range', () => {
    const state = initPaintState(400, 600);
    const result = applyPaintPan(state, -100, -100);
    expect(result.viewport.x).toBe(0);
    expect(result.viewport.y).toBe(0);
  });

  test('clamps to max (world - viewport)', () => {
    const state = initPaintState(400, 600);
    const result = applyPaintPan(state, 99999, 99999);
    expect(result.viewport.x).toBe(state.world.width - state.viewport.width);
    expect(result.viewport.y).toBe(state.world.height - state.viewport.height);
  });

  test('does not mutate original state', () => {
    const state = initPaintState(400, 600);
    const origX = state.viewport.x;
    applyPaintPan(state, 0, 0);
    expect(state.viewport.x).toBe(origX);
  });

  test('applies valid pan within bounds', () => {
    const state = initPaintState(400, 600);
    const result = applyPaintPan(state, 100, 200);
    expect(result.viewport.x).toBe(100);
    expect(result.viewport.y).toBe(200);
  });
});
