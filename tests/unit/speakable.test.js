// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../components/speech/speech-ui.js', () => ({ speakInterrupt: vi.fn(), stop: vi.fn() }));

import { makeSpeakable, makeSpeakableButton, makeInteractive } from '../../components/speech/speakable.js';
import { speakInterrupt } from '../../components/speech/speech-ui.js';

beforeEach(() => { vi.clearAllMocks(); });

describe('makeSpeakable', () => {
  it('adds speakable class', () => {
    const el = document.createElement('div');
    makeSpeakable(el, 'cat');
    expect(el.classList.contains('speakable')).toBe(true);
  });

  it('calls speak with string text on click', () => {
    const el = document.createElement('div');
    makeSpeakable(el, 'cat');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(speakInterrupt).toHaveBeenCalledWith('cat');
  });

  it('accepts function as text', () => {
    const el = document.createElement('div');
    makeSpeakable(el, () => 'dog');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(speakInterrupt).toHaveBeenCalledWith('dog');
  });

  it('reads function text at tap time not bind time', () => {
    const el = document.createElement('div');
    var label = 'dog';
    makeSpeakable(el, () => label);
    label = 'cat';
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(speakInterrupt).toHaveBeenCalledWith('cat');
  });

  it('debounces rapid taps', () => {
    const el = document.createElement('div');
    makeSpeakable(el, 'cat');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(speakInterrupt).toHaveBeenCalledTimes(1);
  });

  it('adds speakable--tap class on tap', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    makeSpeakable(el, 'cat');
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.classList.contains('speakable--tap')).toBe(true);
    document.body.removeChild(el);
  });
});

describe('makeInteractive', () => {
  it('adds speakable class', () => {
    const el = document.createElement('div');
    makeInteractive(el, vi.fn());
    expect(el.classList.contains('speakable')).toBe(true);
  });

  it('calls onTap on click', () => {
    const el = document.createElement('div');
    const onTap = vi.fn();
    makeInteractive(el, onTap);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('debounces rapid taps', () => {
    const el = document.createElement('div');
    const onTap = vi.fn();
    makeInteractive(el, onTap);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onTap).toHaveBeenCalledTimes(1);
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
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(speakInterrupt).toHaveBeenCalledWith('cow');
  });
});
