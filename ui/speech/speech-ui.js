import { bestVoice } from '../../core/word-lesson/word-lesson-core.js';

export function speak(word) {
  [word].filter(Boolean).forEach(word => {
    var u = new SpeechSynthesisUtterance(word);
    u.rate = 1.0; u.pitch = 1.1;
    [bestVoice(speechSynthesis.getVoices())].filter(Boolean).forEach(v => { u.voice = v; });
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}
