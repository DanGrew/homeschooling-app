var current, locked;
var DO_SPEAK = { 'true': function(btn, text) { window.__makeSpeakable(btn, text); }, 'false': function() {} };

function newRound() {
  locked = false;
  var col = pickCol();
  var type = types[Math.floor(Math.random() * types.length)];
  current = {col: col, type: type};
  document.getElementById('shape').innerHTML = svg(type, col);
  var distractors = makeDistractors(col, type, colours, types);
  var options = [current].concat(distractors).sort(function() { return Math.random() - 0.5; });
  var optContainer = document.getElementById('options');
  optContainer.innerHTML = '';
  options.forEach(function(o) {
    var btn = document.createElement('button');
    btn.dataset.col = o.col;
    btn.dataset.type = o.type;
    btn.style.cssText = 'background:none;border:4px solid rgba(0,0,0,0.08);border-radius:18px;padding:8px;cursor:pointer;touch-action:manipulation;-webkit-touch-callout:none;user-select:none;';
    btn.innerHTML = svg(o.type, o.col, 'clamp(60px,13vmin,96px)');
    DO_SPEAK[String(typeof window.__makeSpeakable === 'function')](btn, colourNames[o.col] + ' ' + o.type);
    optContainer.appendChild(btn);
  });
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
window.addEventListener('load', function() {
  document.querySelectorAll('#options button:not(.speakable)').forEach(function(btn) {
    DO_SPEAK[String(typeof window.__makeSpeakable === 'function')](btn, colourNames[btn.dataset.col] + ' ' + btn.dataset.type);
  });
});
