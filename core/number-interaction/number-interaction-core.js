var PLURAL_SUFFIX = { y: 'ies', h: 'es' };
var GET_SUFFIX = { 'true': function(l) { return PLURAL_SUFFIX[l]; }, 'false': function() { return 's'; } };
var GET_BASE   = { 'true': function(n) { return n.slice(0, -1); },  'false': function(n) { return n; } };

export function pluralize(name) {
  var last = name.slice(-1);
  var has = String(last in PLURAL_SUFFIX);
  return GET_BASE[has](name) + GET_SUFFIX[has](last);
}

export function comparisonColor(a, b) {
  return a > b ? '#2ECC71' : a < b ? '#E74C3C' : '#3498DB';
}

export function pickFruitPair(fruits) {
  const ai = Math.floor(Math.random() * fruits.length);
  const bi = (ai + 1 + Math.floor(Math.random() * (fruits.length - 1))) % fruits.length;
  return [fruits[ai], fruits[bi]];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function makeImg(item, sz) {
  return '<img src="' + item.url + '" style="' + sz + ';transition:transform 0.15s,filter 0.15s;" draggable="false">';
}

export function labelState(self, other) {
  return (
    ['empty'].filter(function() { return self + other === 0; })
    .concat(['same'].filter(function() { return self === other; }))
    .concat(['bigger'].filter(function() { return self > other; }))
    .concat(['smaller'].filter(function() { return self < other; }))
    .concat(['empty'])
  )[0];
}

