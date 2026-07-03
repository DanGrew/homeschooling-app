import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
  PRIMITIVES, FAMILIES, ALPHABET,
  buildLetterShapeMap, groupLettersByFamily, lettersWithShape,
  buildOrderPool, availableTiles, isOrderComplete, isCorrectPlacement, countShapes, parseJsonResponse,
  glyphHtml, letterPickerHtml, identifyPanelHtml, matchPanelHtml, orderPanelHtml
} = require('../../core/letter-shapes/letter-shapes-core.js');

const GRAPHEMES = {
  'lower-a': { type: 'letter', characters: 'a', shapes: ['circle', 'straight line'] },
  'lower-c': { type: 'letter', characters: 'c', shapes: ['curve'] },
  'lower-o': { type: 'letter', characters: 'o', shapes: ['circle'] },
  'lower-v': { type: 'letter', characters: 'v', shapes: ['diagonal', 'diagonal'] },
  'upper-a': { type: 'letter', characters: 'A', shapes: ['diagonal', 'diagonal', 'straight line'] },
  'digit-1': { type: 'digit', characters: '1', shapes: ['straight line'] }
};

describe('buildLetterShapeMap', function() {
  it('maps only lowercase letters to a copy of their shapes array', function() {
    var map = buildLetterShapeMap(GRAPHEMES);
    expect(map.a).toEqual(['circle', 'straight line']);
    expect(map.c).toEqual(['curve']);
    expect(map.v).toEqual(['diagonal', 'diagonal']);
  });
  it('ignores uppercase, digit and non-lower entries', function() {
    var map = buildLetterShapeMap(GRAPHEMES);
    expect(map.A).toBeUndefined();
    expect(map['1']).toBeUndefined();
    expect(Object.keys(map).sort()).toEqual(['a', 'c', 'o', 'v']);
  });
  it('returns a defensive copy, not the source array', function() {
    var map = buildLetterShapeMap(GRAPHEMES);
    map.a.push('dot');
    expect(GRAPHEMES['lower-a'].shapes).toEqual(['circle', 'straight line']);
  });
  it('handles missing/empty input', function() {
    expect(buildLetterShapeMap()).toEqual({});
    expect(buildLetterShapeMap({ 'lower-x': { characters: 'x' } }).x).toEqual([]);
  });
});

describe('groupLettersByFamily', function() {
  it('keeps only letters present in the map, in family order', function() {
    var map = { a: ['circle'], c: ['curve'], o: ['circle'], v: ['diagonal'] };
    var groups = groupLettersByFamily(map, FAMILIES);
    expect(groups[0].label).toBe('curly caterpillars');
    expect(groups[0].letters).toEqual(['c', 'a', 'o']);
    expect(groups.find(g => g.label === 'zigzag monsters').letters).toEqual(['v']);
  });
  it('drops families with no present letters', function() {
    var groups = groupLettersByFamily({ a: ['circle'] }, FAMILIES);
    expect(groups.length).toBe(1);
    expect(groups.every(g => g.letters.length > 0)).toBe(true);
  });
  it('buckets registry letters outside any family into a trailing group', function() {
    var groups = groupLettersByFamily({ a: ['circle'], ' ': ['dot'] }, FAMILIES);
    var extra = groups.find(g => g.label === 'more letters');
    expect(extra.letters).toEqual([' ']);
  });
});

describe('lettersWithShape', function() {
  it('returns alphabet letters whose shapes include the target', function() {
    var map = { a: ['circle', 'straight line'], o: ['circle'], c: ['curve'] };
    expect(lettersWithShape(map, 'circle', ALPHABET)).toEqual(['a', 'o']);
    expect(lettersWithShape(map, 'curve', ALPHABET)).toEqual(['c']);
  });
  it('returns empty when no letter has the shape', function() {
    expect(lettersWithShape({ a: ['circle'] }, 'dot', ALPHABET)).toEqual([]);
  });
});

describe('buildOrderPool', function() {
  it('adds a missing primitive as the single distractor', function() {
    var pool = buildOrderPool(['circle', 'straight line'], PRIMITIVES);
    expect(pool.slice(0, 2)).toEqual(['circle', 'straight line']);
    expect(pool.length).toBe(3);
    expect(['curve', 'diagonal', 'dot']).toContain(pool[2]);
  });
  it('falls back to diagonal when all primitives are already used', function() {
    var pool = buildOrderPool(PRIMITIVES.slice(), PRIMITIVES);
    expect(pool[pool.length - 1]).toBe('diagonal');
  });
});

