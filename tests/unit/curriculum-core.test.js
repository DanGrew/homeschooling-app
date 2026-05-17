import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { lessonCriteria, buildCriterionMap, buildByArea, lessonToRow, flattenLessons, physicalToRow, flattenPhysical, defaultCompare, colCompare } = require('../../core/curriculum/curriculum-core.js');

const CRITERIA_DATA = {
  areas: [
    { id: 'cl', criteria: [{ id: 'cl1', label: 'Speaking' }, { id: 'cl2', label: 'Listening' }] },
    { id: 'md', criteria: [{ id: 'md1', label: 'Counting' }] }
  ]
};
const AREAS = CRITERIA_DATA.areas;

describe('lessonCriteria', () => {
  it('returns criteria array when present', () => {
    expect(lessonCriteria({ criteria: ['cl1', 'md1'] })).toEqual(['cl1', 'md1']);
  });
  it('returns empty array when criteria absent', () => {
    expect(lessonCriteria({})).toEqual([]);
  });
  it('returns empty array when criteria not an array', () => {
    expect(lessonCriteria({ criteria: 'cl1' })).toEqual([]);
  });
});

describe('buildCriterionMap', () => {
  it('maps criterion id to label and areaId', () => {
    const map = buildCriterionMap(CRITERIA_DATA);
    expect(map['cl1']).toEqual({ label: 'Speaking', areaId: 'cl' });
    expect(map['md1']).toEqual({ label: 'Counting', areaId: 'md' });
  });
  it('covers all criteria', () => {
    const map = buildCriterionMap(CRITERIA_DATA);
    expect(Object.keys(map)).toHaveLength(3);
  });
});

describe('buildByArea', () => {
  const map = buildCriterionMap(CRITERIA_DATA);
  it('groups labels under correct area', () => {
    const result = buildByArea(['cl1', 'md1'], map, AREAS);
    expect(result['cl']).toEqual(['Speaking']);
    expect(result['md']).toEqual(['Counting']);
  });
  it('sorts labels within area', () => {
    const result = buildByArea(['cl2', 'cl1'], map, AREAS);
    expect(result['cl']).toEqual(['Listening', 'Speaking']);
  });
  it('empty array for area with no matching criteria', () => {
    const result = buildByArea(['cl1'], map, AREAS);
    expect(result['md']).toEqual([]);
  });
  it('skips unknown criterion ids', () => {
    const result = buildByArea(['cl1', 'unknown'], map, AREAS);
    expect(result['cl']).toEqual(['Speaking']);
  });
});

describe('lessonToRow', () => {
  const map = buildCriterionMap(CRITERIA_DATA);
  it('returns row with title, activity, byArea', () => {
    const row = lessonToRow({ title: 'Numbers', criteria: ['md1'] }, 'Counting Game', map, AREAS);
    expect(row.title).toBe('Numbers');
    expect(row.activity).toBe('Counting Game');
    expect(row.byArea['md']).toEqual(['Counting']);
  });
});

describe('flattenLessons', () => {
  const map = buildCriterionMap(CRITERIA_DATA);
  it('flattens multiple files with multiple lessons', () => {
    const files = [
      { activityLabel: 'Game A', lessons: [{ title: 'L1', criteria: ['cl1'] }, { title: 'L2', criteria: [] }] },
      { activityLabel: 'Game B', lessons: [{ title: 'L3', criteria: ['md1'] }] }
    ];
    const result = flattenLessons(files, map, AREAS);
    expect(result).toHaveLength(3);
    expect(result[0].activity).toBe('Game A');
    expect(result[2].activity).toBe('Game B');
  });
});

describe('physicalToRow', () => {
  const map = buildCriterionMap(CRITERIA_DATA);
  it('returns row with title, activity=Physical Play, byArea, type=physical', () => {
    const row = physicalToRow({ title: 'Rope Rescue', criteria: ['cl1'] }, map, AREAS);
    expect(row.title).toBe('Rope Rescue');
    expect(row.activity).toBe('Physical Play');
    expect(row.byArea['cl']).toEqual(['Speaking']);
    expect(row.type).toBe('physical');
  });
  it('handles missing criteria', () => {
    const row = physicalToRow({ title: 'Rope Rescue' }, map, AREAS);
    expect(row.byArea['cl']).toEqual([]);
    expect(row.type).toBe('physical');
  });
});

describe('flattenPhysical', () => {
  const map = buildCriterionMap(CRITERIA_DATA);
  it('maps each file to a physical row', () => {
    const files = [
      { data: { title: 'Activity A', criteria: ['cl1'] } },
      { data: { title: 'Activity B', criteria: ['md1'] } }
    ];
    const result = flattenPhysical(files, map, AREAS);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('physical');
    expect(result[1].activity).toBe('Physical Play');
  });
  it('returns empty array for empty input', () => {
    expect(flattenPhysical([], map, AREAS)).toEqual([]);
  });
});

describe('defaultCompare', () => {
  it('sorts by activity then title', () => {
    const a = { activity: 'B', title: 'Z' };
    const b = { activity: 'A', title: 'Z' };
    expect(defaultCompare(a, b)).toBeGreaterThan(0);
  });
  it('same activity falls back to title', () => {
    const a = { activity: 'A', title: 'Z' };
    const b = { activity: 'A', title: 'A' };
    expect(defaultCompare(a, b)).toBeGreaterThan(0);
  });
  it('equal rows return 0', () => {
    const a = { activity: 'A', title: 'T' };
    expect(defaultCompare(a, a)).toBe(0);
  });
});

describe('colCompare', () => {
  const keyFns = [function(r) { return r.title; }, function(r) { return r.activity; }];
  it('ascending sort', () => {
    expect(colCompare({ title: 'A' }, { title: 'B' }, true, keyFns, 0)).toBeLessThan(0);
  });
  it('descending sort', () => {
    expect(colCompare({ title: 'A' }, { title: 'B' }, false, keyFns, 0)).toBeGreaterThan(0);
  });
  it('uses correct column key fn', () => {
    expect(colCompare({ title: 'Z', activity: 'A' }, { title: 'A', activity: 'Z' }, true, keyFns, 1)).toBeLessThan(0);
  });
});
