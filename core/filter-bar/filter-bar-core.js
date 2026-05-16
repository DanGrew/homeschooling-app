export function extractTags(items){
  var tags=[];
  items.forEach(function(p){(p.tags||[]).forEach(function(t){if(tags.indexOf(t)<0)tags.push(t);});});
  tags.sort();
  return ['all'].concat(tags);
}

export function filterItems(items,activeTag){
  return items.filter(function(p){
    return activeTag==='all'||(p.tags||[]).indexOf(activeTag)>=0;
  });
}

export var ACTIVE_STYLES = {
  'true':  function(colour) { return { border: colour, bg: colour, color: 'white' }; },
  'false': function()       { return { border: '#ddd', bg: '#fff', color: '#333' }; }
};

export function active(on, colour) {
  var s = ACTIVE_STYLES[String(on)](colour);
  return 'padding:6px 14px;border-radius:12px;border:2px solid ' + s.border + ';background:' + s.bg + ';color:' + s.color + ';font-family:inherit;font-size:0.95em;cursor:pointer;';
}
