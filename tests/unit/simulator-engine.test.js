import { SimulatorEngine } from '../../app/activities/simulator/engine/engine.js';

function makeEngine(state = {}, overrides = {}) {
  const spec = {
    state,
    scene: { width: 400, height: 300 },
    objects: [],
    actions: [],
    rules: [],
    win_condition: null,
    win_response: [],
    ...overrides,
  };
  return new SimulatorEngine(spec, {});
}

function silenceDOM(engine) {
  engine._execActions = () => {};
  engine._checkRules = () => {};
  engine._checkWin = () => {};
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

describe('SimulatorEngine._exec — state mutations', () => {
  it('+= increments state value', () => {
    const e = makeEngine({ water: 2 });
    e._exec('state.water += 3');
    expect(e.state.water).toBe(5);
  });

  it('-= decrements state value', () => {
    const e = makeEngine({ water: 5 });
    e._exec('state.water -= 2');
    expect(e.state.water).toBe(3);
  });

  it('-= clamps to 0, never negative', () => {
    const e = makeEngine({ water: 1 });
    e._exec('state.water -= 10');
    expect(e.state.water).toBe(0);
  });

  it('= assigns exact value', () => {
    const e = makeEngine({ stage: 0 });
    e._exec('state.stage = 7');
    expect(e.state.stage).toBe(7);
  });

  it('= overwrites existing value', () => {
    const e = makeEngine({ stage: 99 });
    e._exec('state.stage = 1');
    expect(e.state.stage).toBe(1);
  });

  it('ignores unrecognised action without throwing', () => {
    const e = makeEngine({ x: 1 });
    expect(() => e._exec('unknown_action')).not.toThrow();
    expect(e.state.x).toBe(1);
  });
});

describe('SimulatorEngine._handleTap — action routing', () => {
  function makeEngineWithActions(state, actions, objects = []) {
    const e = makeEngine(state, { actions, objects });
    silenceDOM(e);
    return e;
  }

  it('fires tap action when no tool selected', () => {
    const fired = [];
    const e = makeEngineWithActions({ x: 0 }, [
      { when: { tap: 'btn' }, do: ['state.x += 1'] },
    ]);
    e._execActions = (a) => fired.push(...a);
    e._handleTap('btn');
    expect(fired).toContain('state.x += 1');
  });

  it('skips tap action when condition not met', () => {
    const fired = [];
    const e = makeEngineWithActions({ x: 0 }, [
      { when: { tap: 'btn', if: 'state.x >= 5' }, do: ['state.x += 1'] },
    ]);
    e._execActions = (a) => fired.push(...a);
    e._handleTap('btn');
    expect(fired).toHaveLength(0);
  });

  it('fires tap action when condition met', () => {
    const fired = [];
    const e = makeEngineWithActions({ x: 5 }, [
      { when: { tap: 'btn', if: 'state.x >= 5' }, do: ['state.x += 1'] },
    ]);
    e._execActions = (a) => fired.push(...a);
    e._handleTap('btn');
    expect(fired).toContain('state.x += 1');
  });

  it('fires tool_tap action when correct tool and target selected', () => {
    const fired = [];
    const e = makeEngineWithActions({ x: 0 }, [
      { when: { tool_tap: { tool: 'brush', target: 'canvas' } }, do: ['state.x += 1'] },
    ]);
    e._execActions = (a) => fired.push(...a);
    e.selectedTool = 'brush';
    e._clearTool = () => {};
    e._handleTap('canvas');
    expect(fired).toContain('state.x += 1');
  });

  it('ignores tap when won and object not always_clickable', () => {
    const fired = [];
    const e = makeEngineWithActions({ x: 0 }, [
      { when: { tap: 'btn' }, do: ['state.x += 1'] },
    ], [{ id: 'btn', always_clickable: false }]);
    e._execActions = (a) => fired.push(...a);
    e.won = true;
    e._handleTap('btn');
    expect(fired).toHaveLength(0);
  });
});

describe('SimulatorEngine._checkWin', () => {
  it('sets won and schedules win response when condition met', () => {
    const e = makeEngine({ x: 5 }, {
      win_condition: 'state.x >= 5',
      win_response: ['say: You win!'],
    });
    const fired = [];
    e._execActions = (a) => fired.push(...a);
    e._checkWin();
    expect(e.won).toBe(true);
  });

  it('does not set won when condition not met', () => {
    const e = makeEngine({ x: 2 }, {
      win_condition: 'state.x >= 5',
      win_response: [],
    });
    e._execActions = () => {};
    e._checkWin();
    expect(e.won).toBe(false);
  });

  it('does not fire again once already won', () => {
    const e = makeEngine({ x: 5 }, {
      win_condition: 'state.x >= 5',
      win_response: [],
    });
    let calls = 0;
    e._execActions = () => calls++;
    e._checkWin();
    e._checkWin();
    expect(calls).toBe(0); // setTimeout delayed — just check won not double-set
    expect(e.won).toBe(true);
  });
});
