const GATE_COLOURS = { AND: '#3498DB', OR: '#2ECC71', XOR: '#9B59B6', NOT: '#F39C12' };

function buildLamp(cx, cy, r) {
  r = r || 28;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.output = 'lamp';
  const base = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  base.setAttribute('cx', cx); base.setAttribute('cy', cy); base.setAttribute('r', r);
  base.setAttribute('fill', '#ddd'); base.setAttribute('stroke', '#bbb'); base.setAttribute('stroke-width', '3');
  const filament = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  filament.setAttribute('d', `M${cx-8},${cy+8} Q${cx},${cy-10} ${cx+8},${cy+8}`);
  filament.setAttribute('stroke', '#aaa'); filament.setAttribute('stroke-width', '2.5');
  filament.setAttribute('fill', 'none'); filament.setAttribute('stroke-linecap', 'round');
  g.appendChild(base); g.appendChild(filament);
  return g;
}

function updateLamp(g, active) {
  const base = g.querySelector('circle');
  const fil  = g.querySelector('path');
  if (active) {
    base.setAttribute('fill', '#FFD700');
    base.setAttribute('stroke', '#F39C12');
    base.setAttribute('filter', 'drop-shadow(0 0 10px #FFD700)');
    fil.setAttribute('stroke', '#fff');
  } else {
    base.setAttribute('fill', '#ddd');
    base.setAttribute('stroke', '#bbb');
    base.removeAttribute('filter');
    fil.setAttribute('stroke', '#aaa');
  }
}

function buildFan(cx, cy, r) {
  r = r || 28;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.output = 'fan';
  const hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  hub.setAttribute('cx', cx); hub.setAttribute('cy', cy); hub.setAttribute('r', 5);
  hub.setAttribute('fill', '#bbb');
  const blades = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  blades.dataset.blades = '1';
  const angles = [0, 90, 180, 270];
  angles.forEach(function(a) {
    const blade = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    const rad = a * Math.PI / 180;
    blade.setAttribute('cx', cx + (r * 0.5) * Math.cos(rad));
    blade.setAttribute('cy', cy + (r * 0.5) * Math.sin(rad));
    blade.setAttribute('rx', r * 0.45); blade.setAttribute('ry', r * 0.22);
    blade.setAttribute('transform', `rotate(${a}, ${cx}, ${cy})`);
    blade.setAttribute('fill', '#ccc'); blade.setAttribute('opacity', '0.85');
    blades.appendChild(blade);
  });
  g.appendChild(blades); g.appendChild(hub);
  return g;
}

function updateFan(g, active) {
  const blades = g.querySelector('[data-blades]');
  const hub = g.querySelector('circle');
  Array.from(blades.children).forEach(function(b) {
    b.setAttribute('fill', active ? '#1ABC9C' : '#ccc');
  });
  hub.setAttribute('fill', active ? '#0E8C6E' : '#bbb');
  blades.style.transformBox = 'fill-box';
  blades.style.transformOrigin = 'center';
  blades.style.animation = active ? 'spin 1.2s linear infinite' : '';
}

function buildFountain(cx, cy, r) {
  r = r || 28;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.output = 'fountain';
  const basin = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  basin.setAttribute('cx', cx); basin.setAttribute('cy', cy + r * 0.6);
  basin.setAttribute('rx', r * 0.8); basin.setAttribute('ry', r * 0.2);
  basin.setAttribute('fill', '#ddd');
  const arcs = [[-20, 0], [0, -10], [20, 0]];
  arcs.forEach(function(offset, i) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = cx + offset[0] * 0.3;
    const y1 = cy + r * 0.4;
    const cpx = cx + offset[0];
    const cpy = cy - r * 0.5;
    const x2 = cx + offset[0] + offset[1];
    const y2 = cy + offset[0] * 0.2;
    path.setAttribute('d', `M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`);
    path.setAttribute('stroke', '#bbb'); path.setAttribute('stroke-width', '2.5');
    path.setAttribute('fill', 'none'); path.setAttribute('stroke-linecap', 'round');
    path.dataset.arc = i;
    g.appendChild(path);
  });
  g.appendChild(basin);
  return g;
}

function updateFountain(g, active) {
  const basin = g.querySelector('ellipse');
  const arcs = g.querySelectorAll('[data-arc]');
  basin.setAttribute('fill', active ? '#5DADE2' : '#ddd');
  arcs.forEach(function(arc) {
    arc.setAttribute('stroke', active ? '#3498DB' : '#bbb');
    if (active) {
      arc.setAttribute('filter', 'drop-shadow(0 0 4px #3498DB)');
    } else {
      arc.removeAttribute('filter');
    }
  });
}

function buildOutput(type, cx, cy, r) {
  if (type === 'fan')      return buildFan(cx, cy, r);
  if (type === 'fountain') return buildFountain(cx, cy, r);
  return buildLamp(cx, cy, r);
}

function updateOutput(g, type, active) {
  if (type === 'fan')      return updateFan(g, active);
  if (type === 'fountain') return updateFountain(g, active);
  return updateLamp(g, active);
}

if (typeof module !== 'undefined') {
  module.exports = { buildOutput, updateOutput, GATE_COLOURS };
} else {
  window.OutputUI = { buildOutput, updateOutput, GATE_COLOURS };
}
