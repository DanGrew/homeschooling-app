import { buildSoundIndex, getAssetPath as coreGetAssetPath, deriveLetterSounds as coreDerive, graphemeIdForChar as coreGraphemeIdForChar } from '../../core/phonics/phonics-core.js';

var _DEFAULT_REGISTRY   = new URL('../../content/phonics/graphemes.json', import.meta.url).href;
var _DEFAULT_MANIFEST   = new URL('../../content/phonics/manifest.json',   import.meta.url).href;
var _DEFAULT_AUDIO_BASE = new URL('../../assets/audio/phonics/',            import.meta.url).href;
var _DEFAULT_ASSET_BASE = new URL('../../',                                 import.meta.url).href;

function _createCtx() {
  var Cls = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  return new Cls();
}
function _decodeBuffer(ctx, buf) {
  return new Promise(function(resolve, reject) { ctx.decodeAudioData(buf, resolve, reject); });
}

var _ctx = null;
var _graphemes = {};
var _soundIndex = {};
var _manifest = {};
var _rawBuffers = {};
var _decoded = {};
var _assetBase = '';

export function initAudio() {
  if (_ctx) return;
  _ctx = _createCtx();
  document.addEventListener('touchstart', function() {
    if (_ctx.state !== 'running') _ctx.resume();
  }, { passive: true });
}

export function loadRegistry(registryPath, assetBasePath) {
  var rPath = registryPath !== undefined ? registryPath : _DEFAULT_REGISTRY;
  var base  = assetBasePath !== undefined ? assetBasePath : _DEFAULT_ASSET_BASE;
  return fetch(rPath).then(function(r) { return r.json(); }).then(function(data) {
    _graphemes = data;
    _soundIndex = buildSoundIndex(_graphemes);
    _assetBase = base;
  });
}

export function loadGraphemes(registryPath, manifestPath, audioBasePath) {
  var rPath = registryPath !== undefined ? registryPath : _DEFAULT_REGISTRY;
  var mPath = manifestPath !== undefined ? manifestPath : _DEFAULT_MANIFEST;
  var aBase = audioBasePath !== undefined ? audioBasePath : _DEFAULT_AUDIO_BASE;
  return Promise.all([
    fetch(rPath).then(function(r) { return r.json(); }),
    fetch(mPath).then(function(r) { return r.json(); })
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
          fetch(aBase + filename)
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
  _decodeBuffer(_ctx, _rawBuffers[filename].slice(0))
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

function _playBufferAsync(filename) {
  return new Promise(function(resolve) {
    function play(buf) {
      var src = _ctx.createBufferSource();
      src.buffer = buf;
      src.connect(_ctx.destination);
      src.onended = resolve;
      src.start();
    }
    if (_decoded[filename]) { play(_decoded[filename]); return; }
    _decodeBuffer(_ctx, _rawBuffers[filename].slice(0))
      .then(function(buf) { _decoded[filename] = buf; play(buf); })
      .catch(resolve);
  });
}

export function playSoundAsync(soundId) {
  var entry = _soundIndex[soundId];
  if (!entry) { _tts(soundId); return Promise.resolve(); }
  var filename = _manifest[entry.clipId];
  if (!filename || !_rawBuffers[filename]) { _tts(entry.characters); return Promise.resolve(); }
  if (!_ctx) { _tts(entry.characters); return Promise.resolve(); }
  return _ctx.resume().then(function() { return _playBufferAsync(filename); }).catch(function() { return Promise.resolve(); });
}

export function playSequence(soundIds, gapMs) {
  var gap = gapMs !== undefined ? gapMs : 200;
  soundIds.forEach(function(id, i) {
    setTimeout(function() { playSound(id); }, i * gap);
  });
}

export var getAssetPath = function(graphemeId) {
  var path = coreGetAssetPath(_graphemes, graphemeId);
  return path ? (_assetBase + path) : null;
};

export var getAssetPathForChar = function(char) {
  var id = coreGraphemeIdForChar(char);
  return id ? getAssetPath(id) : null;
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
  _assetBase = '';
}
