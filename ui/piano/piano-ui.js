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

function _decodeNote(ctx, note) {
  return [_rawBuffers[note]]
    .filter(Boolean)
    .filter(function(r) { return r.byteLength; })
    .map(function(r) {
      return _decodeBuffer(ctx, r.slice(0))
        .then(function(decoded) { _audioBuffers[note] = decoded; })
        .catch(function() {});
    })
    .concat([Promise.resolve()])[0];
}

function _decodeAll(ctx) {
  return Promise.all(PIANO_CONFIG.NOTES.map(function(note) { return _decodeNote(ctx, note); }));
}

function _onCtxStateChange() {
  [_audioCtx]
    .filter(Boolean)
    .filter(function(c) { return c.state === 'running'; })
    .filter(function() { return _initDone; })
    .forEach(function(c) { _decodeAll(c); });
}

function _unlock(ctx) {
  // Plays a silent 1-sample buffer — primes the iOS audio pipeline after resume()
  var buf = ctx.createBuffer(1, 1, 22050);
  var src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
}

function _resumeOnTouch() {
  // touchstart fires before pointerdown — resume here so context is running by play time
  [_audioCtx]
    .filter(Boolean)
    .filter(function(c) { return c.state !== 'running'; })
    .forEach(function(c) { c.resume(); });
}

var initAudio = once(function() {
  _audioCtx = new AudioCtx();
  _audioCtx.addEventListener('statechange', _onCtxStateChange);
  document.addEventListener('touchstart', _resumeOnTouch, { passive: true });
  return _audioCtx.resume()
    .then(function() { _unlock(_audioCtx); return _decodeAll(_audioCtx); })
    .then(function() { _initDone = true; })
    .catch(function() {});
});

function _play(decoded, volume) {
  var src = _audioCtx.createBufferSource();
  src.buffer = decoded;
  var gain = _audioCtx.createGain();
  gain.gain.value = volume;
  src.connect(gain);
  gain.connect(_audioCtx.destination);
  src.start();
}

function _playFromRaw(noteName, volume) {
  return [_rawBuffers[noteName]]
    .filter(Boolean)
    .filter(function(r) { return r.byteLength; })
    .map(function(r) {
      return _decodeBuffer(_audioCtx, r.slice(0))
        .then(function(d) { _audioBuffers[noteName] = d; _play(d, volume); })
        .catch(function() {});
    })
    .concat([Promise.resolve()])[0];
}

var _PLAY_READY = {
  'true':  function(noteName, volume) { _play(_audioBuffers[noteName], volume); return Promise.resolve(); },
  'false': _playFromRaw
};

function _playWhenReady(noteName, volume) {
  return _PLAY_READY[String(!!_audioBuffers[noteName])](noteName, volume);
}

function playNote(noteName, volume) {
  return [_audioCtx].filter(Boolean)
    .map(function(ctx) {
      return ctx.resume().then(function() { return _playWhenReady(noteName, volume); }).catch(function() {});
    })
    .concat([Promise.resolve()])[0];
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
