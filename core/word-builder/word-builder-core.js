const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function parseWord(word) {
  return word.toUpperCase().split('').map(ch => {
    if (ch === ' ') return { char: ch, type: 'space' };
    if (ch === "'") return { char: ch, type: 'apostrophe' };
    return { char: ch, type: 'letter' };
  });
}

export function buildTileSet(word, mode) {
  const letters = parseWord(word).filter(t => t.type === 'letter').map(t => t.char);
  if (mode === 'alphabet') return [...ALPHABET];
  const unique = [...new Set(letters)];
  const noise = ALPHABET.filter(l => !unique.includes(l));
  const needed = Math.max(4, letters.length + 4);
  const extras = shuffle(noise).slice(0, needed - unique.length);
  return shuffle([...unique, ...extras]);
}

export function validateLetter(expected, placed) {
  return expected.toUpperCase() === placed.toUpperCase();
}

export function isWordComplete(slots) {
  return slots.every(s => s.type !== 'letter' || s.locked === true);
}

export function pickWord(items) {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

if (typeof module !== 'undefined') module.exports = { parseWord, buildTileSet, validateLetter, isWordComplete, pickWord };
