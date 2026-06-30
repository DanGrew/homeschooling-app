import { speak } from '../../components/speech/speech-ui.js';
import { getVoice } from '../../components/speech/voice-service.js';
import { makeInteractive } from '../../components/speech/speakable.js';
import { comparisonColor, clamp, makeImg, labelState, computeChange } from '../../core/number-interaction/number-interaction-core.js';

const FRAME_CELL = 'min(52px,6.4vw)';
const FRAME_CELL_SM = 'min(40px,5vw)';
const IMG_FILL = 'width:82%;height:82%;object-fit:contain';
const CELL_STYLE = {
  'true': 'border:2px solid #E3E3E3;background:#FFF;',
  'false': 'border:2px dashed #D2D2D2;'
};

let aCount = 0, bCount = 0, aKey = '', bKey = '', MAX = 10, counting = false;

function stopAndSpeak(wasCounting, doSpeak) {
  var wasSpeaking = [speechSynthesis.speaking].filter(() => !wasCounting)[0];
  [1].filter(() => wasSpeaking).forEach(() => speechSynthesis.cancel());
  var needsDelay = [wasCounting, wasSpeaking].some(Boolean);
  ({true: () => setTimeout(doSpeak, 50), false: doSpeak})[String(needsDelay)]();
}

export function init(a, b, max) {
  aKey = a; bKey = b; MAX = max;
  var numA = document.getElementById('num-a');
  var numB = document.getElementById('num-b');
  var numTotal = document.getElementById('num-total');
  var instruction = document.getElementById('ni-instruction');
  instruction.style.cursor = 'pointer';
  makeInteractive(instruction, () => stopAndSpeak(stopCounting(), () => speak('Use the plus and minus buttons to change each group. See how the total changes!')));
  var lblA = document.getElementById('lbl-a');
  var lblB = document.getElementById('lbl-b');
  makeInteractive(lblA, () => { var t=lblA.textContent; [t].filter(Boolean).forEach(() => stopAndSpeak(stopCounting(), () => speak(t))); });
  makeInteractive(lblB, () => { var t=lblB.textContent; [t].filter(Boolean).forEach(() => stopAndSpeak(stopCounting(), () => speak(t))); });
  makeInteractive(document.getElementById('lbl-total'), () => stopAndSpeak(stopCounting(), () => speak('Total')));
  makeInteractive(document.getElementById('btn-a-plus'),  () => change('a',  1, (wc) => stopAndSpeak(wc, () => speak('plus'))));
  makeInteractive(document.getElementById('btn-a-minus'), () => change('a', -1, (wc) => stopAndSpeak(wc, () => speak('minus'))));
  makeInteractive(document.getElementById('btn-b-plus'),  () => change('b',  1, (wc) => stopAndSpeak(wc, () => speak('plus'))));
  makeInteractive(document.getElementById('btn-b-minus'), () => change('b', -1, (wc) => stopAndSpeak(wc, () => speak('minus'))));
  numA.style.cursor = 'pointer';
  numB.style.cursor = 'pointer';
  numTotal.style.cursor = 'pointer';
  makeInteractive(numA,     () => stopAndSpeak(stopCounting(), () => { speak(String(aCount)); setTimeout(() => flashAll('objects-a'), 100); }));
  makeInteractive(numB,     () => stopAndSpeak(stopCounting(), () => { speak(String(bCount)); setTimeout(() => flashAll('objects-b'), 100); }));
  makeInteractive(numTotal, () => stopAndSpeak(stopCounting(), countAll));
  render();
}

function makeImgEl(item, sz) {
  var img = document.createElement('img');
  img.src = item.url;
  img.alt = item.name;
  img.style.cssText = sz + ';transition:transform 0.15s,filter 0.15s;';
  img.draggable = false;
  makeInteractive(img, () => stopAndSpeak(stopCounting(), () => speak(item.name)));
  return img;
}

function frameCell(filled) {
  var c = document.createElement('div');
  c.style.cssText = 'box-sizing:border-box;display:flex;align-items:center;justify-content:center;border-radius:8px;width:100%;height:100%;' + CELL_STYLE[String(filled)];
  return c;
}

function renderFrames(container, flat, capacity, cellSz) {
  container.innerHTML = '';
  var wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:center;';
  Array.from({length: capacity / 10}, (_, f) => {
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,' + cellSz + ');grid-template-rows:repeat(2,' + cellSz + ');gap:5px;';
    Array.from({length: 10}, (_, j) => {
      var key = flat[f * 10 + j];
      var c = frameCell(!!key);
      [key].filter(Boolean).forEach(k => c.appendChild(makeImgEl(k, IMG_FILL)));
      grid.appendChild(c);
    });
    wrap.appendChild(grid);
  });
  container.appendChild(wrap);
}

var LABEL_TEXT = { empty: '', same: 'same', bigger: 'bigger', smaller: 'smaller' };
export function render() {
  var aContainer = document.getElementById('objects-a');
  var bContainer = document.getElementById('objects-b');
  renderFrames(aContainer, Array.from({length: aCount}, () => aKey), 10, FRAME_CELL);
  renderFrames(bContainer, Array.from({length: bCount}, () => bKey), 10, FRAME_CELL);
  var totalFlat = [].concat(Array.from({length: aCount}, () => aKey), Array.from({length: bCount}, () => bKey));
  renderFrames(document.getElementById('objects-total'), totalFlat, 20, FRAME_CELL_SM);
  document.getElementById('num-a').textContent = aCount;
  document.getElementById('num-b').textContent = bCount;
  document.getElementById('num-total').textContent = aCount + bCount;
  aContainer.style.borderColor = comparisonColor(aCount, bCount);
  bContainer.style.borderColor = comparisonColor(bCount, aCount);
  document.getElementById('lbl-a').textContent = LABEL_TEXT[labelState(aCount, bCount)];
  document.getElementById('lbl-b').textContent = LABEL_TEXT[labelState(bCount, aCount)];
}

export function flashAll(containerId) {
  const imgs = document.querySelectorAll(`#${containerId} img`);
  imgs.forEach(img => { img.classList.add('speakable--flash'); });
  setTimeout(() => imgs.forEach(img => { img.classList.remove('speakable--flash'); }), 400);
}

function stopCounting() {
  var was = counting;
  [1].filter(() => was).forEach(() => {
    counting = false;
    speechSynthesis.cancel();
    document.querySelectorAll('#objects-total img').forEach(img => img.classList.remove('speakable--highlight'));
  });
  return was;
}

export function change(side, delta, onChanged) {
  var wasCounting = stopCounting();
  var result = computeChange(side, delta, aCount, bCount, MAX);
  aCount = result.newA;
  bCount = result.newB;
  render();
  [1].filter(() => result.changed).forEach(() => {
    [onChanged].filter(Boolean).forEach(function(cb) { cb(wasCounting); });
  });
}

function countSpeak(text, onDone) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = 1.0; u.pitch = 1.1;
  [getVoice()].filter(Boolean).forEach(v => { u.voice = v; });
  u.onend = () => { [1].filter(() => counting).forEach(() => setTimeout(onDone, 200)); };
  speechSynthesis.resume();
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
