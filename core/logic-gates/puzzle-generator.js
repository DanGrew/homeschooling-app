const { evalGraph } = typeof require !== 'undefined'
  ? require('./logic-engine.js')
  : window.LogicEngine;

function allCombinations(n) {
  const combos = [];
  for (let i = 0; i < (1 << n); i++) {
    const combo = {};
    for (let b = 0; b < n; b++) combo['S' + b] = !!(i & (1 << b));
    combos.push(combo);
  }
  return combos;
}

function validate(config) {
  const inputs = config.inputs.map(i => i.id);
  const combos = allCombinations(inputs.length);
  const solutions = combos.filter(combo => {
    const inputStates = {};
    inputs.forEach(id => { inputStates[id] = combo[id]; });
    const out = evalGraph(config, inputStates);
    return config.goal.every(g => out[g.id] === g.value);
  });
  return solutions.length === 1 ? solutions[0] : null;
}

function generateFromTemplate(template, rng) {
  const rand = rng || Math.random;
  const outputTypes = ['lamp', 'fan', 'fountain'];
  const pick = arr => arr[Math.floor(rand() * arr.length)];

  const config = JSON.parse(JSON.stringify(template));
  config.inputs.forEach(input => { input.state = rand() < 0.5; });
  config.outputs.forEach(out => { out.type = pick(outputTypes); });

  const inputStates = {};
  config.inputs.forEach(i => { inputStates[i.id] = i.state; });
  const results = evalGraph(config, inputStates);
  const outId = config.outputs[0].id;
  config.goal = [{ id: outId, value: !results[outId] }];

  return validate(config) !== null ? config : null;
}

function generate(templates, maxAttempts) {
  maxAttempts = maxAttempts || 50;
  for (let i = 0; i < maxAttempts; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const result = generateFromTemplate(template);
    if (result) return result;
  }
  return null;
}

if (typeof module !== 'undefined') {
  module.exports = { generate, generateFromTemplate, validate };
} else {
  window.PuzzleGenerator = { generate, generateFromTemplate, validate };
}
