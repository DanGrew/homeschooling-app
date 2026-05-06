var px, py, tx, ty, bx, by, locked;

function posKey(x, y) { return x + ',' + y; }
function inBounds(x, y) { return [x, y].every(function(v) { return Math.max(0, Math.min(N - 1, v)) === v; }); }
function isObstacle(x, y) { return posKey(x, y) === posKey(bx, by); }
function isTarget(x, y) { return posKey(x, y) === posKey(tx, ty); }

function render() {
  var cellMap = {};
  [[px, py, 'player'], [tx, ty, 'target'], [bx, by, 'obstacle']].forEach(function(entry) {
    cellMap[posKey(entry[0], entry[1])] = entry[2];
  });
  var g = document.getElementById('grid');
  g.innerHTML = '';
  Array.from({ length: N * N }, function(_, i) { return [i % N, Math.floor(i / N)]; }).forEach(function(pair) {
    var col = pair[0], row = pair[1];
    var cell = document.createElement('div');
    cell.className = ['cell', cellMap[posKey(col, row)]].filter(Boolean).join(' ');
    g.appendChild(cell);
  });
}

function doMove(nx, ny) {
  px = nx; py = ny;
  render();
  [null].filter(function() { return isTarget(px, py); }).forEach(function() { locked = true; showBanner(newGame); });
}

function move(dx, dy) {
  var nx = px + dx, ny = py + dy;
  [doMove]
    .filter(function() { return !locked; })
    .filter(function() { return inBounds(nx, ny); })
    .filter(function() { return !isObstacle(nx, ny); })
    .forEach(function(f) { f(nx, ny); });
}

var KEY_MOVES = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

document.addEventListener('keydown', function(e) {
  [KEY_MOVES[e.key]].filter(Boolean).forEach(function(d) { e.preventDefault(); move(d[0], d[1]); });
});

function newGame() {
  locked = false;
  hideBanner();
  [generatePuzzle()].filter(Boolean).forEach(function(p) { px = p.px; py = p.py; tx = p.tx; ty = p.ty; bx = p.bx; by = p.by; });
  render();
}
