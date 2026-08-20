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

// The atlas's Learning-cards row deep-links here with ?id=<learning-id> (TASK-ATLAS-
// LEARNINGS-LINK) — this is that lookup, a real filter over every learning rather than a
// null-sentinel: 0 or 1 matches, so the caller can .forEach() it open with no branch of its
// own (ui-cyclomatic).
function lcFindById(groups, id) {
  return lcAllLearnings(groups).filter(function(l) { return l.id === id; });
}

function lcAddPlaygroundChip(chips, seen, index, id) {
  if (seen[id]) return;
  seen[id] = true;
  chips.push({ type: 'playground', id: id, label: index.playgrounds[id].name, icon: index.playgrounds[id].emoji });
}

function lcAreaChip(area) {
  return { type: 'area', id: area.id, label: area.title, icon: area.icon };
}

function lcBuildChips(index, learnings) {
  var chips = [{ type: 'all', id: 'all', label: 'All', icon: '✨' }];
  index.areas.forEach(function(area) { chips.push(lcAreaChip(area)); });
  var seen = {};
  learnings.forEach(function(learning) {
    (learning.playgrounds || []).forEach(function(venue) { lcAddPlaygroundChip(chips, seen, index, venue.id); });
  });
  return chips;
}

// The catalogue holds three kinds of card (owner 2026-08-16): a learning is what you aim
// for, a life-moment is what already happens, an activity is structured play you set up.
// A learning carries no `type` at all, so it is the fallback.
var LC_TYPED_CARDS = ['life-moment', 'activity'];

function lcCardType(learning) {
  return LC_TYPED_CARDS.indexOf(learning.type) >= 0 ? learning.type : 'learning';
}

function lcChipClass(chip, active) {
  return chip.type === active.type && chip.id === active.id ? 'lc-chip lc-chip-on' : 'lc-chip';
}

// What a card offers the search beyond its title: a learning has keywords, a life-moment
// has theme titles, and an activity has neither — it is searched on the one line that says
// what it is.
function lcSearchTexts(learning) {
  if (learning.themes) return learning.themes.map(function(t) { return t.title; });
  return learning.keywords || [learning.focus];
}

function lcMatchesQuery(learning, query) {
  var q = query.trim().toLowerCase();
  if (q === '') return true;
  if (learning.title.toLowerCase().indexOf(q) >= 0) return true;
  return lcSearchTexts(learning).some(function(k) { return k.toLowerCase().indexOf(q) >= 0; });
}

function lcMatchesChip(learning, chip) {
  if (chip.type === 'all') return true;
  if (chip.type === 'area') return learning.area === chip.id;
  return (learning.playgrounds || []).some(function(venue) { return venue.id === chip.id; });
}

function lcFilterLearnings(learnings, query, chip) {
  return learnings.filter(function(l) { return lcMatchesChip(l, chip) && lcMatchesQuery(l, query); });
}

function lcFilter(groups, query, chip) {
  return groups.map(function(group) {
    return { id: group.id, title: group.title, learnings: lcFilterLearnings(group.learnings, query, chip) };
  }).filter(function(group) { return group.learnings.length > 0; });
}

function lcActivitySection(label, items) {
  return '<div class="lc-sec"><div class="lc-lab">' + label + '</div><ul class="lc-look">' +
    items.map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul></div>';
}

// The four things an activity card tells you, in the order you need them on the day:
// what to get out, what to do, what to say, and what to change to run it again.
function lcActivityBody(activity) {
  return lcActivitySection('🧺 Get out', activity.getOut) +
    lcActivitySection('▶ Run it', activity.run) +
    lcActivitySection('💬 Say', activity.say) +
    lcActivitySection('🔁 Again next time', activity.again);
}

function lcTalkColumn(heading, items) {
  return '<div class="lc-talk-col"><div class="lc-talk-ch">' + heading + '</div><ul class="lc-talk-ul">' +
    items.map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul></div>';
}

function lcTalkColumnsHtml(talkPrompts) {
  return lcTalkColumn('Ask them to…', talkPrompts.actions) + lcTalkColumn('…about', talkPrompts.topics);
}

if (typeof module !== 'undefined') module.exports = {
  buildIconMap, assembleGroups, activityHref,
  lcAllLearnings, lcFindById, lcAddPlaygroundChip, lcAreaChip, lcBuildChips, lcCardType, lcChipClass,
  lcSearchTexts, lcMatchesQuery, lcMatchesChip, lcFilterLearnings, lcFilter,
  lcActivitySection, lcActivityBody, lcTalkColumn, lcTalkColumnsHtml
};
