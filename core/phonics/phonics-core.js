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

function graphemeIdForChar(char) {
  if (char >= 'a' && char <= 'z') return 'lower-' + char;
  if (char >= 'A' && char <= 'Z') return 'upper-' + char.toLowerCase();
  if (char >= '0' && char <= '9') return 'digit-' + char;
  return null;
}

function getShapesForChar(graphemes, char) {
  var id = graphemeIdForChar(char);
  return [id].filter(Boolean)
    .map(function(i) { return graphemes[i]; })
    .filter(Boolean)
    .map(function(g) { return g.shapes; })
    .filter(Boolean)[0];
}

export { buildSoundIndex, getAssetPath, deriveLetterSounds, graphemeIdForChar, getShapesForChar };
if (typeof module !== 'undefined') module.exports = { buildSoundIndex, getAssetPath, deriveLetterSounds, graphemeIdForChar, getShapesForChar };
