// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../ui/speech/speech-ui.js', () => ({ speak: vi.fn() }));

import { makeSpeakable, makeSpeakableButton } from '../../ui/speech/speakable.js';
import { speak } from '../../ui/speech/speech-ui.js';

beforeEach(() => { vi.clearAllMocks(); });

describe('makeSpeakable', () => {
  it('adds speakable class', () => {
    const el = document.createElement('div');
    makeSpeakable(el, 'cat');
    expect(el.classList.contains('speakable')).toBe(true);
  });

  it('calls speak with string text on pointerdown', () => {
    const el = document.createElement('div');
    makeSpeakable(el, 'cat');
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(speak).toHaveBeenCalledWith('cat');
  });

  it('accepts function as text', () => {
    const el = document.createElement('div');
    makeSpeakable(el, () => 'dog');
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(speak).toHaveBeenCalledWith('dog');
  });

  it('reads function text at tap time not bind time', () => {
    const el = document.createElement('div');
    var label = 'dog';
    makeSpeakable(el, () => label);
    label = 'cat';
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(speak).toHaveBeenCalledWith('cat');
  });

  it('debounces rapid taps', () => {
    const el = document.createElement('div');
    makeSpeakable(el, 'cat');
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('adds speakable--tap class on tap', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    makeSpeakable(el, 'cat');
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(el.classList.contains('speakable--tap')).toBe(true);
    document.body.removeChild(el);
  });
});

describe('makeSpeakableButton', () => {
  it('returns a button element', () => {
    expect(makeSpeakableButton('cow').tagName).toBe('BUTTON');
  });

  it('button text matches label', () => {
    expect(makeSpeakableButton('cow').textContent).toBe('cow');
  });

  it('button is speakable', () => {
    const btn = makeSpeakableButton('cow');
    expect(btn.classList.contains('speakable')).toBe(true);
  });

  it('button speaks on tap', () => {
    const btn = makeSpeakableButton('cow');
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(speak).toHaveBeenCalledWith('cow');
  });
});
