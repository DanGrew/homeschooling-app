import { speak } from '../../components/speech/speech-ui.js';
import { makeSpeakable } from '../../components/speech/speakable.js';
import { showBanner as _showBanner, hideBanner as _hideBanner } from '../../components/success-banner.js';
import { buildSimpleFilterBar } from '../../components/filter-bar/filter-bar-ui.js';
import { createPaginator } from '../../components/pagination/paginator-ui.js';
import { getAssetPathForChar, playSound, initAudio, deriveLetterSounds } from '../../components/phonics/phonics-service.js';

const CHARS = [
  ...'abcdefghijklmnopqrstuvwxyz'.split('').map(c => ({char: c, file: 'lower-' + c + '.svg', group: 'lower', speak: c})),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => ({char: c, file: 'upper-' + c.toLowerCase() + '.svg', group: 'upper', speak: c})),
  ...'0123456789'.split('').map(c => ({char: c, file: c + '.svg', group: 'digit', speak: c}))
];

const FILTERS = {all: () => true, lower: e => e.group === 'lower', upper: e => e.group === 'upper', digit: e => e.group === 'digit'};

let mode = 'lesson';
let currentFilter = 'all';
let filteredChars = CHARS.slice();
let engine = null;
let currentEntry = null;
let dotEl = null;
let autoPlay = false;
let paginator = null;

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
}

function hideBanner() { _hideBanner(); }

function showBanner() {
  [currentEntry].filter(Boolean).forEach(function(e) {
    window.dispatchEvent(new CustomEvent('guidance:event', {detail: {type: 'CHAR_' + e.char + '_TRACED'}}));
  });
  _showBanner({ buttons: [
    { label: '\u21BA Again', bg: 'white', color: '#E74C3C', onClick: function() { hideBanner(); [engine].filter(Boolean).forEach(function(e) { e.restart(); }); } },
    { label: 'Next \u2192',  bg: 'white', color: '#2ECC71', onClick: function() { paginator.next(); } }
  ]});
}

var MODE_UI = {
  'trace':  { trace: 'none', tryit: 'none', watch: '', hint: '' },
  'lesson': { trace: 'none', tryit: '',     watch: '', hint: 'none' }
};

function applyModeUI() {
  var s = MODE_UI[mode];
  document.getElementById('btn-trace').style.display = s.trace;
  document.getElementById('btn-tryit').style.display = s.tryit;
  document.getElementById('btn-watch').style.display = s.watch;
  document.getElementById('trace-hint').style.display = s.hint;
  document.getElementById('btn-stop').style.display = 'none';
}

function switchMode(newMode) {
  mode = newMode;
  applyModeUI();
  hideBanner();
  [currentEntry].filter(Boolean).forEach(loadChar);
}

function renderChar(entry) {
  currentEntry = entry;
  [document.getElementById('char-label')].filter(Boolean).forEach(el => { el.textContent = entry.char; });
  hideBanner();
  setParam(entry.char, currentFilter);
  loadChar(entry);
}

function navTo(idx) { paginator.goTo(idx); }

function onLessonComplete() {
  document.getElementById('btn-trace').disabled = false;
  document.getElementById('btn-tryit').disabled = false;
  document.getElementById('btn-watch').disabled = false;
  document.getElementById('btn-stop').style.display = 'none';
  [document.querySelector('.char-decoration')].filter(Boolean).forEach(dot => {
    dot.setAttribute('fill', '#FFD700');
    dot.style.filter = 'drop-shadow(0 0 8px #FFD700)';
  });
}

var TRACE_COMPLETE = {
  'true':  () => { dotEl.setAttribute('fill', '#E74C3C'); dotEl.setAttribute('r', '14'); dotEl.classList.add('dot-pulse'); },
  'false': showBanner
};

function onTraceComplete() { playCharPhoneme(); TRACE_COMPLETE[String(!!dotEl)](); }

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
var LESSON_URL = { 'true': function(p) { return p; }, 'false': function(_, e) { return '../../../assets/language-characters/' + e.file; } };

function loadChar(entry) {
  var p = getAssetPathForChar(entry.char);
  fetch(LESSON_URL[String(p != null)](p, entry))
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
      [autoPlay].filter(Boolean).forEach(() => { autoPlay=false; BTN_TRACE_CLICK[String(!engine)](); });
    });
}

var SHAPE_COLORS = {'straight line':'#3498DB','curve':'#E67E22','circle':'#2ECC71','diagonal':'#9B59B6'};

function getActiveShapeDecomp(char) {
  return [window.guidanceService]
    .filter(Boolean)
    .map(function(s) { return s._lesson; })
    .filter(Boolean)
    .map(function(l) { return l.shapeDecomp; })
    .filter(Boolean)
    .map(function(sd) { return sd[char]; })
    .filter(Boolean)[0];
}

function makeShapePill(s) {
  var pill = document.createElement('span');
  pill.style.cssText = 'color:white;border-radius:20px;padding:10px 24px;font-size:1.2em;font-weight:bold;font-family:inherit;';
  pill.style.background = [SHAPE_COLORS[s], '#888'].filter(Boolean)[0];
  pill.textContent = s;
  return pill;
}

