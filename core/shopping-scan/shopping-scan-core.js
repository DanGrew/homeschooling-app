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
