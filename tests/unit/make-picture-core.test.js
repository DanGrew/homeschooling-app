import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { mpStripDot, mpObjectSvg, mpComposePicture, mpTilesHtml, mpSectionHtml } = require('../../core/learning-catalogue/make-picture-core.js');

function fakeShape(shape, colour) {
  return '<rect fill="#123456"/><circle cx="0" cy="-25" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>';
}

describe('mpStripDot', () => {
  it('removes the white tittle dot circle from a shape render', () => {
    const out = mpStripDot(fakeShape('circle', 'red'));
    expect(out).not.toContain('fill="#fff"');
    expect(out).toContain('<rect fill="#123456"/>');
  });
  it('keeps the coloured shape circle of a circle render', () => {
    const svg = '<circle r="32" fill="#E74C3C" stroke="#C0392B" stroke-width="3"/><circle cx="0" cy="-25" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>';
    const out = mpStripDot(svg);
    expect(out).toContain('fill="#E74C3C"');
    expect(out).not.toContain('fill="#fff"');
  });
});

describe('mpObjectSvg', () => {
  it('places the object at translate(x*100,y*100) with a size-scaled group', () => {
    const out = mpObjectSvg({ shape: 'circle', colour: 'red', size: 'large', x: 0.5, y: 0.34 }, fakeShape);
    expect(out).toContain('translate(50.0,34.0)');
    expect(out).toContain('scale(0.782)');
    expect(out).not.toContain('rotate');
  });
  it('appends a rotation when rot is set', () => {
    const out = mpObjectSvg({ shape: 'rectangle', colour: 'blue', size: 'small', x: 0.5, y: 0.8, rot: 90 }, fakeShape);
    expect(out).toContain('rotate(90)');
    expect(out).toContain('scale(0.340)');
  });
});

describe('mpComposePicture', () => {
  it('wraps one group per object in a 0-100 viewBox svg', () => {
    const pic = { title: 'House', objects: [
      { shape: 'triangle', colour: 'red', size: 'large', x: 0.5, y: 0.34 },
      { shape: 'square', colour: 'red', size: 'large', x: 0.5, y: 0.62 }
    ] };
    const out = mpComposePicture(pic, fakeShape);
    expect(out).toContain('viewBox="-12 -12 124 124"');
    expect((out.match(/<g /g) || []).length).toBe(2);
  });
});

describe('mpTilesHtml', () => {
  it('renders one lc-pic button per picture carrying its index and title', () => {
    const pics = [
      { title: 'House', objects: [{ shape: 'square', colour: 'red', size: 'large', x: 0.5, y: 0.5 }] },
      { title: 'Car', objects: [{ shape: 'rectangle', colour: 'blue', size: 'large', x: 0.5, y: 0.5 }] }
    ];
    const out = mpTilesHtml(pics, fakeShape);
    expect((out.match(/class="lc-pic"/g) || []).length).toBe(2);
    expect(out).toContain('data-idx="0"');
    expect(out).toContain('data-idx="1"');
    expect(out).toContain('>House<');
    expect(out).toContain('>Car<');
  });
});

describe('mpSectionHtml', () => {
  it('returns an empty string when there are no pictures', () => {
    expect(mpSectionHtml(undefined, fakeShape)).toBe('');
  });
  it('wraps the tiles in a Pictures to make section when pictures exist', () => {
    const pics = [{ title: 'House', objects: [{ shape: 'square', colour: 'red', size: 'large', x: 0.5, y: 0.5 }] }];
    const out = mpSectionHtml(pics, fakeShape);
    expect(out).toContain('Pictures to make');
    expect(out).toContain('class="lc-pics"');
    expect(out).toContain('data-idx="0"');
  });
});
