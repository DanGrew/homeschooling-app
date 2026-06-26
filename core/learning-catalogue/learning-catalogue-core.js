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

function lcAllLearnings(groups) {
  return groups.reduce(function(acc, group) { return acc.concat(group.learnings); }, []);
}

function lcAddPlaygroundChip(chips, seen, index, id) {
  if (seen[id]) return;
  seen[id] = true;
  chips.push({ type: 'playground', id: id, label: index.playgrounds[id].name });
}

function lcAreaChip(area) {
  return { type: 'area', id: area.id, label: area.title };
}

function lcBuildChips(index, learnings) {
  var chips = [{ type: 'all', id: 'all', label: 'All' }];
  index.areas.forEach(function(area) { chips.push(lcAreaChip(area)); });
  var seen = {};
  learnings.forEach(function(learning) {
    learning.playgrounds.forEach(function(venue) { lcAddPlaygroundChip(chips, seen, index, venue.id); });
  });
  return chips;
}

function lcChipClass(chip, active) {
  return chip.type === active.type && chip.id === active.id ? 'lc-chip lc-chip-on' : 'lc-chip';
}

function lcMatchesQuery(learning, query) {
  var q = query.trim().toLowerCase();
  if (q === '') return true;
  if (learning.title.toLowerCase().indexOf(q) >= 0) return true;
  return learning.keywords.some(function(k) { return k.toLowerCase().indexOf(q) >= 0; });
}

function lcMatchesChip(learning, chip) {
  if (chip.type === 'all') return true;
  if (chip.type === 'area') return learning.area === chip.id;
  return learning.playgrounds.some(function(venue) { return venue.id === chip.id; });
}

function lcFilterLearnings(learnings, query, chip) {
  return learnings.filter(function(l) { return lcMatchesChip(l, chip) && lcMatchesQuery(l, query); });
}

function lcFilter(groups, query, chip) {
  return groups.map(function(group) {
    return { id: group.id, title: group.title, learnings: lcFilterLearnings(group.learnings, query, chip) };
  }).filter(function(group) { return group.learnings.length > 0; });
}

if (typeof module !== 'undefined') module.exports = {
  buildIconMap, assembleGroups, activityHref,
  lcAllLearnings, lcAddPlaygroundChip, lcAreaChip, lcBuildChips, lcChipClass,
  lcMatchesQuery, lcMatchesChip, lcFilterLearnings, lcFilter
};
