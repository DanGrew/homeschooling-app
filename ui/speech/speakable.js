import { speak } from './speech-ui.js';

var DEBOUNCE_MS = 100;

export function makeSpeakable(el, text) {
  var lastFired = 0;
  el.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    var now = Date.now();
    if (now - lastFired < DEBOUNCE_MS) return;
    lastFired = now;
    speak(typeof text === 'function' ? text() : text);
    triggerFeedback(el);
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
