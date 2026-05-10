import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeLongPress } from '../../ui/shared/long-press.js';

function makeEl() {
  return { _handlers: {}, addEventListener: function(ev, fn) { this._handlers[ev] = fn; }, fire: function(ev) { this._handlers[ev] && this._handlers[ev](); } };
}

beforeEach(() => { vi.useFakeTimers(); });

describe('makeLongPress', () => {
  it('fires onFire after holdMs', () => {
    var el = makeEl();
    var fired = false;
    makeLongPress(el, function() { fired = true; }, 600);
    el.fire('pointerdown');
    vi.advanceTimersByTime(600);
    expect(fired).toBe(true);
  });

  it('does not fire if released before holdMs', () => {
    var el = makeEl();
    var fired = false;
    makeLongPress(el, function() { fired = true; }, 600);
    el.fire('pointerdown');
    vi.advanceTimersByTime(300);
    el.fire('pointerup');
    vi.advanceTimersByTime(400);
    expect(fired).toBe(false);
  });

  it('calls onPress on pointerdown', () => {
    var el = makeEl();
    var pressed = false;
    makeLongPress(el, function() {}, 600, function() { pressed = true; });
    el.fire('pointerdown');
    expect(pressed).toBe(true);
  });

  it('calls onRelease on pointerup before holdMs', () => {
    var el = makeEl();
    var released = false;
    makeLongPress(el, function() {}, 600, null, function() { released = true; });
    el.fire('pointerdown');
    el.fire('pointerup');
    expect(released).toBe(true);
  });

  it('calls onRelease when fire completes', () => {
    var el = makeEl();
    var released = false;
    makeLongPress(el, function() {}, 600, null, function() { released = true; });
    el.fire('pointerdown');
    vi.advanceTimersByTime(600);
    expect(released).toBe(true);
  });

  it('pointerleave cancels press', () => {
    var el = makeEl();
    var fired = false;
    makeLongPress(el, function() { fired = true; }, 600);
    el.fire('pointerdown');
    el.fire('pointerleave');
    vi.advanceTimersByTime(600);
    expect(fired).toBe(false);
  });
});
