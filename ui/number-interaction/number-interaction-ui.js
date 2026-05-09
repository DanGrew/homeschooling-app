import { speak } from '../speech/speech-ui.js';
import { makeSpeakable, makeInteractive } from '../speech/speakable.js';
import { bestVoice } from '../../core/word-lesson/word-lesson-core.js';
import { comparisonColor, clamp } from '../../core/number-interaction/number-interaction-core.js';

const SZ = 'width:min(62px,8vw);height:min(62px,8vw)';
const SZ_SM = 'width:min(48px,6.2vw);height:min(48px,6.2vw)';

let aCount = 0, bCount = 0, aKey = '', bKey = '', MAX = 10, counting = false;

export function init(a, b, max) {
  aKey = a; bKey = b; MAX = max;
  var numA = document.getElementById('num-a');
  var numB = document.getElementById('num-b');
  var numTotal = document.getElementById('num-total');
  var instruction = document.getElementById('ni-instruction');
  instruction.style.cursor = 'pointer';
  makeSpeakable(instruction, 'Use the plus and minus buttons to change each group. See how the total changes!');
  makeSpeakable(document.getElementById('lbl-a'), 'A');
  makeSpeakable(document.getElementById('lbl-b'), 'B');
  makeSpeakable(document.getElementById('lbl-total'), 'Total');
  makeInteractive(document.getElementById('btn-a-plus'),  () => { speak('plus');  change('a',  1); });
  makeInteractive(document.getElementById('btn-a-minus'), () => { speak('minus'); change('a', -1); });
  makeInteractive(document.getElementById('btn-b-plus'),  () => { speak('plus');  change('b',  1); });
  makeInteractive(document.getElementById('btn-b-minus'), () => { speak('minus'); change('b', -1); });
  numA.style.cursor = 'pointer';
  numB.style.cursor = 'pointer';
  numTotal.style.cursor = 'pointer';
  makeInteractive(numA, () => { speak(String(aCount)); setTimeout(() => flashAll('objects-a'), 100); });
  makeInteractive(numB, () => { speak(String(bCount)); setTimeout(() => flashAll('objects-b'), 100); });
  makeInteractive(numTotal, countAll);
  render();
}

export function makeImg(item, sz) {
  return `<img src="${item.url}" style="${sz};transition:transform 0.15s,filter 0.15s;" draggable="false">`;
}

function makeImgEl(item, sz) {
  var img = document.createElement('img');
  img.src = item.url;
  img.alt = item.name;
  img.style.cssText = sz + ';transition:transform 0.15s,filter 0.15s;';
  img.draggable = false;
  makeSpeakable(img, item.name);
  return img;
}

export function render() {
  var aContainer = document.getElementById('objects-a');
  var bContainer = document.getElementById('objects-b');
  aContainer.innerHTML = '';
  bContainer.innerHTML = '';
  Array.from({length: aCount}, () => { aContainer.appendChild(makeImgEl(aKey, SZ)); });
  Array.from({length: bCount}, () => { bContainer.appendChild(makeImgEl(bKey, SZ)); });
  var totalContainer = document.getElementById('objects-total');
  totalContainer.innerHTML = '';
  Array.from({length: aCount}, () => { totalContainer.appendChild(makeImgEl(aKey, SZ_SM)); });
  Array.from({length: bCount}, () => { totalContainer.appendChild(makeImgEl(bKey, SZ_SM)); });
  document.getElementById('num-a').textContent = aCount;
  document.getElementById('num-b').textContent = bCount;
  document.getElementById('num-total').textContent = aCount + bCount;
  aContainer.style.borderColor = comparisonColor(aCount, bCount);
  bContainer.style.borderColor = comparisonColor(bCount, aCount);
}

export function flashAll(containerId) {
  const imgs = document.querySelectorAll(`#${containerId} img`);
  imgs.forEach(img => { img.classList.add('speakable--flash'); });
  setTimeout(() => imgs.forEach(img => { img.classList.remove('speakable--flash'); }), 400);
}

function stopCounting() {
  counting = false;
  speechSynthesis.cancel();
  document.querySelectorAll('#objects-total img').forEach(img => { img.classList.remove('speakable--highlight'); });
}

export function change(side, delta) {
  stopCounting();
  ({a: () => { aCount = clamp(aCount + delta, 0, MAX); }, b: () => { bCount = clamp(bCount + delta, 0, MAX); }})[side]();
  render();
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
  imgs.forEach(img => { img.classList.remove('speakable--highlight'); });
  Array.from(imgs).slice(idx, idx + 1).forEach(img => { img.classList.add('speakable--highlight'); });
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
