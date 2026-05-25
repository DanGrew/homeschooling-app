// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('learning-moment', () => {
  var show, hide, LEARNING_MOMENT_DURATION_MS;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = '';
    var mod = await import('../../components/learning-moments/learning-moment.js');
    show = mod.show;
    hide = mod.hide;
    LEARNING_MOMENT_DURATION_MS = mod.LEARNING_MOMENT_DURATION_MS;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exports LEARNING_MOMENT_DURATION_MS as 4000', () => {
    expect(LEARNING_MOMENT_DURATION_MS).toBe(4000);
  });

  it('injects element into body on first show', () => {
    show('You made orange!');
    expect(document.body.children.length).toBe(1);
  });

  it('renders message text', () => {
    show('You found another way!');
    expect(document.body.textContent).toContain('You found another way!');
  });

  it('renders star icon', () => {
    show('You completed the pattern!');
    expect(document.body.textContent).toContain('\u2B50');
  });

  it('becomes visible on show', () => {
    show('You solved the puzzle!');
    var el = document.querySelector('[data-testid="learning-moment"]');
    expect(el.style.opacity).toBe('1');
  });

  it('becomes hidden on hide', () => {
    show('You solved the puzzle!');
    hide();
    var el = document.querySelector('[data-testid="learning-moment"]');
    expect(el.style.opacity).toBe('0');
  });

  it('auto-dismisses after LEARNING_MOMENT_DURATION_MS', () => {
    show('You changed both lights!');
    var el = document.querySelector('[data-testid="learning-moment"]');
    expect(el.style.opacity).toBe('1');
    vi.advanceTimersByTime(LEARNING_MOMENT_DURATION_MS);
    expect(el.style.opacity).toBe('0');
  });

  it('reuses same element on repeated calls', () => {
    show('First');
    show('Second');
    expect(document.body.querySelectorAll('[data-testid="learning-moment"]').length).toBe(1);
  });

  it('updates message on repeated calls', () => {
    show('First');
    show('Second');
    expect(document.body.textContent).toContain('Second');
    expect(document.body.textContent).not.toContain('First');
  });

  it('resets auto-dismiss timer on repeated calls', () => {
    show('First');
    vi.advanceTimersByTime(1000);
    show('Second');
    vi.advanceTimersByTime(3500);
    var el = document.querySelector('[data-testid="learning-moment"]');
    expect(el.style.opacity).toBe('1');
    vi.advanceTimersByTime(500);
    expect(el.style.opacity).toBe('0');
  });

  it('graceful no-op if Web Audio unavailable', () => {
    var original = window.AudioContext;
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
    expect(() => show('test')).not.toThrow();
    window.AudioContext = original;
  });

  it('visually distinct from error/warning — no red background', () => {
    show('You made orange!');
    var el = document.querySelector('[data-testid="learning-moment"]');
    expect(el.style.cssText).not.toContain('red');
    expect(el.style.cssText).not.toContain('#e74c3c');
    expect(el.style.cssText).not.toContain('#c0392b');
  });

  it('shows activity line when activity provided', () => {
    show('Well done!', 'AND Gate');
    var actEl = document.querySelector('[data-testid="learning-moment-activity"]');
    expect(actEl.textContent).toBe('Activity: AND Gate');
    expect(actEl.style.display).not.toBe('none');
  });

  it('hides activity line when no activity provided', () => {
    show('Well done!');
    var actEl = document.querySelector('[data-testid="learning-moment-activity"]');
    expect(actEl.style.display).toBe('none');
  });

  it('clears activity line on subsequent call without activity', () => {
    show('First', 'AND Gate');
    show('Second');
    var actEl = document.querySelector('[data-testid="learning-moment-activity"]');
    expect(actEl.style.display).toBe('none');
  });
});
