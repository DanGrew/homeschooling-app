var PRIMITIVES = ['straight line', 'curve', 'circle', 'diagonal', 'dot'];

var COLOURS = {
  'straight line': '#3498DB',
  'curve': '#27AE60',
  'circle': '#9B59B6',
  'diagonal': '#F39C12',
  'dot': '#E74C3C'
};

var SHORT = {
  'straight line': 'line',
  'curve': 'curve',
  'circle': 'circle',
  'diagonal': 'diag',
  'dot': 'dot'
};

var FAMILIES = [
  { label: 'curly caterpillars', letters: ['c', 'a', 'd', 'o', 's', 'g', 'q', 'e', 'f'] },
  { label: 'long ladders',       letters: ['l', 'i', 'u', 't', 'j', 'y'] },
  { label: 'one-armed robots',   letters: ['r', 'n', 'm', 'h', 'b', 'p', 'k'] },
  { label: 'zigzag monsters',    letters: ['v', 'w', 'x', 'z'] }
];

var ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

var GLYPHS = {
  a: '<circle cx="42" cy="74" r="24" stroke="#9B59B6"/><line x1="68" y1="42" x2="68" y2="99" stroke="#3498DB"/>',
  c: '<path d="M72,54 A26,26 0 1 0 72,96" stroke="#27AE60"/>',
  o: '<circle cx="50" cy="72" r="26" stroke="#9B59B6"/>',
  d: '<circle cx="42" cy="74" r="24" stroke="#9B59B6"/><line x1="70" y1="30" x2="70" y2="99" stroke="#3498DB"/>',
  g: '<circle cx="46" cy="66" r="22" stroke="#9B59B6"/><path d="M68,48 L68,96 A20,15 0 0 1 34,104" stroke="#27AE60"/>',
  q: '<circle cx="42" cy="70" r="24" stroke="#9B59B6"/><line x1="68" y1="46" x2="68" y2="112" stroke="#3498DB"/>',
  l: '<line x1="50" y1="26" x2="50" y2="100" stroke="#3498DB"/>',
  i: '<line x1="50" y1="52" x2="50" y2="100" stroke="#3498DB"/><circle cx="50" cy="34" r="2" fill="#E74C3C" stroke="#E74C3C"/>',
  t: '<line x1="52" y1="34" x2="52" y2="100" stroke="#3498DB"/><line x1="34" y1="54" x2="70" y2="54" stroke="#3498DB"/>',
  v: '<line x1="34" y1="50" x2="50" y2="98" stroke="#F39C12"/><line x1="66" y1="50" x2="50" y2="98" stroke="#F39C12"/>',
  x: '<line x1="34" y1="50" x2="66" y2="98" stroke="#F39C12"/><line x1="66" y1="50" x2="34" y2="98" stroke="#F39C12"/>',
  s: '<path d="M68,58 A15,13 0 1 0 44,68 A15,13 0 1 1 32,90" stroke="#27AE60"/>'
};

function buildLetterShapeMap(graphemes) {
  var map = {};
  Object.keys(graphemes || {}).forEach(function(id) {
    var m = id.match(/^lower-([a-z])$/);
    if (m) map[m[1]] = (graphemes[id].shapes || []).slice();
  });
  return map;
}

function groupLettersByFamily(shapeMap, families) {
  var covered = {};
  var groups = families.map(function(f) {
    var letters = f.letters.filter(function(l) { return shapeMap[l]; });
    letters.forEach(function(l) { covered[l] = true; });
    return { label: f.label, letters: letters };
  }).filter(function(g) { return g.letters.length; });
  var extra = Object.keys(shapeMap).filter(function(l) { return !covered[l]; }).sort();
  if (extra.length) groups.push({ label: 'more letters', letters: extra });
  return groups;
}

function strokesFor(shapeMap, key) {
  return shapeMap[key] || [];
}

function lettersWithShape(shapeMap, shape, alphabet) {
  return alphabet.filter(function(l) {
    return strokesFor(shapeMap, l).indexOf(shape) !== -1;
  });
}

