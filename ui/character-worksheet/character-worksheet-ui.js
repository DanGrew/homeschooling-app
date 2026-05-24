import { charToFile, clamp, buildPattern } from '../../core/character-worksheet/character-worksheet-core.js';
import { makeSpeakable } from '../../components/speech/speakable.js';
import { getAssetPathForChar } from '../../components/phonics/phonics-service.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CHARS_BASE = '../../../assets/language-characters/';

var state = { cols: 4, rows: 3, cellSize: 120 };
var svgCache = {};

var LOAD_CACHED = (file) => Promise.resolve(svgCache[file]);

var SHEET_URL = { 'true': function(p) { return p; }, 'false': function(_, f) { return CHARS_BASE + f; } };

var FETCH_PATH = (file, char) => {
  var p = getAssetPathForChar(char);
  return fetch(SHEET_URL[String(p != null)](p, file))
    .then(r => r.text())
    .then(text => {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      svgCache[file] = doc.getElementById('trace-path')?.getAttribute('d');
      return svgCache[file];
    })
    .catch(() => { svgCache[file] = null; return null; });
};

var LOAD_SOURCES = { 'true': LOAD_CACHED, 'false': FETCH_PATH };
var NULL_PROMISE = () => Promise.resolve(null);
var LOAD_FILE = (file, char) => LOAD_SOURCES[String(file in svgCache)](file, char);
var LOAD_DISPATCH = { 'true': NULL_PROMISE, 'false': LOAD_FILE };

function makeSvgPath(d) {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#ccc');
  path.setAttribute('stroke-width', '18');
  path.setAttribute('stroke-linecap', 'butt');
  path.setAttribute('stroke-linejoin', 'round');
  return path;
}

function makeSvgEl(d) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 250');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.appendChild(makeSvgPath(d));
  return svg;
}

function makeCell(d) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.style.height = state.cellSize + 'px';
  [d].filter(Boolean).forEach(d => cell.appendChild(makeSvgEl(d)));
  return cell;
}

var EMPTY_DISPLAY = { 'true': 'none', 'false': '' };

async function renderCells(sheet, chars) {
  const paths = await Promise.all(buildPattern(chars.split(''), state.cols * state.rows).map(c => {
    const file = charToFile(c);
    return LOAD_DISPATCH[String(!file)](file, c);
  }));
  paths.forEach(d => sheet.appendChild(makeCell(d)));
}

var RENDER_CELLS = { 'true': renderCells, 'false': () => Promise.resolve() };

async function render() {
  const sheet = document.getElementById('sheet');
  const chars = document.getElementById('input-chars').value.replace(/[^a-zA-Z0-9]/g, '');

  sheet.style.gridTemplateColumns = 'repeat(' + state.cols + ', 1fr)';
  sheet.querySelectorAll('.cell').forEach(el => el.remove());
  document.getElementById('empty-msg').style.display = EMPTY_DISPLAY[String(!!chars)];

  await RENDER_CELLS[String(!!chars)](sheet, chars);
}

function adjustCounter(key, displayId, delta, min, max) {
  state[key] = clamp(state[key] + delta, min, max);
  document.getElementById(displayId).textContent = state[key];
  render();
}

export function init() {
  document.getElementById('cols-dec').addEventListener('click', () => adjustCounter('cols', 'cols-val', -1, 1, 8));
  document.getElementById('cols-inc').addEventListener('click', () => adjustCounter('cols', 'cols-val', +1, 1, 8));
  document.getElementById('rows-dec').addEventListener('click', () => adjustCounter('rows', 'rows-val', -1, 1, 8));
  document.getElementById('rows-inc').addEventListener('click', () => adjustCounter('rows', 'rows-val', +1, 1, 8));

  makeSpeakable(document.getElementById('cols-dec'), 'Fewer columns');
  makeSpeakable(document.getElementById('cols-inc'), 'More columns');
  makeSpeakable(document.getElementById('rows-dec'), 'Fewer rows');
  makeSpeakable(document.getElementById('rows-inc'), 'More rows');

  const SIZE_LABELS = { '80': 'Small', '120': 'Medium', '180': 'Large' };
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.cellSize = parseInt(btn.dataset.size);
      render();
    });
    makeSpeakable(btn, SIZE_LABELS[btn.dataset.size]);
  });

  let debounce;
  document.getElementById('input-chars').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(render, 300);
  });

  document.getElementById('btn-print').addEventListener('click', () => window.print());
  makeSpeakable(document.getElementById('btn-print'), 'Print');
}
