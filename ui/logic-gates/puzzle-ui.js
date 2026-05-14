const OUTPUT_LABELS = { lamp: 'light', fan: 'fan', fountain: 'fountain' };
const GOAL_SUFFIX = ['OFF', 'ON'];

function goalText(goal, outputs) {
  const out = outputs.find(o => o.id === goal[0].id);
  return 'Turn the ' + OUTPUT_LABELS[out.type] + ' ' + GOAL_SUFFIX[+goal[0].value];
}

(function() {
  var currentConfig = null;
  var currentSvg    = null;
  var originalStates = [];
  var solved = false;
  var onSolvedFn = function() {};

  function noop() {}
  function notifySolved() { onSolvedFn = noop; }

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
    solved = goalMet();
    [noop, onSolvedFn][+solved]();
  }

  function restoreState(inp, i) { inp.state = originalStates[i]; }

  function onReset() {
    currentConfig.inputs.forEach(restoreState);
    loadPuzzle(currentConfig);
  }

  function loadPuzzle(config) {
    onSolvedFn = notifySolved;
    currentConfig = JSON.parse(JSON.stringify(config));
    solved = false;
    originalStates = currentConfig.inputs.map(i => i.state);
    document.getElementById('goal-text').textContent = goalText(currentConfig.goal, currentConfig.outputs);
    var next = window.StationUI.buildStation(currentConfig, stationToggle);
    document.getElementById('puzzle-area').replaceChild(next, currentSvg);
    currentSvg = next;
    checkGoal();
  }

  window.addEventListener('load', function() {
    currentSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.getElementById('puzzle-area').appendChild(currentSvg);
    document.getElementById('btn-reset').addEventListener('click', onReset);
  });

  window.PuzzleUI = { loadPuzzle, getConfig: function() { return currentConfig; } };
})();
