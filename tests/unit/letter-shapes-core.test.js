import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
  PRIMITIVES, FAMILIES, ALPHABET,
  buildLetterShapeMap, groupLettersByFamily, lettersWithShape, strokesFor,
  buildOrderPool, availableTiles, isOrderComplete, isCorrectPlacement, countShapes, parseJsonResponse,
  glyphHtml, swatchHtml, strokeSwatchHtml, letterPickerHtml, chipsHtml, countHtml,
  identifyPanelHtml, shapePickerHtml, matchPanelHtml,
  orderSlotsHtml, orderPoolHtml, orderPanelHtml
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
  it('requires the id to start with lower- (anchored, not just contain it)', function() {
    var map = buildLetterShapeMap({ 'xlower-a': { shapes: ['y'] } });
    expect(map).toEqual({});
  });
  it('requires exactly one letter after lower- (anchored to end)', function() {
    var map = buildLetterShapeMap({ 'lower-ab': { shapes: ['y'] } });
    expect(map).toEqual({});
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
  it('sorts the trailing extra group, not registry insertion order', function() {
    var groups = groupLettersByFamily({ z2: ['x'], a2: ['y'] }, FAMILIES);
    expect(groups).toEqual([{ label: 'more letters', letters: ['a2', 'z2'] }]);
  });
  it('adds no trailing group at all when every letter is covered by a family', function() {
    var groups = groupLettersByFamily({ a: ['circle'] }, FAMILIES);
    expect(groups).toEqual([{ label: 'curly caterpillars', letters: ['a'] }]);
    expect(groups.find(g => g.label === 'more letters')).toBeUndefined();
  });
});

