var AREA = {
  ead:  'Expressive Arts',
  uw:   'Understanding the World',
  cl:   'Communication',
  pd:   'Physical Development',
  psed: 'Personal & Social',
  l:    'Literacy',
  m:    'Maths'
};

export var GROUP_LABELS = ['Today', 'Earlier This Week', 'Older'];

var _lessonCache = {};
var _activityLabels = {};

var TIME_FORMAT = {
  'true':  function(ts) { return formatTime(ts); },
  'false': function(ts) { return formatDate(ts) + ' ' + formatTime(ts); }
};

var SOURCE_FORMAT = {
  'true':  function(label, num) { return label + num; },
  'false': function()           { return ''; }
};

var LESSON_NUM_FORMAT = {
  'true':  function(n) { return ' · Lesson ' + n; },
  'false': function()  { return ''; }
};

export function formatSlug(s) {
  if (!s) return '';
  return s.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

var NON_LESSON_TITLE = {
  'colouring_guided_complete': function(e) { return formatSlug(e.designId) || 'Design'; },
  'colouring_free_complete':   function(e) { return formatSlug(e.designId) || 'Design'; },
  'puzzle_completed':          function(e) { return formatSlug(e.puzzleId) || 'Puzzle'; }
};

var NON_LESSON_SOURCE = {
  'colouring_guided_complete': function()  { return 'Colouring Playground \u2014 Guided'; },
  'colouring_free_complete':   function()  { return 'Colouring Playground \u2014 Free'; },
  'puzzle_completed':          function(e) { return 'Puzzle' + (e.difficulty ? ' \u2014 ' + e.difficulty : ''); }
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

export function buildEntryViewModel(event, lesson) {
  var group = groupKey(event.timestamp);
  var timeStr = TIME_FORMAT[String(group === 'Today')](event.timestamp);
  var titleFn = NON_LESSON_TITLE[event.type];
  var title = titleFn ? titleFn(event) : ((lesson && lesson.title) || event.lessonId || event.type);
  var sourceFn = NON_LESSON_SOURCE[event.type];
  var actLabel = (event.activityId && (_activityLabels[event.activityId] || event.activityId)) || '';
  var numStr = LESSON_NUM_FORMAT[String(!!(lesson && lesson.number))](lesson && lesson.number);
  var sourceStr = sourceFn ? sourceFn(event) : SOURCE_FORMAT[String(!!actLabel)](actLabel, numStr);
  var criteria = (!titleFn && lesson && lesson.criteria) || [];
  return {
    timeStr: timeStr,
    sourceStr: sourceStr,
    title: title,
    criteriaTags: criteria.map(formatCriterion)
  };
}

export function sortAndGroupEvents(events) {
  var sorted = events.slice().sort(function(a, b) { return b.timestamp - a.timestamp; });
  var groups = { 'Today': [], 'Earlier This Week': [], 'Older': [] };
  sorted.forEach(function(e) { groups[groupKey(e.timestamp)].push(e); });
  var order = GROUP_LABELS.filter(function(l) { return groups[l].length > 0; });
  return { groups: groups, order: order };
}

export function fetchLesson(activityId, lessonId, cb) {
  if (!activityId || !lessonId) { cb(null); return; }
  var key = activityId;
  if (_lessonCache[key]) { cb(_lessonCache[key][lessonId] || null); return; }
  fetch('../../content/lessons/' + activityId + '.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var map = {};
      (data.lessons || []).forEach(function(l) { map[l.id] = l; });
      _lessonCache[key] = map;
      _activityLabels[key] = data.label || activityId;
      cb(map[lessonId] || null);
    })
    .catch(function() { cb(null); });
}
