(function() {
  var currentConfig = null;
  var currentSvg    = null;
  var originalStates = [];
  var solved = false;

  function stationToggle(id) {
    currentSvg._handleToggle(id);
    checkGoal();
  }

  function goalMet() {
    var states = currentSvg._getInputStates();
    var out = window.LogicEngine.evalGraph(currentConfig, states);
    return currentConfig.goal.every(g => out[g.id] === g.value);
  }

  function checkGoal() {
    var wasSolved = solved;
    solved = goalMet();
    if (solved && !wasSolved) {
      window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: 'PUZZLE_SOLVED' } }));
    }
  }

  function onReset() {
    currentConfig.inputs.forEach(function(inp, i) { inp.state = originalStates[i]; });
    loadPuzzle(currentConfig);
  }

  function loadPuzzle(config) {
    currentConfig = JSON.parse(JSON.stringify(config));
    solved = false;
    originalStates = currentConfig.inputs.map(i => i.state);
    var gt = document.getElementById('goal-text');
    if (gt) gt.textContent = goalText(currentConfig.goal, currentConfig.outputs);
    var area = document.getElementById('puzzle-area');
    var next = window.StationUI.buildStation(currentConfig, stationToggle);
    if (currentSvg && currentSvg.parentNode === area) {
      area.replaceChild(next, currentSvg);
    } else {
      area.innerHTML = '';
      area.appendChild(next);
    }
    currentSvg = next;
    checkGoal();
  }

  window.addEventListener('load', function() {
    currentSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var area = document.getElementById('puzzle-area');
    if (area) area.appendChild(currentSvg);
    var resetBtn = document.getElementById('btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', onReset);
  });

  window.PuzzleUI = { loadPuzzle, getConfig: function() { return currentConfig; } };
})();
