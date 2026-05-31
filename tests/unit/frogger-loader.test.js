import { createRequire } from 'module';
const require2 = createRequire(import.meta.url);
const { parseScenario } = require2('../../core/frogger/frogger-loader.js');

function makeRow(overrides) {
  return Object.assign(
    { id: 'r', y: 0, baseTile: 'ground', wrap: false, movement: { direction: 'none', moveEvery: 0 }, label: 'path' },
    overrides
  );
}

function makeScenario(overrides) {
  return Object.assign({
    id: 'test', title: 'Test', grid: { rows: 4, cols: 8 },
    resetPoints: [{ id: 'start', position: { x: 0, y: 3 } }],
    rows: [makeRow()], entities: {}
  }, overrides);
}

describe('parseScenario', () => {
  test('returns valid scenario unchanged', () => {
    var s = makeScenario();
    expect(parseScenario(s)).toBe(s);
  });

  test('throws if id missing', () => {
    var s = makeScenario(); delete s.id;
    expect(() => parseScenario(s)).toThrow('scenario missing required field: id');
  });

  test('throws if title missing', () => {
    var s = makeScenario(); delete s.title;
    expect(() => parseScenario(s)).toThrow('scenario missing required field: title');
  });

  test('throws if grid missing', () => {
    var s = makeScenario(); delete s.grid;
    expect(() => parseScenario(s)).toThrow('scenario missing required field: grid');
  });

  test('throws if grid.rows missing', () => {
    var s = makeScenario({ grid: { cols: 8 } });
    expect(() => parseScenario(s)).toThrow('scenario.grid missing required field: rows');
  });

  test('throws if grid.cols missing', () => {
    var s = makeScenario({ grid: { rows: 4 } });
    expect(() => parseScenario(s)).toThrow('scenario.grid missing required field: cols');
  });

  test('throws if resetPoints missing', () => {
    var s = makeScenario(); delete s.resetPoints;
    expect(() => parseScenario(s)).toThrow('scenario missing required field: resetPoints');
  });

  test('throws if rows missing', () => {
    var s = makeScenario(); delete s.rows;
    expect(() => parseScenario(s)).toThrow('scenario missing required field: rows');
  });

  test('throws if entities missing', () => {
    var s = makeScenario(); delete s.entities;
    expect(() => parseScenario(s)).toThrow('scenario missing required field: entities');
  });

  test('throws if row missing id', () => {
    var row = makeRow(); delete row.id;
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('row[0] missing required field: id');
  });

  test('throws if row missing y', () => {
    var row = makeRow(); delete row.y;
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('row[0] missing required field: y');
  });

  test('throws if row missing baseTile', () => {
    var row = makeRow(); delete row.baseTile;
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('row[0] missing required field: baseTile');
  });

  test('throws if row missing movement', () => {
    var row = makeRow(); delete row.movement;
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('row[0] missing required field: movement');
  });

  test('throws if row missing label', () => {
    var row = makeRow(); delete row.label;
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('row[0] missing required field: label');
  });

  test('throws if movement missing direction', () => {
    var row = makeRow({ movement: { moveEvery: 0 } });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('row[0].movement missing required field: direction');
  });

  test('throws if movement missing moveEvery', () => {
    var row = makeRow({ movement: { direction: 'none' } });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('row[0].movement missing required field: moveEvery');
  });

  test('throws if movement contains deprecated speed field', () => {
    var row = makeRow({ movement: { direction: 'none', speed: 1.2, moveEvery: 8 } });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('deprecated field: speed');
  });

  test('throws if moveEvery is not a non-negative integer', () => {
    var row = makeRow({ movement: { direction: 'right', moveEvery: -1 } });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('moveEvery must be a non-negative integer');
  });

  test('throws if moveEvery is a float', () => {
    var row = makeRow({ movement: { direction: 'right', moveEvery: 1.5 } });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('moveEvery must be a non-negative integer');
  });

  test('accepts moveEvery of 0 (no movement)', () => {
    var row = makeRow({ movement: { direction: 'none', moveEvery: 0 } });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).not.toThrow();
  });

  test('throws if spawn contains deprecated every field', () => {
    var row = makeRow({ spawns: [{ entity: { type: 'platform', width: 1 }, every: 2 }] });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('deprecated field: every');
  });

  test('throws if spawn missing spawnEvery', () => {
    var row = makeRow({ spawns: [{ entity: { type: 'platform', width: 1 } }] });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('missing required field: spawnEvery');
  });

  test('throws if spawnEvery is not a positive integer', () => {
    var row = makeRow({ spawns: [{ entity: { type: 'platform', width: 1 }, spawnEvery: 0 }] });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).toThrow('spawnEvery must be a positive integer');
  });

  test('accepts valid spawns with spawnEvery', () => {
    var row = makeRow({ spawns: [{ entity: { type: 'platform', width: 1 }, spawnEvery: 17 }] });
    expect(() => parseScenario(makeScenario({ rows: [row] }))).not.toThrow();
  });

  test('validates all rows — catches error in second row', () => {
    var row0 = makeRow({ id: 'r0', y: 0 });
    var row1 = makeRow({ id: 'r1', y: 1 }); delete row1.baseTile;
    expect(() => parseScenario(makeScenario({ rows: [row0, row1] }))).toThrow('row[1] missing required field: baseTile');
  });
});
