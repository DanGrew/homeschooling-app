import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { collectCriterionIds, validateLearning } = require('../../core/learning-catalogue/catalogue-refs-core.js');

describe('collectCriterionIds', () => {
  const CRITERIA = {
    areas: [
      { id: 'cl', criteria: [{ id: 'cl.topic-vocabulary' }, { id: 'cl.listening' }] },
      { id: 'maths', criteria: [{ id: 'maths.counting-5' }] }
    ]
  };
  it('flattens every criterion id across areas', () => {
    expect(collectCriterionIds(CRITERIA)).toEqual(['cl.topic-vocabulary', 'cl.listening', 'maths.counting-5']);
  });
  it('returns an empty list when no areas have criteria', () => {
    expect(collectCriterionIds({ areas: [] })).toEqual([]);
  });
});

describe('validateLearning', () => {
  const CTX = {
    areaId: 'mathematics',
    criterionIds: ['maths.counting-5'],
    iconIds: ['count', 'observe'],
    playgroundIds: ['object-playground'],
    activityIds: ['object-playground', 'paint-playground']
  };
  const VALID = {
    id: 'count-to-5',
    learningIcons: ['count', 'observe'],
    curriculum: ['maths.counting-5'],
    area: 'mathematics',
    playgrounds: [{ id: 'object-playground', note: 'Add objects and count them' }]
  };

  it('returns no errors for a fully resolving learning', () => {
    expect(validateLearning(VALID, CTX)).toEqual([]);
  });

  it('flags an area that does not match the file home', () => {
    const errs = validateLearning(Object.assign({}, VALID, { area: 'communication-language' }), CTX);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toBe('count-to-5: area "communication-language" does not match its file home "mathematics"');
  });

  it('flags a curriculum tag that is not a valid criterion id', () => {
    const errs = validateLearning(Object.assign({}, VALID, { curriculum: ['maths.nope'] }), CTX);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toBe('count-to-5: curriculum tag "maths.nope" is not a valid criterion id');
  });

  it('flags a learningIcon outside the registry', () => {
    const errs = validateLearning(Object.assign({}, VALID, { learningIcons: ['count', 'sparkle'] }), CTX);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toBe('count-to-5: learningIcon "sparkle" is not in the icon registry');
  });

  it('flags a playground missing from the registry and the activities dir', () => {
    const errs = validateLearning(Object.assign({}, VALID, { playgrounds: [{ id: 'ghost', note: 'x' }] }), CTX);
    expect(errs).toHaveLength(2);
    expect(errs).toContain('count-to-5: playground "ghost" is not in the playgrounds registry');
    expect(errs).toContain('count-to-5: playground "ghost" has no app/activities/ghost/ directory');
  });

  it('flags a registered playground that has no activity directory', () => {
    const ctx = Object.assign({}, CTX, { playgroundIds: ['object-playground', 'ghost'] });
    const errs = validateLearning(Object.assign({}, VALID, { playgrounds: [{ id: 'ghost', note: 'x' }] }), ctx);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toBe('count-to-5: playground "ghost" has no app/activities/ghost/ directory');
  });

  it('returns no errors for a life-moment entry with no curriculum, learningIcons or playgrounds', () => {
    const moment = { id: 'getting-dressed', type: 'life-moment', area: 'mathematics' };
    expect(validateLearning(moment, CTX)).toEqual([]);
  });
});
