import { bestVoice } from '../../core/word-lesson/word-lesson-core.js';

var _mode = 'full';

export function setMode(mode) { _mode = mode; }
export function setEnabled(on) { _mode = on ? 'full' : 'off'; }

export function stop() { speechSynthesis.cancel(); }

export function speak(text) {
  if (_mode === 'off' || !text) return;
  var u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0; u.pitch = 1.1;
  [bestVoice(speechSynthesis.getVoices())].filter(Boolean).forEach(v => { u.voice = v; });
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