describe('availableTiles', function() {
  it('removes tiles already placed, respecting duplicates', function() {
    var pool = ['diagonal', 'diagonal', 'straight line'];
    expect(availableTiles(pool, [])).toEqual(['diagonal', 'diagonal', 'straight line']);
    expect(availableTiles(pool, ['diagonal'])).toEqual(['diagonal', 'straight line']);
    expect(availableTiles(pool, ['diagonal', 'straight line'])).toEqual(['diagonal']);
  });
});

describe('isOrderComplete', function() {
  it('is true only when every slot is filled', function() {
    expect(isOrderComplete(['circle', 'straight line'], ['circle'])).toBe(false);
    expect(isOrderComplete(['circle', 'straight line'], ['circle', 'straight line'])).toBe(true);
  });
  it('is false for a letter with no strokes', function() {
    expect(isOrderComplete([], [])).toBe(false);
  });
});

describe('isCorrectPlacement', function() {
  it('accepts only the stroke expected at the next slot', function() {
    var strokes = ['circle', 'straight line'];
    expect(isCorrectPlacement(strokes, [], 'circle')).toBe(true);
    expect(isCorrectPlacement(strokes, [], 'straight line')).toBe(false);
    expect(isCorrectPlacement(strokes, ['circle'], 'straight line')).toBe(true);
  });
  it('rejects a distractor that is not part of the letter', function() {
    expect(isCorrectPlacement(['curve'], [], 'diagonal')).toBe(false);
  });
});

describe('parseJsonResponse', function() {
  it('delegates to the response json parser', function() {
    var payload = { a: ['circle'] };
    var response = { json: function() { return payload; } };
    expect(parseJsonResponse(response)).toBe(payload);
  });
});

describe('countShapes', function() {
  it('counts distinct primitives present, not repeated strokes', function() {
    expect(countShapes(['circle', 'straight line'])).toBe(2);
    expect(countShapes(['straight line', 'straight line'])).toBe(1);
    expect(countShapes(['curve', 'straight line', 'straight line'])).toBe(2);
    expect(countShapes([])).toBe(0);
  });
});

describe('glyphHtml', function() {
  it('renders a stroke-coloured svg for a known glyph', function() {
    var html = glyphHtml('a');
    expect(html).toContain('<svg');
    expect(html).toContain('#9B59B6');
  });
  it('falls back to a plain letter for an unknown glyph', function() {
    expect(glyphHtml('z')).toBe('<div class="fallback">z</div>');
  });
});

describe('letterPickerHtml', function() {
  it('marks the current letter and exposes a data-letter hook per button', function() {
    var html = letterPickerHtml({ a: ['circle'], c: ['curve'] }, 'a');
    expect(html).toContain('data-letter="a"');
    expect(html).toContain('data-letter="c"');
    expect(html).toContain('class="pick on" data-letter="a"');
  });
});

describe('identifyPanelHtml', function() {
  it('flags each primitive chip as present or absent for the letter', function() {
    var html = identifyPanelHtml({ a: ['circle', 'straight line'] }, 'a');
    expect(html).toContain('data-shape="circle" data-has="true"');
    expect(html).toContain('data-shape="dot" data-has="false"');
    expect(html).toContain('What shapes make');
  });
  it('shows a progress count of the correct chips to find', function() {
    var html = identifyPanelHtml({ a: ['circle', 'straight line'] }, 'a');
    expect(html).toContain('data-total="2"');
    expect(html).toContain('>0/2<');
  });
});

describe('matchPanelHtml', function() {
  it('renders unticked letter buttons with a has flag, not pre-highlighted', function() {
    var html = matchPanelHtml({ a: ['circle'], o: ['circle'], c: ['curve'] }, 'circle');
    expect(html).toContain('data-cell="a" data-has="true"');
    expect(html).toContain('data-cell="c" data-has="false"');
    expect(html).not.toContain('letterbtn on');
  });
  it('counts how many letters contain the shape', function() {
    var html = matchPanelHtml({ a: ['circle'], o: ['circle'], c: ['curve'] }, 'circle');
    expect(html).toContain('data-total="2"');
    expect(html).toContain('>0/2<');
  });
});

describe('orderPanelHtml', function() {
  it('shows tap slots and a stroke pool while incomplete', function() {
    var html = orderPanelHtml({ a: ['circle', 'straight line'] }, 'a', []);
    expect(html).toContain('data-tile=');
    expect(html).not.toContain("that's how you make");
  });
  it('shows the completion tick once every slot is filled', function() {
    var html = orderPanelHtml({ a: ['circle', 'straight line'] }, 'a', ['circle', 'straight line']);
    expect(html).toContain("that's how you make a");
    expect(html).not.toContain('data-tile=');
  });
});
