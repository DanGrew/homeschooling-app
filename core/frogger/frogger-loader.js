var SCENARIO_REQUIRED = ['id', 'title', 'grid', 'resetPoints', 'rows', 'entities'];
var GRID_REQUIRED = ['rows', 'cols'];
var ROW_REQUIRED = ['id', 'y', 'baseTile', 'wrap', 'movement'];
var MOVEMENT_REQUIRED = ['direction', 'speed'];

function validateFields(obj, fields, context) {
  fields.forEach(function(k) {
    if (!(k in obj)) throw new Error(context + ' missing required field: ' + k);
  });
}

function validateRow(row, i) {
  validateFields(row, ROW_REQUIRED, 'row[' + i + ']');
  validateFields(row.movement, MOVEMENT_REQUIRED, 'row[' + i + '].movement');
}

function parseScenario(json) {
  validateFields(json, SCENARIO_REQUIRED, 'scenario');
  validateFields(json.grid, GRID_REQUIRED, 'scenario.grid');
  json.rows.forEach(validateRow);
  return json;
}

if (typeof module !== 'undefined') module.exports = { parseScenario };