function buildOrderPool(strokes, primitives) {
  var distractor = primitives.filter(function(p) { return strokes.indexOf(p) === -1; })[0] || 'diagonal';
  return strokes.concat([distractor]);
}

function availableTiles(pool, placed) {
  var used = {};
  placed.forEach(function(p) { used[p] = (used[p] || 0) + 1; });
  var seen = {};
  var avail = [];
  pool.forEach(function(s) {
    seen[s] = (seen[s] || 0) + 1;
    if (seen[s] > (used[s] || 0)) avail.push(s);
  });
  return avail;
}

function isOrderComplete(strokes, placed) {
  return strokes.length > 0 && placed.length === strokes.length;
}

function isCorrectPlacement(strokes, placed, shape) {
  return shape === strokes[placed.length];
}

function countShapes(strokes) {
  return PRIMITIVES.filter(function(p) { return strokes.indexOf(p) !== -1; }).length;
}

function parseJsonResponse(response) {
  return response.json();
}

function glyphHtml(letter) {
  if (GLYPHS[letter]) {
    return '<svg width="150" height="150" viewBox="0 0 100 125" fill="none" stroke-width="9" stroke-linecap="round">' + GLYPHS[letter] + '</svg>';
  }
  return '<div class="fallback">' + letter + '</div>';
}

function swatchHtml(shape) {
  return '<span class="sw c-' + SHORT[shape] + '"></span>';
}

var STROKE_ICON = {
  'straight line': '<line x1="20" y1="7" x2="20" y2="33"/>',
  'curve': '<path d="M27,9 A13,13 0 1 0 27,31"/>',
  'circle': '<circle cx="20" cy="20" r="13"/>',
  'diagonal': '<line x1="11" y1="31" x2="29" y2="9"/>'
};

function strokeSwatchHtml(shape) {
  var col = COLOURS[shape];
  var inner = STROKE_ICON[shape] || '<circle cx="20" cy="20" r="6" fill="' + col + '"/>';
  return '<svg class="strokeicon" viewBox="0 0 40 40" fill="none" stroke="' + col + '" stroke-width="6" stroke-linecap="round">' + inner + '</svg>';
}

function letterPickerHtml(shapeMap, current) {
  return '<div class="groups">' + groupLettersByFamily(shapeMap, FAMILIES).map(function(g) {
    return '<div class="grplabel">' + g.label + '</div><div class="grp">' + g.letters.map(function(l) {
      return '<button class="pick' + (l === current ? ' on' : '') + '" data-letter="' + l + '">' + l + '</button>';
    }).join('') + '</div>';
  }).join('') + '</div>';
}

function chipsHtml(strokes) {
  return PRIMITIVES.map(function(shape) {
    var has = strokes.indexOf(shape) !== -1;
    return '<button class="chip" data-shape="' + shape + '" data-has="' + has + '">' + swatchHtml(shape) + SHORT[shape] + '<span class="tick">✓</span></button>';
  }).join('');
}

function countHtml(total, selector) {
  return '<span class="count" data-total="' + total + '" data-sel="' + selector + '">0/' + total + '</span>';
}

function identifyPanelHtml(shapeMap, current) {
  var strokes = strokesFor(shapeMap, current);
  return '<div class="panel-title">What shapes make <span class="hl">' + current + '</span>? ' +
    countHtml(countShapes(strokes), ".chip.tapped[data-has='true']") + '</div>' +
    letterPickerHtml(shapeMap, current) +
    '<div class="mode-body">' +
    '<div class="row identify-row"><div class="glyph">' + glyphHtml(current) + '</div>' +
    '<div class="row chips">' + chipsHtml(strokes) + '</div></div>' +
    '<div class="hint">Tap the strokes you can see — the right ones turn green. The letter is drawn in matching stroke colours.</div>' +
    '</div>';
}

