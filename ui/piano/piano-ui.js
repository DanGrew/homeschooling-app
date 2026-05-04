// arch: allow-cyclomatic
// initAudio: lazy AudioContext creation requires a user gesture (browser spec);
// _initPromise memoisation prevents re-decoding on every keypress.
// Both || operators are browser lifecycle constraints, not moveable to core.

var _audioCtx = null;
var _audioBuffers = {};
var _rawBuffers = {};
var _initPromise = null;

// Prefetch raw bytes before first keypress to minimise audio latency.
// Called once at load; no memoisation guard needed.
Promise.all(PIANO_CONFIG.NOTES.map(function(note) {
  return fetch('../../assets/audio/piano/' + note + '.wav')
    .then(function(r) { return r.arrayBuffer(); })
    .then(function(buf) { _rawBuffers[note] = buf; })
    .catch(function() {});
}));

var GLOW_BG = { hit: '#FFD700', miss: '#FF4444' };

function initAudio() {
  _audioCtx = _audioCtx || new AudioContext();
  _initPromise = _initPromise || _audioCtx.resume().then(function() {
    PIANO_CONFIG.NOTES.forEach(function(note) {
      _audioBuffers[note] = _audioCtx.createBuffer(1, 1, 22050);
    });
    return Promise.all(PIANO_CONFIG.NOTES.map(function(note) {
      return _audioCtx.decodeAudioData(_rawBuffers[note] || new ArrayBuffer(0))
        .then(function(decoded) { _audioBuffers[note] = decoded; })
        .catch(function() {});
    }));
  });
  return _initPromise;
}

// Callers always go through initAudio().then(() => playNote(...)).
// _audioBuffers[note] is guaranteed to be a valid AudioBuffer (real or silent fallback).
function playNote(noteName, volume) {
  var src = _audioCtx.createBufferSource();
  src.buffer = _audioBuffers[noteName];
  var gain = _audioCtx.createGain();
  gain.gain.value = volume;
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
    key._origBg = PIANO_CONFIG.KEY_COLORS[i];
    key.style.cssText = 'flex:1;height:100%;background:' + PIANO_CONFIG.KEY_COLORS[i] + ';border-radius:0 0 14px 14px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;font-size:clamp(14px,3vw,20px);font-weight:bold;color:#555;cursor:pointer;user-select:none;touch-action:none;border:2px solid rgba(0,0,0,0.08);box-sizing:border-box';
    key.textContent = PIANO_CONFIG.NOTE_LABELS[i];
    key.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      onKeyPress(i, note, key);
    });
    container.appendChild(key);
  });
}

function glowKey(keyEl, type) {
  keyEl.style.background = GLOW_BG[type];
  keyEl.style.filter = 'brightness(1.3) drop-shadow(0 0 16px ' + GLOW_BG[type] + ')';
  keyEl.style.transform = 'scaleY(0.93)';
  clearTimeout(keyEl._glowTimer);
  keyEl._glowTimer = setTimeout(function() {
    keyEl.style.background = keyEl._origBg;
    keyEl.style.filter = '';
    keyEl.style.transform = '';
  }, 300);
}
