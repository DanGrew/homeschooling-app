var PIANO_CONFIG = {
  NOTES: ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5'],
  NOTE_LABELS: ['C','D','E','F','G','A','B','C','D','E'],
  KEY_COLORS: ['#FFB3B3','#FFCBA4','#FFF0A3','#B3FFB3','#A3D9FF','#B3C6FF','#E0B3FF','#FFB3E6','#B3FFEE','#D4FFB3'],
  HIT_WINDOW_MS: 400,
  LOOKAHEAD_MS: 4000,
  MIN_NOTE_GAP_MS: 1000,
  MAX_NOTE_GAP_MS: 3000,
  NOTE_COUNT: 10
};
PIANO_CONFIG.KEY_COUNT = PIANO_CONFIG.NOTES.length;

var _audioCtx = null;
var _audioBuffers = {};
var _audioLoaded = false;
var _rawBuffers = {};
var _prefetchPromise = null;

function _prefetchAudio() {
  if (_prefetchPromise) return _prefetchPromise;
  _prefetchPromise = Promise.all(PIANO_CONFIG.NOTES.map(function(note) {
    return fetch('../../assets/audio/piano/' + note + '.wav')
      .then(function(r) { return r.arrayBuffer(); })
      .then(function(buf) { _rawBuffers[note] = buf; })
      .catch(function() {});
  }));
  return _prefetchPromise;
}
_prefetchAudio();

function initAudio() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  var resume = _audioCtx.state === 'suspended' ? _audioCtx.resume() : Promise.resolve();
  if (_audioLoaded) return resume;
  return resume.then(function() {
    return _prefetchAudio().then(function() {
      return Promise.all(PIANO_CONFIG.NOTES.map(function(note) {
        var src = _rawBuffers[note]
          ? Promise.resolve(_rawBuffers[note])
          : fetch('../../assets/audio/piano/' + note + '.wav').then(function(r) { return r.arrayBuffer(); });
        return src
          .then(function(buf) { return _audioCtx.decodeAudioData(buf); })
          .then(function(decoded) { _audioBuffers[note] = decoded; })
          .catch(function() {});
      }));
    });
  }).then(function() { _audioLoaded = true; });
}

function playNote(noteName, volume) {
  if (!_audioCtx || !_audioBuffers[noteName]) return;
  var src = _audioCtx.createBufferSource();
  src.buffer = _audioBuffers[noteName];
  var gain = _audioCtx.createGain();
  gain.gain.value = volume == null ? 1.0 : volume;
  src.connect(gain);
  gain.connect(_audioCtx.destination);
  src.start();
}

function renderKeys(container, onKeyPress) {
  container.style.display = 'flex';
  container.style.touchAction = 'none';
  PIANO_CONFIG.NOTES.forEach(function(note, i) {
    var key = document.createElement('div');
    key.dataset.keyIndex = i;
    key.dataset.note = note;
    key.style.cssText = 'flex:1;height:100%;background:' + PIANO_CONFIG.KEY_COLORS[i] +
      ';border-radius:0 0 14px 14px;display:flex;align-items:flex-end;justify-content:center' +
      ';padding-bottom:8px;font-size:clamp(14px,3vw,20px);font-weight:bold;color:#555' +
      ';cursor:pointer;user-select:none;touch-action:none' +
      ';border:2px solid rgba(0,0,0,0.08);box-sizing:border-box';
    key.textContent = PIANO_CONFIG.NOTE_LABELS[i];
    key.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      onKeyPress(i, note, key);
    });
    container.appendChild(key);
  });
}

function glowKey(keyEl, type) {
  var bg = type === 'miss' ? '#FF4444' : '#FFD700';
  var orig = keyEl._origBg || keyEl.style.background;
  if (!keyEl._origBg) keyEl._origBg = orig;
  keyEl.style.background = bg;
  keyEl.style.filter = 'brightness(1.3) drop-shadow(0 0 16px ' + bg + ')';
  keyEl.style.transform = 'scaleY(0.93)';
  clearTimeout(keyEl._glowTimer);
  keyEl._glowTimer = setTimeout(function() {
    keyEl.style.background = keyEl._origBg;
    keyEl.style.filter = '';
    keyEl.style.transform = '';
  }, 300);
}