function shapePickerHtml(current) {
  return '<div class="shapepick"><span class="picklabel">shape</span>' + PRIMITIVES.map(function(shape) {
    return '<button class="pick shape' + (shape === current ? ' on' : '') + '" data-shape="' + shape + '">' + swatchHtml(shape) + SHORT[shape] + '</button>';
  }).join('') + '</div>';
}

function matchPanelHtml(shapeMap, currentShape) {
  var lit = lettersWithShape(shapeMap, currentShape, ALPHABET);
  return '<div class="panel-title">Which letters have a <span class="hl" style="color:' + COLOURS[currentShape] + '">' + SHORT[currentShape] + '</span>? ' +
    countHtml(lit.length, '.letterbtn.found') + '</div>' +
    '<div class="mode-body">' +
    shapePickerHtml(currentShape) +
    '<div class="abc">' + ALPHABET.map(function(l) {
      return '<button class="letterbtn" data-cell="' + l + '" data-has="' + (lit.indexOf(l) !== -1) + '">' + l + '</button>';
    }).join('') + '</div>' +
    '<div class="hint">Find every letter built from this stroke — tap to check.</div>' +
    '</div>';
}

function orderSlotsHtml(strokes, placed) {
  var labels = ['1st', '2nd', '3rd', '4th'];
  return strokes.map(function(s, i) {
    var filled = i < placed.length;
    var inner = filled ? strokeSwatchHtml(placed[i]) : 'tap →';
    return '<div class="slotwrap"><div class="ordnum">' + (labels[i] || (i + 1)) + '</div><div class="slot' + (filled ? ' filled' : '') + '">' + inner + '</div></div>';
  }).join('<span class="arrow">→</span>');
}

function orderPoolHtml(strokes, placed) {
  var pool = buildOrderPool(strokes, PRIMITIVES);
  return availableTiles(pool, placed).map(function(s) {
    return '<div class="tile" data-tile="' + s + '">' + strokeSwatchHtml(s) + '</div>';
  }).join('');
}

function orderPanelHtml(shapeMap, current, placed) {
  var strokes = strokesFor(shapeMap, current);
  var done = isOrderComplete(strokes, placed);
  var footer = done
    ? '<div class="hint done">✓ that\'s how you make ' + current + '!</div>'
    : '<div class="row"><span class="picklabel">tap a stroke</span>' + orderPoolHtml(strokes, placed) + '</div>';
  return '<div class="panel-title">Make <span class="hl">' + current + '</span> — tap the strokes in order</div>' +
    letterPickerHtml(shapeMap, current) +
    '<div class="mode-body">' +
    '<div class="row slots">' + orderSlotsHtml(strokes, placed) + '</div>' +
    footer +
    '<div class="hint">Tap the strokes one at a time, in the order you\'d write them.</div>' +
    '</div>';
}

export {
  PRIMITIVES, COLOURS, SHORT, FAMILIES, ALPHABET,
  buildLetterShapeMap, groupLettersByFamily, lettersWithShape, strokesFor,
  buildOrderPool, availableTiles, isOrderComplete, isCorrectPlacement, countShapes, parseJsonResponse,
  glyphHtml, swatchHtml, strokeSwatchHtml, letterPickerHtml, chipsHtml, countHtml,
  identifyPanelHtml, shapePickerHtml, matchPanelHtml,
  orderSlotsHtml, orderPoolHtml, orderPanelHtml
};
if (typeof module !== 'undefined') module.exports = {
  PRIMITIVES, COLOURS, SHORT, FAMILIES, ALPHABET,
  buildLetterShapeMap, groupLettersByFamily, lettersWithShape, strokesFor,
  buildOrderPool, availableTiles, isOrderComplete, isCorrectPlacement, countShapes, parseJsonResponse,
  glyphHtml, swatchHtml, strokeSwatchHtml, letterPickerHtml, chipsHtml, countHtml,
  identifyPanelHtml, shapePickerHtml, matchPanelHtml,
  orderSlotsHtml, orderPoolHtml, orderPanelHtml
};
