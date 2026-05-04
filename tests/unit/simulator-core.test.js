import { evalCond, applyStateAction } from '../../core/simulator/simulator-core.js';

describe('evalCond — state comparisons', () => {
  it('>= true when equal', () => expect(evalCond({ x: 3 }, 'state.x >= 3')).toBe(true));
  it('>= true when greater', () => expect(evalCond({ x: 5 }, 'state.x >= 3')).toBe(true));
  it('>= false when less', () => expect(evalCond({ x: 2 }, 'state.x >= 3')).toBe(false));
  it('== true', () => expect(evalCond({ x: 2 }, 'state.x == 2')).toBe(true));
  it('== false', () => expect(evalCond({ x: 1 }, 'state.x == 2')).toBe(false));
  it('<= true when equal', () => expect(evalCond({ x: 3 }, 'state.x <= 3')).toBe(true));
  it('<= false when greater', () => expect(evalCond({ x: 4 }, 'state.x <= 3')).toBe(false));
  it('> true', () => expect(evalCond({ x: 5 }, 'state.x > 3')).toBe(true));
  it('> false when equal', () => expect(evalCond({ x: 3 }, 'state.x > 3')).toBe(false));
  it('< true', () => expect(evalCond({ x: 1 }, 'state.x < 3')).toBe(true));
  it('< false when equal', () => expect(evalCond({ x: 3 }, 'state.x < 3')).toBe(false));
  it('returns false for malformed string', () => expect(evalCond({}, 'not_valid')).toBe(false));
  it('returns false for null', () => expect(evalCond({}, null)).toBe(false));
  it('returns false for unknown key', () => expect(evalCond({}, 'state.missing >= 1')).toBe(false));
});

describe('evalCond — combinators', () => {
  it('all: true when all pass', () => expect(evalCond({ a: 2, b: 5 }, { all: ['state.a >= 2', 'state.b >= 5'] })).toBe(true));
  it('all: false when one fails', () => expect(evalCond({ a: 2, b: 4 }, { all: ['state.a >= 2', 'state.b >= 5'] })).toBe(false));
  it('any: true when one passes', () => expect(evalCond({ a: 2, b: 0 }, { any: ['state.a >= 2', 'state.b >= 5'] })).toBe(true));
  it('any: false when none pass', () => expect(evalCond({ a: 1, b: 1 }, { any: ['state.a >= 2', 'state.b >= 5'] })).toBe(false));
  it('nested all inside any', () => {
    const cond = { any: [{ all: ['state.a >= 3', 'state.b >= 3'] }, 'state.c >= 5'] };
    expect(evalCond({ a: 3, b: 3, c: 0 }, cond)).toBe(true);
  });
});

describe('applyStateAction', () => {
  it('+= increments', () => { const s = { x: 2 }; applyStateAction(s, 'state.x += 3'); expect(s.x).toBe(5); });
  it('-= decrements', () => { const s = { x: 5 }; applyStateAction(s, 'state.x -= 2'); expect(s.x).toBe(3); });
  it('-= clamps to 0', () => { const s = { x: 1 }; applyStateAction(s, 'state.x -= 10'); expect(s.x).toBe(0); });
  it('= assigns', () => { const s = { x: 0 }; applyStateAction(s, 'state.x = 7'); expect(s.x).toBe(7); });
  it('returns true for state action', () => expect(applyStateAction({ x: 0 }, 'state.x += 1')).toBe(true));
  it('returns false for non-state action', () => expect(applyStateAction({}, 'say: hello')).toBe(false));
  it('returns false for unrecognised', () => expect(applyStateAction({}, 'unknown')).toBe(false));
});
