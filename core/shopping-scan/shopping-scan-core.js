export function loadCatalog(url) {
  return fetch(url).then(function(r) {
    if (!r.ok) throw new Error('Failed to load catalog: ' + r.status);
    return r.json();
  }).then(function(data) {
    if (!data.items || !data.items.length) throw new Error('Catalog has no items');
    return data;
  });
}

export function buildCatalogItems(filtered, catalogs) {
  return filtered.flatMap(function(c) {
    return catalogs.filter(function(cat) { return cat.name === c.name; })
                   .flatMap(function(cat) {
                     return cat.items.map(function(it) {
                       return { name: it.name, barcode: it.barcode, icon: it.icon, tags: [].concat(cat.tags).filter(Boolean), catalog: cat.name };
                     });
                   });
  });
}
