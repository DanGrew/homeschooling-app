const GATE_COLOURS = { AND: '#3498DB', OR: '#2ECC71', XOR: '#9B59B6', NOT: '#F39C12' };

function buildLamp(cx, cy, r = 28) {
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

function activateLamp(g) {
  const base = g.querySelector('circle');
  const fil = g.querySelector('path');
  base.setAttribute('fill', '#FFD700');
  base.setAttribute('stroke', '#F39C12');
  base.setAttribute('filter', 'drop-shadow(0 0 10px #FFD700)');
  fil.setAttribute('stroke', '#fff');
}
function deactivateLamp(g) {
  const base = g.querySelector('circle');
  const fil = g.querySelector('path');
  base.setAttribute('fill', '#ddd');
  base.setAttribute('stroke', '#bbb');
  base.removeAttribute('filter');
  fil.setAttribute('stroke', '#aaa');
}
const LAMP_FNS = [deactivateLamp, activateLamp];
function updateLamp(g, active) { LAMP_FNS[+active](g); }

function buildFan(cx, cy, r = 28) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.output = 'fan';
  const blades = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  blades.dataset.blades = '1';
  [0, 90, 180, 270].forEach(function(a) {
    const blade = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    blade.setAttribute('cx', cx + r * 0.52);
    blade.setAttribute('cy', cy);
    blade.setAttribute('rx', r * 0.52);
    blade.setAttribute('ry', r * 0.18);
    blade.setAttribute('transform', `rotate(${a}, ${cx}, ${cy})`);
    blade.setAttribute('fill', '#ccc');
    blade.setAttribute('opacity', '0.9');
    blades.appendChild(blade);
  });
  const hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  hub.setAttribute('cx', cx); hub.setAttribute('cy', cy); hub.setAttribute('r', 6);
  hub.setAttribute('fill', '#bbb');
  g.appendChild(blades); g.appendChild(hub);
  return g;
}

function activateFan(g) {
  const blades = g.querySelector('[data-blades]');
  const hub = g.querySelector('circle');
  Array.from(blades.children).forEach(b => b.setAttribute('fill', '#1ABC9C'));
  hub.setAttribute('fill', '#0E8C6E');
  blades.style.transformBox = 'fill-box';
  blades.style.transformOrigin = 'center';
  blades.style.animation = 'spin 1.2s linear infinite';
}
function deactivateFan(g) {
  const blades = g.querySelector('[data-blades]');
  const hub = g.querySelector('circle');
  Array.from(blades.children).forEach(b => b.setAttribute('fill', '#ccc'));
  hub.setAttribute('fill', '#bbb');
  blades.style.transformBox = 'fill-box';
  blades.style.transformOrigin = 'center';
  blades.style.animation = '';
}
const FAN_FNS = [deactivateFan, activateFan];
function updateFan(g, active) { FAN_FNS[+active](g); }

function buildFountain(cx, cy, r = 28) {
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

function activateFountain(g) {
  const basin = g.querySelector('ellipse');
  const arcs = g.querySelectorAll('[data-arc]');
  basin.setAttribute('fill', '#5DADE2');
  arcs.forEach(arc => {
    arc.setAttribute('stroke', '#3498DB');
    arc.setAttribute('filter', 'drop-shadow(0 0 4px #3498DB)');
  });
}
function deactivateFountain(g) {
  const basin = g.querySelector('ellipse');
  const arcs = g.querySelectorAll('[data-arc]');
  basin.setAttribute('fill', '#ddd');
  arcs.forEach(arc => {
    arc.setAttribute('stroke', '#bbb');
    arc.removeAttribute('filter');
  });
}
const FOUNTAIN_FNS = [deactivateFountain, activateFountain];
function updateFountain(g, active) { FOUNTAIN_FNS[+active](g); }

const BUILDERS = { lamp: buildLamp, fan: buildFan, fountain: buildFountain };
const UPDATERS = { lamp: updateLamp, fan: updateFan, fountain: updateFountain };
function buildOutput(type, cx, cy, r) { return BUILDERS[type](cx, cy, r); }
function updateOutput(g, type, active) { return UPDATERS[type](g, active); }

if (typeof module !== 'undefined') {
  module.exports = { buildOutput, updateOutput, GATE_COLOURS };
} else {
  window.OutputUI = { buildOutput, updateOutput, GATE_COLOURS };
}
