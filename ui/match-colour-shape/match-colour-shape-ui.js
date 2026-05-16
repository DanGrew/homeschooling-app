var current, locked;

function newRound() {
  locked = false;
  var col = pickCol();
  var type = types[Math.floor(Math.random() * types.length)];
  current = {col: col, type: type};
  document.getElementById('shape').innerHTML = svg(type, col);
  var distractors = makeDistractors(col, type, colours, types);
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
