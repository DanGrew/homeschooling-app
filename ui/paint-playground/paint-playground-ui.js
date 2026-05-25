var paintState = null;
var paintBgCtx = null;
var paintDrawCtx = null;
var paintActiveTool = 'hand';
var paintPrevBrush = null;
var paintActiveColour = '#333333';
var paintPaletteEnabled = true;
var paintUndoStack = [];
var PAINT_UNDO_MAX = 5;

var PAINT_ACTIVE_ATTR = {
  true: function(btn) { btn.setAttribute('data-active', ''); },
  false: function(btn) { btn.removeAttribute('data-active'); }
};

var PAINT_ON_SET_HAND = {
  true: function() { paintPrevBrush = paintActiveTool; },
  false: function() {}
};

var PAINT_PALETTE_OPACITY = { true: '1', false: '0.35' };
var PAINT_PALETTE_EVENTS = { true: '', false: 'none' };

var PAINT_PALETTE_ON = function() { paintSetPaletteEnabled(true); };
var PAINT_PALETTE_OFF = function() { paintSetPaletteEnabled(false); };
var PAINT_PALETTE_TOGGLE = {
  hand: PAINT_PALETTE_ON, pencil: PAINT_PALETTE_ON, crayon: PAINT_PALETTE_ON,
  paintbrush: PAINT_PALETTE_ON, marker: PAINT_PALETTE_ON,
  glitter: PAINT_PALETTE_ON, stamp: PAINT_PALETTE_ON, rainbow: PAINT_PALETTE_OFF,
  eraser: PAINT_PALETTE_ON
};

function paintApplyViewport() {
  var left = -paintState.viewport.x + 'px';
  var top = -paintState.viewport.y + 'px';
  document.getElementById('paint-bg').style.left = left;
  document.getElementById('paint-bg').style.top = top;
  document.getElementById('paint-draw').style.left = left;
  document.getElementById('paint-draw').style.top = top;
}

function paintSetTool(tool) {
  PAINT_ON_SET_HAND[String(tool === 'hand')]();
  paintActiveTool = tool;
  PAINT_PALETTE_TOGGLE[tool]();
  paintRenderToolbar();
}

function paintSetPaletteEnabled(enabled) {
  paintPaletteEnabled = enabled;
  document.getElementById('paint-colour-slot').style.opacity = PAINT_PALETTE_OPACITY[String(enabled)];
  document.getElementById('paint-colour-slot').style.pointerEvents = PAINT_PALETTE_EVENTS[String(enabled)];
}

function paintRenderToolbar() {
  document.querySelectorAll('[data-paint-tool]').forEach(function(btn) {
    PAINT_ACTIVE_ATTR[String(btn.getAttribute('data-paint-tool') === paintActiveTool)](btn);
  });
}

function paintStrokeLine(ctx, x1, y1, x2, y2, colour, lineWidth, alpha, cap, join) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = cap;
  ctx.lineJoin = join;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

var paintRainbowIdx = 0;

