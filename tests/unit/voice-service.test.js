import { describe, it, expect } from 'vitest';
import { resolveVoice } from '../../ui/speech/voice-service.js';

var enGB  = { lang: 'en-GB', name: 'Karen', localService: true };
var enUS  = { lang: 'en-US', name: 'Alex',  localService: true };
var frFR  = { lang: 'fr-FR', name: 'Thomas', localService: true };

describe('resolveVoice — iOS', () => {
  it('returns null regardless of available voices', () => {
    expect(resolveVoice(true, [enGB, enUS])).toBeNull();
  });

  it('returns null even with no voices', () => {
    expect(resolveVoice(true, [])).toBeNull();
  });
});

describe('resolveVoice — non-iOS', () => {
  it('returns best voice from list', () => {
    expect(resolveVoice(false, [enGB, enUS])).toBe(enGB);
  });

  it('returns null when no voices available', () => {
    expect(resolveVoice(false, [])).toBeNull();
  });

  it('falls back when no en-GB voice', () => {
    expect(resolveVoice(false, [enUS, frFR])).toBe(enUS);
  });
});
