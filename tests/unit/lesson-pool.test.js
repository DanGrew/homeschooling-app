import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { fisherYates, initPools } = require('../../core/guidance/lesson-pool.js');

describe('fisherYates', () => {
  it('preserves all elements', () => {
    const arr = [1, 2, 3, 4, 5];
    fisherYates(arr);
    expect(arr.slice().sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });
  it('handles empty array', () => {
    const arr = [];
    fisherYates(arr);
    expect(arr).toEqual([]);
  });
  it('handles single element', () => {
    const arr = ['a'];
    fisherYates(arr);
    expect(arr).toEqual(['a']);
  });
});

describe('initPools', () => {
  it('no-op when no randomPools', () => {
    const data = { steps: [{ prompt: 'test', expect: 'X', feedback: 'y' }] };
    const originalSteps = data.steps;
    initPools(data);
    expect(data.steps).toBe(originalSteps);
  });

  it('no-op when randomPools is empty', () => {
    const data = { steps: [{ expect: 'X' }], randomPools: [] };
    const originalSteps = data.steps;
    initPools(data);
    expect(data.steps).toBe(originalSteps);
  });

  it('replaces random step with pool item fields', () => {
    const data = {
      steps: [{ random: 'pool1' }],
      randomPools: [{
        id: 'pool1',
        items: [{ prompt: 'Find the cow!', expect: 'COW_SPOKEN', feedback: 'The cow!' }]
      }]
    };
    initPools(data);
    expect(data.steps[0].prompt).toBe('Find the cow!');
    expect(data.steps[0].expect).toBe('COW_SPOKEN');
    expect(data.steps[0].feedback).toBe('The cow!');
  });

  it('leaves fixed steps unchanged', () => {
    const data = {
      steps: [
        { prompt: 'fixed', expect: 'FIXED', feedback: 'ok' },
        { random: 'pool1' }
      ],
      randomPools: [{
        id: 'pool1',
        items: [{ prompt: 'clue', expect: 'X', feedback: 'ack' }]
      }]
    };
    initPools(data);
    expect(data.steps[0].prompt).toBe('fixed');
    expect(data.steps[0].expect).toBe('FIXED');
    expect(data.steps[1].prompt).toBe('clue');
  });

  it('uses each pool item exactly once before repeating', () => {
    const items = [
      { prompt: 'c1', expect: 'E1', feedback: 'a1' },
      { prompt: 'c2', expect: 'E2', feedback: 'a2' },
      { prompt: 'c3', expect: 'E3', feedback: 'a3' }
    ];
    const data = {
      steps: [{ random: 'pool1' }, { random: 'pool1' }, { random: 'pool1' }],
      randomPools: [{ id: 'pool1', items }]
    };
    initPools(data);
    const expects = data.steps.map(s => s.expect);
    expect(new Set(expects).size).toBe(3);
    expect(expects.sort()).toEqual(['E1', 'E2', 'E3']);
  });

  it('refills queue when exhausted', () => {
    const items = [
      { prompt: 'c1', expect: 'E1', feedback: 'a1' },
      { prompt: 'c2', expect: 'E2', feedback: 'a2' }
    ];
    const data = {
      steps: [{ random: 'pool1' }, { random: 'pool1' }, { random: 'pool1' }],
      randomPools: [{ id: 'pool1', items }]
    };
    initPools(data);
    data.steps.forEach(function(s) {
      expect(s.prompt).toBeDefined();
      expect(s.expect).toBeDefined();
      expect(s.feedback).toBeDefined();
    });
  });

  it('handles multiple independent pools', () => {
    const data = {
      steps: [
        { random: 'poolA' },
        { random: 'poolB' },
        { random: 'poolA' }
      ],
      randomPools: [
        { id: 'poolA', items: [
          { prompt: 'a1', expect: 'A1', feedback: 'ack_a1' },
          { prompt: 'a2', expect: 'A2', feedback: 'ack_a2' }
        ]},
        { id: 'poolB', items: [
          { prompt: 'b1', expect: 'B1', feedback: 'ack_b1' }
        ]}
      ]
    };
    initPools(data);
    expect(data.steps[1].expect).toBe('B1');
    const poolAExpects = [data.steps[0].expect, data.steps[2].expect].sort();
    expect(poolAExpects).toEqual(['A1', 'A2']);
  });

  it('ignores random step referencing unknown pool', () => {
    const data = {
      steps: [{ random: 'missing' }],
      randomPools: [{ id: 'other', items: [{ clue: 'x', expect: 'X', acknowledgement: 'a' }] }]
    };
    initPools(data);
    expect(data.steps[0].random).toBe('missing');
  });
});
