const OUTPUT_LABELS = { lamp: 'light', fan: 'fan' };

function goalText(goal, outputs) {
  const out = outputs.find(function(o) { return o.id === goal[0].id; });
  const device = out ? OUTPUT_LABELS[out.type] || out.type : 'output';
  return goal[0].value ? 'Turn the ' + device + ' ON' : 'Turn the ' + device + ' OFF';
}

(function() {
  var currentConfig = null;
  var currentSvg    = null;
  var originalStates = [];
  var solved = false;

  function loadPuzzle(config) {
    var puzzleArea = document.getElementById('puzzle-area');
    var goalBanner = document.getElementById('goal-text');

    currentConfig = JSON.parse(JSON.stringify(config));
    solved = false;
    originalStates = currentConfig.inputs.map(function(i) { return i.state; });
    goalBanner.textContent = goalText(currentConfig.goal, currentConfig.outputs);

    if (currentSvg) puzzleArea.removeChild(currentSvg);
    currentSvg = window.StationUI.buildStation(currentConfig, function(id) {
      currentSvg._handleToggle(id);
      checkGoal();
    });
    puzzleArea.appendChild(currentSvg);
    if (window.hideBanner) window.hideBanner();
    checkGoal();
  }

  function checkGoal() {
    if (!currentConfig || solved) return;
    var states = currentSvg._getInputStates();
    var out = window.LogicEngine.evalGraph(currentConfig, states);
    solved = currentConfig.goal.every(function(g) { return out[g.id] === g.value; });
    if (solved && window.showBanner) {
      window.showBanner(function() {
        if (window._puzzlePaginator) window._puzzlePaginator.next();
      });
    }
  }

  window.addEventListener('load', function() {
    var resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        if (!currentConfig) return;
        currentConfig.inputs.forEach(function(inp, i) { inp.state = originalStates[i]; });
        loadPuzzle(currentConfig);
      });
    }
  });

  window.PuzzleUI = { loadPuzzle: loadPuzzle };
})();
