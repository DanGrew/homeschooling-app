var _audioCtx = null;
var _audioBuffers = {};
var _rawBuffers = {};
var _initDone = false;
var AudioCtx = window.AudioContext || window.webkitAudioContext;

var GLOW_BG = { hit: '#FFD700', miss: '#FF4444' };

PIANO_CONFIG.NOTES.forEach(function(note) {
  fetch('../../assets/audio/piano/' + note + '.wav')
    .then(function(r) { return r.arrayBuffer(); })
    .then(function(buf) { _rawBuffers[note] = buf; })
    .catch(function() {});
});

function _decodeBuffer(ctx, buf) {
  // Callback form covers iOS <14.5 where decodeAudioData returns undefined (no promise)
  return new Promise(function(resolve, reject) {
    ctx.decodeAudioData(buf, resolve, reject);
  });
}

function _decodeAll(ctx) {
  return Promise.all(PIANO_CONFIG.NOTES.map(function(note) {
    var raw = _rawBuffers[note];
    if (!raw || !raw.byteLength) return Promise.resolve();
    // slice(0) passes a copy — original stays intact for future context recreations
    return _decodeBuffer(ctx, raw.slice(0))
      .then(function(decoded) { _audioBuffers[note] = decoded; })
      .catch(function() {});
  }));
}

var initAudio = once(function() {
  try { _audioCtx = new AudioCtx(); } catch(e) { return Promise.reject(e); }
  _audioCtx.addEventListener('statechange', function() {
    // iOS: fires running after interrupted (phone call ended, Siri dismissed, app foregrounded)
    // _initDone guard avoids double-decode on the initial resume
    if (_audioCtx && _audioCtx.state === 'running' && _initDone) _decodeAll(_audioCtx);
  });
  return _audioCtx.resume()
    .then(function() { return _decodeAll(_audioCtx); })
    .then(function() { _initDone = true; })
    .catch(function() {});
});

function _play(decoded, volume) {
  try {
    var src = _audioCtx.createBufferSource();
    src.buffer = decoded;
    var gain = _audioCtx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(_audioCtx.destination);
    src.start();
  } catch(e) {}
}

function playNote(noteName, volume) {
  if (!_audioCtx) return Promise.resolve();
  return _audioCtx.resume().then(function() {
    var decoded = _audioBuffers[noteName];
    if (decoded) { _play(decoded, volume); return; }
    // Lazy decode: raw buffer arrived after initAudio already ran
    var raw = _rawBuffers[noteName];
    if (!raw || !raw.byteLength) return;
    return _decodeBuffer(_audioCtx, raw.slice(0))
      .then(function(d) { _audioBuffers[noteName] = d; _play(d, volume); })
      .catch(function() {});
  }).catch(function() {});
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
