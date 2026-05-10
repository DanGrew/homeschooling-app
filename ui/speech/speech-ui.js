import { getVoice } from './voice-service.js';

var _LS = { 'true': function() { return localStorage.getItem('parental.audio'); }, 'false': function() { return ''; } };
var _VALID_MODE = { full: 1, off: 1, quiet: 1 };
var _stored = _LS[String(typeof localStorage !== 'undefined')]();
var _mode = [_stored].filter(function(m) { return _VALID_MODE[m]; }).concat(['full'])[0];

var MODE_ENABLED = { 'true': 'full', 'false': 'off' };

function _doSpeak(text) {
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = 1.0; u.pitch = 1.1;
  [getVoice()].filter(Boolean).forEach(v => { u.voice = v; });
  speechSynthesis.resume();
  speechSynthesis.speak(u);
}

var SPEAK_ACTION = {
  'off':   () => {},
  'quiet': () => {},
  'full':  _doSpeak
};

export function setMode(mode) { _mode = mode; }
export function setEnabled(on) { _mode = MODE_ENABLED[String(!!on)]; }
export function stop() { speechSynthesis.cancel(); }
export function speak(text) { [text].filter(Boolean).forEach(t => SPEAK_ACTION[_mode](t)); }
