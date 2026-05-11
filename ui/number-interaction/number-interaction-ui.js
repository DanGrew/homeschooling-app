import { speak } from '../speech/speech-ui.js';
import { getVoice } from '../speech/voice-service.js';
import { makeInteractive } from '../speech/speakable.js';
import { comparisonColor, clamp } from '../../core/number-interaction/number-interaction-core.js';

const SZ = 'width:min(62px,8vw);height:min(62px,8vw)';
const SZ_SM = 'width:min(48px,6.2vw);height:min(48px,6.2vw)';

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
  makeInteractive(document.getElementById('btn-a-plus'),  () => { var r=change('a',  1); [r].filter(x=>x.changed).forEach(()=>stopAndSpeak(r.wasCounting,()=>speak('plus'))); });
  makeInteractive(document.getElementById('btn-a-minus'), () => { var r=change('a', -1); [r].filter(x=>x.changed).forEach(()=>stopAndSpeak(r.wasCounting,()=>speak('minus'))); });
  makeInteractive(document.getElementById('btn-b-plus'),  () => { var r=change('b',  1); [r].filter(x=>x.changed).forEach(()=>stopAndSpeak(r.wasCounting,()=>speak('plus'))); });
  makeInteractive(document.getElementById('btn-b-minus'), () => { var r=change('b', -1); [r].filter(x=>x.changed).forEach(()=>stopAndSpeak(r.wasCounting,()=>speak('minus'))); });
  numA.style.cursor = 'pointer';
  numB.style.cursor = 'pointer';
  numTotal.style.cursor = 'pointer';
  makeInteractive(numA,     () => stopAndSpeak(stopCounting(), () => { speak(String(aCount)); setTimeout(() => flashAll('objects-a'), 100); }));
  makeInteractive(numB,     () => stopAndSpeak(stopCounting(), () => { speak(String(bCount)); setTimeout(() => flashAll('objects-b'), 100); }));
  makeInteractive(numTotal, () => stopAndSpeak(stopCounting(), countAll));
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
  makeInteractive(img, () => stopAndSpeak(stopCounting(), () => speak(item.name)));
  return img;
}

var LABEL_TEXT = { empty: '', same: 'same', bigger: 'bigger', smaller: 'smaller' };
function labelState(self, other) {
  return (
    ['empty'].filter(() => self + other === 0)
    .concat(['same'].filter(() => self === other))
    .concat(['bigger'].filter(() => self > other))
    .concat(['smaller'].filter(() => self < other))
    .concat(['empty'])
  )[0];
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

export function change(side, delta) {
  var wasCounting = stopCounting();
  var prevA = aCount, prevB = bCount;
  ({a: () => { aCount = clamp(aCount + delta, 0, MAX); }, b: () => { bCount = clamp(bCount + delta, 0, MAX); }})[side]();
  render();
  var changed = [aCount !== prevA, bCount !== prevB].some(Boolean);
  return {wasCounting, changed};
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
