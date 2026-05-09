import { bestVoice } from '../../core/word-lesson/word-lesson-core.js';

var _voices = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : [];
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener('voiceschanged', function() { _voices = speechSynthesis.getVoices(); });
}

var _isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

var VOICE_RESOLVE = {
  'true':  function(vs) { return null; },
  'false': function(vs) { return bestVoice(vs); }
};

export function resolveVoice(isIOS, voices) { return VOICE_RESOLVE[String(isIOS)](voices); }
export function getVoice() { return resolveVoice(_isIOS, _voices); }
