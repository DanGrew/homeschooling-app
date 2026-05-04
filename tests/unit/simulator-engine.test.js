import { SimulatorEngine } from '../../app/activities/simulator/engine/engine.js';

function makeEngine(state = {}) {
  const spec = {
    state,
    scene: { width: 400, height: 300 },
    objects: [],
    actions: [],
    rules: [],
    win_condition: null,
    win_response: [],
  };
  return new SimulatorEngine(spec, {});
}

describe('SimulatorEngine._evalCond', () => {
  describe('state comparisons', () => {
    it('>= true when equal', () => {
      const e = makeEngine({ water: 3 });
      expect(e._evalCond('state.water >= 3')).toBe(true);
    });

    it('>= true when greater', () => {
      const e = makeEngine({ water: 5 });
      expect(e._evalCond('state.water >= 3')).toBe(true);
    });

    it('>= false when less', () => {
      const e = makeEngine({ water: 2 });
      expect(e._evalCond('state.water >= 3')).toBe(false);
    });

    it('== true when equal', () => {
      const e = makeEngine({ stage: 2 });
      expect(e._evalCond('state.stage == 2')).toBe(true);
    });

    it('== false when not equal', () => {
      const e = makeEngine({ stage: 1 });
      expect(e._evalCond('state.stage == 2')).toBe(false);
    });

    it('<= true when equal', () => {
      const e = makeEngine({ count: 3 });
      expect(e._evalCond('state.count <= 3')).toBe(true);
    });

    it('<= true when less', () => {
      const e = makeEngine({ count: 1 });
      expect(e._evalCond('state.count <= 3')).toBe(true);
    });

    it('<= false when greater', () => {
      const e = makeEngine({ count: 4 });
      expect(e._evalCond('state.count <= 3')).toBe(false);
    });

    it('> true when greater', () => {
      const e = makeEngine({ score: 5 });
      expect(e._evalCond('state.score > 3')).toBe(true);
    });

    it('> false when equal', () => {
      const e = makeEngine({ score: 3 });
      expect(e._evalCond('state.score > 3')).toBe(false);
    });

    it('< true when less', () => {
      const e = makeEngine({ hp: 1 });
      expect(e._evalCond('state.hp < 3')).toBe(true);
    });

    it('< false when equal', () => {
      const e = makeEngine({ hp: 3 });
      expect(e._evalCond('state.hp < 3')).toBe(false);
    });
  });

  describe('all combinator', () => {
    it('returns true when all conditions pass', () => {
      const e = makeEngine({ a: 2, b: 5 });
      expect(e._evalCond({ all: ['state.a >= 2', 'state.b >= 5'] })).toBe(true);
    });

    it('returns false when one condition fails', () => {
      const e = makeEngine({ a: 2, b: 4 });
      expect(e._evalCond({ all: ['state.a >= 2', 'state.b >= 5'] })).toBe(false);
    });

    it('returns false when all conditions fail', () => {
      const e = makeEngine({ a: 0, b: 0 });
      expect(e._evalCond({ all: ['state.a >= 2', 'state.b >= 5'] })).toBe(false);
    });
  });

  describe('any combinator', () => {
    it('returns true when one condition passes', () => {
      const e = makeEngine({ a: 2, b: 0 });
      expect(e._evalCond({ any: ['state.a >= 2', 'state.b >= 5'] })).toBe(true);
    });

    it('returns false when no conditions pass', () => {
      const e = makeEngine({ a: 1, b: 1 });
      expect(e._evalCond({ any: ['state.a >= 2', 'state.b >= 5'] })).toBe(false);
    });
  });

  describe('nested combinators', () => {
    it('handles all inside any', () => {
      const e = makeEngine({ a: 3, b: 3, c: 0 });
      const cond = { any: [{ all: ['state.a >= 3', 'state.b >= 3'] }, 'state.c >= 5'] };
      expect(e._evalCond(cond)).toBe(true);
    });

    it('handles any inside all', () => {
      const e = makeEngine({ a: 1, b: 0, c: 6 });
      const cond = { all: [{ any: ['state.a >= 2', 'state.c >= 5'] }, 'state.b == 0'] };
      expect(e._evalCond(cond)).toBe(true);
    });
  });

  describe('invalid / edge cases', () => {
    it('returns false for malformed string', () => {
      const e = makeEngine({});
      expect(e._evalCond('not_a_valid_condition')).toBe(false);
    });

    it('returns false for null', () => {
      const e = makeEngine({});
      expect(e._evalCond(null)).toBe(false);
    });

    it('returns false for unknown state key', () => {
      const e = makeEngine({});
      expect(e._evalCond('state.missing >= 1')).toBe(false);
    });
  });
});
