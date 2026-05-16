import { speak } from '../../components/speech/speech-ui.js';
import { getVoice } from '../../components/speech/voice-service.js';
import { makeInteractive } from '../../components/speech/speakable.js';
import { comparisonColor, clamp, makeImg, labelState, computeChange } from '../../core/number-interaction/number-interaction-core.js';

var SIDE_EVT = { a: 'A', b: 'B' };
var DELTA_EVT = { 'true': '_PLUS', 'false': '_MINUS' };
var DISPATCH_EQUAL = { 'true': function() { guidanceEvent('GROUPS_EQUAL'); }, 'false': function() {} };
var DISPATCH_NONZERO = { 'true': function() { DISPATCH_EQUAL[String(aCount === bCount)](); }, 'false': function() {} };

function guidanceEvent(type) { window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: type } })); }

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
  window.addEventListener('guidance:start', function() { aCount = 0; bCount = 0; render(); });
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

function makeImgEl(item, sz) {
  var img = document.createElement('img');
  img.src = item.url;
  img.alt = item.name;
  img.style.cssText = sz + ';transition:transform 0.15s,filter 0.15s;';
  img.draggable = false;
  makeInteractive(img, () => stopAndSpeak(stopCounting(), () => speak(item.name)));
  return img;
}

var SHOW_GHOST = {
  'true': function(container, key, sz) {
    var img = document.createElement('img');
    img.src = key.url; img.alt = key.name;
    img.style.cssText = sz + ';opacity:0.4;';
    img.draggable = false;
    makeInteractive(img, () => stopAndSpeak(stopCounting(), () => speak(key.name)));
    container.appendChild(img);
  },
  'false': function() {}
};

var LABEL_TEXT = { empty: '', same: 'same', bigger: 'bigger', smaller: 'smaller' };
export function render() {
  var aContainer = document.getElementById('objects-a');
  var bContainer = document.getElementById('objects-b');
  aContainer.innerHTML = '';
  bContainer.innerHTML = '';
  Array.from({length: aCount}, () => { aContainer.appendChild(makeImgEl(aKey, SZ)); });
  SHOW_GHOST[String(aCount === 0)](aContainer, aKey, SZ);
  Array.from({length: bCount}, () => { bContainer.appendChild(makeImgEl(bKey, SZ)); });
  SHOW_GHOST[String(bCount === 0)](bContainer, bKey, SZ);
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
  guidanceEvent('TOTAL_' + (aCount + bCount));
  DISPATCH_NONZERO[String(aCount > 0)]();
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

var _change = [function(side, delta) {
  var wasCounting = stopCounting();
  var result = computeChange(side, delta, aCount, bCount, MAX);
  aCount = result.newA;
  bCount = result.newB;
  render();
  [1].filter(() => result.changed).forEach(() => { guidanceEvent(SIDE_EVT[side] + DELTA_EVT[String(delta > 0)]); });
  return { wasCounting: wasCounting, changed: result.changed };
}];
export function change(side, delta) { return _change[0](side, delta); }

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
        [1].filter(() => idx < 0).forEach(() => { counting = false; guidanceEvent('COUNT_ALL'); });
      })();
    });
  });
}
