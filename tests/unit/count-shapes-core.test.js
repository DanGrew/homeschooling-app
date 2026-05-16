import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { SVG_SHAPE, svg } = require('../../core/count-shapes/count-shapes-core.js');

describe('SVG_SHAPE', () => {
  it('has circle, square, triangle keys', () => {
    ['circle', 'square', 'triangle'].forEach(k => expect(SVG_SHAPE).toHaveProperty(k));
  });
});

describe('svg', () => {
  it('wraps shape in svg element', () => {
    const result = svg('circle');
    expect(result).toMatch(/^<svg /);
    expect(result).toContain(SVG_SHAPE['circle']);
    expect(result).toContain('</svg>');
  });
  it('includes responsive sizing style', () => {
    expect(svg('square')).toContain('min(80px,15vw)');
  });
  it('uses correct shape content for triangle', () => {
    expect(svg('triangle')).toContain(SVG_SHAPE['triangle']);
  });
});
