var ImageService = (function() {
  var urlCache = {};

  function load(dictBase, callback) {
    fetch(dictBase + 'manifests/image.json')
      .then(function(r) { return r.json(); })
      .then(function(paths) {
        return Promise.all(paths.map(function(p) {
          return fetch(dictBase + p).then(function(r) { return r.json(); });
        }));
      })
      .then(function(reps) {
        reps.forEach(function(rep) { urlCache[rep.concept] = dictBase + rep.src; });
        callback();
      })
      .catch(function() { callback(); });
  }

  function getUrl(id) { return urlCache[id] || null; }

  return { load: load, getUrl: getUrl };
})();
