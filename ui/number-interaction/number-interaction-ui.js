// arch: allow-complexity
// change: routes delta to aCount or bCount by side — unavoidable dispatch between two independent counters
// sayIt: selects count by side — parallel counter structure requires branch
// countSpeak: voice assignment conditional on availability — browser SpeechSynthesis API constraint
// countAll: zero-guard + sequential loop with termination check — speech timing lifecycle, not moveable to core
// highlight: bounds check before DOM mutation — prevents invalid index access

import { speak } from '../speech/speech-ui.js';
import { bestVoice } from '../../core/word-lesson/word-lesson-core.js';
import { comparisonColor, clamp } from '../../core/number-interaction/number-interaction-core.js';

const SZ = 'width:min(62px,8vw);height:min(62px,8vw)';
const SZ_SM = 'width:min(48px,6.2vw);height:min(48px,6.2vw)';

let aCount = 0, bCount = 0, aKey = '', bKey = '', MAX = 10, counting = false;

export function init(a, b, max) {
  aKey = a; bKey = b; MAX = max;
  render();
}

export function makeImg(name, sz) {
  return `<img src="../../dictionary/entries/${name}/${name}.svg" style="${sz};transition:transform 0.15s,filter 0.15s;" draggable="false">`;
}

export function render() {
  const aFruits = Array.from({length: aCount}, () => makeImg(aKey, SZ)).join('');
  const bFruits = Array.from({length: bCount}, () => makeImg(bKey, SZ)).join('');
  document.getElementById('objects-a').innerHTML = aFruits;
  document.getElementById('objects-b').innerHTML = bFruits;
  document.getElementById('objects-total').innerHTML =
    Array.from({length: aCount}, () => makeImg(aKey, SZ_SM)).join('') +
    Array.from({length: bCount}, () => makeImg(bKey, SZ_SM)).join('');
  document.getElementById('num-a').textContent = aCount;
  document.getElementById('num-b').textContent = bCount;
  document.getElementById('num-total').textContent = aCount + bCount;
  document.getElementById('objects-a').style.borderColor = comparisonColor(aCount, bCount);
  document.getElementById('objects-b').style.borderColor = comparisonColor(bCount, aCount);
}

export function flashAll(containerId) {
  const imgs = document.querySelectorAll(`#${containerId} img`);
  imgs.forEach(img => { img.style.transform = 'scale(1.25)'; img.style.filter = 'drop-shadow(0 0 8px gold)'; });
  setTimeout(() => imgs.forEach(img => { img.style.transform = ''; img.style.filter = ''; }), 400);
}

function stopCounting() {
  counting = false;
  speechSynthesis.cancel();
  document.querySelectorAll('#objects-total img').forEach(img => { img.style.transform = ''; img.style.filter = ''; });
}

export function change(side, delta) {
  stopCounting();
  if (side === 'a') aCount = clamp(aCount + delta, 0, MAX);
  else bCount = clamp(bCount + delta, 0, MAX);
  render();
}

export function sayIt(side) {
  stopCounting();
  speak(String(side === 'a' ? aCount : bCount));
  setTimeout(() => flashAll('objects-' + side), 100);
}

function countSpeak(text, onDone) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0;
  u.pitch = 1.1;
  const v = bestVoice(speechSynthesis.getVoices());
  if (v) u.voice = v;
  u.onend = () => setTimeout(onDone, 200);
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export function countAll() {
  if (counting) return;
  const total = aCount + bCount;
  if (total === 0) { speak('zero'); return; }
  counting = true;
  let i = 0;
  const imgs = document.querySelectorAll('#objects-total img');
  function highlight(idx) {
    imgs.forEach(img => { img.style.transform = ''; img.style.filter = ''; });
    if (idx >= 0 && idx < imgs.length) { imgs[idx].style.transform = 'scale(1.3)'; imgs[idx].style.filter = 'drop-shadow(0 0 10px gold)'; }
  }
  (function next() {
    if (i >= total) { highlight(-1); counting = false; return; }
    highlight(i);
    countSpeak(String(i + 1), () => { i++; next(); });
  })();
}
