var _audioCtx = null;
var _audioBuffers = {};
var _rawBuffers = {};
var _initDone = false;

var GLOW_BG = { hit: '#FFD700', miss: '#FF4444' };

PIANO_CONFIG.NOTES.forEach(function(note) {
  fetch('../../../assets/audio/piano/' + note + '.ogg')
    .then(function(r) { return r.arrayBuffer(); })
    .then(function(buf) { _rawBuffers[note] = buf; })
    .catch(function() {});
});
var _PITCH_RATE = {};
PIANO_CONFIG.NOTES.forEach(function(n) { _PITCH_RATE[n] = {source: n, rate: 1}; });
PIANO_CONFIG.BLACK_KEYS.forEach(function(bk) {
  _PITCH_RATE[bk.note] = {source: bk.sourceNote, rate: Math.pow(2, bk.semitones / 12)};
});

function _decodeNote(ctx, note) {
  return [_rawBuffers[note]]
    .filter(Boolean)
    .filter(function(r) { return r.byteLength; })
    .map(function(r) {
      return decodeAudioBuffer(ctx, r.slice(0))
        .then(function(decoded) { _audioBuffers[note] = decoded; })
        .catch(function() {});
    })
    .concat([Promise.resolve()])[0];
}

function _onCtxStateChange() {
  [_audioCtx]
    .filter(Boolean)
    .filter(function(c) { return c.state === 'running'; })
    .filter(function() { return _initDone; })
    .forEach(function(c) { Promise.all(PIANO_CONFIG.NOTES.map(function(note) { return _decodeNote(c, note); })); });
}

function _resumeOnTouch() {
  // touchstart fires before pointerdown — resume here so context is running by play time
  [_audioCtx]
    .filter(Boolean)
    .filter(function(c) { return c.state !== 'running'; })
    .forEach(function(c) { c.resume(); });
}

var initAudio = once(function() {
  _audioCtx = createAudioCtx();
  _audioCtx.addEventListener('statechange', _onCtxStateChange);
  document.addEventListener('touchstart', _resumeOnTouch, { passive: true });
  return _audioCtx.resume()
    .then(function() { unlockAudioCtx(_audioCtx); return Promise.all(PIANO_CONFIG.NOTES.map(function(note) { return _decodeNote(_audioCtx, note); })); })
    .then(function() { _initDone = true; })
    .catch(function() {});
});

function _play(decoded, volume, rate) {
  var src = _audioCtx.createBufferSource();
  src.buffer = decoded;
  src.playbackRate.value = rate;
  var gain = _audioCtx.createGain();
  gain.gain.value = volume;
  src.connect(gain);
  gain.connect(_audioCtx.destination);
  src.start();
}

function _playFromRaw(noteName, volume, rate) {
  return [_rawBuffers[noteName]]
    .filter(Boolean)
    .filter(function(r) { return r.byteLength; })
    .map(function(r) {
      return decodeAudioBuffer(_audioCtx, r.slice(0))
        .then(function(d) { _audioBuffers[noteName] = d; _play(d, volume, rate); })
        .catch(function() {});
    })
    .concat([Promise.resolve()])[0];
}

var _PLAY_READY = {
  'true':  function(noteName, volume, rate) { _play(_audioBuffers[noteName], volume, rate); return Promise.resolve(); },
  'false': _playFromRaw
};

function _playWhenReady(noteName, volume, rate) {
  return _PLAY_READY[String(!!_audioBuffers[noteName])](noteName, volume, rate);
}

function playNote(noteName, volume) {
  var p = _PITCH_RATE[noteName];
  return [_audioCtx].filter(Boolean)
    .map(function(ctx) {
      return ctx.resume().then(function() { return _playWhenReady(p.source, volume, p.rate); }).catch(function() {});
    })
    .concat([Promise.resolve()])[0];
}

function renderKeys(container, onKeyPress) {
  container.style.display = 'flex';
  container.style.touchAction = 'none';
  PIANO_CONFIG.NOTES.forEach(function(note, i) {
    var key = document.createElement('div');
    key.id = 'key-' + note;
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

function renderBlackKeys(container, onKeyPress) {
  container.style.display = 'flex';
  var pos = 0;
  PIANO_CONFIG.BLACK_KEYS.forEach(function(bk) {
    var gap = document.createElement('div');
    gap.style.flex = String(bk.position - 0.5 - pos);
    container.appendChild(gap);
    var key = document.createElement('div');
    key.id = 'key-' + bk.note;
    key.dataset.note = bk.note;
    key._origBg = bk.color;
    key.style.cssText = 'flex:1;height:100%;background:' + bk.color + ';border-radius:0 0 8px 8px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;font-size:clamp(10px,2.5vw,14px);font-weight:bold;color:#444;cursor:pointer;user-select:none;touch-action:none;border:1.5px solid rgba(0,0,0,0.15);box-sizing:border-box;';
    key.textContent = bk.label;
    key.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      onKeyPress(bk, key);
    });
    container.appendChild(key);
    pos = bk.position + 0.5;
  });
  var trailingGap = document.createElement('div');
  trailingGap.style.flex = String(PIANO_CONFIG.WHITE_KEY_COUNT - pos);
  container.appendChild(trailingGap);
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
