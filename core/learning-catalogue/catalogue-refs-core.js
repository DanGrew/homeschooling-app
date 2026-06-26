function collectCriterionIds(criteria) {
  var ids = [];
  criteria.areas.forEach(function(area) {
    area.criteria.forEach(function(c) { ids.push(c.id); });
  });
  return ids;
}

function validateLearning(learning, ctx) {
  var errors = [];
  if (learning.area !== ctx.areaId) {
    errors.push(learning.id + ': area "' + learning.area + '" does not match its file home "' + ctx.areaId + '"');
  }
  learning.curriculum.forEach(function(tag) {
    if (ctx.criterionIds.indexOf(tag) === -1) {
      errors.push(learning.id + ': curriculum tag "' + tag + '" is not a valid criterion id');
    }
  });
  learning.learningIcons.forEach(function(icon) {
    if (ctx.iconIds.indexOf(icon) === -1) {
      errors.push(learning.id + ': learningIcon "' + icon + '" is not in the icon registry');
    }
  });
  learning.playgrounds.forEach(function(venue) {
    if (ctx.playgroundIds.indexOf(venue.id) === -1) {
      errors.push(learning.id + ': playground "' + venue.id + '" is not in the playgrounds registry');
    }
    if (ctx.activityIds.indexOf(venue.id) === -1) {
      errors.push(learning.id + ': playground "' + venue.id + '" has no app/activities/' + venue.id + '/ directory');
    }
  });
  return errors;
}

if (typeof module !== 'undefined') module.exports = { collectCriterionIds, validateLearning };
