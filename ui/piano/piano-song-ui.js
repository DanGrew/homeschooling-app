var SONG_NOTE_MAP = {
  'C':  {note:'C4', color:'#FFB3B3'},
  'D':  {note:'D4', color:'#FFCBA4'},
  'E':  {note:'E4', color:'#FFF0A3'},
  'F':  {note:'F4', color:'#B3FFB3'},
  'G':  {note:'G4', color:'#A3D9FF'},
  'A':  {note:'A4', color:'#B3C6FF'},
  'B':  {note:'B4', color:'#E0B3FF'},
  '^C': {note:'C5', color:'#FFB3E6'},
  '^D': {note:'D5', color:'#B3FFEE'},
  '^E': {note:'E5', color:'#D4FFB3'},
  '^F': {note:'F5', color:'#FFCCF2'},
  '^G': {note:'G5', color:'#C5F2CC'},
  '^A': {note:null,  color:'#ccc'},
  'Bb': {note:'Bb4', color:'#CCBBFF'},
  'F#': {note:'Gb4', color:'#D4D4FF'},
  '^C#':{note:'Cs5', color:'#D4FFEE'}
};

var _NO_NOTE_INFO = {note: null, color: '#ccc'};
var _CHIP_CLASS = {'true': 'note-chip playable', 'false': 'note-chip no-audio'};
var _ARROW_HIDDEN = {'true': 'nav-arrow hidden', 'false': 'nav-arrow'};
var _DOT_CLASS = {'true': 'verse-dot active', 'false': 'verse-dot'};

var _lessonSongs = [];
var _lessonSong = 0;
var _lessonVerse = 0;
var _lessonEl = {};
var _simplifications = {};

function _chipGlow(chip, color) {
  chip.style.transform = 'scale(1.2)';
  chip.style.filter = 'brightness(1.35) drop-shadow(0 0 6px ' + color + ')';
  clearTimeout(chip._t);
  chip._t = setTimeout(function() { chip.style.transform = ''; chip.style.filter = ''; }, 220);
}

function _addChipListener(chip, info) {
  chip.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    initAudio().then(function() { playNote(info.note, 1.0); }).catch(function() {});
    _chipGlow(chip, info.color);
  });
}

function makeSongChip(token) {
  var info = noteInfo(token, SONG_NOTE_MAP, _simplifications, _NO_NOTE_INFO);
  var suffix = ['*'].filter(function() { return info.simplified; }).join('');
  var chip = document.createElement('span');
  chip.className = _CHIP_CLASS[String(!!info.note)];
  var label = ([info.displayToken].filter(Boolean).concat([token]))[0];
  chip.textContent = label.replace('^', '\u2191') + suffix;
  chip.style.background = info.color;
  [info].filter(function(i) { return i.note; }).forEach(function() { _addChipListener(chip, info); });
  return chip;
}

function _makeWordGroup(group) {
  var groupEl = document.createElement('div');
  groupEl.className = 'word-group';
  var chipsEl = document.createElement('div');
  chipsEl.className = 'note-chips';
  group.n.forEach(function(token) { chipsEl.appendChild(makeSongChip(token)); });
  var lyricEl = document.createElement('div');
  lyricEl.className = 'lyric';
  lyricEl.textContent = group.t;
  groupEl.appendChild(chipsEl);
  groupEl.appendChild(lyricEl);
  return groupEl;
}

function _makeLine(line) {
  var lineEl = document.createElement('div');
  lineEl.className = 'song-line';
  line.forEach(function(group) { lineEl.appendChild(_makeWordGroup(group)); });
  return lineEl;
}

function _makeVerse(verse) {
  var verseEl = document.createElement('div');
  verseEl.className = 'verse';
  verse.forEach(function(line) { verseEl.appendChild(_makeLine(line)); });
  return verseEl;
}

function renderFullSong(song, container) {
  container.innerHTML = '';
  song.verses.forEach(function(verse) { container.appendChild(_makeVerse(verse)); });
}

function _renderVerseInto(verse, container) {
  container.innerHTML = '';
  verse.forEach(function(line) { container.appendChild(_makeLine(line)); });
}

function _makeDot(i) {
  var dot = document.createElement('div');
  dot.className = _DOT_CLASS[String(i === _lessonVerse)];
  return dot;
}

function _renderDots() {
  _lessonEl.dots.innerHTML = '';
  _lessonSongs[_lessonSong].verses.forEach(function(_, i) { _lessonEl.dots.appendChild(_makeDot(i)); });
}

function _updateArrows() {
  var last = _lessonSongs[_lessonSong].verses.length - 1;
  _lessonEl.prev.className = _ARROW_HIDDEN[String(_lessonVerse === 0)];
  _lessonEl.next.className = _ARROW_HIDDEN[String(_lessonVerse === last)];
}

function lessonGoTo(i) {
  _lessonVerse = i;
  _renderVerseInto(_lessonSongs[_lessonSong].verses[i], _lessonEl.display);
  _updateArrows();
  _renderDots();
}

function lessonLoadSong(idx) {
  _lessonSong = idx;
  lessonGoTo(0);
}

function lessonPrev() {
  [_lessonVerse].filter(function(v) { return v > 0; }).forEach(function() { lessonGoTo(_lessonVerse - 1); });
}

function lessonNext() {
  var last = _lessonSongs[_lessonSong].verses.length - 1;
  [_lessonVerse].filter(function(v) { return v < last; }).forEach(function() { lessonGoTo(_lessonVerse + 1); });
}

function buildSongSelector(songs, selectorEl, onChangeFn) {
  songs.forEach(function(song, i) {
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = song.title;
    selectorEl.appendChild(opt);
  });
  selectorEl.addEventListener('change', function() { onChangeFn(Number(selectorEl.value)); });
}

function initSongLesson(songs, els) {
  _lessonSongs = songs;
  _lessonEl = els;
  [els.selector].filter(Boolean).forEach(function(sel) { buildSongSelector(songs, sel, lessonLoadSong); });
  lessonLoadSong(0);
}

function initSongSheet(songs, selectorEl, sheetEl) {
  buildSongSelector(songs, selectorEl, function(idx) {
    renderFullSong(songs[idx], sheetEl);
    sheetEl.scrollTop = 0;
  });
  renderFullSong(songs[0], sheetEl);
}

function buildSongNavButton(songs, barEl, onSelect) {
  var container = window.__buildNavPopout('&#128218;', 'Songs', 190, songs.map(function(s) { return s.title; }), onSelect);
  barEl.insertBefore(container, barEl.lastElementChild);
}

function loadPianoSongs(basePath, onLoaded) {
  fetch(basePath + 'simplifications.json')
    .then(function(r) { return r.json(); })
    .then(function(s) { _simplifications = s; return fetch(basePath + 'index.json'); })
    .then(function(r) { return r.json(); })
    .then(function(files) {
      return Promise.all(files.map(function(f) {
        return fetch(basePath + f).then(function(r) { return r.json(); });
      }));
    })
    .then(onLoaded)
    .catch(function() {});
}
