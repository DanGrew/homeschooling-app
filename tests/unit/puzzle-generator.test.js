const { validate, generateFromTemplate, generate } = require('../../core/logic-gates/puzzle-generator.js');

const andTemplate = {
  id: 'tpl_and',
  inputs: [{ id: 'S0', state: false, label: 'A' }, { id: 'S1', state: false, label: 'B' }],
  nodes: [{ id: 'G1', type: 'AND', inputs: ['S0', 'S1'] }],
  outputs: [{ id: 'O1', type: 'lamp', source: 'G1' }],
  goal: []
};

const notTemplate = {
  id: 'tpl_not',
  inputs: [{ id: 'S0', state: false, label: 'A' }],
  nodes: [{ id: 'G1', type: 'NOT', inputs: ['S0'] }],
  outputs: [{ id: 'O1', type: 'lamp', source: 'G1' }],
  goal: []
};

const orTemplate = {
  id: 'tpl_or',
  inputs: [{ id: 'S0', state: false, label: 'A' }, { id: 'S1', state: false, label: 'B' }],
  nodes: [{ id: 'G1', type: 'OR', inputs: ['S0', 'S1'] }],
  outputs: [{ id: 'O1', type: 'lamp', source: 'G1' }],
  goal: []
};

describe('validate', () => {
  test('AND goal=ON has exactly one solution (S0=true, S1=true)', () => {
    const config = JSON.parse(JSON.stringify(andTemplate));
    config.goal = [{ id: 'O1', value: true }];
    expect(validate(config)).toEqual({ S0: true, S1: true });
  });

  test('AND goal=OFF has multiple solutions → returns null', () => {
    const config = JSON.parse(JSON.stringify(andTemplate));
    config.goal = [{ id: 'O1', value: false }];
    expect(validate(config)).toBeNull();
  });

  test('NOT goal=ON has exactly one solution (S0=false)', () => {
    const config = JSON.parse(JSON.stringify(notTemplate));
    config.goal = [{ id: 'O1', value: true }];
    expect(validate(config)).toEqual({ S0: false });
  });

  test('NOT goal=OFF has exactly one solution (S0=true)', () => {
    const config = JSON.parse(JSON.stringify(notTemplate));
    config.goal = [{ id: 'O1', value: false }];
    expect(validate(config)).toEqual({ S0: true });
  });

  test('OR goal=OFF has exactly one solution (both false)', () => {
    const config = JSON.parse(JSON.stringify(orTemplate));
    config.goal = [{ id: 'O1', value: false }];
    expect(validate(config)).toEqual({ S0: false, S1: false });
  });

  test('OR goal=ON has multiple solutions → returns null', () => {
    const config = JSON.parse(JSON.stringify(orTemplate));
    config.goal = [{ id: 'O1', value: true }];
    expect(validate(config)).toBeNull();
  });
});

describe('generateFromTemplate', () => {
  test('NOT template always produces valid puzzle', () => {
    let rngVal = 0;
    const rng = () => { rngVal = (rngVal + 0.3) % 1; return rngVal; };
    for (let i = 0; i < 10; i++) {
      const result = generateFromTemplate(JSON.parse(JSON.stringify(notTemplate)), rng);
      expect(result).not.toBeNull();
      expect(result.goal).toHaveLength(1);
      expect(validate(result)).not.toBeNull();
    }
  });

  test('AND template produces valid puzzle when initial output is false', () => {
    const rng = () => 0.9;
    const result = generateFromTemplate(JSON.parse(JSON.stringify(andTemplate)), rng);
    expect(result).not.toBeNull();
    expect(result.goal[0].value).toBe(true);
    expect(validate(result)).toEqual({ S0: true, S1: true });
  });

  test('template is cloned — original not mutated', () => {
    generateFromTemplate(JSON.parse(JSON.stringify(notTemplate)));
    expect(notTemplate.goal).toHaveLength(0);
    expect(notTemplate.inputs[0].state).toBe(false);
  });

  test('output type randomised from allowed set', () => {
    const allowed = ['lamp', 'fan', 'fountain'];
    for (let i = 0; i < 20; i++) {
      const result = generateFromTemplate(JSON.parse(JSON.stringify(notTemplate)));
      if (result) expect(allowed).toContain(result.outputs[0].type);
    }
  });
});

const notOrTemplate = {
  id: 'tpl_not_or',
  inputs: [{ id: 'S0', state: false, label: 'A' }, { id: 'S1', state: false, label: 'B' }],
  nodes: [
    { id: 'G1', type: 'OR',  inputs: ['S0', 'S1'] },
    { id: 'G2', type: 'NOT', inputs: ['G1'] }
  ],
  outputs: [{ id: 'O1', type: 'lamp', source: 'G2' }],
  goal: []
};

describe('validate — compound gates', () => {
  test('NOT(OR): goal=ON has unique solution (both false)', () => {
    const config = JSON.parse(JSON.stringify(notOrTemplate));
    config.goal = [{ id: 'O1', value: true }];
    expect(validate(config)).toEqual({ S0: false, S1: false });
  });

  test('NOT(OR): goal=OFF has multiple solutions', () => {
    const config = JSON.parse(JSON.stringify(notOrTemplate));
    config.goal = [{ id: 'O1', value: false }];
    expect(validate(config)).toBeNull();
  });
});

describe('generate', () => {
  const templates = [andTemplate, notTemplate, orTemplate];

  test('returns valid config', () => {
    const config = generate(templates);
    expect(config).not.toBeNull();
    expect(config.goal.length).toBeGreaterThan(0);
    expect(validate(config)).not.toBeNull();
  });

  test('returns null when no templates work within maxAttempts', () => {
    const alwaysFailTemplate = {
      id: 'xor',
      inputs: [{ id: 'S0', state: false }, { id: 'S1', state: false }],
      nodes: [{ id: 'G1', type: 'XOR', inputs: ['S0', 'S1'] }],
      outputs: [{ id: 'O1', source: 'G1' }],
      goal: []
    };
    expect(generate([alwaysFailTemplate], 10)).toBeNull();
  });
});
