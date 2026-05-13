const OUTPUT_LABELS = { lamp: 'light', fan: 'fan', fountain: 'fountain' };

function goalText(goal, outputs) {
  const out = outputs.find(function(o) { return o.id === goal[0].id; });
  const device = out ? OUTPUT_LABELS[out.type] || out.type : 'output';
  return goal[0].value ? 'Turn the ' + device + ' ON' : 'Turn the ' + device + ' OFF';
}

function init() {
  const puzzleArea  = document.getElementById('puzzle-area');
  const goalBanner  = document.getElementById('goal-text');
  const puzzleNum   = document.getElementById('puzzle-num');
  const resetBtn    = document.getElementById('btn-reset');
  const successOver = document.getElementById('success-overlay');
  const newPuzzleBtn = document.getElementById('btn-new-puzzle');
  const successNextBtn = document.getElementById('btn-next-success');

  let puzzles = [];
  let puzzleIndex = 0;
  let currentConfig = null;
  let currentSvg    = null;
  let originalStates = [];

  function loadPuzzle(config) {
    currentConfig = config;
    originalStates = config.inputs.map(function(i) { return i.state; });
    goalBanner.textContent = goalText(config.goal, config.outputs);

    if (currentSvg) puzzleArea.removeChild(currentSvg);
    currentSvg = window.StationUI.buildStation(config, function(id) {
      currentSvg._handleToggle(id);
      checkGoal();
    });
    puzzleArea.appendChild(currentSvg);
    successOver.style.display = 'none';
    checkGoal();
  }

  function checkGoal() {
    if (!currentConfig) return;
    const states = currentSvg._getInputStates();
    const out = window.LogicEngine.evalGraph(currentConfig, states);
    const solved = currentConfig.goal.every(function(g) { return out[g.id] === g.value; });
    if (solved) successOver.style.display = 'flex';
  }

  function loadNext() {
    if (!puzzles.length) return;
    const num = puzzleIndex + 1;
    const config = JSON.parse(JSON.stringify(puzzles[puzzleIndex]));
    puzzleIndex = (puzzleIndex + 1) % puzzles.length;
    if (puzzleNum) puzzleNum.textContent = num + ' / ' + puzzles.length;
    loadPuzzle(config);
  }

  resetBtn.addEventListener('click', function() {
    if (!currentConfig) return;
    currentConfig.inputs.forEach(function(inp, i) { inp.state = originalStates[i]; });
    loadPuzzle(currentConfig);
  });

  newPuzzleBtn.addEventListener('click', loadNext);
  if (successNextBtn) successNextBtn.addEventListener('click', loadNext);

  fetch('../../../content/logic-gates/puzzles.json?v=1')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      puzzles = data;
      loadNext();
    })
    .catch(function(err) {
      goalBanner.textContent = 'Failed to load puzzles';
      console.error('puzzle load error:', err);
    });
}

window.addEventListener('load', init);
