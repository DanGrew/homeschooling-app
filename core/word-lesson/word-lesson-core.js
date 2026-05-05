export function validWord(w) {
  return w.length > 0 && w.split('').every(c =>
    (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
  );
}

export function charFile(c) {
  if (c >= 'a' && c <= 'z') return 'lower-' + c + '.svg';
  if (c >= 'A' && c <= 'Z') return 'upper-' + c.toLowerCase() + '.svg';
  return c + '.svg';
}

var VOICE_FILTERS = [
  v => v.lang === 'en-GB' && /female|woman|girl|karen|serena|moira|kate/i.test(v.name),
  v => v.lang === 'en-GB',
  v => v.lang.startsWith('en'),
];

export function bestVoice(voices) {
  return VOICE_FILTERS.map(f => voices.find(f)).find(Boolean) || null;
}

export function extractWordTags(words) {
  const tags = ['all'];
  words.forEach(w => (w.tags || []).forEach(t => { if (!tags.includes(t)) tags.push(t); }));
  return [...tags, 'custom'];
}

export function filterWordsByTag(words, tag) {
  if (tag === 'all' || tag === 'custom') return words.slice();
  return words.filter(w => (w.tags || []).includes(tag));
}

export function wrapIdx(idx, total) {
  return ((idx % total) + total) % total;
}

export function resolveWordEntry(concept) {
  return { word: concept.name.toLowerCase(), tags: concept.tags || [], id: concept.id };
}

if (typeof module !== 'undefined') module.exports = { validWord, charFile, bestVoice, extractWordTags, filterWordsByTag, wrapIdx, resolveWordEntry };
