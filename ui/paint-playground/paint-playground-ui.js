var paintState = null;
var paintBgCtx = null;
var paintDrawCtx = null;
var paintActiveTool = 'hand';
var paintPrevBrush = null;

function paintApplyViewport() {
  var left = -paintState.viewport.x + 'px';
  var top = -paintState.viewport.y + 'px';
  document.getElementById('paint-bg').style.left = left;
  document.getElementById('paint-bg').style.top = top;
  document.getElementById('paint-draw').style.left = left;
  document.getElementById('paint-draw').style.top = top;
}

function paintSetTool(tool) {
  if (tool === 'hand') {
    if (paintActiveTool !== 'hand') paintPrevBrush = paintActiveTool;
  } else {
    paintPrevBrush = null;
  }
  paintActiveTool = tool;
  paintRenderToolbar();
}

function paintRenderToolbar() {
  document.querySelectorAll('[data-paint-tool]').forEach(function(btn) {
    if (btn.getAttribute('data-paint-tool') === paintActiveTool) {
      btn.setAttribute('data-active', '');
    } else {
      btn.removeAttribute('data-active');
    }
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

  drawCanvas.addEventListener('pointerdown', function(e) {
    if (paintActiveTool !== 'hand') return;
    drawCanvas.setPointerCapture(e.pointerId);
    panActive = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panOriginX = paintState.viewport.x;
    panOriginY = paintState.viewport.y;
  });

  drawCanvas.addEventListener('pointermove', function(e) {
    if (!panActive) return;
    var dx = e.clientX - panStartX;
    var dy = e.clientY - panStartY;
    paintState = applyPaintPan(paintState, panOriginX - dx, panOriginY - dy);
    paintApplyViewport();
  });

  drawCanvas.addEventListener('pointerup', function() { panActive = false; });
  drawCanvas.addEventListener('pointercancel', function() { panActive = false; });
}
