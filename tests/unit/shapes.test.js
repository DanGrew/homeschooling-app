import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { svg, pickCol, shuffle, colours, types, colourNames } = require('../../core/shapes/shapes-core.js');

describe('svg', () => {
  it('wraps output in svg element with viewBox', () => {
    const out = svg('circle', '#ff0000');
    expect(out).toMatch(/^<svg viewBox="0 0 120 120"/);
    expect(out).toMatch(/<\/svg>$/);
  });

  it('emits the exact style attribute with both width and height set from cssSize', () => {
    const out = svg('circle', '#ff0000', '100px');
    expect(out).toContain('style="width:100px;height:100px">');
  });

  it('applies default cssSize', () => {
    expect(svg('circle', '#ff0000')).toContain('clamp(100px,28vmin,220px)');
  });

  it('applies custom cssSize', () => {
    expect(svg('circle', '#ff0000', '100px')).toContain('width:100px');
  });

  it('renders circle', () => {
    expect(svg('circle', '#E74C3C')).toContain('<circle cx="60" cy="60" r="54" fill="#E74C3C"/>');
  });

  it('renders square', () => {
    expect(svg('square', '#3498DB')).toContain('<rect x="8" y="8" width="104" height="104"');
  });

  it('renders triangle', () => {
    expect(svg('triangle', '#2ECC71')).toContain('<polygon points="60,8 112,112 8,112"');
  });

  it('renders star', () => {
    expect(svg('star', '#F1C40F')).toContain('<polygon points="60,6 73,42');
  });

  it('renders rectangle', () => {
    expect(svg('rectangle', '#E67E22')).toContain('<rect x="8" y="28" width="104" height="64"');
  });

  it('renders heart as fallback for unknown type', () => {
    expect(svg('heart', '#9B59B6')).toContain('<path d="M60,95');
  });

  it('unknown type falls back to heart path', () => {
    expect(svg('unknown', '#fff')).toContain('<path d="M60,95');
  });

  it('fill colour applied to shape', () => {
    types.forEach(t => {
      expect(svg(t, '#AABBCC')).toContain('fill="#AABBCC"');
    });
  });
});

describe('types', () => {
  it('pins the exact list of shape type names', () => {
    expect(types).toEqual(['circle', 'square', 'triangle', 'star', 'rectangle', 'heart']);
  });
});

describe('pickCol', () => {
  it('returns a colour from the palette', () => {
    const c = pickCol();
    expect(colours).toContain(c);
  });

  it('never returns same colour twice in a row', () => {
    for (let i = 0; i < 20; i++) {
      const a = pickCol();
      const b = pickCol();
      expect(a).not.toBe(b);
    }
  });

  it('returns all colours eventually', () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(pickCol());
    colours.forEach(c => expect(seen).toContain(c));
  });
});

describe('colourNames', () => {
  it('has entry for every colour in palette', () => {
    colours.forEach(c => expect(colourNames).toHaveProperty(c));
  });

  it('maps hex to human name string', () => {
    expect(colourNames['#E74C3C']).toBe('Red');
    expect(colourNames['#3498DB']).toBe('Blue');
    expect(colourNames['#2ECC71']).toBe('Green');
    expect(colourNames['#F1C40F']).toBe('Yellow');
    expect(colourNames['#E67E22']).toBe('Orange');
    expect(colourNames['#9B59B6']).toBe('Purple');
  });
});

describe('shuffle', () => {
  it('returns a new array (does not mutate input)', () => {
    const input = ['a', 'b', 'c'];
    const out = shuffle(input);
    expect(out).not.toBe(input);
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('preserves length and membership', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect(out.slice().sort()).toEqual(input.slice().sort());
  });

  it('handles empty and single-element arrays', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['x'])).toEqual(['x']);
  });

  describe('with a pinned random sequence', () => {
    afterEach(() => { vi.restoreAllMocks(); });

    it('applies the Fisher-Yates swap at each step using floor(random * (i + 1))', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9) // i=3: floor(0.9*4)=3 (self-swap)
        .mockReturnValueOnce(0.1) // i=2: floor(0.1*3)=0
        .mockReturnValueOnce(0.6); // i=1: floor(0.6*2)=1 (self-swap)
      expect(shuffle(['A', 'B', 'C', 'D'])).toEqual(['C', 'B', 'A', 'D']);
    });
  });
});
