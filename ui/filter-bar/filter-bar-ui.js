import { extractTags, extractLevels, filterItems } from '../../core/filter-bar/filter-bar-core.js';
export { extractTags, extractLevels, filterItems };

var ACTIVE_STYLES = {
  'true': colour => ({ border: colour, bg: colour, color: 'white' }),
  'false': () => ({ border: '#ddd', bg: '#fff', color: '#333' })
};

function active(on, colour) {
  var s = ACTIVE_STYLES[String(on)](colour);
  return 'padding:6px 14px;border-radius:12px;border:2px solid ' + s.border + ';background:' + s.bg + ';color:' + s.color + ';font-family:inherit;font-size:0.95em;cursor:pointer;';
}

var ROW_EXTRA = { 'true': extra => extra, 'false': () => '' };

function row(extra) {
  var d = document.createElement('div');
  d.style.cssText = 'display:flex;gap:8px;padding:8px 16px;flex-wrap:wrap;' + ROW_EXTRA[String(!!extra)](extra);
  return d;
}

var LEVEL_LABEL = { 'true': () => 'All Levels', 'false': l => 'Level ' + l };

var ADD_LEVEL_ROW = {
  'true': function(bar, levels, getActiveLevel, setActiveLevel, apply) {
    var levelRow = row('border-top:1px solid #eee;');
    ['all'].concat(levels).forEach(function(l) {
      var b = document.createElement('button');
      b.textContent = LEVEL_LABEL[String(l === 'all')](l);
      b.setAttribute('data-level', String(l));
      b.onclick = function() { setActiveLevel(l); apply(); };
      levelRow.appendChild(b);
    });
    bar.appendChild(levelRow);
  },
  'false': () => {}
};

export function buildFilterBar(items, onChange) {
  var bar = document.getElementById('filter-bar');
  bar.innerHTML = '';
  bar.style.cssText = 'display:flex;flex-direction:column;border-bottom:1px solid #eee;';

  var tags = extractTags(items), levels = extractLevels(items);
  var activeTag = 'all', activeLevel = 'all';

  function apply() {
    var filtered = filterItems(items, activeTag, activeLevel);
    bar.querySelectorAll('button[data-tag]').forEach(function(b) {
      b.style.cssText = active(b.getAttribute('data-tag') === activeTag, '#2ECC71');
    });
    bar.querySelectorAll('button[data-level]').forEach(function(b) {
      b.style.cssText = active(b.getAttribute('data-level') === String(activeLevel), '#3498DB');
    });
    onChange(filtered);
  }

  var tagRow = row();
  tags.forEach(function(t) {
    var b = document.createElement('button');
    b.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    b.setAttribute('data-tag', t);
    b.onclick = function() { activeTag = t; apply(); };
    tagRow.appendChild(b);
  });
  bar.appendChild(tagRow);

  ADD_LEVEL_ROW[String(levels.length > 0)](bar, levels, () => activeLevel, l => { activeLevel = l; }, apply);

  apply();
}
