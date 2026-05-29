function createGameLoop(simState, scenario, rState, onTick) {
  var TICK_MS = 100;
  var tickCount = 0;
  var lastTickTime = performance.now();
  var prevPositions = snapshotPositions(simState);
  var tickHandle, rafHandle;

  function tick() {
    prevPositions = snapshotPositions(simState);
    stepSimulation(simState, scenario, tickCount);
    tickCount++;
    lastTickTime = performance.now();
    [onTick].filter(Boolean).forEach(function(fn) { fn(simState); });
  }

  function frame() {
    var alpha = Math.min(1, (performance.now() - lastTickTime) / TICK_MS);
    renderFrogger(rState, simState, scenario, prevPositions, alpha);
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

  return { start: start, stop: stop };
}
