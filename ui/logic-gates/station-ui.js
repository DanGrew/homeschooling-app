const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL_W = 90;
const CELL_H = 65;
const NOOP = function() {};

const GATE_SPOKEN = { 'AND': 'and gate', 'OR': 'or gate', 'NOT': 'not gate', 'XOR': 'X or gate', 'NAND': 'nand gate', 'XNOR': 'ex nor gate' };
const DO_SPEAK_PILL = {
  'true':  function(g, label) { window.__makeSpeakable(g, GATE_SPOKEN[label]); g.removeAttribute('filter'); },
  'false': function() {}
};
const DO_SPEAK_EL = {
  'true':  function(g, text) { window.__makeSpeakable(g, text); g.removeAttribute('filter'); },
  'false': function() {}
};
const SPEAK_WITH_LABEL = {
  'true':  function(d) { return d + ' switch'; },
  'false': function() { return 'switch'; }
};
const DISP_LABEL_FN = {
  'true':  function(input) { return input.displayLabel; },
  'false': function(input) { return input.label; }
};

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
  return e;
}

function buildWirePath(svg, x1, y1, x2, y2, id) {
  const cpx = (x1 + x2) / 2;
  const d = `M${x1},${y1} C${cpx},${y1} ${cpx},${y2} ${x2},${y2}`;
  const wire = el('path', {
    d, stroke: '#ccc', 'stroke-width': '5', fill: 'none',
    'stroke-linecap': 'round', 'data-wire': id
  });
  svg.appendChild(wire);
  return wire;
}

function activateWire(wire, colour) {
  wire.setAttribute('stroke', colour);
  wire.setAttribute('filter', `drop-shadow(0 0 5px ${colour})`);
}
function deactivateWire(wire) {
  wire.setAttribute('stroke', '#ccc');
  wire.removeAttribute('filter');
}
const WIRE_FNS = [deactivateWire, activateWire];
function updateWire(wire, active, colour) { WIRE_FNS[+active](wire, colour); }

function buildSwitch(svg, id, cx, cy, active, colour, eventLabel, displayLabel, onToggle) {
  const W = 64, H = 32, R = 16;
  const g = el('g', { 'data-switch': id, 'data-switch-label': eventLabel, style: 'cursor:pointer' });
  const track = el('rect', {
    x: cx - W/2, y: cy - H/2, width: W, height: H, rx: R,
    fill: '#ddd', stroke: '#bbb', 'stroke-width': '2'
  });
  const knob = el('circle', {
    cx: cx - W/2 + R, cy: cy, r: R - 4,
    fill: '#fff', stroke: '#bbb', 'stroke-width': '2'
  });
  const lbl = el('text', {
    x: cx, y: cy - H/2 - 8,
    'text-anchor': 'middle', 'font-size': '14', 'font-weight': 'bold', fill: '#555'
  });
  lbl.textContent = displayLabel;
  g.appendChild(track); g.appendChild(knob); g.appendChild(lbl);
  svg.appendChild(g);
  DO_SPEAK_EL[String(typeof window.__makeSpeakable === 'function')](g, SPEAK_WITH_LABEL[String(!!displayLabel)](displayLabel));

  function activateState() {
    track.setAttribute('fill', colour);
    track.setAttribute('stroke', colour);
    knob.setAttribute('cx', cx + W/2 - R);
    knob.setAttribute('stroke', colour);
  }
  function deactivateState() {
    track.setAttribute('fill', '#ddd');
    track.setAttribute('stroke', '#bbb');
    knob.setAttribute('cx', cx - W/2 + R);
    knob.setAttribute('stroke', '#bbb');
  }
  const STATE_FNS = [deactivateState, activateState];
  function applyState(on) { STATE_FNS[+on](); }

  applyState(active);
  g.addEventListener('click', function() { onToggle(id); });
  return { applyState };
}

