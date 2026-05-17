var AREA = {
  ead:  'Expressive Arts',
  uw:   'Understanding the World',
  cl:   'Communication',
  pd:   'Physical Development',
  psed: 'Personal & Social',
  l:    'Literacy',
  m:    'Maths'
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
