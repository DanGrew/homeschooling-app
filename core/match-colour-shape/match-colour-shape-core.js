function makeDistractors(targetCol, targetType, colours, types, rng) {
  rng = rng || Math.random;
  var pool = [];
  colours.forEach(function(c) {
    types.forEach(function(t) {
      if (c !== targetCol || t !== targetType) pool.push({ col: c, type: t });
    });
  });
  pool.sort(function() { return rng() - 0.5; });
  var colWrong = pool.filter(function(o) { return o.type === targetType; });
  var typeWrong = pool.filter(function(o) { return o.col === targetCol; });
  var guaranteed = [colWrong[0], typeWrong[0]].filter(Boolean);
  var rest = pool.filter(function(o) { return guaranteed.indexOf(o) === -1; });
  return guaranteed.concat(rest).slice(0, 5);
}

if (typeof module !== 'undefined') module.exports = { makeDistractors };
