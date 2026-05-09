import { validWord, charFile, bestVoice, extractWordTags, filterWordsByTag, wrapIdx, resolveWordEntry } from '../../core/word-lesson/word-lesson-core.js';
import { speak, stop } from '../speech/speech-ui.js';

const CHAR_BASE = '../../language-characters/';
const DICT_BASE = '../../dictionary/';
const NS = 'http://www.w3.org/2000/svg';

var words = [];
var filtered = [];
var currentIdx = 0;
var isCustom = false;
var currentWord = '';
var isTracing = false;
var lessonAnimating = false;
var charSvgs = [];
var charBases = [];
var charBalls = [];
var charDots = [];
var charEngines = [];

function stopAllEngines() {
  charEngines.forEach(e => [e].filter(Boolean).forEach(e => { e.done = true; e.stopAnimation(); }));
  charEngines = [];
  lessonAnimating = false;
}

function loadDictionary() {
  return fetch(DICT_BASE + 'dictionary.json')
    .then(r => r.json())
    .then(ids => Promise.all(ids.map(id =>
      fetch(DICT_BASE + 'entries/' + id + '/concept.json').then(r => r.json())
    )))
    .then(concepts => {
      words = concepts.map(resolveWordEntry);
    });
}

function setActiveFilter(tag) {
  document.querySelectorAll('#filter-bar .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tag === tag)
  );
}

function hideBanner() {
  document.getElementById('success-banner').classList.remove('visible');
}

var BANNER_NEXT_DISPLAY = { 'true': 'none', 'false': '' };

function showBanner() {
  document.getElementById('btn-banner-next').style.display = BANNER_NEXT_DISPLAY[String(isCustom)];
  document.getElementById('success-banner').classList.add('visible');
}

function setLessonUI() {
  isTracing = false;
  document.getElementById('btn-watch').disabled = false;
  document.getElementById('btn-tryit').style.display = '';
  document.getElementById('btn-tryit').disabled = false;
  document.getElementById('btn-stop').style.display = 'none';
}

function setTraceUI() {
  isTracing = true;
  document.getElementById('btn-watch').disabled = false;
  document.getElementById('btn-tryit').style.display = 'none';
  document.getElementById('btn-stop').style.display = 'none';
}


function doNav(idx) {
  currentIdx = wrapIdx(idx, filtered.length);
  currentWord = filtered[currentIdx].word;
  document.getElementById('word-label').textContent = currentWord;
  const multi = filtered.length > 1;
  document.getElementById('btn-prev').disabled = !multi;
  document.getElementById('btn-next').disabled = !multi;
  hideBanner();
  setLessonUI();
  loadWord(currentWord);
}

var NAV_EMPTY_GUARD = { 'true': () => {}, 'false': doNav };
var NAV_CUSTOM_GUARD = { 'true': () => {}, 'false': idx => NAV_EMPTY_GUARD[String(!filtered.length)](idx) };

function navTo(idx) {
  NAV_CUSTOM_GUARD[String(isCustom)](idx);
}

function setupFilterBar() {
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = '';
  extractWordTags(words).forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.tag = tag;
    var TAG_LABEL = { 'true': 'All', 'false': tag.charAt(0).toUpperCase() + tag.slice(1) };
    btn.textContent = TAG_LABEL[String(tag === 'all')];
    btn.addEventListener('click', () => onFilterClick(tag));
    bar.appendChild(btn);
  });
  setActiveFilter('all');
}

function showCustomMode() {
  isCustom = true;
  stopAllEngines();
  document.getElementById('custom-input').style.display = 'flex';
  document.getElementById('word-label').textContent = '';
  document.getElementById('btn-prev').disabled = true;
  document.getElementById('btn-next').disabled = true;
  document.getElementById('word-container').innerHTML = '';
  charSvgs = []; charBases = []; charBalls = []; charDots = [];
  setLessonUI();
}

function showTagMode(tag) {
  isCustom = false;
  document.getElementById('custom-input').style.display = 'none';
  filtered = filterWordsByTag(words, tag);
  navTo(0);
}

var FILTER_HANDLERS = { 'true': showCustomMode, 'false': showTagMode };

function onFilterClick(tag) {
  setActiveFilter(tag);
  hideBanner();
  FILTER_HANDLERS[String(tag === 'custom')](tag);
}

function fetchCharData(c) {
  return fetch(CHAR_BASE + charFile(c))
    .then(r => r.text())
    .then(svgText => {
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      const d = doc.getElementById('trace-path').getAttribute('d');
      const circle = doc.querySelector('circle');
      const dot = [circle].filter(Boolean).map(c => ({
        cx: c.getAttribute('cx'), cy: c.getAttribute('cy'), r: c.getAttribute('r')
      }))[0];
      return { d, dot };
    });
}

