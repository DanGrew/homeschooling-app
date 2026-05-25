var PAINT_WORLD_SCALE = 4;

var PAINT_COLOURS = [
  '#E74C3C','#3498DB','#F1C40F','#2ECC71','#E67E22',
  '#9B59B6','#FF69B4','#795548','#333333','#F5F5F5'
];

var PAINT_BRUSHES = {
  pencil:     { lineWidth: 2,  alpha: 0.9,  cap: 'round',  join: 'round' },
  crayon:     { lineWidth: 14, alpha: 0.4,  cap: 'round',  join: 'round' },
  paintbrush: { lineWidth: 14, alpha: 0.75, cap: 'round',  join: 'round' },
  marker:     { lineWidth: 18, alpha: 1.0,  cap: 'square', join: 'miter' }
};

var CRAYON_PASSES = [
  { ox: 0,  oy: 0,  wf: 1.0, a: 0.40 },
  { ox: -1, oy: 0,  wf: 0.7, a: 0.20 },
  { ox: 2,  oy: 1,  wf: 0.6, a: 0.20 },
  { ox: -2, oy: -1, wf: 0.5, a: 0.15 }
];

function initPaintState(viewportW, viewportH) {
  var worldW = viewportW * PAINT_WORLD_SCALE;
  var worldH = viewportH * PAINT_WORLD_SCALE;
  var vpX = Math.floor((worldW - viewportW) / 2);
  var vpY = Math.floor((worldH - viewportH) / 2);
  return {
    world: { width: worldW, height: worldH },
    viewport: { x: vpX, y: vpY, width: viewportW, height: viewportH }
  };
}

function applyPaintPan(state, targetX, targetY) {
  var maxX = state.world.width - state.viewport.width;
  var maxY = state.world.height - state.viewport.height;
  var x = Math.max(0, Math.min(targetX, maxX));
  var y = Math.max(0, Math.min(targetY, maxY));
  return Object.assign({}, state, {
    viewport: Object.assign({}, state.viewport, { x: x, y: y })
  });
}

var GLITTER_OFFSETS = [
  { dx:  0,   dy:  0,   r: 3.0 },
  { dx: -8,   dy: -6,   r: 2.0 },
  { dx: 10,   dy: -4,   r: 2.0 },
  { dx: -5,   dy:  9,   r: 2.0 },
  { dx:  8,   dy:  7,   r: 2.0 },
  { dx: -12,  dy:  2,   r: 1.5 },
  { dx:  6,   dy: -11,  r: 1.5 }
];

function paintClientToCanvas(clientX, clientY, rectLeft, rectTop, viewportX, viewportY) {
  return { x: clientX - rectLeft + viewportX, y: clientY - rectTop + viewportY };
}

function buildStarPath(cx, cy, outerR, innerR, points) {
  var radii = [outerR, innerR];
  var step = Math.PI / points;
  var result = [];
  for (var i = 0; i < points * 2; i++) {
    var angle = i * step - Math.PI / 2;
    result.push({ x: cx + Math.cos(angle) * radii[i % 2], y: cy + Math.sin(angle) * radii[i % 2] });
  }
  return result;
}

if (typeof module !== 'undefined') module.exports = { PAINT_WORLD_SCALE, PAINT_COLOURS, PAINT_BRUSHES, CRAYON_PASSES, GLITTER_OFFSETS, initPaintState, applyPaintPan, paintClientToCanvas, buildStarPath };
