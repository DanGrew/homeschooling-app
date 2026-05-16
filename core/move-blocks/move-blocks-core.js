var N = 5;

function bfs(sc, sr, ec, er, bc, br) {
  var vis = {}, q = [[sc, sr, 0]];
  vis[sc + ',' + sr] = 1;
  while (q.length) {
    var s = q.shift(), c = s[0], r = s[1], d = s[2];
    if (c === ec && r === er) return d;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(dir) {
      var nc = c + dir[0], nr = r + dir[1], k = nc + ',' + nr;
      if (nc >= 0 && nc < N && nr >= 0 && nr < N && !(nc === bc && nr === br) && !vis[k]) {
        vis[k] = 1; q.push([nc, nr, d + 1]);
      }
    });
  }
  return -1;
}

function generatePuzzle(rng) {
  rng = rng || Math.random;
  var tries = 0;
  while (tries++ < 300) {
    var px = Math.floor(rng() * N), py = Math.floor(rng() * N);
    var tx = Math.floor(rng() * N), ty = Math.floor(rng() * N);
    if (tx === px && ty === py) continue;
    var mDist = Math.abs(tx - px) + Math.abs(ty - py);
    if (mDist < 4) continue;
    var cands = [];
    for (var row = 0; row < N; row++) {
      for (var col = 0; col < N; col++) {
        if ((col === px && row === py) || (col === tx && row === ty)) continue;
        var dp = Math.abs(col - px) + Math.abs(row - py);
        var dt = Math.abs(col - tx) + Math.abs(row - ty);
        if (dp >= 1 && dt >= 1 && dp + dt <= mDist + 2) cands.push([col, row]);
      }
    }
    if (!cands.length) continue;
    var pick = cands[Math.floor(rng() * cands.length)];
    var bx = pick[0], by = pick[1];
    if (bfs(px, py, tx, ty, bx, by) >= 4) return { px: px, py: py, tx: tx, ty: ty, bx: bx, by: by };
  }
  return null;
}

function posKey(x, y) { return x + ',' + y; }
function inBounds(x, y) { return [x, y].every(function(v) { return Math.max(0, Math.min(N - 1, v)) === v; }); }
function isObstacle(x, y, bx, by) { return posKey(x, y) === posKey(bx, by); }
function isTarget(x, y, tx, ty) { return posKey(x, y) === posKey(tx, ty); }

if (typeof module !== 'undefined') module.exports = { N, bfs, generatePuzzle, posKey, inBounds, isObstacle, isTarget };
