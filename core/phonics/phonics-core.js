function buildSoundIndex(graphemes) {
  var index = {};
  Object.keys(graphemes).forEach(function(gId) {
    var g = graphemes[gId];
    (g.sounds || []).forEach(function(s) {
      if (!index[s.id]) {
        index[s.id] = { clipId: s.clip, characters: g.characters };
      }
    });
  });
  return index;
}

function getAssetPath(graphemes, graphemeId) {
  var g = graphemes[graphemeId];
  return g ? g.asset : null;
}

function deriveLetterSounds(graphemes, word) {
  return word.toLowerCase().split('').map(function(c) {
    var g = graphemes['lower-' + c];
    return g ? g.defaultSound : null;
  });
}

if (typeof module !== 'undefined') module.exports = { buildSoundIndex, getAssetPath, deriveLetterSounds };
