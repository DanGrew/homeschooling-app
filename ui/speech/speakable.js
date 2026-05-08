import { speak } from './speech-ui.js';

var DEBOUNCE_MS = 100;
var RESOLVE_TEXT = { 'function': t => t, 'string': t => () => t };
var FIRE = {
  'true':  (getText, el, setLast) => { setLast(); speak(getText()); triggerFeedback(el); },
  'false': () => {}
};

export function makeSpeakable(el, text) {
  el.classList.add('speakable');
  var getText = RESOLVE_TEXT[typeof text](text);
  var lastFired = 0;
  el.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    var now = Date.now();
    FIRE[String(now - lastFired >= DEBOUNCE_MS)](getText, el, () => { lastFired = now; });
  });
}

export function makeSpeakableButton(text) {
  var btn = document.createElement('button');
  btn.textContent = text;
  makeSpeakable(btn, text);
  return btn;
}

function triggerFeedback(el) {
  el.classList.remove('speakable--tap');
  void el.offsetWidth;
  el.classList.add('speakable--tap');
  el.addEventListener('animationend', function handler() {
    el.classList.remove('speakable--tap');
    el.removeEventListener('animationend', handler);
  });
}
