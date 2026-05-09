import { describe, it, expect, beforeEach, vi } from 'vitest';
import { speak, stop, setMode, setEnabled } from '../../ui/speech/speech-ui.js';

var cancelSpy, speakSpy;

beforeEach(() => {
  cancelSpy = vi.fn();
  speakSpy = vi.fn();
  global.speechSynthesis = { cancel: cancelSpy, speak: speakSpy, resume: vi.fn(), getVoices: vi.fn().mockReturnValue([]) };
  global.SpeechSynthesisUtterance = vi.fn().mockImplementation(function(text) { this.text = text; });
  setMode('full');
});

describe('speak', () => {
  it('speaks', () => {
    speak('hello');
    expect(speakSpy).toHaveBeenCalled();
  });

  it('does nothing when text is empty', () => {
    speak('');
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it('does nothing when text is null', () => {
    speak(null);
    expect(speakSpy).not.toHaveBeenCalled();
  });
});

describe('setMode', () => {
  it('off suppresses speech', () => {
    setMode('off');
    speak('hello');
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it('quiet suppresses speech', () => {
    setMode('quiet');
    speak('hello');
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it('full allows speech', () => {
    setMode('off');
    setMode('full');
    speak('hello');
    expect(speakSpy).toHaveBeenCalled();
  });
});

describe('setEnabled', () => {
  it('false suppresses speech', () => {
    setEnabled(false);
    speak('hello');
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it('true restores speech', () => {
    setEnabled(false);
    setEnabled(true);
    speak('hello');
    expect(speakSpy).toHaveBeenCalled();
  });
});

describe('stop', () => {
  it('calls cancel', () => {
    stop();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
