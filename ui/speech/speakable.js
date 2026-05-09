import { speak } from './speech-ui.js';

var DEBOUNCE_MS = 100;
var RESOLVE_TEXT = { 'function': t => t, 'string': t => () => t };
var FIRE = {
  'true':  (onTap, el, setLast) => { setLast(); onTap(); triggerFeedback(el); },
  'false': () => {}
};

function ensureSvgGlowFilter(svg) {
  [1].filter(() => !svg.querySelector('#speakable-glow')).forEach(() => {
    var NS = 'http://www.w3.org/2000/svg';
    var defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
    var filt = document.createElementNS(NS, 'filter');
    filt.id = 'speakable-glow';
    filt.setAttribute('x', '-50%'); filt.setAttribute('y', '-50%');
    filt.setAttribute('width', '200%'); filt.setAttribute('height', '200%');
    var fds = document.createElementNS(NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '4');
    fds.setAttribute('flood-color', 'rgb(150,80,220)');
    fds.setAttribute('flood-opacity', '0.5');
    filt.appendChild(fds); defs.appendChild(filt);
  });
}

export function makeInteractive(el, onTap) {
  el.classList.add('speakable');
  [el.ownerSVGElement].filter(Boolean).forEach(svg => {
    ensureSvgGlowFilter(svg);
    el.setAttribute('filter', 'url(#speakable-glow)');
    el.classList.remove('speakable');
  });
  var lastFired = 0;
  el.addEventListener('click', function(e) {
    var now = Date.now();
    FIRE[String(now - lastFired >= DEBOUNCE_MS)](onTap, el, () => { lastFired = now; });
  });
}

export function makeSpeakable(el, text) {
  var getText = RESOLVE_TEXT[typeof text](text);
  makeInteractive(el, () => speak(getText()));
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
