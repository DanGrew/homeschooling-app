function createGameLoop(simState, scenario, rState, onTick) {
  var TICK_MS = 100;
  var tickCount = 0;
  var lastTickTime = performance.now();
  var lastFrameTime = performance.now();
  var prevPositions = snapshotPositions(simState);
  var tickHandle, rafHandle;
  var pendingInput = null;

  function tick() {
    prevPositions = snapshotPositions(simState);
    [pendingInput].filter(Boolean).forEach(function(dir) { applyInput(simState, scenario, dir); });
    pendingInput = null;
    stepSimulation(simState, scenario, tickCount);
    tickCount++;
    lastTickTime = performance.now();
    [onTick].filter(Boolean).forEach(function(fn) { fn(simState); });
  }

  function frame(timestamp) {
    var dt = Math.min(timestamp - lastFrameTime, 50);
    lastFrameTime = timestamp;
    var alpha = Math.min(1, (performance.now() - lastTickTime) / TICK_MS);
    renderFrogger(rState, simState, scenario, prevPositions, alpha, dt);
    rafHandle = requestAnimationFrame(frame);
  }

  function start() {
    tickHandle = setInterval(tick, TICK_MS);
    rafHandle = requestAnimationFrame(frame);
  }

  function stop() {
    clearInterval(tickHandle);
    cancelAnimationFrame(rafHandle);
  }

  function queueInput(dir) { pendingInput = dir; }

  return { start: start, stop: stop, queueInput: queueInput };
}
