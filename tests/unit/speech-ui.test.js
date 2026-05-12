import { describe, it, expect, beforeEach, vi } from 'vitest';
import { speak, speakInterrupt, queue, interrupt, stop, setMode, setEnabled } from '../../ui/speech/speech-ui.js';

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

describe('queue', () => {
  it('speaks without cancelling', () => {
    queue('hello');
    expect(speakSpy).toHaveBeenCalled();
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it('does nothing when text is empty', () => {
    queue('');
    expect(speakSpy).not.toHaveBeenCalled();
  });
});

describe('interrupt', () => {
  it('cancels then speaks', () => {
    interrupt('hello');
    expect(cancelSpy).toHaveBeenCalled();
    expect(speakSpy).toHaveBeenCalled();
  });
});

describe('speakInterrupt', () => {
  it('cancels then speaks', () => {
    speakInterrupt('hello');
    expect(cancelSpy).toHaveBeenCalled();
    expect(speakSpy).toHaveBeenCalled();
  });
});