function loadWord(word) {
  stopAllEngines();
  const chars = word.split('');
  return Promise.all(chars.map(fetchCharData))
    .then(charData => renderWord(chars, charData))
    .catch(() => { document.getElementById('word-label').textContent = '⚠️ Could not load "' + word + '"'; });
}

function makeSvgPath(d) {
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#ddd');
  path.setAttribute('stroke-width', '18');
  path.setAttribute('stroke-linecap', 'butt');
  path.setAttribute('stroke-linejoin', 'round');
  return path;
}

function makeDotCircle(dot) {
  const dc = document.createElementNS(NS, 'circle');
  dc.setAttribute('cx', dot.cx);
  dc.setAttribute('cy', dot.cy);
  dc.setAttribute('r', dot.r);
  dc.setAttribute('fill', '#ddd');
  dc.setAttribute('stroke', 'none');
  dc.style.pointerEvents = 'none';
  return dc;
}

function makeBallCircle() {
  const ball = document.createElementNS(NS, 'circle');
  ball.setAttribute('r', '16');
  ball.setAttribute('fill', '#E74C3C');
  ball.setAttribute('stroke', 'white');
  ball.setAttribute('stroke-width', '3');
  ball.style.display = 'none';
  return ball;
}

function renderWord(chars, charData) {
  stopAllEngines();
  const n = chars.length;
  const GAP = 10;
  const container = document.getElementById('word-container');
  container.innerHTML = '';
  charSvgs = []; charBases = []; charBalls = []; charDots = [];

  var CONTAINER_WIDTH = { 'true': () => container.clientWidth, 'false': () => window.innerWidth - 32 };
  const containerW = CONTAINER_WIDTH[String(!!container.clientWidth)]();
  const maxCharH = Math.min(260, window.innerHeight * 0.38);
  const maxCharW = maxCharH * (200 / 270);
  const charW = Math.max(72, Math.min(maxCharW, (containerW - (n - 1) * GAP) / n));
  const charH = Math.round(charW * (270 / 200));

  const wrap = document.createElement('div');
  wrap.style.cssText = `display:flex;gap:${GAP}px;align-items:center;justify-content:center;`;

  chars.forEach((c, i) => {
    const { d, dot } = charData[i];

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 270');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.cssText = `width:${charW}px;height:${charH}px;display:block;touch-action:none;flex-shrink:0;`;

    const base = makeSvgPath(d);
    const dc = [dot].filter(Boolean).map(makeDotCircle)[0];
    const ball = makeBallCircle();

    svg.appendChild(base);
    [dc].filter(Boolean).forEach(el => svg.appendChild(el));
    svg.appendChild(ball);
    wrap.appendChild(svg);

    charSvgs.push(svg);
    charBases.push(base);
    charDots.push(dc);
    charBalls.push(ball);
  });

  container.appendChild(wrap);
}

function clearProgress() {
  charSvgs.forEach(svg => svg.querySelectorAll('.progress-path').forEach(p => p.remove()));
  charBalls.forEach(b => { b.style.display = 'none'; b.style.filter = ''; b.setAttribute('fill', '#E74C3C'); });
  charDots.forEach(d => {
    [d].filter(Boolean).forEach(d => {
      [d._tapListener].filter(Boolean).forEach(fn => { d.removeEventListener('pointerdown', fn); d._tapListener = null; });
      d.setAttribute('fill', '#ddd');
      d.setAttribute('stroke', 'none');
      d.style.pointerEvents = 'none';
      d.style.cursor = '';
      d.style.filter = '';
    });
  });
}

var LESSON_COMPLETE_DOT = {
  'true': (dot, i, total) => {
    dot.setAttribute('fill', '#FFD700');
    dot.style.filter = 'drop-shadow(0 0 8px #FFD700)';
    setTimeout(() => animateLessonChar(i + 1, total), 400);
  },
  'false': (dot, i, total) => setTimeout(() => animateLessonChar(i + 1, total), 300)
};

function doAnimateLessonChar(i, total) {
  const ball = charBalls[i];
  const dot = charDots[i];
  ball.style.display = '';
  [dot].filter(Boolean).forEach(d => d.setAttribute('fill', '#E74C3C'));

  const engine = new TraceEngine(charSvgs[i], charBases[i], ball, null, {
    interactive: false,
    progressStroke: '#FFD700',
    progressWidth: 20,
    progressStyle: 'filter:drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 5px #FFA500)'
  });
  engine.progressPaths.forEach(pp => pp.classList.add('progress-path'));
  charEngines[i] = engine;

  engine.onComplete = () => {
    ball.style.display = 'none';
    LESSON_COMPLETE_DOT[String(!!dot)](dot, i, total);
  };

  engine.startAnimation(1250);
}

var ANIM_FINISHED_GUARD = { 'true': onLessonComplete, 'false': doAnimateLessonChar };
var ANIM_STOPPED_GUARD = { 'true': () => {}, 'false': (i, total) => ANIM_FINISHED_GUARD[String(i >= total)](i, total) };

