var GET_CRITERIA = {
  'true':  function(lesson) { return lesson.criteria; },
  'false': function() { return []; }
};
var COMPARE_DIR = {
  'true':  function(ka, kb) { return ka.localeCompare(kb); },
  'false': function(ka, kb) { return kb.localeCompare(ka); }
};

function lessonCriteria(lesson) {
  return GET_CRITERIA[String(Array.isArray(lesson.criteria))](lesson);
}

function buildCriterionMap(criteriaData) {
  var map = {};
  criteriaData.areas.forEach(function(area) {
    area.criteria.forEach(function(c) { map[c.id] = { label: c.label, areaId: area.id }; });
  });
  return map;
}

function buildByArea(criteria, criterionMap, areas) {
  var byArea = {};
  areas.forEach(function(a) { byArea[a.id] = []; });
  criteria.filter(function(cid) { return criterionMap[cid]; })
    .forEach(function(cid) { byArea[criterionMap[cid].areaId].push(criterionMap[cid].label); });
  Object.keys(byArea).forEach(function(aid) { byArea[aid].sort(); });
  return byArea;
}

function lessonToRow(lesson, activityLabel, criterionMap, areas) {
  return { title: lesson.title, activity: activityLabel, byArea: buildByArea(lessonCriteria(lesson), criterionMap, areas), type: 'lesson' };
}

function flattenLessons(files, criterionMap, areas) {
  var result = [];
  files.forEach(function(f) {
    f.lessons.forEach(function(lesson) { result.push(lessonToRow(lesson, f.activityLabel, criterionMap, areas)); });
  });
  return result;
}

function physicalToRow(activityData, criterionMap, areas) {
  var criteria = Array.isArray(activityData.criteria) ? activityData.criteria : [];
  return { title: activityData.title, activity: 'Physical Play',
           byArea: buildByArea(criteria, criterionMap, areas), type: 'physical' };
}

function flattenPhysical(files, criterionMap, areas) {
  return files.map(function(f) { return physicalToRow(f.data, criterionMap, areas); });
}

function exerciseToRow(exercise, criterionMap, areas) {
  return { title: exercise.title, activity: exercise.source || '', byArea: buildByArea(lessonCriteria(exercise), criterionMap, areas), type: 'exercise' };
}

function flattenExercises(exercises, criterionMap, areas) {
  return exercises.map(function(ex) { return exerciseToRow(ex, criterionMap, areas); });
}

function defaultCompare(a, b) {
  return (a.activity + '\x00' + a.title).localeCompare(b.activity + '\x00' + b.title);
}

function colCompare(a, b, sortAsc, colKeyFns, sortCol) {
  return COMPARE_DIR[String(sortAsc)](colKeyFns[sortCol](a), colKeyFns[sortCol](b));
}

if (typeof module !== 'undefined') module.exports = { lessonCriteria, buildCriterionMap, buildByArea, lessonToRow, flattenLessons, physicalToRow, flattenPhysical, exerciseToRow, flattenExercises, defaultCompare, colCompare };