function buildGatePill(svg, cx, cy, label, colour) {
  const W = 80, H = 36, R = 18;
  const g = el('g', { 'data-gate-pill': label, style: 'cursor:pointer' });
  const rect = el('rect', {
    x: cx - W/2, y: cy - H/2, width: W, height: H, rx: R, fill: colour
  });
  const lbl = el('text', {
    x: cx, y: cy + 5, 'text-anchor': 'middle',
    'font-size': '16', 'font-weight': 'bold', fill: '#fff', 'font-family': 'inherit'
  });
  lbl.textContent = label;
  g.appendChild(rect); g.appendChild(lbl);
  svg.appendChild(g);
  DO_SPEAK_PILL[String(typeof window.__makeSpeakable === 'function')](g, label);
  return g;
}

function animatePulse(svg, wire, delay, colour) {
  const d = wire.getAttribute('d');
  const circle = el('circle', { r: '7', fill: colour, opacity: '0',
    style: 'pointer-events:none;filter:drop-shadow(0 0 4px ' + colour + ')' });
  const anim = document.createElementNS(SVG_NS, 'animateMotion');
  anim.setAttribute('dur', '0.22s');
  anim.setAttribute('begin', 'indefinite');
  anim.setAttribute('fill', 'freeze');
  anim.setAttribute('path', d);
  circle.appendChild(anim);
  svg.appendChild(circle);
  setTimeout(function() { circle.setAttribute('opacity', '0.85'); anim.beginElement(); }, delay * 1000);
  setTimeout(function() { circle.remove(); }, (delay + 0.25) * 1000);
}

