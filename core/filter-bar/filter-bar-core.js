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

var TAG_EMOJI = { all: '', animals: '\uD83D\uDC3E', fruit: '\uD83C\uDF4E', emotions: '\uD83D\uDE0A', vehicles: '\uD83D\uDE97', medical: '\uD83C\uDFE5', vegetables: '\uD83E\uDD66', dairy: '\uD83E\uDDC0', bakery: '\uD83E\uDD50', groceries: '\uD83D\uDED2', 'paw-patrol': '\uD83D\uDC3E\uD83D\uDE93' };

export function tagIcon(t) {
  if (t === 'all') return '\u2726';
  return TAG_EMOJI[t] || t.charAt(0).toUpperCase();
}

export function optIcon(opt) {
  if (opt.icon) return opt.icon;
  if (opt.value === 'all') return '\u2726';
  return TAG_EMOJI[opt.value] || opt.label.charAt(0);
}

export function collapsedBtn(on, colour) {
  var border = on ? colour : '#ddd', bg = on ? colour : '#fff', col = on ? 'white' : '#333';
  return 'display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;border:2px solid ' + border + ';background:' + bg + ';color:' + col + ';font-family:inherit;cursor:pointer;box-sizing:border-box;padding:0;font-size:1.2em;flex-shrink:0;';
}

export function expandedBtn(on, colour) {
  var border = on ? colour : '#ddd', bg = on ? colour : '#fff', col = on ? 'white' : '#333';
  return 'display:flex;align-items:center;gap:6px;width:100%;padding:6px 8px;border-radius:10px;border:2px solid ' + border + ';background:' + bg + ';color:' + col + ';font-family:inherit;cursor:pointer;box-sizing:border-box;text-align:left;flex-shrink:0;';
}

export function btnStyle(expanded, on, colour) {
  return expanded ? expandedBtn(on, colour) : collapsedBtn(on, colour);
}

export var ACTIVE_STYLES = {
  'true':  function(colour) { return { border: colour, bg: colour, color: 'white' }; },
  'false': function()       { return { border: '#ddd', bg: '#fff', color: '#333' }; }
};

export function active(on, colour) {
  var s = ACTIVE_STYLES[String(on)](colour);
  return 'padding:6px 14px;border-radius:12px;border:2px solid ' + s.border + ';background:' + s.bg + ';color:' + s.color + ';font-family:inherit;font-size:0.95em;cursor:pointer;';
}
