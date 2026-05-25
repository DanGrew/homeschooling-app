var paintState = null;
var paintBgCtx = null;
var paintDrawCtx = null;

function paintApplyViewport() {
  var left = -paintState.viewport.x + 'px';
  var top = -paintState.viewport.y + 'px';
  document.getElementById('paint-bg').style.left = left;
  document.getElementById('paint-bg').style.top = top;
  document.getElementById('paint-draw').style.left = left;
  document.getElementById('paint-draw').style.top = top;
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
}