describe('strokesFor', function() {
  it('returns the shapes array for a known key', function() {
    expect(strokesFor({ a: ['circle'] }, 'a')).toEqual(['circle']);
  });
  it('returns an empty array, not a placeholder, for an unknown key', function() {
    expect(strokesFor({}, 'z')).toEqual([]);
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
  it('picks the first missing primitive in PRIMITIVES order, not the diagonal fallback', function() {
    var pool = buildOrderPool(['diagonal', 'circle'], PRIMITIVES);
    expect(pool).toEqual(['diagonal', 'circle', 'straight line']);
  });
});

describe('availableTiles', function() {
  it('removes tiles already placed, respecting duplicates', function() {
    var pool = ['diagonal', 'diagonal', 'straight line'];
    expect(availableTiles(pool, [])).toEqual(['diagonal', 'diagonal', 'straight line']);
    expect(availableTiles(pool, ['diagonal'])).toEqual(['diagonal', 'straight line']);
    expect(availableTiles(pool, ['diagonal', 'straight line'])).toEqual(['diagonal']);
  });
  it('accumulates placed-count across duplicate entries rather than resetting each time', function() {
    var pool = ['diagonal', 'diagonal', 'diagonal'];
    expect(availableTiles(pool, ['diagonal', 'diagonal'])).toEqual(['diagonal']);
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
  it('renders the exact svg markup for a known glyph, pinning the wrapper and path', function() {
    expect(glyphHtml('a')).toBe('<svg width="150" height="150" viewBox="0 0 100 125" fill="none" stroke-width="9" stroke-linecap="round"><circle cx="42" cy="74" r="24" stroke="#9B59B6"/><line x1="68" y1="42" x2="68" y2="99" stroke="#3498DB"/></svg>');
    expect(glyphHtml('c')).toBe('<svg width="150" height="150" viewBox="0 0 100 125" fill="none" stroke-width="9" stroke-linecap="round"><path d="M72,54 A26,26 0 1 0 72,96" stroke="#27AE60"/></svg>');
  });
  it('falls back to a plain letter for an unknown glyph', function() {
    expect(glyphHtml('z')).toBe('<div class="fallback">z</div>');
  });
});

describe('swatchHtml', function() {
  it('renders the exact short-label swatch span', function() {
    expect(swatchHtml('circle')).toBe('<span class="sw c-circle"></span>');
    expect(swatchHtml('dot')).toBe('<span class="sw c-dot"></span>');
  });
});

describe('strokeSwatchHtml', function() {
  it('renders the exact coloured icon svg for every STROKE_ICON entry', function() {
    expect(strokeSwatchHtml('circle')).toBe('<svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#9B59B6" stroke-width="6" stroke-linecap="round"><circle cx="20" cy="20" r="13"/></svg>');
    expect(strokeSwatchHtml('straight line')).toBe('<svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#3498DB" stroke-width="6" stroke-linecap="round"><line x1="20" y1="7" x2="20" y2="33"/></svg>');
    expect(strokeSwatchHtml('curve')).toBe('<svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#27AE60" stroke-width="6" stroke-linecap="round"><path d="M27,9 A13,13 0 1 0 27,31"/></svg>');
    expect(strokeSwatchHtml('diagonal')).toBe('<svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#F39C12" stroke-width="6" stroke-linecap="round"><line x1="11" y1="31" x2="29" y2="9"/></svg>');
  });
  it('falls back to a filled dot for a shape with no STROKE_ICON entry', function() {
    expect(strokeSwatchHtml('dot')).toBe('<svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#E74C3C" stroke-width="6" stroke-linecap="round"><circle cx="20" cy="20" r="6" fill="#E74C3C"/></svg>');
  });
});

describe('letterPickerHtml', function() {
  it('marks the current letter and exposes a data-letter hook per button', function() {
    var html = letterPickerHtml({ a: ['circle'], c: ['curve'] }, 'a');
    expect(html).toContain('data-letter="a"');
    expect(html).toContain('data-letter="c"');
    expect(html).toContain('class="pick on" data-letter="a"');
  });
  it('renders the exact markup across two families, only the current letter marked on', function() {
    var html = letterPickerHtml({ a: ['circle'], v: ['diagonal'] }, 'a');
    expect(html).toBe('<div class="groups"><div class="grplabel">curly caterpillars</div><div class="grp"><button class="pick on" data-letter="a">a</button></div><div class="grplabel">zigzag monsters</div><div class="grp"><button class="pick" data-letter="v">v</button></div></div>');
  });
  it('joins two letters within the same family with no separator between their buttons', function() {
    var html = letterPickerHtml({ a: ['circle'], c: ['curve'] }, 'a');
    expect(html).toBe('<div class="groups"><div class="grplabel">curly caterpillars</div><div class="grp"><button class="pick" data-letter="c">c</button><button class="pick on" data-letter="a">a</button></div></div>');
  });
});

describe('chipsHtml', function() {
  it('renders the exact chip row for a mixed has/not-has stroke set', function() {
    expect(chipsHtml(['circle', 'curve'])).toBe('<button class="chip" data-shape="straight line" data-has="false"><span class="sw c-line"></span>line<span class="tick">✓</span></button><button class="chip" data-shape="curve" data-has="true"><span class="sw c-curve"></span>curve<span class="tick">✓</span></button><button class="chip" data-shape="circle" data-has="true"><span class="sw c-circle"></span>circle<span class="tick">✓</span></button><button class="chip" data-shape="diagonal" data-has="false"><span class="sw c-diag"></span>diag<span class="tick">✓</span></button><button class="chip" data-shape="dot" data-has="false"><span class="sw c-dot"></span>dot<span class="tick">✓</span></button>');
  });
});

describe('countHtml', function() {
  it('renders the exact progress span', function() {
    expect(countHtml(2, ".chip.tapped[data-has='true']")).toBe('<span class="count" data-total="2" data-sel=".chip.tapped[data-has=\'true\']">0/2</span>');
  });
});

describe('shapePickerHtml', function() {
  it('renders the exact shape-picker row, only the current shape marked on', function() {
    expect(shapePickerHtml('circle')).toBe('<div class="shapepick"><span class="picklabel">shape</span><button class="pick shape" data-shape="straight line"><span class="sw c-line"></span>line</button><button class="pick shape" data-shape="curve"><span class="sw c-curve"></span>curve</button><button class="pick shape on" data-shape="circle"><span class="sw c-circle"></span>circle</button><button class="pick shape" data-shape="diagonal"><span class="sw c-diag"></span>diag</button><button class="pick shape" data-shape="dot"><span class="sw c-dot"></span>dot</button></div>');
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
  it('renders the exact panel end to end for a known letter', function() {
    var html = identifyPanelHtml({ a: ['circle', 'straight line'] }, 'a');
    expect(html).toBe('<div class="panel-title">What shapes make <span class="hl">a</span>? <span class="count" data-total="2" data-sel=".chip.tapped[data-has=\'true\']">0/2</span></div><div class="groups"><div class="grplabel">curly caterpillars</div><div class="grp"><button class="pick on" data-letter="a">a</button></div></div><div class="mode-body"><div class="row identify-row"><div class="glyph"><svg width="150" height="150" viewBox="0 0 100 125" fill="none" stroke-width="9" stroke-linecap="round"><circle cx="42" cy="74" r="24" stroke="#9B59B6"/><line x1="68" y1="42" x2="68" y2="99" stroke="#3498DB"/></svg></div><div class="row chips"><button class="chip" data-shape="straight line" data-has="true"><span class="sw c-line"></span>line<span class="tick">✓</span></button><button class="chip" data-shape="curve" data-has="false"><span class="sw c-curve"></span>curve<span class="tick">✓</span></button><button class="chip" data-shape="circle" data-has="true"><span class="sw c-circle"></span>circle<span class="tick">✓</span></button><button class="chip" data-shape="diagonal" data-has="false"><span class="sw c-diag"></span>diag<span class="tick">✓</span></button><button class="chip" data-shape="dot" data-has="false"><span class="sw c-dot"></span>dot<span class="tick">✓</span></button></div></div><div class="hint">Tap the strokes you can see — the right ones turn green. The letter is drawn in matching stroke colours.</div></div>');
  });
  it('falls back to an empty stroke set (not a placeholder) for a letter outside the registry', function() {
    var html = identifyPanelHtml({}, 'z');
    expect(html).toContain('data-total="0"');
    expect(html).toContain('>0/0<');
    expect(html).toContain('data-shape="circle" data-has="false"');
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
  it('renders the exact panel end to end, including the shape picker and full a-z grid', function() {
    var html = matchPanelHtml({ a: ['circle'], o: ['circle'], c: ['curve'] }, 'circle');
    var abc = ALPHABET.map(function(l) {
      return '<button class="letterbtn" data-cell="' + l + '" data-has="' + (l === 'a' || l === 'o') + '">' + l + '</button>';
    }).join('');
    expect(html).toBe('<div class="panel-title">Which letters have a <span class="hl" style="color:#9B59B6">circle</span>? <span class="count" data-total="2" data-sel=".letterbtn.found">0/2</span></div><div class="mode-body"><div class="shapepick"><span class="picklabel">shape</span><button class="pick shape" data-shape="straight line"><span class="sw c-line"></span>line</button><button class="pick shape" data-shape="curve"><span class="sw c-curve"></span>curve</button><button class="pick shape on" data-shape="circle"><span class="sw c-circle"></span>circle</button><button class="pick shape" data-shape="diagonal"><span class="sw c-diag"></span>diag</button><button class="pick shape" data-shape="dot"><span class="sw c-dot"></span>dot</button></div><div class="abc">' + abc + '</div><div class="hint">Find every letter built from this stroke — tap to check.</div></div>');
  });
});

describe('orderSlotsHtml', function() {
  it('renders the exact filled vs tap-to-fill slots, joined by an arrow, for a partial placement', function() {
    var html = orderSlotsHtml(['circle', 'straight line', 'curve'], ['circle']);
    expect(html).toBe('<div class="slotwrap"><div class="ordnum">1st</div><div class="slot filled"><svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#9B59B6" stroke-width="6" stroke-linecap="round"><circle cx="20" cy="20" r="13"/></svg></div></div><span class="arrow">→</span><div class="slotwrap"><div class="ordnum">2nd</div><div class="slot">tap →</div></div><span class="arrow">→</span><div class="slotwrap"><div class="ordnum">3rd</div><div class="slot">tap →</div></div>');
  });
  it('falls back to a numeric ordinal past the 4th named label', function() {
    var html = orderSlotsHtml(['circle', 'circle', 'circle', 'circle', 'circle'], []);
    expect(html).toContain('<div class="ordnum">4th</div>');
    expect(html).toContain('<div class="ordnum">5</div>');
    expect(html).not.toContain('<div class="ordnum">3</div>');
  });
});

describe('orderPoolHtml', function() {
  it('renders the exact tile row, excluding the strokes already placed', function() {
    var html = orderPoolHtml(['circle', 'straight line'], ['circle']);
    expect(html).toBe('<div class="tile" data-tile="straight line"><svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#3498DB" stroke-width="6" stroke-linecap="round"><line x1="20" y1="7" x2="20" y2="33"/></svg></div><div class="tile" data-tile="curve"><svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#27AE60" stroke-width="6" stroke-linecap="round"><path d="M27,9 A13,13 0 1 0 27,31"/></svg></div>');
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
  it('renders the exact panel end to end while incomplete', function() {
    var html = orderPanelHtml({ a: ['circle', 'straight line'] }, 'a', []);
    expect(html).toBe('<div class="panel-title">Make <span class="hl">a</span> — tap the strokes in order</div><div class="groups"><div class="grplabel">curly caterpillars</div><div class="grp"><button class="pick on" data-letter="a">a</button></div></div><div class="mode-body"><div class="row slots"><div class="slotwrap"><div class="ordnum">1st</div><div class="slot">tap →</div></div><span class="arrow">→</span><div class="slotwrap"><div class="ordnum">2nd</div><div class="slot">tap →</div></div></div><div class="row"><span class="picklabel">tap a stroke</span><div class="tile" data-tile="circle"><svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#9B59B6" stroke-width="6" stroke-linecap="round"><circle cx="20" cy="20" r="13"/></svg></div><div class="tile" data-tile="straight line"><svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#3498DB" stroke-width="6" stroke-linecap="round"><line x1="20" y1="7" x2="20" y2="33"/></svg></div><div class="tile" data-tile="curve"><svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#27AE60" stroke-width="6" stroke-linecap="round"><path d="M27,9 A13,13 0 1 0 27,31"/></svg></div></div><div class="hint">Tap the strokes one at a time, in the order you\'d write them.</div></div>');
  });
  it('renders the exact panel end to end once complete, including the done hint', function() {
    var html = orderPanelHtml({ a: ['circle', 'straight line'] }, 'a', ['circle', 'straight line']);
    expect(html).toBe('<div class="panel-title">Make <span class="hl">a</span> — tap the strokes in order</div><div class="groups"><div class="grplabel">curly caterpillars</div><div class="grp"><button class="pick on" data-letter="a">a</button></div></div><div class="mode-body"><div class="row slots"><div class="slotwrap"><div class="ordnum">1st</div><div class="slot filled"><svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#9B59B6" stroke-width="6" stroke-linecap="round"><circle cx="20" cy="20" r="13"/></svg></div></div><span class="arrow">→</span><div class="slotwrap"><div class="ordnum">2nd</div><div class="slot filled"><svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="#3498DB" stroke-width="6" stroke-linecap="round"><line x1="20" y1="7" x2="20" y2="33"/></svg></div></div></div><div class="hint done">✓ that\'s how you make a!</div><div class="hint">Tap the strokes one at a time, in the order you\'d write them.</div></div>');
  });
  it('falls back to an empty stroke set (not a placeholder) for a letter outside the registry', function() {
    var html = orderPanelHtml({}, 'z', []);
    expect(html).toContain('<div class="row slots"></div>');
    expect(html).toContain('data-tile="straight line"');
  });
});
