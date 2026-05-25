var paintState = null;
var paintBgCtx = null;
var paintDrawCtx = null;
var paintActiveTool = 'hand';
var paintPrevBrush = null;

var PAINT_ACTIVE_ATTR = {
  true: function(btn) { btn.setAttribute('data-active', ''); },
  false: function(btn) { btn.removeAttribute('data-active'); }
};

var PAINT_ON_SET_HAND = {
  true: function() { paintPrevBrush = paintActiveTool; },
  false: function() {}
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
  paintRenderToolbar();
}

function paintRenderToolbar() {
  document.querySelectorAll('[data-paint-tool]').forEach(function(btn) {
    PAINT_ACTIVE_ATTR[String(btn.getAttribute('data-paint-tool') === paintActiveTool)](btn);
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

  document.getElementById('paint-hand-btn').addEventListener('click', function() {
    paintSetTool('hand');
  });

  var panActive = false;
  var panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0;

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

  drawCanvas.addEventListener('pointerdown', function(e) {
    [PAN_START[paintActiveTool]].filter(Boolean).forEach(function(fn) { fn(e); });
  });

  drawCanvas.addEventListener('pointermove', function(e) {
    [panActive].filter(Boolean).forEach(function() {
      var dx = e.clientX - panStartX;
      var dy = e.clientY - panStartY;
      paintState = applyPaintPan(paintState, panOriginX - dx, panOriginY - dy);
      paintApplyViewport();
    });
  });

  drawCanvas.addEventListener('pointerup', function() { panActive = false; });
  drawCanvas.addEventListener('pointercancel', function() { panActive = false; });
}
