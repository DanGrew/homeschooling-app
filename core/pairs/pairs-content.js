function filterByTag(entries, tag) {
  return entries.filter(function(e) { return e.tags && e.tags.indexOf(tag) !== -1; });
}

function filterByTags(entries, tags) {
  if (!tags || tags.length === 0) return entries.slice();
  return entries.filter(function(e) {
    return tags.some(function(tag) { return e.tags && e.tags.indexOf(tag) !== -1; });
  });
}

function getAvailableTags(entries) {
  var seen = {};
  var tags = [];
  entries.forEach(function(e) {
    (e.tags || []).forEach(function(t) {
      if (!seen[t]) { seen[t] = true; tags.push(t); }
    });
  });
  return tags.sort();
}

function buildContentSet(entries, count) {
  var ids = entries.map(function(e) { return e.id; });
  var result = [];
  var i = 0;
  while (result.length < count) {
    result.push(ids[i % ids.length]);
    i++;
  }
  return result;
}

if (typeof module !== 'undefined') module.exports = { filterByTag, filterByTags, getAvailableTags, buildContentSet };
