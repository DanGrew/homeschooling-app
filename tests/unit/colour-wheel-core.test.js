import { describe, it, expect } from 'vitest';
import { w2r, pieSeg, annulusSeg, hex, lsnMix } from '../../core/colour-wheel/colour-wheel-core.js';

describe('w2r', () => {
  it('90 degrees maps to 0 radians', () => {
    expect(w2r(90)).toBeCloseTo(0);
  });
  it('180 degrees maps to PI/2', () => {
    expect(w2r(180)).toBeCloseTo(Math.PI / 2);
  });
  it('0 degrees maps to -PI/2', () => {
    expect(w2r(0)).toBeCloseTo(-Math.PI / 2);
  });
});

describe('pieSeg', () => {
  it('returns an SVG path string starting with M and ending with Z', () => {
    var d = pieSeg(150, 150, 55, 0, 120, 1.5);
    expect(d).toMatch(/^M/);
    expect(d).toMatch(/Z$/);
  });
  it('contains a center moveto and arc command', () => {
    var d = pieSeg(150, 150, 55, 0, 120, 0);
    expect(d).toContain('M150 150');
    expect(d).toContain(' A55 55 ');
  });
});

describe('annulusSeg', () => {
  it('returns an SVG path string starting with M and ending with Z', () => {
    var d = annulusSeg(150, 150, 100, 60, 0, 120, 1.5);
    expect(d).toMatch(/^M/);
    expect(d).toMatch(/Z$/);
  });
  it('contains both outer and inner arc radii', () => {
    var d = annulusSeg(150, 150, 100, 60, 0, 120, 0);
    expect(d).toContain(' A100 100 ');
    expect(d).toContain(' A60 60 ');
  });
});

describe('hex', () => {
  var mockColours = {
    red: { hex: '#E74C3C', label: 'Red' },
    blue: { hex: '#3498DB', label: 'Blue' }
  };
  it('returns the hex value for a known colour', () => {
    expect(hex('red', mockColours)).toBe('#E74C3C');
    expect(hex('blue', mockColours)).toBe('#3498DB');
  });
});

describe('lsnMix', () => {
  var mockMixes = {
    'red+yellow': 'orange',
    'yellow+red': 'orange',
    'red+blue': 'purple'
  };
  it('returns the mixed colour when a valid pair exists', () => {
    expect(lsnMix('red', 'yellow', mockMixes)).toBe('orange');
    expect(lsnMix('yellow', 'red', mockMixes)).toBe('orange');
    expect(lsnMix('red', 'blue', mockMixes)).toBe('purple');
  });
  it('returns the first colour when no mix is defined', () => {
    expect(lsnMix('green', 'purple', mockMixes)).toBe('green');
  });
});
