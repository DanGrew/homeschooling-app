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

export function makeImg(item, sz) {
  return `<img src="${item.url}" style="${sz};transition:transform 0.15s,filter 0.15s;" draggable="false">`;
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
  ({a: () => { aCount = clamp(aCount + delta, 0, MAX); }, b: () => { bCount = clamp(bCount + delta, 0, MAX); }})[side]();
  render();
}

export function sayIt(side) {
  stopCounting();
  speak(String(({a: () => aCount, b: () => bCount})[side]()));
  setTimeout(() => flashAll('objects-' + side), 100);
}

function countSpeak(text, onDone) {
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0;
  u.pitch = 1.1;
  [bestVoice(speechSynthesis.getVoices())].filter(Boolean).forEach(v => { u.voice = v; });
  u.onend = () => setTimeout(onDone, 200);
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function highlight(idx, imgs) {
  imgs.forEach(img => { img.style.transform = ''; img.style.filter = ''; });
  Array.from(imgs).slice(idx, idx + 1).forEach(img => { img.style.transform = 'scale(1.3)'; img.style.filter = 'drop-shadow(0 0 10px gold)'; });
}

export function countAll() {
  [1].filter(() => !counting).forEach(() => {
    const total = aCount + bCount;
    [total].filter(t => t === 0).forEach(() => speak('zero'));
    [total].filter(t => t > 0).forEach(() => {
      counting = true;
      let i = 0;
      const steps = [...Array.from({length: total}, (_, idx) => idx), -1];
      const imgs = document.querySelectorAll('#objects-total img');
      (function next() {
        const idx = steps[i++];
        highlight(idx, imgs);
        [countSpeak].filter(() => idx >= 0).forEach(fn => fn(String(idx + 1), next));
        [1].filter(() => idx < 0).forEach(() => { counting = false; });
      })();
    });
  });
}
