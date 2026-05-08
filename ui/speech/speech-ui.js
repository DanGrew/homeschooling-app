import { bestVoice } from '../../core/word-lesson/word-lesson-core.js';

var _mode = 'full';

var MODE_ENABLED = { 'true': 'full', 'false': 'off' };

var SPEAK_ACTION = {
  'off':   () => {},
  'quiet': () => {},
  'full':  (text) => {
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1.1;
    [bestVoice(speechSynthesis.getVoices())].filter(Boolean).forEach(v => { u.voice = v; });
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
};

export function setMode(mode) { _mode = mode; }
export function setEnabled(on) { _mode = MODE_ENABLED[String(!!on)]; }
export function stop() { speechSynthesis.cancel(); }
export function speak(text) { [text].filter(Boolean).forEach(t => SPEAK_ACTION[_mode](t)); }
