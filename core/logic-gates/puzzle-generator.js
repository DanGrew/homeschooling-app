function _getEvalGraph() {
  if (typeof require !== 'undefined') return require('./logic-engine.js').evalGraph;
  return globalThis.LogicEngine.evalGraph;
}

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
    const out = _getEvalGraph()(config, inputStates);
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
  const results = _getEvalGraph()(config, inputStates);
  const outId = config.outputs[0].id;
  config.goal = [{ id: outId, value: !results[outId] }];

  return validate(config) !== null ? config : null;
}

function shuffled(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function generate(templates, maxAttempts) {
  maxAttempts = maxAttempts || 50;
  var order = shuffled(templates);
  for (var i = 0; i < maxAttempts; i++) {
    var template = order[i % order.length];
    var result = generateFromTemplate(template);
    if (result) return result;
  }
  return null;
}

if (typeof module !== 'undefined') {
  module.exports = { generate, generateFromTemplate, validate };
} else {
  globalThis.PuzzleGenerator = { generate, generateFromTemplate, validate };
}
