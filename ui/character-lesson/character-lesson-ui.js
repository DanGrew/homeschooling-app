import { speak } from '../speech/speech-ui.js';

const CHARS = [
  ...'abcdefghijklmnopqrstuvwxyz'.split('').map(c => ({char: c, file: 'lower-' + c + '.svg', group: 'lower', speak: c})),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => ({char: c, file: 'upper-' + c.toLowerCase() + '.svg', group: 'upper', speak: c})),
  ...'0123456789'.split('').map(c => ({char: c, file: c + '.svg', group: 'digit', speak: c}))
];

const FILTERS = {all: () => true, lower: e => e.group === 'lower', upper: e => e.group === 'upper', digit: e => e.group === 'digit'};

let mode = 'lesson';
let currentFilter = 'all';
let filteredChars = CHARS.slice();
let currentIdx = 0;
let engine = null;
let currentEntry = null;
let dotEl = null;

function getParam(key) { return new URLSearchParams(location.search).get(key); }

function setParam(char, filter) {
  const url = new URL(location.href);
  url.searchParams.set('char', char);
  url.searchParams.set('filter', filter);
  url.searchParams.set('mode', mode);
  history.replaceState(null, '', url);
}

function applyFilter(filter) {
  currentFilter = filter;
  filteredChars = CHARS.filter(FILTERS[filter]);
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === filter);
  });
}

function showBanner() { document.getElementById('success-banner').classList.add('visible'); }
function hideBanner() { document.getElementById('success-banner').classList.remove('visible'); }

var MODE_UI = {
  'trace':  { trace: 'none', tryit: 'none', watch: '',     hint: '' },
  'lesson': { trace: '',     tryit: '',     watch: 'none', hint: 'none' }
};

function applyModeUI() {
  var s = MODE_UI[mode];
  document.getElementById('btn-trace').style.display = s.trace;
  document.getElementById('btn-tryit').style.display = s.tryit;
  document.getElementById('btn-watch').style.display = s.watch;
  document.getElementById('trace-hint').style.display = s.hint;
}

function switchMode(newMode) {
  mode = newMode;
  applyModeUI();
  hideBanner();
  [currentEntry].filter(Boolean).forEach(loadChar);
}

function navTo(idx) {
  currentIdx = ((idx % filteredChars.length) + filteredChars.length) % filteredChars.length;
  currentEntry = filteredChars[currentIdx];
  document.getElementById('char-label').textContent = currentEntry.char;
  document.getElementById('btn-prev').disabled = false;
  document.getElementById('btn-next').disabled = false;
  hideBanner();
  setParam(currentEntry.char, currentFilter);
  loadChar(currentEntry);
}

function onLessonComplete() {
  document.getElementById('btn-trace').disabled = false;
  document.getElementById('btn-tryit').disabled = false;
  [document.querySelector('.char-decoration')].filter(Boolean).forEach(dot => {
    dot.setAttribute('fill', '#FFD700');
    dot.style.filter = 'drop-shadow(0 0 8px #FFD700)';
  });
}

var TRACE_COMPLETE = {
  'true':  () => { dotEl.setAttribute('fill', '#E74C3C'); dotEl.setAttribute('r', '14'); dotEl.classList.add('dot-pulse'); },
  'false': showBanner
};

function onTraceComplete() { TRACE_COMPLETE[String(!!dotEl)](); }

function dotTappedAction() {
  dotEl.classList.remove('dot-pulse');
  dotEl.setAttribute('fill', '#FFD700');
  dotEl.style.filter = 'drop-shadow(0 0 8px #FFD700)';
  showBanner();
}

function onDotTapped() {
  [dotTappedAction].filter(() => [dotEl, engine, engine?.done].every(Boolean)).forEach(f => f());
}

var ON_COMPLETE = { 'trace': onTraceComplete, 'lesson': onLessonComplete };

function onStrokeComplete(strokeIdx, cx, cy) {
  [engine.progressPaths[strokeIdx - 1]].filter(Boolean).forEach(pp => { pp.style.filter = ''; });
  [document.getElementById('next-stroke-hint')].filter(Boolean).forEach(el => el.remove());
  var hint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  hint.id = 'next-stroke-hint';
  hint.setAttribute('cx', cx); hint.setAttribute('cy', cy);
  hint.setAttribute('r', '14'); hint.setAttribute('fill', '#E74C3C');
  hint.setAttribute('stroke', 'white'); hint.setAttribute('stroke-width', '3');
  hint.classList.add('char-decoration', 'dot-pulse');
  hint.style.pointerEvents = 'none';
  document.getElementById('svg').appendChild(hint);
  document.getElementById('svg').addEventListener('pointerdown', function cleanup() {
    [document.getElementById('next-stroke-hint')].filter(Boolean).forEach(el => el.remove());
  }, { once: true });
}

