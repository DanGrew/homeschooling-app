import { getVoice } from './voice-service.js';

var _mode = 'full';
var _guidancePriority = false;

export function setGuidancePriority(on) { _guidancePriority = on; }

var MODE_ENABLED = { 'true': 'full', 'false': 'off' };

function _doSpeak(text) {
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = 1.0; u.pitch = 1.1;
  [getVoice()].filter(Boolean).forEach(v => { u.voice = v; });
  speechSynthesis.resume();
  speechSynthesis.speak(u);
}

var PRIORITY_SPEAK = {
  'true':  () => {},
  'false': _doSpeak
};

var SPEAK_ACTION = {
  'off':   () => {},
  'quiet': () => {},
  'full':  (text) => PRIORITY_SPEAK[String(_guidancePriority)](text)
};

export function setMode(mode) { _mode = mode; }
export function setEnabled(on) { _mode = MODE_ENABLED[String(!!on)]; }
export function stop() { speechSynthesis.cancel(); }
export function speak(text) { [text].filter(Boolean).forEach(t => SPEAK_ACTION[_mode](t)); }
