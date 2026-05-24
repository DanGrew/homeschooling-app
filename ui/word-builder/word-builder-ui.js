import { parseWord, buildTileSet, validateLetter, isWordComplete, slotKey } from '../../core/word-builder/word-builder-core.js';
import { makeSpeakable } from '../../components/speech/speakable.js';
import { playSound, deriveLetterSounds } from '../../components/phonics/phonics-service.js';

var NO_ITEM = { name: '', url: '' };

var state = {
  mode: 'distractors',
  slots: [],
  tiles: [],
  showPicture: true,
  currentItem: NO_ITEM,
  speakFn: function() {},
  onNextWord: function() {},
};

export function init(speakFn, onNextWord) {
  state.speakFn = speakFn;
  state.onNextWord = onNextWord;
}

var START_DISPATCH = {
  'true': function(item) {
    state.currentItem = item;
    var word = item.name;
    state.slots = parseWord(word).map(function(t) { return Object.assign({}, t, { placed: null, locked: false, display: '' }); });
    state.tiles = buildTileSet(word, state.mode);
    render();
    state.speakFn(word, 'word');
  },
  'false': function() {}
};

export function startRound(item) {
  START_DISPATCH[String(item !== undefined)](item);
}

export function setMode(mode) {
  state.mode = mode;
  startRound(state.currentItem);
}

export function togglePicture() {
  state.showPicture = !state.showPicture;
  renderPicture();
}

export function reset() {
  var word = state.currentItem.name;
  state.slots = parseWord(word).map(function(t) { return Object.assign({}, t, { placed: null, locked: false, display: '' }); });
  render();
  state.speakFn(word, 'word');
}

var SLOT_ACTIVE = { letter: function(s) { return !s.locked; }, space: function() { return false; }, apostrophe: function() { return false; } };
function isActiveSlot(s) { return SLOT_ACTIVE[s.type](s); }
function currentTargetIndex() { return state.slots.findIndex(isActiveSlot); }

var PLACE_ACTION = {
  'true': function(slot, letter) { slot.locked = true; slot.placed = letter.toUpperCase(); slot.display = letter.toUpperCase(); },
  'false': function(slot, letter) { slot.placed = letter.toUpperCase(); slot.display = letter.toUpperCase(); slot.error = true; }
};

var COMPLETE_ACTION = {
  'true': function() {
    var word = state.currentItem.name;
    setTimeout(function() { state.speakFn(word, 'word'); }, 300);
    renderActions();
  },
  'false': function() {}
};

var VALID_SLOT = {
  'true': function() {},
  'false': function(letter) {
    var slot = state.slots[currentTargetIndex()];
    PLACE_ACTION[String(validateLetter(slot.char, letter))](slot, letter);
    renderSlots();
    COMPLETE_ACTION[String(isWordComplete(state.slots))]();
  }
};

function tryPlace(letter) { VALID_SLOT[String(currentTargetIndex() === -1)](letter); }

function render() { renderPicture(); renderSlots(); renderTiles(); renderActions(); }

var PICTURE_DISPLAY = { 'true': 'flex', 'false': 'none' };
var IMG_DISPLAY = { 'true': '', 'false': 'none' };
var BTN_LABEL = { 'true': 'Hide picture', 'false': 'Show picture' };

function renderPicture() {
  var src = state.currentItem.url;
  var img = document.getElementById('wb-picture').querySelector('img');
  img.src = src;
  img.alt = state.currentItem.name;
  img.style.display = IMG_DISPLAY[String(src.length > 0)];
  document.getElementById('wb-picture').style.display = PICTURE_DISPLAY[String(state.showPicture)];
  document.getElementById('wb-picture-toggle').textContent = BTN_LABEL[String(state.showPicture)];
}

var SLOT_BG = { locked: '#c8f7c5', error: '#ffd0cc', target: '#fff9c4', default: '#f0f0f0' };
var SLOT_BORDER = { locked: '3px solid #4caf50', error: '3px solid #e53935', target: '3px solid #f9a825', default: '3px solid #ccc' };


var SLOT_RENDER = {
  space: function(el) {
    var gap = document.createElement('div');
    gap.style.cssText = 'width:clamp(16px,4vmin,32px);flex-shrink:0;';
    el.appendChild(gap);
  },
  apostrophe: function(el) {
    var apos = document.createElement('div');
    apos.textContent = "'";
    apos.style.cssText = 'font-size:clamp(2em,8vmin,4em);font-weight:bold;color:#555;align-self:flex-start;padding-top:4px;';
    el.appendChild(apos);
  },
  letter: function(el, slot, isTarget) {
    var key = slotKey(slot, isTarget);
    var div = document.createElement('div');
    div.style.cssText = 'width:clamp(40px,10vmin,72px);height:clamp(48px,12vmin,88px);border-radius:10px;background:' + SLOT_BG[key] + ';border:' + SLOT_BORDER[key] + ';display:flex;align-items:center;justify-content:center;font-size:clamp(1.8em,7vmin,3.5em);font-weight:bold;color:#333;transition:background 0.2s,border 0.2s;user-select:none;';
    div.textContent = slot.display;
    el.appendChild(div);
  }
};

function renderSlots() {
  var el = document.getElementById('wb-slots');
  el.innerHTML = '';
  var targetIdx = currentTargetIndex();
  state.slots.forEach(function(slot, i) { SLOT_RENDER[slot.type](el, slot, i === targetIdx); });
}

var TILE_STYLE = 'width:clamp(36px,9vmin,64px);height:clamp(36px,9vmin,64px);border-radius:10px;background:#fff;border:2px solid #bbb;font-size:clamp(1.2em,4vmin,2.2em);font-weight:bold;color:#333;cursor:pointer;touch-action:manipulation;transition:transform 0.1s,background 0.1s;';

function makeTile(letter, soundId) {
  var btn = document.createElement('button');
  btn.textContent = letter;
  btn.style.cssText = TILE_STYLE;
  if (soundId) {
    btn.addEventListener('pointerup', function() { playSound(soundId); });
  } else {
    makeSpeakable(btn, letter);
  }
  btn.addEventListener('pointerdown', function() { btn.style.transform = 'scale(0.9)'; btn.style.background = '#e3f2fd'; });
  btn.addEventListener('pointerup', function() { btn.style.transform = ''; btn.style.background = '#fff'; tryPlace(letter); });
  btn.addEventListener('pointerleave', function() { btn.style.transform = ''; btn.style.background = '#fff'; });
  return btn;
}

function renderTiles() {
  var el = document.getElementById('wb-tiles');
  el.innerHTML = '';
  state.tiles.forEach(function(letter) {
    var soundIds = deriveLetterSounds(letter);
    el.appendChild(makeTile(letter, soundIds[0]));
  });
}

var BTN_STYLE = 'padding:clamp(8px,2vmin,14px) clamp(20px,5vmin,40px);border-radius:12px;border:none;font-size:clamp(1em,3vmin,1.5em);font-weight:bold;cursor:pointer;touch-action:manipulation;';

function renderActions() {
  var el = document.getElementById('wb-actions');
  el.innerHTML = '';
  var spk = document.createElement('button');
  spk.textContent = 'Speak';
  spk.style.cssText = BTN_STYLE + 'background:#e0e0e0;color:#333;';
  makeSpeakable(spk, function() { return state.currentItem.name; });
  el.appendChild(spk);
}
