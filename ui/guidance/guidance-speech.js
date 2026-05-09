import { setGuidancePriority, cachedBestVoice } from '../speech/speech-ui.js';

function _utt(text) {
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = 0.9; u.pitch = 1.0;
  [cachedBestVoice()].filter(Boolean).forEach(function(v) { u.voice = v; });
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
