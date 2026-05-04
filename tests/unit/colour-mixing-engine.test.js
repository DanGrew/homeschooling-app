import { mix, hex, CM_COLOURS, CM_MIXES } from '../../app/shared/colour-mixing-logic.js';

describe('mix', () => {
  it('same colour returns itself', () => {
    expect(mix('red', 'red')).toBe('red');
    expect(mix('blue', 'blue')).toBe('blue');
  });

  it('primary combinations', () => {
    expect(mix('red', 'yellow')).toBe('orange');
    expect(mix('yellow', 'red')).toBe('orange');
    expect(mix('red', 'blue')).toBe('purple');
    expect(mix('blue', 'red')).toBe('purple');
    expect(mix('blue', 'yellow')).toBe('green');
    expect(mix('yellow', 'blue')).toBe('green');
  });

  it('primary + secondary combinations', () => {
    expect(mix('red', 'orange')).toBe('red-orange');
    expect(mix('yellow', 'orange')).toBe('yellow-orange');
    expect(mix('yellow', 'green')).toBe('yellow-green');
    expect(mix('blue', 'green')).toBe('blue-green');
    expect(mix('blue', 'purple')).toBe('blue-purple');
    expect(mix('red', 'purple')).toBe('red-purple');
  });

  it('complementary pairs produce muted results', () => {
    expect(mix('red', 'green')).toBe('red-green-mix');
    expect(mix('yellow', 'purple')).toBe('yellow-purple-mix');
    expect(mix('blue', 'orange')).toBe('blue-orange-mix');
  });

  it('is commutative for all defined pairs', () => {
    Object.keys(CM_MIXES).forEach(key => {
      const [a, b] = key.split('+');
      expect(mix(a, b)).toBe(mix(b, a));
    });
  });

  it('unknown pair returns null', () => {
    expect(mix('red', 'unknown')).toBeNull();
    expect(mix('unknown', 'unknown')).toBe('unknown'); // same colour rule applies first
  });
});

describe('hex', () => {
  it('returns hex for known colour', () => {
    expect(hex('red')).toBe('#E74C3C');
    expect(hex('blue')).toBe('#3498DB');
  });

  it('returns fallback for unknown colour', () => {
    expect(hex('unknown')).toBe('#f0f0f0');
    expect(hex(null)).toBe('#f0f0f0');
  });
});

describe('CM_COLOURS', () => {
  it('every colour has hex and label', () => {
    Object.entries(CM_COLOURS).forEach(([id, val]) => {
      expect(val.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof val.label).toBe('string');
    });
  });
});
