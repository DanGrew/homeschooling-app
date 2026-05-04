export function flattenCatalogs(catalogs){
  var out=[];
  catalogs.forEach(function(c){c.items.forEach(function(it){out.push({name:it.name,barcode:it.barcode,icon:it.icon,tags:c.tags,catalog:c.name});});});
  return out;
}

export function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
export function byName(a,b){return a.name.localeCompare(b.name);}
