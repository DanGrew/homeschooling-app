var LEARNING_MOMENT_DURATION_MS = 4000;

var _el = null;
var _timer = null;
var _AudioCtxClass = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);

var STYLE = [
  'position:fixed;top:16px;right:16px;',
  'background:rgba(255,255,255,0.92);',
  'border-radius:16px;',
  'box-shadow:0 2px 12px rgba(0,0,0,0.15),0 0 0 2px rgba(255,220,50,0.4);',
  'padding:12px 18px;',
  'display:flex;align-items:center;gap:10px;',
  'font-size:1.1em;font-family:inherit;',
  'z-index:9200;',
  'pointer-events:none;',
  'opacity:0;transform:translateY(-8px);',
  'transition:opacity 0.25s ease,transform 0.25s ease;'
].join('');

var NARROW_MQ = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:480px)');

function _create() {
  _el = document.createElement('div');
  _el.style.cssText = STYLE;
  _el.dataset.testid = 'learning-moment';
  var icon = document.createElement('span');
  icon.dataset.testid = 'learning-moment-icon';
  icon.textContent = '\u2B50';
  icon.style.cssText = 'font-size:1.3em;flex-shrink:0;';
  var text = document.createElement('div');
  text.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
  var msg = document.createElement('span');
  msg.dataset.testid = 'learning-moment-msg';
  var activity = document.createElement('span');
  activity.dataset.testid = 'learning-moment-activity';
  activity.style.cssText = 'font-size:0.8em;color:#888;display:none;';
  text.appendChild(msg);
  text.appendChild(activity);
  _el.appendChild(icon);
  _el.appendChild(text);
  document.body.appendChild(_el);
}

function _applyPosition() {
  if (NARROW_MQ && NARROW_MQ.matches) {
    _el.style.right = '';
    _el.style.left = '50%';
    _el.style.transform = _el.style.opacity === '0' ? 'translateX(-50%) translateY(-8px)' : 'translateX(-50%) translateY(0)';
  } else {
    _el.style.left = '';
    _el.style.right = '16px';
  }
}

function _playTing() {
  if (!_AudioCtxClass) return;
  try {
    var ctx = new _AudioCtxClass();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

export function show(message, activity) {
  if (typeof document === 'undefined') return;
  if (!_el) _create();
  _el.querySelector('[data-testid="learning-moment-msg"]').textContent = message;
  var actEl = _el.querySelector('[data-testid="learning-moment-activity"]');
  if (activity) {
    actEl.textContent = 'Activity: ' + activity;
    actEl.style.display = '';
  } else {
    actEl.textContent = '';
    actEl.style.display = 'none';
  }

  if (_timer) { clearTimeout(_timer); _timer = null; }

  _applyPosition();
  _el.style.opacity = '1';
  if (NARROW_MQ && NARROW_MQ.matches) {
    _el.style.transform = 'translateX(-50%) translateY(0)';
  } else {
    _el.style.transform = 'translateY(0)';
  }

  _playTing();

  _timer = setTimeout(hide, LEARNING_MOMENT_DURATION_MS);
}

export function hide() {
  if (!_el) return;
  _el.style.opacity = '0';
  if (NARROW_MQ && NARROW_MQ.matches) {
    _el.style.transform = 'translateX(-50%) translateY(-8px)';
  } else {
    _el.style.transform = 'translateY(-8px)';
  }
  _timer = null;
}

export { LEARNING_MOMENT_DURATION_MS };
