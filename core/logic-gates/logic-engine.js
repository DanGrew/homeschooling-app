function evalGate(type, inputs) {
  switch (type) {
    case 'AND': return inputs.every(Boolean);
    case 'OR':  return inputs.some(Boolean);
    case 'XOR': return inputs.filter(Boolean).length % 2 === 1;
    case 'NOT': return !inputs[0];
    default: return false;
  }
}

function evalGraph(config, inputStates) {
  const values = Object.assign({}, inputStates);
  for (const node of config.nodes) {
    values[node.id] = evalGate(node.type, node.inputs.map(id => !!values[id]));
  }
  const outputs = {};
  for (const out of config.outputs) {
    outputs[out.id] = !!values[out.source];
  }
  return outputs;
}

if (typeof module !== 'undefined') {
  module.exports = { evalGate, evalGraph };
} else {
  window.LogicEngine = { evalGate, evalGraph };
}
