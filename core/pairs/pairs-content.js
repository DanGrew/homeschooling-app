function filterByTag(entries, tag) {
  return entries.filter(function(e) { return e.tags && e.tags.indexOf(tag) !== -1; });
}

function buildContentSet(entries, pairCount) {
  var ids = entries.map(function(e) { return e.id; });
  var result = [];
  var i = 0;
  while (result.length < pairCount) {
    result.push(ids[i % ids.length]);
    i++;
  }
  return result;
}

if (typeof module !== 'undefined') module.exports = { filterByTag, buildContentSet };
