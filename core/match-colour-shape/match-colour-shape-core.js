function makeDistractors(targetCol, targetType, colours, types) {
  var targetKey = targetCol + '/' + targetType;
  var pool = [];
  colours.forEach(function(c) {
    types.forEach(function(t) {
      ({'true':function(){pool.push({col:c,type:t});},'false':function(){}})[String((c+'/'+t)!==targetKey)]();
    });
  });
  pool.sort(function() { return Math.random() - 0.5; });
  var colWrong = pool.filter(function(o) { return o.col !== targetCol; }).filter(function(o) { return o.type === targetType; });
  var typeWrong = pool.filter(function(o) { return o.col === targetCol; }).filter(function(o) { return o.type !== targetType; });
  var guaranteed = [colWrong[0], typeWrong[0]].filter(Boolean);
  var rest = pool.filter(function(o) { return guaranteed.indexOf(o) === -1; });
  return guaranteed.concat(rest).slice(0, 5);
}

if (typeof module !== 'undefined') module.exports = { makeDistractors };
