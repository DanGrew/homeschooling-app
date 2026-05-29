var SCENARIO_REQUIRED = ['id', 'title', 'grid', 'resetPoints', 'rows', 'entities'];
var GRID_REQUIRED = ['rows', 'cols'];
var ROW_REQUIRED = ['id', 'y', 'baseTile', 'wrap', 'movement'];
var MOVEMENT_REQUIRED = ['direction', 'moveEvery'];

function validateFields(obj, fields, context) {
  fields.forEach(function(k) {
    if (!(k in obj)) throw new Error(context + ' missing required field: ' + k);
  });
}

function validateMovement(movement, context) {
  if ('speed' in movement) throw new Error(context + ' contains deprecated field: speed (use moveEvery)');
  validateFields(movement, MOVEMENT_REQUIRED, context);
  if (!Number.isInteger(movement.moveEvery) || movement.moveEvery < 0)
    throw new Error(context + '.moveEvery must be a non-negative integer');
}

function validateSpawns(spawns, context) {
  if (!spawns) return;
  spawns.forEach(function(s, i) {
    var ctx = context + '.spawns[' + i + ']';
    if ('every' in s) throw new Error(ctx + ' contains deprecated field: every (use spawnEvery)');
    if (!('spawnEvery' in s)) throw new Error(ctx + ' missing required field: spawnEvery');
    if (!Number.isInteger(s.spawnEvery) || s.spawnEvery <= 0)
      throw new Error(ctx + '.spawnEvery must be a positive integer');
  });
}

function validateRow(row, i) {
  validateFields(row, ROW_REQUIRED, 'row[' + i + ']');
  validateMovement(row.movement, 'row[' + i + '].movement');
  validateSpawns(row.spawns, 'row[' + i + ']');
}

function parseScenario(json) {
  validateFields(json, SCENARIO_REQUIRED, 'scenario');
  validateFields(json.grid, GRID_REQUIRED, 'scenario.grid');
  json.rows.forEach(validateRow);
  return json;
}

if (typeof module !== 'undefined') module.exports = { parseScenario };
