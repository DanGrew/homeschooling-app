import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { buildIconMap, assembleGroups, activityHref } = require('../../core/learning-catalogue/learning-catalogue-core.js');

describe('buildIconMap', () => {
  const ICONS = [
    { id: 'observe', emoji: '👀', label: 'Observe' },
    { id: 'count', emoji: '🔢', label: 'Count' }
  ];
  it('maps each icon id to its emoji', () => {
    expect(buildIconMap(ICONS)).toEqual({ observe: '👀', count: '🔢' });
  });
  it('returns an empty map for no icons', () => {
    expect(buildIconMap([])).toEqual({});
  });
});

describe('assembleGroups', () => {
  const AREAS = [
    { id: 'communication-language', title: 'Communication & Language', file: 'a.json' },
    { id: 'mathematics', title: 'Mathematics', file: 'b.json' }
  ];
  const PAYLOADS = [
    { learnings: [{ id: 'name-objects' }] },
    { learnings: [{ id: 'count-to-5' }] }
  ];
  it('zips area metadata with its payload learnings in order', () => {
    expect(assembleGroups(AREAS, PAYLOADS)).toEqual([
      { id: 'communication-language', title: 'Communication & Language', learnings: [{ id: 'name-objects' }] },
      { id: 'mathematics', title: 'Mathematics', learnings: [{ id: 'count-to-5' }] }
    ]);
  });
  it('preserves area order', () => {
    expect(assembleGroups(AREAS, PAYLOADS).map(g => g.id)).toEqual(['communication-language', 'mathematics']);
  });
});

describe('activityHref', () => {
  it('builds a relative path to the activity from the catalogue page', () => {
    expect(activityHref('object-playground')).toBe('../../activities/object-playground/');
  });
});