function animateLessonChar(i, total) {
  ANIM_STOPPED_GUARD[String(!lessonAnimating)](i, total);
}

function onLessonComplete() {
  lessonAnimating = false;
  document.getElementById('btn-watch').disabled = false;
  document.getElementById('btn-stop').style.display = 'none';
}

var START_WATCH_GUARD = { 'true': doStartWatch, 'false': () => {} };

function doStartWatch() {
  stopAllEngines();
  clearProgress();
  setLessonUI();
  document.getElementById('btn-watch').disabled = true;
  document.getElementById('btn-stop').style.display = '';
  lessonAnimating = true;
  animateLessonChar(0, charBases.length);
}

function startWatch() {
  START_WATCH_GUARD[String(!!charSvgs.length)]();
}

var TRACE_DOT_HANDLERS = {
  'true': (dot, charIdx) => {
    dot.setAttribute('fill', '#E74C3C');
    dot.style.pointerEvents = 'auto';
    dot.style.cursor = 'pointer';
    const onDotTap = () => {
      dot.removeEventListener('pointerdown', onDotTap);
      dot._tapListener = null;
      dot.style.pointerEvents = 'none';
      dot.style.cursor = '';
      dot.setAttribute('fill', '#FFD700');
      traceChar(charIdx + 1);
    };
    dot._tapListener = onDotTap;
    dot.addEventListener('pointerdown', onDotTap);
  },
  'false': (dot, charIdx) => setTimeout(() => traceChar(charIdx + 1), 300)
};

function traceChar(charIdx) {
  TRACE_FINISHED_GUARD[String(charIdx >= charBases.length)](charIdx);
}

var TRACE_FINISHED_GUARD = { 'true': onWordComplete, 'false': doTraceChar };

function doTraceChar(charIdx) {
  const ball = charBalls[charIdx];
  const dot = charDots[charIdx];
  ball.style.display = '';
  ball.setAttribute('fill', '#E74C3C');
  ball.style.filter = '';

  const engine = new TraceEngine(charSvgs[charIdx], charBases[charIdx], ball, null, {
    interactive: true,
    progressStroke: '#FFD700',
    progressWidth: 20,
    progressStyle: 'filter:drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 5px #FFA500)',
    onComplete: () => {
      ball.style.display = 'none';
      TRACE_DOT_HANDLERS[String(!!dot)](dot, charIdx);
    }
  });
  engine.progressPaths.forEach(pp => pp.classList.add('progress-path'));
  charEngines[charIdx] = engine;
}

function onWordComplete() { isTracing = false; showBanner(); }

var START_TRACE_GUARD = { 'true': doStartTrace, 'false': () => {} };

function doStartTrace() {
  stopAllEngines();
  clearProgress();
  setTraceUI();
  traceChar(0);
}

function startTrace() {
  START_TRACE_GUARD[String(!!charSvgs.length)]();
}

function flashInvalid() {
  const el = document.getElementById('custom-word-input');
  el.style.borderColor = '#E74C3C';
  setTimeout(() => { el.style.borderColor = '#ddd'; }, 800);
}

var GENERATE_HANDLERS = { 'true': doGenerate, 'false': flashInvalid };

function doGenerate(val) {
  currentWord = val;
  document.getElementById('word-label').textContent = val;
  hideBanner();
  setLessonUI();
  loadWord(val);
}

function handleGenerate() {
  const val = document.getElementById('custom-word-input').value.trim();
  GENERATE_HANDLERS[String(validWord(val))](val);
}

export function init() {
  document.getElementById('btn-watch').addEventListener('click', startWatch);
  document.getElementById('btn-tryit').addEventListener('click', startTrace);
  document.getElementById('btn-stop').addEventListener('click', () => { stopAllEngines(); clearProgress(); setLessonUI(); });
  document.getElementById('btn-sayit').addEventListener('click', () => { if (currentWord) { stop(); speak(currentWord); } });
  document.getElementById('btn-prev').addEventListener('click', () => navTo(currentIdx - 1));
  document.getElementById('btn-next').addEventListener('click', () => navTo(currentIdx + 1));
  document.getElementById('btn-generate').addEventListener('click', handleGenerate);
  document.getElementById('custom-word-input').addEventListener('keydown', e => { ['Enter'].filter(k => k === e.key).forEach(handleGenerate); });
  document.getElementById('btn-banner-again').addEventListener('click', () => { hideBanner(); startTrace(); });
  document.getElementById('btn-banner-next').addEventListener('click', () => navTo(currentIdx + 1));

  loadDictionary().then(() => {
    setupFilterBar();
    filtered = words.slice();
    navTo(0);
  }).catch(() => {
    document.getElementById('word-label').textContent = '⚠️ Failed to load — check connection';
  });
}
