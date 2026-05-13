const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL_W = 120;
const CELL_H = 80;

function el(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs || {}).forEach(function(k) { e.setAttribute(k, attrs[k]); });
  return e;
}

function cellCenter(cell) {
  return { x: cell[0] * CELL_W + CELL_W / 2, y: cell[1] * CELL_H + CELL_H / 2 };
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

function updateWire(wire, active, colour) {
  wire.setAttribute('stroke', active ? colour : '#ccc');
  if (active) {
    wire.setAttribute('filter', `drop-shadow(0 0 5px ${colour})`);
  } else {
    wire.removeAttribute('filter');
  }
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

  const grid = config.grid;
  const W = grid.cols * CELL_W;
  const H = grid.rows * CELL_H;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`, width: '100%',
    style: 'max-width:720px;display:block;margin:0 auto;'
  });

  const positions = {};
  config.inputs.forEach(function(i) { positions[i.id] = cellCenter(i.cell); });
  config.nodes.forEach(function(n) { positions[n.id] = cellCenter(n.cell); });
  config.outputs.forEach(function(o) { positions[o.id] = cellCenter(o.cell); });

  const nodeColourMap = {};
  config.nodes.forEach(function(n) { nodeColourMap[n.id] = GATE_COLOURS[n.type] || '#999'; });

  const inputStates = {};
  config.inputs.forEach(function(i) { inputStates[i.id] = i.state; });

  const switchMetas = {};
  const wires = {};

  // Wires drawn first — behind all components
  config.inputs.forEach(function(input) {
    const p1 = positions[input.id];
    const targetNode = config.nodes.find(function(n) { return n.inputs.indexOf(input.id) !== -1; });
    if (!targetNode) return;
    const p2 = positions[targetNode.id];
    wires['in_' + input.id] = buildWirePath(svg, p1.x, p1.y, p2.x, p2.y, 'in_' + input.id);
  });

  config.nodes.forEach(function(node) {
    node.inputs.forEach(function(srcId) {
      if (!config.nodes.find(function(n) { return n.id === srcId; })) return;
      const wireKey = 'gate_' + srcId + '_to_' + node.id;
      wires[wireKey] = buildWirePath(svg, positions[srcId].x, positions[srcId].y, positions[node.id].x, positions[node.id].y, wireKey);
    });
  });

  config.outputs.forEach(function(out) {
    wires['out_' + out.id] = buildWirePath(svg, positions[out.source].x, positions[out.source].y, positions[out.id].x, positions[out.id].y, 'out_' + out.id);
  });

  // Components drawn on top of wires
  config.inputs.forEach(function(input) {
    const p = positions[input.id];
    const targetNode = config.nodes.find(function(n) { return n.inputs.indexOf(input.id) !== -1; });
    const colour = targetNode ? nodeColourMap[targetNode.id] : '#999';
    const meta = buildSwitch(svg, input.id, p.x, p.y, input.state, colour, input.label, onToggle);
    switchMetas[input.id] = { meta };
  });

  config.nodes.forEach(function(node) {
    const p = positions[node.id];
    buildGatePill(svg, p.x, p.y, node.type, nodeColourMap[node.id]);
  });

  const out0 = config.outputs[0];
  const op = positions[out0.id];
  const outputG = buildOutput(out0.type, op.x, op.y, 24);
  svg.appendChild(outputG);

  function evaluate() {
    const nodeValues = Object.assign({}, inputStates);
    config.nodes.forEach(function(node) {
      nodeValues[node.id] = window.LogicEngine.evalGate(
        node.type,
        node.inputs.map(function(id) { return !!nodeValues[id]; })
      );
    });
    const active = !!nodeValues[out0.source];

    config.inputs.forEach(function(input) {
      const targetNode = config.nodes.find(function(n) { return n.inputs.indexOf(input.id) !== -1; });
      if (!targetNode) return;
      updateWire(wires['in_' + input.id], inputStates[input.id], nodeColourMap[targetNode.id]);
    });

    config.nodes.forEach(function(node) {
      node.inputs.forEach(function(srcId) {
        const wireKey = 'gate_' + srcId + '_to_' + node.id;
        if (wires[wireKey]) {
          updateWire(wires[wireKey], !!nodeValues[srcId], nodeColourMap[srcId] || nodeColourMap[node.id]);
        }
      });
    });

    updateWire(wires['out_' + out0.id], active, nodeColourMap[out0.source]);
    updateOutput(outputG, out0.type, active);
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
