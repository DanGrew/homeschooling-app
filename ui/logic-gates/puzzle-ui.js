const OUTPUT_LABELS = { lamp: 'light', fan: 'fan', fountain: 'fountain' };

function goalText(goal, outputs) {
  const out = outputs.find(function(o) { return o.id === goal[0].id; });
  const device = out ? OUTPUT_LABELS[out.type] || out.type : 'output';
  return goal[0].value ? 'Turn the ' + device + ' ON' : 'Turn the ' + device + ' OFF';
}

function init() {
  const puzzleArea  = document.getElementById('puzzle-area');
  const goalBanner  = document.getElementById('goal-text');
  const resetBtn    = document.getElementById('btn-reset');
  const successOver = document.getElementById('success-overlay');
  const newPuzzleBtn = document.getElementById('btn-new-puzzle');

  let currentConfig = null;
  let currentSvg    = null;

  function loadPuzzle(config) {
    currentConfig = config;
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

  function loadNewPuzzle() {
    fetch('../../../content/logic-gates/templates.json')
      .then(function(r) { return r.json(); })
      .then(function(templates) {
        const config = window.PuzzleGenerator.generate(templates);
        if (config) {
          loadPuzzle(config);
        } else {
          goalBanner.textContent = 'Could not generate puzzle — try again';
        }
      });
  }

  resetBtn.addEventListener('click', function() {
    if (!currentConfig) return;
    currentConfig.inputs.forEach(function(i) { i.state = false; });
    loadPuzzle(currentConfig);
  });

  newPuzzleBtn.addEventListener('click', loadNewPuzzle);

  loadNewPuzzle();
}

window.addEventListener('load', init);
