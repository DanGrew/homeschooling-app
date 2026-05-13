const { evalGate, evalGraph } = require('../../core/logic-gates/logic-engine.js');

describe('evalGate', () => {
  test('AND: both true', () => expect(evalGate('AND', [true, true])).toBe(true));
  test('AND: one false', () => expect(evalGate('AND', [true, false])).toBe(false));
  test('AND: both false', () => expect(evalGate('AND', [false, false])).toBe(false));

  test('OR: both true', () => expect(evalGate('OR', [true, true])).toBe(true));
  test('OR: one true', () => expect(evalGate('OR', [false, true])).toBe(true));
  test('OR: both false', () => expect(evalGate('OR', [false, false])).toBe(false));

  test('XOR: both true', () => expect(evalGate('XOR', [true, true])).toBe(false));
  test('XOR: one true', () => expect(evalGate('XOR', [true, false])).toBe(true));
  test('XOR: both false', () => expect(evalGate('XOR', [false, false])).toBe(false));

  test('NOT: true', () => expect(evalGate('NOT', [true])).toBe(false));
  test('NOT: false', () => expect(evalGate('NOT', [false])).toBe(true));

  test('unknown gate returns false', () => expect(evalGate('NAND', [true, true])).toBe(false));
});

describe('evalGraph', () => {
  const andConfig = {
    inputs: [{ id: 'A', state: false }, { id: 'B', state: false }],
    nodes: [{ id: 'G1', type: 'AND', inputs: ['A', 'B'] }],
    outputs: [{ id: 'O1', type: 'lamp', source: 'G1' }]
  };

  test('AND gate off/off → output false', () => {
    expect(evalGraph(andConfig, { A: false, B: false })).toEqual({ O1: false });
  });
  test('AND gate on/on → output true', () => {
    expect(evalGraph(andConfig, { A: true, B: true })).toEqual({ O1: true });
  });
  test('AND gate on/off → output false', () => {
    expect(evalGraph(andConfig, { A: true, B: false })).toEqual({ O1: false });
  });

  const notConfig = {
    inputs: [{ id: 'A', state: false }],
    nodes: [{ id: 'G1', type: 'NOT', inputs: ['A'] }],
    outputs: [{ id: 'O1', type: 'lamp', source: 'G1' }]
  };

  test('NOT off → output true', () => {
    expect(evalGraph(notConfig, { A: false })).toEqual({ O1: true });
  });
  test('NOT on → output false', () => {
    expect(evalGraph(notConfig, { A: true })).toEqual({ O1: false });
  });

  const chainConfig = {
    inputs: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
    nodes: [
      { id: 'G1', type: 'AND', inputs: ['A', 'B'] },
      { id: 'G2', type: 'OR',  inputs: ['G1', 'C'] }
    ],
    outputs: [{ id: 'O1', source: 'G2' }]
  };

  test('chained (A AND B) OR C: all false → false', () => {
    expect(evalGraph(chainConfig, { A: false, B: false, C: false })).toEqual({ O1: false });
  });
  test('chained: C alone true → true', () => {
    expect(evalGraph(chainConfig, { A: false, B: false, C: true })).toEqual({ O1: true });
  });
  test('chained: A and B true → true', () => {
    expect(evalGraph(chainConfig, { A: true, B: true, C: false })).toEqual({ O1: true });
  });
});
