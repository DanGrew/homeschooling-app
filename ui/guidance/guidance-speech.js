import { setGuidancePriority } from '../speech/speech-ui.js';

function _isLocal(v)  { return v.localService; }
function _isEnGB(v)   { return v.lang === 'en-GB'; }
function _isEn(v)     { return v.lang.startsWith('en'); }
function _isFemale(v) { return /female|woman|girl|samantha|karen|serena|moira|kate|nicky/i.test(v.name); }

var VOICE_STRATEGIES = [
  function(vs) { return vs.filter(_isLocal).filter(_isEnGB).filter(_isFemale)[0]; },
  function(vs) { return vs.filter(_isLocal).filter(_isEn).filter(_isFemale)[0]; },
  function(vs) { return vs.filter(_isLocal).filter(_isEn)[0]; },
  function(vs) { return vs.filter(_isEn)[0]; }
];

function _guidanceVoice() {
  var vs = speechSynthesis.getVoices();
  return VOICE_STRATEGIES.map(function(f) { return f(vs); }).filter(Boolean)[0];
}

function _utt(text) {
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = 1.0; u.pitch = 1.1;
  [_guidanceVoice()].filter(Boolean).forEach(function(v) { u.voice = v; });
  return u;
}

function _clearPriority() { setGuidancePriority(false); }

function _doSpeak(text) {
  setGuidancePriority(true);
  var u = _utt(text);
  u.onend = _clearPriority;
  u.onerror = _clearPriority;
  speechSynthesis.resume();
  speechSynthesis.speak(u);
}

export var GuidanceSpeech = {
  speak: function(text) {
    speechSynthesis.cancel();
    [text].filter(Boolean).forEach(_doSpeak);
  },
  stop: function() {
    speechSynthesis.cancel();
    _clearPriority();
  }
};