function buildStation(config, onToggle) {
  config = Object.assign({ onUpdate: NOOP }, config);
  const { buildOutput, updateOutput, GATE_COLOURS } = window.OutputUI;

  const grid = config.grid;
  const W = grid.cols * CELL_W;
  const H = grid.rows * CELL_H;

  const svg = el('svg', {
    viewBox: `0 -18 ${W} ${H + 18}`, width: '100%',
    style: 'max-width:540px;display:block;margin:0 auto;'
  });

  const positions = {};
  config.inputs.forEach(i => { positions[i.id] = cellCenter(i.cell, CELL_W, CELL_H); });
  config.nodes.forEach(n => { positions[n.id] = cellCenter(n.cell, CELL_W, CELL_H); });
  config.outputs.forEach(o => { positions[o.id] = cellCenter(o.cell, CELL_W, CELL_H); });

  const nodeColourMap = {};
  config.nodes.forEach(n => { nodeColourMap[n.id] = GATE_COLOURS[n.type]; });

  const inputNodeMap = {};
  config.nodes.forEach(n => n.inputs.forEach(id => { inputNodeMap[id] = n; }));

  const inputStates = {};
  config.inputs.forEach(i => { inputStates[i.id] = i.state; });

  const switchMetas = {};
  const wires = {};

  // Wires behind components
  function buildInputWire(input) {
    const p1 = positions[input.id];
    const p2 = positions[inputNodeMap[input.id].id];
    wires['in_' + input.id] = buildWirePath(svg, p1.x, p1.y, p2.x, p2.y, 'in_' + input.id);
  }
  config.inputs.forEach(buildInputWire);

  const nodeWirePairs = [];
  function buildNodeInputWires(node) {
    node.inputs.filter(id => config.nodes.some(n => n.id === id)).forEach(function(srcId) {
      const key = 'gate_' + srcId + '_to_' + node.id;
      wires[key] = buildWirePath(svg, positions[srcId].x, positions[srcId].y, positions[node.id].x, positions[node.id].y, key);
      nodeWirePairs.push({ srcId, nodeId: node.id });
    });
  }
  config.nodes.forEach(buildNodeInputWires);

  function buildOutputWire(out) {
    wires['out_' + out.id] = buildWirePath(svg, positions[out.source].x, positions[out.source].y, positions[out.id].x, positions[out.id].y, 'out_' + out.id);
  }
  config.outputs.forEach(buildOutputWire);

  const pulseLayer = el('g', {});
  svg.appendChild(pulseLayer);

  // Components on top of wires
  function buildInputComponent(input) {
    const p = positions[input.id];
    const colour = nodeColourMap[inputNodeMap[input.id].id];
    const dispLabel = DISP_LABEL_FN[String(input.displayLabel !== undefined)](input);
    const meta = buildSwitch(svg, input.id, p.x, p.y, input.state, colour, input.label, dispLabel, onToggle);
    switchMetas[input.id] = { meta };
  }
  config.inputs.forEach(buildInputComponent);

  config.nodes.forEach(function(node) {
    const p = positions[node.id];
    buildGatePill(svg, p.x, p.y, node.type, nodeColourMap[node.id]);
  });

  const out0 = config.outputs[0];
  const op = positions[out0.id];
  const outputG = buildOutput(out0.type, op.x, op.y, 24);
  svg.appendChild(outputG);
  DO_SPEAK_EL[String(typeof window.__makeSpeakable === 'function')](outputG, out0.type);

  function nodeDepths() {
    const depths = {};
    config.inputs.forEach(function(i) { depths[i.id] = 0; });
    config.nodes.forEach(function(n) {
      depths[n.id] = n.inputs.reduce(function(m, id) { return Math.max(m, depths[id]); }, 0) + 1;
    });
    return depths;
  }

  function pulseInput(input) { animatePulse(pulseLayer, wires['in_' + input.id], 0, nodeColourMap[inputNodeMap[input.id].id]); }
  function pulsePair(depths, HOP, pair) { animatePulse(pulseLayer, wires['gate_' + pair.srcId + '_to_' + pair.nodeId], depths[pair.srcId] * HOP, nodeColourMap[pair.srcId]); }

  function runPulses(nodeValues) {
    const HOP = 0.22;
    const depths = nodeDepths();
    config.inputs.filter(function(inp) { return inputStates[inp.id]; }).forEach(pulseInput);
    nodeWirePairs.filter(function(p) { return nodeValues[p.srcId]; }).forEach(function(p) { pulsePair(depths, HOP, p); });
    PULSE_OUTPUT[String(!!nodeValues[out0.source])](depths, HOP);
  }

  const PULSE_OUTPUT = {
    'true':  function(depths, HOP) { animatePulse(pulseLayer, wires['out_' + out0.id], depths[out0.source] * HOP, nodeColourMap[out0.source]); },
    'false': function() {}
  };
  const DO_PULSE = { 'true': runPulses, 'false': NOOP };

  function evaluate(animate) {
    const nodeValues = Object.assign({}, inputStates);
    config.nodes.forEach(n => {
      nodeValues[n.id] = window.LogicEngine.evalGate(n.type, n.inputs.map(id => !!nodeValues[id]));
    });
    const active = !!nodeValues[out0.source];

    config.inputs.forEach(input => {
      updateWire(wires['in_' + input.id], inputStates[input.id], nodeColourMap[inputNodeMap[input.id].id]);
    });
    nodeWirePairs.forEach(pair => {
      updateWire(wires['gate_' + pair.srcId + '_to_' + pair.nodeId], !!nodeValues[pair.srcId], nodeColourMap[pair.srcId]);
    });
    updateWire(wires['out_' + out0.id], active, nodeColourMap[out0.source]);
    updateOutput(outputG, out0.type, active);
    DO_PULSE[String(!!animate)](nodeValues);
    return active;
  }

  function handleToggle(id) {
    inputStates[id] = !inputStates[id];
    switchMetas[id].meta.applyState(inputStates[id]);
    const output = evaluate(true);
    config.onUpdate(inputStates, output);
  }

  svg._handleToggle = handleToggle;
  svg._evaluate = evaluate;
  svg._getInputStates = function() { return inputStates; };
  svg._silentReset = function() {
    config.inputs.forEach(function(inp) {
      inputStates[inp.id] = false;
      switchMetas[inp.id].meta.applyState(false);
    });
    evaluate();
  };

  evaluate();
  return svg;
}

window.StationUI = { buildStation };
