const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs || {}).forEach(function(k) { e.setAttribute(k, attrs[k]); });
  return e;
}

function buildSwitch(svg, id, cx, cy, active, colour, label, onToggle) {
  const W = 64, H = 32, R = 16;
  const g = el('g', { 'data-switch': id, style: 'cursor:pointer' });
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
  lbl.textContent = label;
  g.appendChild(track); g.appendChild(knob); g.appendChild(lbl);
  svg.appendChild(g);

  function applyState(on) {
    track.setAttribute('fill', on ? colour : '#ddd');
    track.setAttribute('stroke', on ? colour : '#bbb');
    knob.setAttribute('cx', on ? cx + W/2 - R : cx - W/2 + R);
    knob.setAttribute('stroke', on ? colour : '#bbb');
  }

  applyState(active);
  g.addEventListener('click', function() { onToggle(id); });
  return { applyState };
}

function buildWirePath(svg, x1, y1, x2, y2, id) {
  const mid = (x1 + x2) / 2;
  const d = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
  const wire = el('path', {
    d, stroke: '#ccc', 'stroke-width': '5', fill: 'none',
    'stroke-linecap': 'round', 'data-wire': id
  });
  svg.appendChild(wire);
  return wire;
}

function updateWire(wire, active, colour) {
  wire.setAttribute('stroke', active ? colour : '#ccc');
  if (active) {
    wire.setAttribute('filter', `drop-shadow(0 0 5px ${colour})`);
  } else {
    wire.removeAttribute('filter');
  }
}

function buildGatePill(svg, cx, cy, label, colour) {
  const W = 80, H = 36, R = 18;
  const g = el('g', {});
  const rect = el('rect', {
    x: cx - W/2, y: cy - H/2, width: W, height: H, rx: R,
    fill: colour
  });
  const lbl = el('text', {
    x: cx, y: cy + 5, 'text-anchor': 'middle',
    'font-size': '16', 'font-weight': 'bold', fill: '#fff',
    'font-family': 'inherit'
  });
  lbl.textContent = label;
  g.appendChild(rect); g.appendChild(lbl);
  svg.appendChild(g);
  return g;
}

function buildStation(config, onToggle) {
  const { buildOutput, updateOutput, GATE_COLOURS } = window.OutputUI;

  const compound = config.nodes.length > 1;
  const switchCount = config.inputs.length;
  const isSingleInput = switchCount === 1;

  const W = compound ? 600 : 480;
  const H = isSingleInput ? 120 : (switchCount >= 3 ? 220 : 180);

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, width: '100%',
    style: 'max-width:640px;display:block;margin:0 auto;'
  });

  const switchX  = compound ? 70  : 80;
  const gate1X   = compound ? 210 : W / 2;
  const gate2X   = compound ? 390 : null;
  const outputX  = compound ? 545 : W - 80;

  const gate1Colour = GATE_COLOURS[config.nodes[0].type] || '#999';
  const gate2Colour = compound ? (GATE_COLOURS[config.nodes[1].type] || '#999') : null;

  const inputStates = {};
  config.inputs.forEach(function(i) { inputStates[i.id] = i.state; });

  const switchMetas = {};
  const wires = {};

  const switchYPositions = config.inputs.map(function(_, i) {
    return (H / (switchCount + 1)) * (i + 1);
  });

  config.inputs.forEach(function(input, idx) {
    const cy = switchYPositions[idx];
    const meta = buildSwitch(svg, input.id, switchX, cy, input.state, gate1Colour, input.label, onToggle);
    switchMetas[input.id] = { meta, cy };
    wires['in_' + input.id] = buildWirePath(svg, switchX + 40, cy, gate1X - 40, H / 2, 'in_' + input.id);
  });

  buildGatePill(svg, gate1X, H / 2, config.nodes[0].type, gate1Colour);

  if (compound) {
    wires['mid'] = buildWirePath(svg, gate1X + 40, H / 2, gate2X - 40, H / 2, 'mid');
    buildGatePill(svg, gate2X, H / 2, config.nodes[1].type, gate2Colour);
    wires['gate_out'] = buildWirePath(svg, gate2X + 40, H / 2, outputX - 28, H / 2, 'gate_out');
  } else {
    wires['gate_out'] = buildWirePath(svg, gate1X + 40, H / 2, outputX - 28, H / 2, 'gate_out');
  }

  const outputType = config.outputs[0].type;
  const outputG = buildOutput(outputType, outputX, H / 2, 24);
  svg.appendChild(outputG);

  function evaluate() {
    const nodeValues = Object.assign({}, inputStates);
    config.nodes.forEach(function(node) {
      nodeValues[node.id] = window.LogicEngine.evalGate(node.type, node.inputs.map(function(id) { return !!nodeValues[id]; }));
    });
    const active = !!nodeValues[config.outputs[0].source];

    config.inputs.forEach(function(input) {
      updateWire(wires['in_' + input.id], inputStates[input.id], gate1Colour);
    });

    if (compound) {
      const gate1Active = !!nodeValues[config.nodes[0].id];
      updateWire(wires['mid'], gate1Active, gate1Colour);
      updateWire(wires['gate_out'], active, gate2Colour);
    } else {
      updateWire(wires['gate_out'], active, gate1Colour);
    }

    updateOutput(outputG, outputType, active);
    return active;
  }

  function handleToggle(id) {
    inputStates[id] = !inputStates[id];
    switchMetas[id].meta.applyState(inputStates[id]);
    const active = evaluate();
    if (config.onUpdate) config.onUpdate(inputStates, active);
  }

  svg._handleToggle = handleToggle;
  svg._evaluate = evaluate;
  svg._getInputStates = function() { return inputStates; };

  evaluate();
  return svg;
}

window.StationUI = { buildStation };