var BRUSH_STROKE = {
  pencil: function(ctx, x1, y1, x2, y2, colour) {
    paintStrokeLine(ctx, x1, y1, x2, y2, colour, 2, 0.9, 'round', 'round');
  },
  marker: function(ctx, x1, y1, x2, y2, colour) {
    paintStrokeLine(ctx, x1, y1, x2, y2, colour, 18, 1.0, 'square', 'miter');
  },
  paintbrush: function(ctx, x1, y1, x2, y2, colour) {
    paintStrokeLine(ctx, x1, y1, x2, y2, colour, 14, 0.75, 'round', 'round');
  },
  crayon: function(ctx, x1, y1, x2, y2, colour) {
    CRAYON_PASSES.forEach(function(p) {
      paintStrokeLine(ctx, x1 + p.ox, y1 + p.oy, x2 + p.ox, y2 + p.oy, colour, 14 * p.wf, p.a, 'round', 'round');
    });
  },
  glitter: function(ctx, x1, y1, x2, y2, colour) {
    ctx.save();
    ctx.fillStyle = colour;
    GLITTER_OFFSETS.forEach(function(g) {
      ctx.globalAlpha = 0.4 + g.r * 0.1;
      ctx.beginPath();
      ctx.arc(x2 + g.dx, y2 + g.dy, g.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  },
  rainbow: function(ctx, x1, y1, x2, y2) {
    var colour = PAINT_COLOURS[paintRainbowIdx % PAINT_COLOURS.length];
    paintRainbowIdx = (paintRainbowIdx + 1) % PAINT_COLOURS.length;
    paintStrokeLine(ctx, x1, y1, x2, y2, colour, 14, 1.0, 'round', 'round');
  },
  eraser: function(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    paintStrokeLine(ctx, x1, y1, x2, y2, 'rgba(0,0,0,1)', 24, 1.0, 'round', 'round');
    ctx.restore();
  }
};

function paintPushUndo() {
  var vp = paintState.viewport;
  paintUndoStack.push({ data: paintDrawCtx.getImageData(vp.x, vp.y, vp.width, vp.height), x: vp.x, y: vp.y });
  [paintUndoStack.length > PAINT_UNDO_MAX].filter(Boolean).forEach(function() { paintUndoStack.shift(); });
}

function paintUndo() {
  [paintUndoStack.pop()].filter(Boolean).forEach(function(snap) {
    paintDrawCtx.putImageData(snap.data, snap.x, snap.y);
  });
}

function paintClearCanvas() {
  paintDrawCtx.clearRect(0, 0, paintDrawCtx.canvas.width, paintDrawCtx.canvas.height);
  paintUndoStack = [];
}

function paintBuildColourSlot(slot) {
  PAINT_COLOURS.forEach(function(colour) {
    var d = document.createElement('div');
    d.className = 'paint-colour-swatch';
    d.style.background = colour;
    d.dataset.colour = colour;
    d.addEventListener('click', function() {
      [paintPaletteEnabled].filter(Boolean).forEach(function() {
        paintActiveColour = colour;
        document.querySelectorAll('.paint-colour-swatch').forEach(function(s) {
          PAINT_ACTIVE_ATTR[String(s.dataset.colour === colour)](s);
        });
      });
    });
    slot.appendChild(d);
  });
}

function initPaintPlayground() {
  var wrap = document.getElementById('paint-viewport');
  var bgCanvas = document.getElementById('paint-bg');
  var drawCanvas = document.getElementById('paint-draw');

  var w = wrap.clientWidth;
  var h = wrap.clientHeight;

  paintState = initPaintState(w, h);

  bgCanvas.width = paintState.world.width;
  bgCanvas.height = paintState.world.height;
  drawCanvas.width = paintState.world.width;
  drawCanvas.height = paintState.world.height;

  paintBgCtx = bgCanvas.getContext('2d');
  paintDrawCtx = drawCanvas.getContext('2d');

  paintApplyViewport();
  paintRenderToolbar();
  paintBuildColourSlot(document.getElementById('paint-colour-slot'));

  document.querySelectorAll('[data-paint-tool]').forEach(function(btn) {
    btn.addEventListener('click', function() { paintSetTool(btn.getAttribute('data-paint-tool')); });
  });

  document.getElementById('paint-undo-btn').addEventListener('click', paintUndo);

  var gestureRect = { left: 0, top: 0 };
  var panActive = false;
  var panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0;
  var isDrawing = false;
  var lastX = 0, lastY = 0;
  var tapStartX = 0, tapStartY = 0;

  var PAN_START = {
    hand: function(e) {
      drawCanvas.setPointerCapture(e.pointerId);
      panActive = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panOriginX = paintState.viewport.x;
      panOriginY = paintState.viewport.y;
    }
  };

  var TOOL_DOWN = {
    stamp: function(e) {
      drawCanvas.setPointerCapture(e.pointerId);
      paintPushUndo();
      var pt = paintClientToCanvas(e.clientX, e.clientY, gestureRect.left, gestureRect.top, paintState.viewport.x, paintState.viewport.y);
      tapStartX = pt.x;
      tapStartY = pt.y;
    }
  };

  var BRUSH_TAP = {
    stamp: function() {
      var path = buildStarPath(tapStartX, tapStartY, 30, 12, 5);
      paintDrawCtx.save();
      paintDrawCtx.fillStyle = paintActiveColour;
      paintDrawCtx.globalAlpha = 0.9;
      paintDrawCtx.beginPath();
      paintDrawCtx.moveTo(path[0].x, path[0].y);
      path.slice(1).forEach(function(pt) { paintDrawCtx.lineTo(pt.x, pt.y); });
      paintDrawCtx.closePath();
      paintDrawCtx.fill();
      paintDrawCtx.restore();
    }
  };

  drawCanvas.addEventListener('pointerdown', function(e) {
    gestureRect = wrap.getBoundingClientRect();
    [PAN_START[paintActiveTool]].filter(Boolean).forEach(function(fn) { fn(e); });
    [BRUSH_STROKE[paintActiveTool]].filter(Boolean).forEach(function() {
      drawCanvas.setPointerCapture(e.pointerId);
      paintPushUndo();
      isDrawing = true;
      var pt = paintClientToCanvas(e.clientX, e.clientY, gestureRect.left, gestureRect.top, paintState.viewport.x, paintState.viewport.y);
      lastX = pt.x; lastY = pt.y;
    });
    [TOOL_DOWN[paintActiveTool]].filter(Boolean).forEach(function(fn) { fn(e); });
  });

  drawCanvas.addEventListener('pointermove', function(e) {
    [panActive].filter(Boolean).forEach(function() {
      var dx = e.clientX - panStartX;
      var dy = e.clientY - panStartY;
      paintState = applyPaintPan(paintState, panOriginX - dx, panOriginY - dy);
      paintApplyViewport();
    });
    [isDrawing].filter(Boolean).forEach(function() {
      var pt = paintClientToCanvas(e.clientX, e.clientY, gestureRect.left, gestureRect.top, paintState.viewport.x, paintState.viewport.y);
      [BRUSH_STROKE[paintActiveTool]].filter(Boolean).forEach(function(fn) {
        fn(paintDrawCtx, lastX, lastY, pt.x, pt.y, paintActiveColour);
      });
      lastX = pt.x; lastY = pt.y;
    });
  });

  drawCanvas.addEventListener('pointerup', function() {
    [BRUSH_TAP[paintActiveTool]].filter(Boolean).forEach(function(fn) { fn(); });
    panActive = false;
    isDrawing = false;
  });

  drawCanvas.addEventListener('pointercancel', function() { panActive = false; isDrawing = false; });
}
