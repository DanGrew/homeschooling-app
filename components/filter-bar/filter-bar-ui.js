import { extractTags, extractLevels, filterItems } from '../../core/filter-bar/filter-bar-core.js';
export { extractTags, extractLevels, filterItems };
import { makeSpeakable } from '../speech/speakable.js';

var TAG_EMOJI = { all: '', animals: '\uD83D\uDC3E', fruit: '\uD83C\uDF4E', emotions: '\uD83D\uDE0A', vehicles: '\uD83D\uDE97', medical: '\uD83C\uDFE5' };

function tagIcon(t) {
  if (t === 'all') return '\u2726';
  return TAG_EMOJI[t] || t.charAt(0).toUpperCase();
}

function optIcon(opt) {
  if (opt.value === 'all') return '\u2726';
  return TAG_EMOJI[opt.value] || opt.label.charAt(0).toUpperCase();
}

var _expanded = false;
var _applyFn = null;
window.addEventListener('nav:expand', function(e) {
  _expanded = e.detail.expanded;
  if (_applyFn) _applyFn();
});

function collapsedBtn(on, colour) {
  var border = on ? colour : '#ddd', bg = on ? colour : '#fff', col = on ? 'white' : '#333';
  return 'display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;border:2px solid ' + border + ';background:' + bg + ';color:' + col + ';font-family:inherit;cursor:pointer;box-sizing:border-box;padding:0;font-size:1.2em;flex-shrink:0;';
}

function expandedBtn(on, colour) {
  var border = on ? colour : '#ddd', bg = on ? colour : '#fff', col = on ? 'white' : '#333';
  return 'display:flex;align-items:center;gap:6px;width:100%;padding:6px 8px;border-radius:10px;border:2px solid ' + border + ';background:' + bg + ';color:' + col + ';font-family:inherit;cursor:pointer;box-sizing:border-box;text-align:left;flex-shrink:0;';
}

function btnStyle(on, colour) {
  return _expanded ? expandedBtn(on, colour) : collapsedBtn(on, colour);
}

function makeBtn(icon, label, dataAttr, dataVal, on, colour, onClick) {
  var b = document.createElement('button');
  b.setAttribute(dataAttr, dataVal);
  b.style.cssText = btnStyle(on, colour);

  var iconSpan = document.createElement('span');
  iconSpan.setAttribute('data-icon', '');
  iconSpan.textContent = icon;
  b.appendChild(iconSpan);

  var labelSpan = document.createElement('span');
  labelSpan.setAttribute('data-label', '');
  labelSpan.textContent = label;
  labelSpan.style.cssText = 'font-size:0.8em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (_expanded ? '' : 'display:none;');
  b.appendChild(labelSpan);

  b.onclick = onClick;
  makeSpeakable(b, label);
  return b;
}

function getSlot() {
  var navSlot = document.getElementById('nav-filter-slot');
  if (navSlot) return navSlot;
  _expanded = true;
  return document.getElementById('filter-bar');
}

var LEVEL_LABEL = { 'true': function() { return 'All Levels'; }, 'false': function(l) { return 'Level ' + l; } };
var LEVEL_ICON  = { 'true': function() { return '\u2605'; },      'false': function(l) { return 'L' + l; } };

export function buildFilterBar(items, onChange) {
  var slot = getSlot();
  if (!slot) return;
  slot.innerHTML = '';

  var tags = extractTags(items), levels = extractLevels(items);
  var activeTag = 'all', activeLevel = 'all';

  function updateStyles() {
    slot.querySelectorAll('button[data-tag]').forEach(function(b) {
      var on = b.getAttribute('data-tag') === activeTag;
      b.style.cssText = btnStyle(on, '#2ECC71');
      b.querySelector('[data-label]').style.display = _expanded ? '' : 'none';
    });
    slot.querySelectorAll('button[data-level]').forEach(function(b) {
      var on = b.getAttribute('data-level') === String(activeLevel);
      b.style.cssText = btnStyle(on, '#3498DB');
      b.querySelector('[data-label]').style.display = _expanded ? '' : 'none';
    });
  }

  function apply() {
    updateStyles();
    onChange(filterItems(items, activeTag, activeLevel));
  }

  _applyFn = updateStyles;

  tags.forEach(function(t) {
    var label = t.charAt(0).toUpperCase() + t.slice(1);
    slot.appendChild(makeBtn(tagIcon(t), label, 'data-tag', t, t === 'all', '#2ECC71', function() {
      activeTag = t; apply();
    }));
  });

  if (levels.length > 0) {
    var sep = document.createElement('div');
    sep.style.cssText = 'border-top:1px solid #eee;margin:4px 0;flex-shrink:0;';
    slot.appendChild(sep);
    ['all'].concat(levels).forEach(function(l) {
      slot.appendChild(makeBtn(
        LEVEL_ICON[String(l === 'all')](l),
        LEVEL_LABEL[String(l === 'all')](l),
        'data-level', String(l), l === 'all', '#3498DB',
        function() { activeLevel = l; apply(); }
      ));
    });
  }

  apply();
}

var SIMPLE_INITIAL = {
  'true':  function(iv)       { return String(iv); },
  'false': function(iv, opts) { return String(opts[0].value); }
};

export function buildSimpleFilterBar(options, onChange, initialValue) {
  var slot = getSlot();
  if (!slot) return;
  slot.innerHTML = '';

  var activeValue = SIMPLE_INITIAL[String(initialValue !== undefined)](initialValue, options);

  function updateStyles() {
    slot.querySelectorAll('button[data-value]').forEach(function(b) {
      var on = b.getAttribute('data-value') === activeValue;
      b.style.cssText = btnStyle(on, '#3498DB');
      b.querySelector('[data-label]').style.display = _expanded ? '' : 'none';
    });
  }

  _applyFn = updateStyles;

  options.forEach(function(opt) {
    slot.appendChild(makeBtn(optIcon(opt), opt.label, 'data-value', String(opt.value), String(opt.value) === activeValue, '#3498DB', function() {
      activeValue = String(opt.value);
      updateStyles();
      onChange(opt.value);
    }));
  });

  updateStyles();
}
