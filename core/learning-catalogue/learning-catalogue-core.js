function buildIconMap(learningIcons) {
  var map = {};
  learningIcons.forEach(function(ic) { map[ic.id] = ic.emoji; });
  return map;
}

function assembleGroups(areas, payloads) {
  return areas.map(function(area, i) {
    return { id: area.id, title: area.title, learnings: payloads[i].learnings };
  });
}

function activityHref(playgroundId) {
  return '../../activities/' + playgroundId + '/';
}

if (typeof module !== 'undefined') module.exports = { buildIconMap, assembleGroups, activityHref };
