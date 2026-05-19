import { parseWord, buildTileSet, validateLetter, isWordComplete, pickWord } from '../../core/word-builder/word-builder-core.js';

let state = {
  items: [],
  mode: 'distractors',
  slots: [],
  tiles: [],
  showPicture: true,
  currentItem: null,
};

export function init(items, speakFn) {
  state.items = items;
  state.speakFn = speakFn || (() => {});
  nextWord();
}

export function setMode(mode) {
  state.mode = mode;
  nextWord();
}

export function togglePicture() {
  state.showPicture = !state.showPicture;
  renderPicture();
}

export function nextWord() {
  state.currentItem = pickWord(state.items);
  if (!state.currentItem) return;
  const word = state.currentItem.name || '';
  state.slots = parseWord(word).map(t => ({ ...t, placed: null, locked: false }));
  state.tiles = buildTileSet(word, state.mode);
  render();
  state.speakFn(word, 'word');
}

export function reset() {
  const word = state.currentItem ? (state.currentItem.word || state.currentItem.label || '') : '';
  state.slots = parseWord(word).map(t => ({ ...t, placed: null, locked: false }));
  render();
  state.speakFn(word, 'word');
}

function currentTargetIndex() {
  return state.slots.findIndex(s => s.type === 'letter' && !s.locked);
}

function placeLetter(letter) {
  const idx = currentTargetIndex();
  if (idx === -1) return;
  const slot = state.slots[idx];
  const correct = validateLetter(slot.char, letter);
  if (correct) {
    slot.locked = true;
    slot.placed = letter.toUpperCase();
    state.speakFn(letter, 'letter');
  } else {
    slot.placed = letter.toUpperCase();
    slot.error = true;
  }
  renderSlots();
  if (isWordComplete(state.slots)) {
    const word = state.currentItem.name || '';
    setTimeout(() => {
      if (window.showBanner) window.showBanner(() => nextWord());
      state.speakFn(word, 'word');
    }, 300);
    renderActions(true);
  }
}

function render() {
  renderPicture();
  renderSlots();
  renderTiles();
  renderActions(false);
}

function renderPicture() {
  const el = document.getElementById('wb-picture');
  if (!el) return;
  const img = el.querySelector('img');
  const btn = document.getElementById('wb-picture-toggle');
  const src = state.currentItem ? (state.currentItem.url || '') : '';
  if (img) { img.src = src; img.alt = state.currentItem ? (state.currentItem.name || '') : ''; img.style.display = src ? '' : 'none'; }
  el.style.display = state.showPicture ? 'flex' : 'none';
  if (btn) btn.textContent = state.showPicture ? 'Hide picture' : 'Show picture';
}

function renderSlots() {
  const el = document.getElementById('wb-slots');
  if (!el) return;
  el.innerHTML = '';
  const targetIdx = currentTargetIndex();
  state.slots.forEach((slot, i) => {
    if (slot.type === 'space') {
      const gap = document.createElement('div');
      gap.style.cssText = 'width:clamp(16px,4vmin,32px);flex-shrink:0;';
      el.appendChild(gap);
      return;
    }
    if (slot.type === 'apostrophe') {
      const apos = document.createElement('div');
      apos.textContent = "'";
      apos.style.cssText = 'font-size:clamp(2em,8vmin,4em);font-weight:bold;color:#555;align-self:flex-start;padding-top:4px;';
      el.appendChild(apos);
      return;
    }
    const div = document.createElement('div');
    const isTarget = i === targetIdx;
    const bg = slot.locked ? '#c8f7c5' : slot.error ? '#ffd0cc' : isTarget ? '#fff9c4' : '#f0f0f0';
    const border = slot.locked ? '3px solid #4caf50' : slot.error ? '3px solid #e53935' : isTarget ? '3px solid #f9a825' : '3px solid #ccc';
    div.style.cssText = `width:clamp(40px,10vmin,72px);height:clamp(48px,12vmin,88px);border-radius:10px;background:${bg};border:${border};display:flex;align-items:center;justify-content:center;font-size:clamp(1.8em,7vmin,3.5em);font-weight:bold;color:#333;transition:background 0.2s,border 0.2s;user-select:none;`;
    div.textContent = slot.locked || slot.error ? (slot.placed || '') : '';
    el.appendChild(div);
  });
}

function renderTiles() {
  const el = document.getElementById('wb-tiles');
  if (!el) return;
  el.innerHTML = '';
  state.tiles.forEach(letter => {
    const btn = document.createElement('button');
    btn.textContent = letter;
    btn.style.cssText = 'width:clamp(36px,9vmin,64px);height:clamp(36px,9vmin,64px);border-radius:10px;background:#fff;border:2px solid #bbb;font-size:clamp(1.2em,4vmin,2.2em);font-weight:bold;color:#333;cursor:pointer;touch-action:manipulation;transition:transform 0.1s,background 0.1s;';
    btn.addEventListener('pointerdown', () => {
      btn.style.transform = 'scale(0.9)';
      btn.style.background = '#e3f2fd';
    });
    btn.addEventListener('pointerup', () => {
      btn.style.transform = '';
      btn.style.background = '#fff';
      placeLetter(letter);
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
      btn.style.background = '#fff';
    });
    el.appendChild(btn);
  });
}

function renderActions(complete) {
  const el = document.getElementById('wb-actions');
  if (!el) return;
  el.innerHTML = '';
  const btnStyle = 'padding:clamp(8px,2vmin,14px) clamp(20px,5vmin,40px);border-radius:12px;border:none;font-size:clamp(1em,3vmin,1.5em);font-weight:bold;cursor:pointer;touch-action:manipulation;';
  if (complete) {
    const next = document.createElement('button');
    next.textContent = 'Next word';
    next.style.cssText = btnStyle + 'background:#4caf50;color:#fff;margin-right:12px;';
    next.addEventListener('click', nextWord);
    el.appendChild(next);
  }
  const rst = document.createElement('button');
  rst.textContent = 'Try again';
  rst.style.cssText = btnStyle + 'background:#e0e0e0;color:#333;';
  rst.addEventListener('click', reset);
  el.appendChild(rst);
}