function showShapeDecomp(shapes, onDismiss) {
  var overlay = document.createElement('div');
  overlay.id = 'shape-decomp-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);z-index:1000;cursor:pointer;';
  var card = document.createElement('div');
  card.style.cssText = 'background:white;border-radius:20px;padding:28px 36px;display:flex;flex-direction:column;align-items:center;gap:16px;max-width:90vw;';
  var lbl = document.createElement('div');
  lbl.style.cssText = 'font-size:1em;color:#888;font-family:inherit;font-weight:bold;';
  lbl.textContent = 'Made of:';
  card.appendChild(lbl);
  var pills = document.createElement('div');
  pills.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;';
  shapes.forEach(function(s) { pills.appendChild(makeShapePill(s)); });
  card.appendChild(pills);
  var hint = document.createElement('div');
  hint.style.cssText = 'font-size:0.85em;color:#bbb;font-family:inherit;';
  hint.textContent = 'tap to continue';
  card.appendChild(hint);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  overlay.addEventListener('pointerdown', function() { overlay.remove(); onDismiss(); }, {once: true});
}

var DECOMP_ACTION = {
  'true':  function(shapes, fn) { showShapeDecomp(shapes, fn); },
  'false': function(_, fn) { fn(); }
};

var BTN_TRACE_CLICK = {
  'true':  () => {},
  'false': () => {
    engine.stopAnimation();
    engine.done = false;
    document.getElementById('btn-trace').disabled = true;
    document.getElementById('btn-tryit').disabled = true;
    document.getElementById('btn-watch').disabled = true;
    document.getElementById('btn-stop').style.display = '';
    [document.querySelector('.char-decoration')].filter(Boolean).forEach(dot => {
      dot.setAttribute('fill', [dot.dataset.origFill, '#ccc'].filter(Boolean)[0]);
      dot.style.filter = '';
    });
    var startAnim = function() { engine.startAnimation(2500); };
    var shapes = [currentEntry].filter(Boolean).map(function(e) { return getActiveShapeDecomp(e.char); }).filter(Boolean)[0];
    DECOMP_ACTION[String(!!shapes)](shapes, startAnim);
  }
};

var WATCH_CLICK = {
  'trace':  () => { autoPlay=true; switchMode('lesson'); },
  'lesson': () => BTN_TRACE_CLICK[String(!engine)]()
};

var MODE_PARAM = { 'true': 'trace', 'false': 'lesson' };

var PHONEME_BY_GROUP = {
  'lower': function(e) { var sounds = deriveLetterSounds(e.char); [sounds[0]].filter(Boolean).forEach(playSound); },
  'upper': function(e) { speak(e.speak); },
  'digit': function(e) { speak(e.speak); }
};

function playCharPhoneme() {
  [currentEntry].filter(Boolean).forEach(function(e) { PHONEME_BY_GROUP[e.group](e); });
}

function getSpeakLabel() { return [currentEntry].filter(Boolean).map(function(e) { return e.speak; }).concat(['Speak'])[0]; }

export function init() {
  initAudio();
  const paramChar   = [new URLSearchParams(location.search).get('char'),   'a'  ].filter(Boolean)[0];
  const paramFilter = [new URLSearchParams(location.search).get('filter'), 'all'].filter(Boolean)[0];
  mode = MODE_PARAM[String(new URLSearchParams(location.search).get('mode') === 'trace')];
  applyFilter(paramFilter);
  applyModeUI();

  paginator = createPaginator({
    container: document.getElementById('paginator-bar'),
    items: filteredChars,
    perPage: 1,
    wrap: true,
    onRender: function(entry) { renderChar(entry); }
  });

  buildSimpleFilterBar(
    [
      {label: 'All',  value: 'all'},
      {label: 'a\u2013z', value: 'lower'},
      {label: 'A\u2013Z', value: 'upper'},
      {label: '0\u20139', value: 'digit'}
    ],
    function(val) { applyFilter(val); paginator.reset(filteredChars); },
    paramFilter
  );

  paginator.goTo(Math.max(0, filteredChars.findIndex(e => e.char === paramChar)));

  window.addEventListener('guidance:start', function() {
    [window.guidanceService].filter(Boolean)
      .map(function(s) { return s._lesson; })
      .filter(Boolean)
      .filter(function(l) { return l.characters; })
      .forEach(function(lesson) {
        var chars = lesson.characters.map(String);
        filteredChars = CHARS.filter(function(e) { return chars.indexOf(e.char) !== -1; });
        paginator.reset(filteredChars);
      });
  });
  window.addEventListener('guidance:stop', function() {
    applyFilter(currentFilter);
    paginator.reset(filteredChars);
  });

  document.getElementById('btn-trace').addEventListener('click', () => BTN_TRACE_CLICK[String(!engine)]());
  document.getElementById('btn-speak').addEventListener('click', playCharPhoneme);
  makeSpeakable(document.getElementById('btn-speak'), getSpeakLabel);
  document.getElementById('btn-tryit').addEventListener('click', () => switchMode('trace'));
  document.getElementById('btn-watch').addEventListener('click', () => WATCH_CLICK[mode]());
  document.getElementById('btn-stop').addEventListener('click', () => {
    engine?.stopAnimation();
    document.getElementById('btn-stop').style.display = 'none';
    document.getElementById('btn-tryit').disabled = false;
    document.getElementById('btn-watch').disabled = false;
    [currentEntry].filter(Boolean).forEach(loadChar);
  });
}
