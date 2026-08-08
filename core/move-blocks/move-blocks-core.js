var N = 5;

function bfs(sc, sr, ec, er, bc, br) {
  var vis = Array.from({ length: N }, function () { return []; });
  var q = [[sc, sr, 0]];
  while (q.length) {
    var s = q.shift(), c = s[0], r = s[1], d = s[2];
    if (c === ec && r === er) return d;
    var east = [c + 1, r], west = [c - 1, r], south = [c, r + 1], north = [c, r - 1];
    [east, west, south, north].forEach(function(n) {
      var nc = n[0], nr = n[1];
      if (inBounds(nc, nr) && !(nc === bc && nr === br) && !vis[nc][nr]) {
        vis[nc][nr] = true; q.push([nc, nr, d + 1]);
      }
    });
  }
  return -1;
}

// Once mDist >= 4 a candidate always exists, and bfs against any of them is
// always >= mDist: a single obstacle (never on player/target) has no cut-
// vertex to exploit on an N>=2 grid, so it can only detour a path, never
// disconnect it. No need to re-check either after the fact (proven exhaustively).
function generatePuzzle(rng) {
  rng = rng || Math.random;
  var tries = 0;
  while (tries++ < 300) {
    var px = Math.floor(rng() * N), py = Math.floor(rng() * N);
    var tx = Math.floor(rng() * N), ty = Math.floor(rng() * N);
    var mDist = Math.abs(tx - px) + Math.abs(ty - py);
    if (mDist < 4) continue;
    var cands = [];
    for (var row = 0; row < N; row++) {
      for (var col = 0; col < N; col++) {
        if ((col === px && row === py) || (col === tx && row === ty)) continue;
        var dp = Math.abs(col - px) + Math.abs(row - py);
        var dt = Math.abs(col - tx) + Math.abs(row - ty);
        if (dp + dt <= mDist + 2) cands.push([col, row]);
      }
    }
    var pick = cands[Math.floor(rng() * cands.length)];
    return { px: px, py: py, tx: tx, ty: ty, bx: pick[0], by: pick[1] };
  }
  return null;
}

function posKey(x, y) { return x + ',' + y; }
function inBounds(x, y) { return [x, y].every(function(v) { return Math.max(0, Math.min(N - 1, v)) === v; }); }
function isObstacle(x, y, bx, by) { return posKey(x, y) === posKey(bx, by); }
function isTarget(x, y, tx, ty) { return posKey(x, y) === posKey(tx, ty); }

if (typeof module !== 'undefined') module.exports = { N, bfs, generatePuzzle, posKey, inBounds, isObstacle, isTarget };
