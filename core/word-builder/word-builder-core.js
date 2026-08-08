const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function parseWord(word) {
  return word.toUpperCase().split('').map(ch => {
    if (ch === ' ') return { char: ch, type: 'space' };
    if (ch === "'") return { char: ch, type: 'apostrophe' };
    return { char: ch, type: 'letter' };
  });
}

export function buildTileSet(word, mode, rng) {
  rng = rng || Math.random;
  const letters = parseWord(word).filter(t => t.type === 'letter').map(t => t.char);
  if (mode === 'alphabet') return [...ALPHABET];
  const unique = [...new Set(letters)];
  const noise = ALPHABET.filter(l => !unique.includes(l));
  const needed = Math.max(4, letters.length + 4);
  const extras = shuffle(noise, rng).slice(0, needed - unique.length);
  return shuffle([...unique, ...extras], rng);
}

export function validateLetter(expected, placed) {
  return expected.toUpperCase() === placed.toUpperCase();
}

export function isWordComplete(slots) {
  return slots.every(s => s.type !== 'letter' || s.locked === true);
}

export function pickWord(items, rng) {
  rng = rng || Math.random;
  if (!items || items.length === 0) return null;
  return items[Math.floor(rng() * items.length)];
}

function shuffle(arr, rng) {
  rng = rng || Math.random;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function slotKey(slot, isTarget) {
  var keys = [['locked', slot.locked], ['error', slot.error], ['target', isTarget], ['default', true]];
  return keys.find(function(k) { return k[1]; })[0];
}