var ON_STROKE_COMPLETE = { 'trace': onStrokeComplete, 'lesson': null };

function initEngine() {
  engine = window.engine = new TraceEngine(
    document.getElementById('svg'),
    document.getElementById('base'),
    document.getElementById('ball'),
    null,
    {
      interactive: mode === 'trace',
      progressStroke: '#FFD700',
      progressWidth: 20,
      progressStyle: 'filter:drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 5px #FFA500)',
      onComplete: ON_COMPLETE[mode],
      onStrokeComplete: ON_STROKE_COMPLETE[mode]
    }
  );
  engine.progressPaths.forEach(pp => pp.classList.add('progress-path'));
}

var SETUP_DOT_TRACE = {
  'true':  c => { c.style.cursor = 'pointer'; c.addEventListener('pointerdown', onDotTapped); window.dotEl = dotEl = c; },
  'false': () => {}
};

var SET_TRACE_BTN_ENABLED = { 'true': () => {}, 'false': () => { document.getElementById('btn-trace').disabled = false; } };

function loadChar(entry) {
  fetch('../../language-characters/' + entry.file)
    .then(r => r.text())
    .then(svgText => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const d = doc.getElementById('trace-path')?.getAttribute('d');
      const svg = document.getElementById('svg');
      svg.querySelectorAll('.char-decoration').forEach(el => el.remove());

      window.dotEl = dotEl = null;
      [doc.querySelector('circle')].filter(Boolean).forEach(circle => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ['cx','cy','r','fill'].forEach(a => c.setAttribute(a, circle.getAttribute(a)));
        c.dataset.origFill = circle.getAttribute('fill');
        c.classList.add('char-decoration');
        SETUP_DOT_TRACE[String(mode === 'trace')](c);
        svg.insertBefore(c, svg.querySelector('#base'));
      });

      document.getElementById('base').setAttribute('d', d);
      document.querySelectorAll('.progress-path').forEach(el => el.remove());
      engine = window.engine = null;
      SET_TRACE_BTN_ENABLED[String(mode === 'trace')]();
      initEngine();
    });
}

var BTN_TRACE_CLICK = {
  'true':  () => {},
  'false': () => {
    engine.stopAnimation();
    engine.done = false;
    document.getElementById('btn-trace').disabled = true;
    document.getElementById('btn-tryit').disabled = true;
    [document.querySelector('.char-decoration')].filter(Boolean).forEach(dot => {
      dot.setAttribute('fill', [dot.dataset.origFill, '#ccc'].filter(Boolean)[0]);
      dot.style.filter = '';
    });
    engine.startAnimation(2500);
  }
};

var MODE_PARAM = { 'true': 'trace', 'false': 'lesson' };

export function init() {
  const paramChar   = [getParam('char'),   'a'  ].filter(Boolean)[0];
  const paramFilter = [getParam('filter'), 'all'].filter(Boolean)[0];
  mode = MODE_PARAM[String(getParam('mode') === 'trace')];
  applyFilter(paramFilter);
  applyModeUI();
  navTo(Math.max(0, filteredChars.findIndex(e => e.char === paramChar)));

  document.getElementById('btn-trace').addEventListener('click', () => BTN_TRACE_CLICK[String(!engine)]());
  document.getElementById('btn-speak').addEventListener('click', () => { [currentEntry].filter(Boolean).forEach(e => speak(e.speak)); });
  document.getElementById('btn-tryit').addEventListener('click', () => switchMode('trace'));
  document.getElementById('btn-watch').addEventListener('click', () => switchMode('lesson'));
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => { applyFilter(btn.dataset.filter); navTo(0); });
  });
  document.getElementById('btn-prev').addEventListener('click', () => navTo(currentIdx - 1));
  document.getElementById('btn-next').addEventListener('click', () => navTo(currentIdx + 1));
  document.getElementById('btn-banner-reset').addEventListener('click', () => { hideBanner(); [engine].filter(Boolean).forEach(e => e.restart()); });
  document.getElementById('btn-banner-next').addEventListener('click', () => navTo(currentIdx + 1));
}
