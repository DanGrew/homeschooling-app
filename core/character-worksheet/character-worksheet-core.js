var LOWER = (c) => 'lower-' + c + '.svg';
var UPPER = (c) => 'upper-' + c.toLowerCase() + '.svg';
var DIGIT = (c) => c + '.svg';

function charRange(lo, hi, fn) {
  return Array.from({ length: hi.charCodeAt(0) - lo.charCodeAt(0) + 1 }, (_, i) =>
    [String.fromCharCode(lo.charCodeAt(0) + i), fn]
  );
}

var CHAR_MAP = new Map([
  ...charRange('a', 'z', LOWER),
  ...charRange('A', 'Z', UPPER),
  ...charRange('0', '9', DIGIT),
]);

export function charToFile(c) {
  const fn = CHAR_MAP.get(c);
  return fn ? fn(c) : null;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function buildPattern(chars, total) {
  return Array.from({ length: total }, (_, i) => chars[i % chars.length]);
}

if (typeof module !== 'undefined') module.exports = { charToFile, clamp, buildPattern };
