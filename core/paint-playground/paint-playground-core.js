var PAINT_WORLD_SCALE = 4;

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

if (typeof module !== 'undefined') module.exports = { PAINT_WORLD_SCALE, initPaintState, applyPaintPan };
