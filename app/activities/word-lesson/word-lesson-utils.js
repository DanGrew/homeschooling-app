function validWord(w) {
  return w.length > 0 && w.split('').every(c =>
    (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
  );
}

function charFile(c) {
  if (c >= 'a' && c <= 'z') return 'lower-' + c + '.svg';
  if (c >= 'A' && c <= 'Z') return 'upper-' + c.toLowerCase() + '.svg';
  return c + '.svg';
}

if (typeof module !== 'undefined') { module.exports = { validWord, charFile }; }
