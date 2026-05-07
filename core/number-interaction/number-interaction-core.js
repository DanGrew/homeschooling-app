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
