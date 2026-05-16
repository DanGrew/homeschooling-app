var current, locked;

function makeDistractors(targetCol, targetType) {
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

function newRound() {
  locked = false;
  var col = pickCol();
  var type = types[Math.floor(Math.random() * types.length)];
  current = {col: col, type: type};
  document.getElementById('shape').innerHTML = svg(type, col);
  var distractors = makeDistractors(col, type);
  var options = [current].concat(distractors).sort(function() { return Math.random() - 0.5; });
  document.getElementById('options').innerHTML = options.map(function(o) {
    return '<button data-col="' + o.col + '" data-type="' + o.type + '" data-no-speak style="background:none;border:4px solid rgba(0,0,0,0.08);border-radius:18px;padding:8px;cursor:pointer;touch-action:manipulation;-webkit-touch-callout:none;user-select:none;">' + svg(o.type, o.col, 'clamp(60px,13vmin,96px)') + '</button>';
  }).join('');
}

var CHECK_RESULT = {
  'true': function(btn) { locked = true; btn.classList.add('feedback-correct'); showBanner(newRound); },
  'false': function(btn) { btn.classList.add('feedback-wrong'); setTimeout(function() { btn.classList.remove('feedback-wrong'); }, 500); }
};

function doCheck(btn) {
  var isCorrect = (btn.dataset.col + '/' + btn.dataset.type) === (current.col + '/' + current.type);
  CHECK_RESULT[String(isCorrect)](btn);
}

function check(btn) {
  [doCheck].filter(function() { return !locked; }).forEach(function(f) { f(btn); });
}

document.getElementById('options').addEventListener('click', function(e) {
  [e.target.closest('button')].filter(Boolean).forEach(function(btn) { check(btn); });
});

newRound();
