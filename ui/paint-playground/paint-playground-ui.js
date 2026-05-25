var paintState = null;
var paintBgCtx = null;
var paintDrawCtx = null;
var paintActiveTool = 'hand';
var paintPrevBrush = null;
var paintActiveColour = '#333333';
var paintPaletteEnabled = true;

var PAINT_ACTIVE_ATTR = {
  true: function(btn) { btn.setAttribute('data-active', ''); },
  false: function(btn) { btn.removeAttribute('data-active'); }
};

var PAINT_ON_SET_HAND = {
  true: function() { paintPrevBrush = paintActiveTool; },
  false: function() {}
};

var PAINT_PALETTE_OPACITY = { true: '1', false: '0.35' };

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
  paintRenderToolbar();
}

function paintSetPaletteEnabled(enabled) {
  paintPaletteEnabled = enabled;
  document.getElementById('paint-colour-slot').style.opacity = PAINT_PALETTE_OPACITY[String(enabled)];
  document.getElementById('paint-colour-slot').style.pointerEvents = enabled ? '' : 'none';
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
  }
};

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

  var panActive = false;
  var panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0;
  var isDrawing = false;
  var lastX = 0, lastY = 0;

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

  function toCanvasCoords(e) {
    var r = wrap.getBoundingClientRect();
    return { x: e.clientX - r.left + paintState.viewport.x, y: e.clientY - r.top + paintState.viewport.y };
  }

  drawCanvas.addEventListener('pointerdown', function(e) {
    [PAN_START[paintActiveTool]].filter(Boolean).forEach(function(fn) { fn(e); });
    [BRUSH_STROKE[paintActiveTool]].filter(Boolean).forEach(function() {
      drawCanvas.setPointerCapture(e.pointerId);
      isDrawing = true;
      var pt = toCanvasCoords(e);
      lastX = pt.x; lastY = pt.y;
    });
  });

  drawCanvas.addEventListener('pointermove', function(e) {
    [panActive].filter(Boolean).forEach(function() {
      var dx = e.clientX - panStartX;
      var dy = e.clientY - panStartY;
      paintState = applyPaintPan(paintState, panOriginX - dx, panOriginY - dy);
      paintApplyViewport();
    });
    [isDrawing].filter(Boolean).forEach(function() {
      var pt = toCanvasCoords(e);
      [BRUSH_STROKE[paintActiveTool]].filter(Boolean).forEach(function(fn) {
        fn(paintDrawCtx, lastX, lastY, pt.x, pt.y, paintActiveColour);
      });
      lastX = pt.x; lastY = pt.y;
    });
  });

  drawCanvas.addEventListener('pointerup', function() { panActive = false; isDrawing = false; });
  drawCanvas.addEventListener('pointercancel', function() { panActive = false; isDrawing = false; });
}
