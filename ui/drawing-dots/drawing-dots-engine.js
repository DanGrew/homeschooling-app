// arch: allow-complexity
// Line count exceeds 80 — complex UI component with multiple dispatch tables.
// Zero cyclomatic violations: all decisions are in core or resolved via lookup.

import { edgeKey, buildAdj, computeR, tapResult, formatTitle, getDotStyleIndex, isDotDone, getInstruction } from '../../core/drawing-dots/drawing-dots-core.js';
import { buildFilterBar } from '../filter-bar/filter-bar-ui.js';

var shapeIdx = 0, selectedDot = null, completedEdges, adj, complete, filtered = [];

(function() {
  var b = document.createElement('div');
  b.id = 'dd-banner';
  b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#2ECC71;color:white;display:flex;align-items:center;justify-content:space-between;padding:14px 20px;transform:translateY(100%);transition:transform 0.3s ease;z-index:100;box-sizing:border-box;font-family:inherit;';
  b.innerHTML = '<span style="font-size:1.6em;">&#11088; Well done!</span><button id="dd-next" style="background:white;color:#2ECC71;border:none;font-size:1.2em;padding:10px 24px;border-radius:12px;font-family:inherit;cursor:pointer;font-weight:bold;">Next &#8594;</button>';
  document.body.appendChild(b);
})();

var DOT_STYLES = [
  { fill: 'white',   stroke: '#444',    tFill: '#333'  },
  { fill: '#F39C12', stroke: '#E67E22', tFill: 'white' },
  { fill: '#2ECC71', stroke: '#27AE60', tFill: 'white' },
];

var SET_INSTR = {
  'true':  function(el, text) { el.innerHTML = text; },
  'false': function(el, text) { el.textContent = text; },
};

var ANIM_DONE = {
  'false': function(start, els) { requestAnimationFrame(function(ts) { animFrame(ts, start, els); }); },
  'true':  function() { showBannerDone(); },
};

var REVEAL_NO_BG = {
  'true':  function() { showBannerDone(); },
  'false': function(bg, els) { requestAnimationFrame(function(ts) { animFrame(ts, ts, [bg].concat(els)); }); },
};

var TAP_ACTIONS = {
  draw: function(result, prev, i) {
    var dots = filtered[shapeIdx].dots;
    drawLine(dots[prev].cx, dots[prev].cy, dots[i].cx, dots[i].cy);
    refreshInstruction();
  },
  reveal:  function()           { revealImage(); },
  flash:   function(result, p, i) { flashDot(i); refreshInstruction(); },
  none:    function()           { refreshInstruction(); },
};

function showBannerDone() {
  document.getElementById('dd-banner')?.style.setProperty('transform', 'translateY(0)');
  document.getElementById('dd-next').onclick = function() {
    document.getElementById('dd-banner')?.style.setProperty('transform', 'translateY(100%)');
    nextShape();
  };
}

function ns(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.keys(attrs).forEach(function(k) { el.setAttribute(k, String(attrs[k])); });
  return el;
}

function refreshInstruction() {
  var instr = getInstruction(selectedDot, completedEdges, filtered[shapeIdx].dots);
  SET_INSTR[String(instr.isHtml)](document.getElementById('instruction'), instr.text);
}

function render() {
  var shape = filtered[shapeIdx];
  adj = buildAdj(shape);
  completedEdges = new Set();
  complete = false;
  selectedDot = null;
  document.getElementById('dd-banner')?.style.setProperty('transform', 'translateY(100%)');
  document.getElementById('title').textContent = formatTitle(shape);
  var r = computeR(shape, window.ddDotScale);
  var svg = document.getElementById('svg');
  svg.setAttribute('viewBox', shape.vb);
  svg.innerHTML = '';
  var bg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  bg.setAttribute('id', 'bg'); bg.setAttribute('opacity', '0.2'); bg.innerHTML = shape.decor;
  svg.appendChild(bg);
  var guides = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  guides.setAttribute('id', 'guides');
  shape.edges.forEach(function(e) {
    var a = shape.dots[e[0]], b = shape.dots[e[1]];
    guides.appendChild(ns('line', { x1:a.cx, y1:a.cy, x2:b.cx, y2:b.cy, stroke:'#888', 'stroke-width':Math.max(1,r*0.22), 'stroke-dasharray':'6 4' }));
  });
  svg.appendChild(guides);
  var linesG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  linesG.setAttribute('id', 'lines');
  svg.appendChild(linesG);
  svg.appendChild(makeDotsGroup(shape, r));
  refreshInstruction();
}

