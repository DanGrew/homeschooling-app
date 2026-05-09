var PIANO_CONFIG = {
  NOTES: ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5'],
  NOTE_LABELS: ['C','D','E','F','G','A','B','C','D','E'],
  KEY_COLORS: ['#FFB3B3','#FFCBA4','#FFF0A3','#B3FFB3','#A3D9FF','#B3C6FF','#E0B3FF','#FFB3E6','#B3FFEE','#D4FFB3'],
  HIT_WINDOW_MS: 400,
  LOOKAHEAD_MS: 4000,
  MIN_NOTE_GAP_MS: 1000,
  MAX_NOTE_GAP_MS: 3000,
  NOTE_COUNT: 10
};
PIANO_CONFIG.KEY_COUNT = PIANO_CONFIG.NOTES.length;

function generateNotes(config, rng) {
  rng = rng || Math.random;
  var result = [];
  var hitTime = config.LOOKAHEAD_MS + 600;
  for (var i = 0; i < config.NOTE_COUNT; i++) {
    var keyIndex = Math.floor(rng() * config.KEY_COUNT);
    if (i > 0) hitTime += config.MIN_NOTE_GAP_MS + rng() * (config.MAX_NOTE_GAP_MS - config.MIN_NOTE_GAP_MS);
    result.push({
      id: i,
      keyIndex: keyIndex,
      note: config.NOTES[keyIndex],
      spawnTime: hitTime - config.LOOKAHEAD_MS,
      hitTime: hitTime,
      state: 'active'
    });
  }
  return result;
}

function scoreMessage(hitCount) {
  if (hitCount >= 10) return { emoji: '\uD83E\uDD47', text: 'Amazing!',      sub: 'Perfect score!' };
  if (hitCount >= 7)  return { emoji: '\uD83C\uDF89', text: 'Well done!',    sub: hitCount + ' out of 10!' };
  if (hitCount >= 4)  return { emoji: '\u2B50',        text: 'Good try!',     sub: hitCount + ' out of 10!' };
  return              { emoji: '\uD83C\uDFB5',          text: 'Keep playing!', sub: hitCount + ' out of 10' };
}

function once(fn) {
  var called = false, result;
  return function() {
    if (!called) {
      called = true;
      try { result = fn(); } catch(e) { result = Promise.reject(e); }
    }
    return result;
  };
}

if (typeof module !== 'undefined') module.exports = { PIANO_CONFIG, generateNotes, scoreMessage, once };
