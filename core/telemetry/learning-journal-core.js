var AREA = {
  ead:     'Expressive Arts',
  uw:      'Understanding the World',
  cl:      'Communication',
  pd:      'Physical Development',
  psed:    'Personal & Social',
  literacy:'Literacy',
  maths:   'Maths'
};

export var GROUP_LABELS = ['Today', 'Earlier This Week', 'Older'];

var _learningCache = {};

var TIME_FORMAT = {
  'true':  function(ts) { return formatTime(ts); },
  'false': function(ts) { return formatDate(ts) + ' ' + formatTime(ts); }
};

var SOURCE_FORMAT = {
  'true':  function(source, num) { return source + num; },
  'false': function()            { return ''; }
};

var NUM_TYPE_LABEL = { 'exercise': 'Exercise', 'lesson': 'Lesson' };
var LESSON_NUM_FORMAT = {
  'true':  function(n, type) { return ' · ' + (NUM_TYPE_LABEL[type] || 'Lesson') + ' ' + n; },
  'false': function()        { return ''; }
};

export function formatCriterion(c) {
  var parts = c.split('.');
  var area = AREA[parts[0]] || parts[0];
  var sub = parts.slice(1).join('.').replace(/-/g, ' ');
  return sub ? area + ' — ' + sub : area;
}

export function groupKey(ts) {
  var now = new Date();
  var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var startOfWeek = startOfToday - (now.getDay() * 86400000);
  if (ts >= startOfToday) return 'Today';
  if (ts >= startOfWeek) return 'Earlier This Week';
  return 'Older';
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function buildEntryViewModel(event, learning) {
  var group = groupKey(event.timestamp);
  var timeStr = TIME_FORMAT[String(group === 'Today')](event.timestamp);
  var lid = event.learning_id || event.lessonId;
  var title = (learning && learning.title) || lid || event.type;
  var source = (learning && learning.source) || '';
  var numStr = LESSON_NUM_FORMAT[String(!!(learning && learning.number))](learning && learning.number, (learning && learning.type) || 'lesson');
  var sourceStr = SOURCE_FORMAT[String(!!source)](source, numStr);
  var criteria = (learning && learning.criteria) || [];
  return {
    timeStr: timeStr,
    sourceStr: sourceStr,
    title: title,
    criteriaTags: criteria.map(formatCriterion),
    variantId: event.variant_id,
    difficulty: event.difficulty
  };
}

export function sortAndGroupEvents(events) {
  var sorted = events.slice().sort(function(a, b) { return b.timestamp - a.timestamp; });
  var groups = { 'Today': [], 'Earlier This Week': [], 'Older': [] };
  sorted.forEach(function(e) { groups[groupKey(e.timestamp)].push(e); });
  var order = GROUP_LABELS.filter(function(l) { return groups[l].length > 0; });
  return { groups: groups, order: order };
}

function colouringMeta(vm) {
  return { key: 'variant_id', label: 'Variant', val: [vm.variantId, 'None'].find(Boolean) };
}

var EXTRA_META = {
  'colouring-guided': colouringMeta,
  'colouring-free':   colouringMeta
};

export function extraMetaTags(vm, event) {
  return [EXTRA_META[event.learning_id]].filter(Boolean).map(function(fn) { return fn(vm); });
}

export function getThreshold(preset) {
  var now = Date.now();
  var d = new Date();
  var THRESH = {
    'last5':    now - 300000,
    'last15':   now - 900000,
    'last30':   now - 1800000,
    'last1h':   now - 3600000,
    'last2h':   now - 7200000,
    'today':    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
    'lastweek': now - 604800000,
    'all':      0
  };
  return THRESH[preset];
}

export function applyPreset(events, preset) {
  var threshold = getThreshold(preset);
  return events.filter(function(e) { return e.timestamp >= threshold; });
}

export function fetchLearning(learningId, cb) {
  if (!learningId) { cb(null); return; }
  if (_learningCache[learningId]) { cb(_learningCache[learningId]); return; }
  fetch('../../content/learnings/' + learningId + '.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _learningCache[learningId] = data;
      cb(data);
    })
    .catch(function() { cb(null); });
}
