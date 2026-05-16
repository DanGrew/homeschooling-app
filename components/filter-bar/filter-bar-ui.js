import { extractTags, extractLevels, filterItems, active } from '../../core/filter-bar/filter-bar-core.js';
export { extractTags, extractLevels, filterItems };
import { makeSpeakable } from '../speech/speakable.js';

var TAG_EMOJI = { all: '', animals: '\uD83D\uDC3E ', fruit: '\uD83C\uDF4E ', emotions: '\uD83D\uDE0A ', vehicles: '\uD83D\uDE97 ', medical: '\uD83C\uDFE5 ' };
var GET_TAG_EMOJI = { 'true': function(t) { return TAG_EMOJI[t]; }, 'false': function() { return ''; } };

var ROW_EXTRA = { 'true': extra => extra, 'false': () => '' };

function row(extra) {
  var d = document.createElement('div');
  d.style.cssText = 'display:flex;gap:8px;padding:8px 16px;flex-wrap:wrap;justify-content:center;' + ROW_EXTRA[String(!!extra)](extra);
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
      makeSpeakable(b, b.textContent);
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
    b.textContent = GET_TAG_EMOJI[String(t in TAG_EMOJI)](t) + t.charAt(0).toUpperCase() + t.slice(1);
    b.setAttribute('data-tag', t);
    b.onclick = function() { activeTag = t; apply(); };
    makeSpeakable(b, t.charAt(0).toUpperCase() + t.slice(1));
    tagRow.appendChild(b);
  });
  bar.appendChild(tagRow);

  ADD_LEVEL_ROW[String(levels.length > 0)](bar, levels, () => activeLevel, l => { activeLevel = l; }, apply);

  apply();
}

var SIMPLE_INITIAL = {
  'true':  function(iv)       { return String(iv); },
  'false': function(iv, opts) { return String(opts[0].value); }
};

export function buildSimpleFilterBar(options, onChange, initialValue) {
  var bar = document.getElementById('filter-bar');
  bar.innerHTML = '';
  bar.style.cssText = 'display:flex;flex-direction:column;border-bottom:1px solid #eee;';

  var activeValue = SIMPLE_INITIAL[String(initialValue !== undefined)](initialValue, options);
  var r = row();

  options.forEach(function(opt) {
    var b = document.createElement('button');
    b.textContent = GET_TAG_EMOJI[String(opt.value in TAG_EMOJI)](opt.value) + opt.label;
    b.setAttribute('data-value', String(opt.value));
    b.style.cssText = active(String(opt.value) === activeValue, '#3498DB');
    b.onclick = function() {
      activeValue = String(opt.value);
      r.querySelectorAll('button[data-value]').forEach(function(btn) {
        btn.style.cssText = active(btn.getAttribute('data-value') === activeValue, '#3498DB');
      });
      onChange(opt.value);
    };
    makeSpeakable(b, opt.label);
    r.appendChild(b);
  });

  bar.appendChild(r);
}