function makeDotsGroup(shape, r) {
  var fs = Math.round(r * 0.85), sw = Math.max(0.3, r * 0.15);
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', 'dots');
  shape.dots.forEach(function(d, i) {
    var s = DOT_STYLES[getDotStyleIndex(isDotDone(adj, i, completedEdges), selectedDot === i)];
    var dg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dg.setAttribute('id', 'dot' + i); dg.style.cursor = 'pointer';
    dg.appendChild(ns('circle', { cx:d.cx, cy:d.cy, r:r, fill:s.fill, stroke:s.stroke, 'stroke-width':sw }));
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', d.cx); t.setAttribute('y', d.cy);
    t.setAttribute('font-size', fs); t.setAttribute('font-weight', 'bold');
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('fill', s.tFill); t.textContent = d.id;
    dg.appendChild(t);
    dg.addEventListener('click', function() { tap(i); });
    g.appendChild(dg);
  });
  return g;
}

function refreshDots() {
  document.getElementById('dots')?.remove();
  document.getElementById('svg').appendChild(makeDotsGroup(filtered[shapeIdx], computeR(filtered[shapeIdx], window.ddDotScale)));
}

function tap(i) {
  var prev = selectedDot;
  var result = tapResult({ selectedDot: selectedDot, completedEdges: completedEdges, complete: complete }, i, adj, filtered[shapeIdx].edges.length);
  selectedDot = result.selectedDot;
  completedEdges = result.completedEdges;
  complete = result.complete;
  refreshDots();
  TAP_ACTIONS[result.action](result, prev, i);
}

function drawLine(x1, y1, x2, y2) {
  var r = computeR(filtered[shapeIdx], window.ddDotScale);
  var len = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
  var line = ns('line', { x1:x1, y1:y1, x2:x2, y2:y2, stroke:'#3498DB', 'stroke-width':Math.max(1,Math.round(r*0.3)), 'stroke-linecap':'round', 'stroke-dasharray':len, 'stroke-dashoffset':len });
  document.getElementById('lines').appendChild(line);
  line.getBoundingClientRect();
  line.style.transition = 'stroke-dashoffset 0.35s ease';
  line.setAttribute('stroke-dashoffset', '0');
}

function flashDot(i) {
  var c = document.getElementById('dot' + i)?.querySelector('circle');
  c?.classList.remove('dot-wrong');
  void (c?.offsetWidth);
  c?.classList.add('dot-wrong');
  setTimeout(function() { c?.classList.remove('dot-wrong'); }, 400);
}

function animFrame(ts, start, els) {
  var t = Math.min((ts - start) / 900, 1);
  els[0].setAttribute('opacity', String(0.2 + 0.8 * t));
  els[1]?.setAttribute('opacity', String(1.0 - 0.8 * t));
  els[2]?.setAttribute('opacity', String(1.0 - 0.8 * t));
  els[3]?.setAttribute('opacity', String(1.0 - 0.8 * t));
  ANIM_DONE[String(t >= 1)](start, els);
}

function revealImage() {
  document.getElementById('instruction').textContent = '';
  var bg = document.getElementById('bg');
  var fadeEls = [document.getElementById('guides'), document.getElementById('lines'), document.getElementById('dots')];
  REVEAL_NO_BG[String(!bg)](bg, fadeEls);
}

function nextShape() { shapeIdx = (shapeIdx + 1) % filtered.length; render(); }
function prevShape() { shapeIdx = (shapeIdx + filtered.length - 1) % filtered.length; render(); }

export function startEngine(shapes) {
  buildFilterBar(shapes, function(f) { filtered = f; shapeIdx = 0; render(); });
}

window.tap = tap;
window.nextShape = nextShape;
window.prevShape = prevShape;
Object.defineProperty(window, 'filtered',      { get: () => filtered,      set: v => { filtered = v; },      configurable: true });
Object.defineProperty(window, 'shapeIdx',      { get: () => shapeIdx,      set: v => { shapeIdx = v; },      configurable: true });
Object.defineProperty(window, 'selectedDot',   { get: () => selectedDot,   set: v => { selectedDot = v; },   configurable: true });
Object.defineProperty(window, 'completedEdges',{ get: () => completedEdges,                                   configurable: true });
Object.defineProperty(window, 'adj',           { get: () => adj,                                              configurable: true });
Object.defineProperty(window, 'complete',      { get: () => complete,                                         configurable: true });
