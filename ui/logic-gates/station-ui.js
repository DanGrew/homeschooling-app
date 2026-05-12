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
    x: cx - W/2, y: cy - H/2, width: W, height: H, rx: R, fill: colour
  });
  const lbl = el('text', {
    x: cx, y: cy + 5, 'text-anchor': 'middle',
    'font-size': '16', 'font-weight': 'bold', fill: '#fff', 'font-family': 'inherit'
  });
  lbl.textContent = label;
  g.appendChild(rect); g.appendChild(lbl);
  svg.appendChild(g);
  return g;
}

function buildStation(config, onToggle) {
  const { buildOutput, updateOutput, GATE_COLOURS } = window.OutputUI;

  const nodeCount  = config.nodes.length;
  const switchCount = config.inputs.length;

  const W = 320 + nodeCount * 150 + switchCount * 20;
  const H = switchCount <= 1 ? 120 : (switchCount >= 3 ? 220 : 180);

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, width: '100%',
    style: 'max-width:720px;display:block;margin:0 auto;'
  });

  const outputX = W - 56;
  const gateSlotW = (outputX - 56 - 120) / nodeCount;

  function gateX(idx) { return 120 + gateSlotW * idx + gateSlotW / 2; }

  const nodeColours = config.nodes.map(function(n) {
    return GATE_COLOURS[n.type] || '#999';
  });

  const inputStates = {};
  config.inputs.forEach(function(i) { inputStates[i.id] = i.state; });

  const switchMetas = {};
  const wires = {};

  const switchYPositions = config.inputs.map(function(_, i) {
    return (H / (switchCount + 1)) * (i + 1);
  });

  const nodeXMap = {};
  config.nodes.forEach(function(node, idx) { nodeXMap[node.id] = gateX(idx); });

  config.inputs.forEach(function(input, idx) {
    const cy = switchYPositions[idx];
    const targetNode = config.nodes.find(function(n) { return n.inputs.indexOf(input.id) !== -1; });
    const tx = targetNode ? nodeXMap[targetNode.id] - 40 : gateX(0) - 40;
    const colour = nodeColours[config.nodes.indexOf(targetNode)] || nodeColours[0];
    const meta = buildSwitch(svg, input.id, 72, cy, input.state, colour, input.label, onToggle);
    switchMetas[input.id] = { meta, cy };
    wires['in_' + input.id] = buildWirePath(svg, 72 + 40, cy, tx, H / 2, 'in_' + input.id);
  });

  config.nodes.forEach(function(node, idx) {
    const cx = gateX(idx);
    buildGatePill(svg, cx, H / 2, node.type, nodeColours[idx]);
    if (idx < nodeCount - 1) {
      wires['mid_' + idx] = buildWirePath(svg, cx + 40, H / 2, gateX(idx + 1) - 40, H / 2, 'mid_' + idx);
    }
  });

  wires['gate_out'] = buildWirePath(svg, gateX(nodeCount - 1) + 40, H / 2, outputX - 26, H / 2, 'gate_out');

  const outputType = config.outputs[0].type;
  const outputG = buildOutput(outputType, outputX, H / 2, 24);
  svg.appendChild(outputG);

  function evaluate() {
    const nodeValues = Object.assign({}, inputStates);
    config.nodes.forEach(function(node) {
      nodeValues[node.id] = window.LogicEngine.evalGate(
        node.type,
        node.inputs.map(function(id) { return !!nodeValues[id]; })
      );
    });
    const active = !!nodeValues[config.outputs[0].source];

    config.inputs.forEach(function(input) {
      const targetNode = config.nodes.find(function(n) { return n.inputs.indexOf(input.id) !== -1; });
      const colour = targetNode ? nodeColours[config.nodes.indexOf(targetNode)] : nodeColours[0];
      updateWire(wires['in_' + input.id], inputStates[input.id], colour);
    });

    config.nodes.forEach(function(node, idx) {
      if (idx < nodeCount - 1) {
        updateWire(wires['mid_' + idx], !!nodeValues[node.id], nodeColours[idx]);
      }
    });

    updateWire(wires['gate_out'], active, nodeColours[nodeCount - 1]);
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
