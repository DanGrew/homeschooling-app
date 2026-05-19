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

  var NOOP = function() {};
  function dispatchSolved() { window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: 'PUZZLE_SOLVED' } })); }
  var SOLVE_DISPATCH = { 'true:true': NOOP, 'true:false': dispatchSolved, 'false:true': NOOP, 'false:false': NOOP };

  function checkGoal() {
    var wasSolved = solved;
    solved = goalMet();
    SOLVE_DISPATCH[solved + ':' + wasSolved]();
  }

  function onReset() {
    currentConfig.inputs.forEach(function(inp, i) { inp.state = originalStates[i]; });
    loadPuzzle(currentConfig);
  }

  var PLACE_SVG = {
    'true':  function(area, next) { area.replaceChild(next, currentSvg); },
    'false': function(area, next) { area.innerHTML = ''; area.appendChild(next); }
  };

  function placeSvg(area, next) { PLACE_SVG[String(area.contains(currentSvg))](area, next); }

  function loadPuzzle(config) {
    currentConfig = JSON.parse(JSON.stringify(config));
    solved = false;
    originalStates = currentConfig.inputs.map(i => i.state);
    [document.getElementById('goal-text')].filter(Boolean).forEach(function(gt) {
      gt.textContent = goalText(currentConfig.goal, currentConfig.outputs);
    });
    var area = document.getElementById('puzzle-area');
    var next = window.StationUI.buildStation(currentConfig, stationToggle);
    placeSvg(area, next);
    currentSvg = next;
    checkGoal();
  }

  window.addEventListener('load', function() {
    currentSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    [document.getElementById('puzzle-area')].filter(Boolean).forEach(function(area) { area.appendChild(currentSvg); });
    [document.getElementById('btn-reset')].filter(Boolean).forEach(function(btn) { btn.addEventListener('click', onReset); });
  });

  window.PuzzleUI = { loadPuzzle, getConfig: function() { return currentConfig; } };
})();
