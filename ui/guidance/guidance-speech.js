import { cachedBestVoice } from '../speech/speech-ui.js';

var _mode = 'full';
var _lessonActive = false;

function _utt(text) {
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = 1.0; u.pitch = 1.1;
  var v = cachedBestVoice();
  if (v) u.voice = v;
  return u;
}

function _clearLesson() {
  _lessonActive = false;
  window._GUIDANCE_LESSON_SPEAKING = false;
}

export var GuidanceSpeech = {
  speak: function(text, source) {
    if (_mode === 'off' || !text) return;
    if (source === 'interaction' && _lessonActive) return;
    speechSynthesis.cancel();
    var u = _utt(text);
    if (source === 'lesson') {
      _lessonActive = true;
      window._GUIDANCE_LESSON_SPEAKING = true;
      u.onend = _clearLesson;
      u.onerror = _clearLesson;
    } else {
      _lessonActive = false;
      window._GUIDANCE_LESSON_SPEAKING = false;
    }
    speechSynthesis.resume();
    speechSynthesis.speak(u);
  },
  stop: function() {
    speechSynthesis.cancel();
    _clearLesson();
  },
  setMode: function(mode) { _mode = mode; }
};
