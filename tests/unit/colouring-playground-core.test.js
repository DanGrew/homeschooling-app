import { hexToRgb, rgbToHex, mixHex, baseOf, BASE_COLOURS } from '../../core/colouring-playground/colouring-playground-core.js';

describe('hexToRgb', () => {
  it('converts pure red', () => expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]));
  it('converts pure blue', () => expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]));
  it('converts mixed colour', () => expect(hexToRgb('#E74C3C')).toEqual([231, 76, 60]));
  it('converts black', () => expect(hexToRgb('#000000')).toEqual([0, 0, 0]));
  it('converts white', () => expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]));
});

describe('rgbToHex', () => {
  it('converts pure red', () => expect(rgbToHex(255, 0, 0)).toBe('#ff0000'));
  it('converts pure green', () => expect(rgbToHex(0, 255, 0)).toBe('#00ff00'));
  it('converts black', () => expect(rgbToHex(0, 0, 0)).toBe('#000000'));
  it('rounds fractional values', () => expect(rgbToHex(127.4, 127.6, 0)).toBe('#7f8000'));
  it('round-trips with hexToRgb', () => {
    const [r, g, b] = hexToRgb('#3498DB');
    expect(rgbToHex(r, g, b)).toBe('#3498db');
  });
});

describe('mixHex', () => {
  it('mixes red and blue to purple-ish', () => {
    const [r, g, b] = hexToRgb(mixHex('#ff0000', '#0000ff'));
    expect(r).toBe(128); expect(g).toBe(0); expect(b).toBe(128);
  });
  it('mixes black and white to mid-grey', () => {
    expect(mixHex('#000000', '#ffffff')).toBe('#808080');
  });
  it('is commutative', () => {
    expect(mixHex('#E74C3C', '#3498DB')).toBe(mixHex('#3498DB', '#E74C3C'));
  });
  it('same colour returns itself', () => {
    expect(mixHex('#F1C40F', '#F1C40F')).toBe('#f1c40f');
  });
});

describe('BASE_COLOURS', () => {
  it('has 10 entries', () => expect(BASE_COLOURS).toHaveLength(10));
  it('every entry has name, base, light, dark', () => {
    BASE_COLOURS.forEach(bc => {
      expect(typeof bc.name).toBe('string');
      expect(bc.base).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(bc.light).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(bc.dark).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
  it('light is distinct from base and dark', () => {
    BASE_COLOURS.forEach(bc => {
      expect(bc.light).not.toBe(bc.base);
      expect(bc.dark).not.toBe(bc.base);
    });
  });
});

describe('baseOf', () => {
  it('returns base for base colour', () => {
    expect(baseOf('#E74C3C')).toBe('#E74C3C');
  });
  it('returns base for light shade', () => {
    expect(baseOf('#F1948A')).toBe('#E74C3C');
  });
  it('returns base for dark shade', () => {
    expect(baseOf('#922B21')).toBe('#E74C3C');
  });
  it('returns null for unknown colour', () => {
    expect(baseOf('#123456')).toBeNull();
  });
  it('finds base for every shade in BASE_COLOURS', () => {
    BASE_COLOURS.forEach(bc => {
      expect(baseOf(bc.light)).toBe(bc.base);
      expect(baseOf(bc.base)).toBe(bc.base);
      expect(baseOf(bc.dark)).toBe(bc.base);
    });
  });
});
