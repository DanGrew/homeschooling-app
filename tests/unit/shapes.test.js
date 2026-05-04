import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { svg, pickCol, colours, types } = require('../../app/shared/shapes-logic.js');

describe('svg', () => {
  it('wraps output in svg element with viewBox', () => {
    const out = svg('circle', '#ff0000');
    expect(out).toMatch(/^<svg viewBox="0 0 120 120"/);
    expect(out).toMatch(/<\/svg>$/);
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
    for (let i = 0; i < 30; i++) seen.add(pickCol());
    colours.forEach(c => expect(seen).toContain(c));
  });
});
