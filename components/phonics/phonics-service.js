import { createAudioCtx, decodeAudioBuffer } from '../../ui/shared/audio-ctx.js';
import { buildSoundIndex, getAssetPath as coreGetAssetPath, deriveLetterSounds as coreDerive } from '../../core/phonics/phonics-core.js';

var _ctx = null;
var _graphemes = {};
var _soundIndex = {};
var _manifest = {};
var _rawBuffers = {};
var _decoded = {};

export function initAudio() {
  if (_ctx) return;
  _ctx = createAudioCtx();
  document.addEventListener('touchstart', function() {
    if (_ctx.state !== 'running') _ctx.resume();
  }, { passive: true });
}

export function loadGraphemes(registryPath, manifestPath, audioBasePath) {
  return Promise.all([
    fetch(registryPath).then(function(r) { return r.json(); }),
    fetch(manifestPath).then(function(r) { return r.json(); })
  ]).then(function(results) {
    _graphemes = results[0];
    _manifest = results[1];
    _soundIndex = buildSoundIndex(_graphemes);
    var seen = {};
    var fetches = [];
    Object.keys(_manifest).forEach(function(clipId) {
      var filename = _manifest[clipId];
      if (!seen[filename]) {
        seen[filename] = true;
        fetches.push(
          fetch(audioBasePath + filename)
            .then(function(r) { return r.arrayBuffer(); })
            .then(function(buf) { _rawBuffers[filename] = buf; })
            .catch(function() {})
        );
      }
    });
    return Promise.all(fetches);
  });
}

function _playBuffer(filename) {
  if (_decoded[filename]) {
    var src = _ctx.createBufferSource();
    src.buffer = _decoded[filename];
    src.connect(_ctx.destination);
    src.start();
    return;
  }
  decodeAudioBuffer(_ctx, _rawBuffers[filename].slice(0))
    .then(function(buf) {
      _decoded[filename] = buf;
      var src = _ctx.createBufferSource();
      src.buffer = buf;
      src.connect(_ctx.destination);
      src.start();
    })
    .catch(function() {});
}

function _tts(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(text));
}

export function playSound(soundId) {
  var entry = _soundIndex[soundId];
  if (!entry) { _tts(soundId); return; }
  var filename = _manifest[entry.clipId];
  if (!filename || !_rawBuffers[filename]) { _tts(entry.characters); return; }
  if (!_ctx) { _tts(entry.characters); return; }
  _ctx.resume().then(function() { _playBuffer(filename); }).catch(function() {});
}

export function playSequence(soundIds, gapMs) {
  var gap = gapMs !== undefined ? gapMs : 200;
  soundIds.forEach(function(id, i) {
    setTimeout(function() { playSound(id); }, i * gap);
  });
}

export var getAssetPath = function(graphemeId) {
  return coreGetAssetPath(_graphemes, graphemeId);
};

export var deriveLetterSounds = function(word) {
  return coreDerive(_graphemes, word);
};

export function _reset() {
  _ctx = null;
  _graphemes = {};
  _soundIndex = {};
  _manifest = {};
  _rawBuffers = {};
  _decoded = {};
}
