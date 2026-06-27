import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
  buildIconMap, assembleGroups, activityHref,
  lcAllLearnings, lcAddPlaygroundChip, lcAreaChip, lcBuildChips, lcChipClass,
  lcMatchesQuery, lcMatchesChip, lcFilterLearnings, lcFilter,
  lcTalkColumn, lcTalkColumnsHtml
} = require('../../core/learning-catalogue/learning-catalogue-core.js');

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

const INDEX = {
  playgrounds: {
    'object-playground': { emoji: '🟦', name: 'Object Playground' },
    'paint-playground': { emoji: '🎨', name: 'Paint Playground' }
  },
  areas: [
    { id: 'mathematics', title: 'Mathematics' },
    { id: 'communication-language', title: 'Communication & Language' }
  ]
};
const COUNT = {
  title: 'Count to 5', keywords: ['how many', '3'], area: 'mathematics',
  playgrounds: [{ id: 'object-playground' }]
};
const PAINT = {
  title: 'Mix colours', keywords: ['red', 'blue'], area: 'expressive-arts-design',
  playgrounds: [{ id: 'object-playground' }, { id: 'paint-playground' }]
};
const GROUPS = [
  { id: 'mathematics', title: 'Mathematics', learnings: [COUNT] },
  { id: 'expressive-arts-design', title: 'Expressive Arts & Design', learnings: [PAINT] }
];
const ALL = { type: 'all', id: 'all' };

describe('lcAllLearnings', () => {
  it('flattens learnings across groups in order', () => {
    expect(lcAllLearnings(GROUPS)).toEqual([COUNT, PAINT]);
  });
  it('returns an empty list for no groups', () => {
    expect(lcAllLearnings([])).toEqual([]);
  });
});

describe('lcAreaChip', () => {
  it('builds an area chip from an area row', () => {
    expect(lcAreaChip({ id: 'mathematics', title: 'Mathematics' }))
      .toEqual({ type: 'area', id: 'mathematics', label: 'Mathematics' });
  });
});

describe('lcAddPlaygroundChip', () => {
  it('pushes a playground chip when unseen', () => {
    const chips = []; const seen = {};
    lcAddPlaygroundChip(chips, seen, INDEX, 'paint-playground');
    expect(chips).toEqual([{ type: 'playground', id: 'paint-playground', label: 'Paint Playground' }]);
    expect(seen['paint-playground']).toBe(true);
  });
  it('skips an already-seen playground', () => {
    const chips = []; const seen = { 'paint-playground': true };
    lcAddPlaygroundChip(chips, seen, INDEX, 'paint-playground');
    expect(chips).toEqual([]);
  });
});

describe('lcBuildChips', () => {
  it('builds All + one chip per area + one chip per playground present, deduped', () => {
    expect(lcBuildChips(INDEX, [COUNT, PAINT])).toEqual([
      { type: 'all', id: 'all', label: 'All' },
      { type: 'area', id: 'mathematics', label: 'Mathematics' },
      { type: 'area', id: 'communication-language', label: 'Communication & Language' },
      { type: 'playground', id: 'object-playground', label: 'Object Playground' },
      { type: 'playground', id: 'paint-playground', label: 'Paint Playground' }
    ]);
  });
  it('omits playgrounds that no learning references', () => {
    const ids = lcBuildChips(INDEX, [COUNT]).filter(c => c.type === 'playground').map(c => c.id);
    expect(ids).toEqual(['object-playground']);
  });
});

describe('lcChipClass', () => {
  it('marks the active chip on', () => {
    expect(lcChipClass(ALL, ALL)).toBe('lc-chip lc-chip-on');
  });
  it('leaves a non-active chip off', () => {
    expect(lcChipClass({ type: 'area', id: 'mathematics' }, ALL)).toBe('lc-chip');
  });
  it('distinguishes by type as well as id', () => {
    const area = { type: 'area', id: 'object-playground' };
    const play = { type: 'playground', id: 'object-playground' };
    expect(lcChipClass(area, play)).toBe('lc-chip');
  });
});

describe('lcMatchesQuery', () => {
  it('matches everything on an empty or whitespace query', () => {
    expect(lcMatchesQuery(COUNT, '')).toBe(true);
    expect(lcMatchesQuery(COUNT, '   ')).toBe(true);
  });
  it('matches on title substring, case-insensitive', () => {
    expect(lcMatchesQuery(COUNT, 'COUNT')).toBe(true);
  });
  it('matches on a keyword substring', () => {
    expect(lcMatchesQuery(COUNT, 'many')).toBe(true);
  });
  it('rejects when neither title nor keywords match', () => {
    expect(lcMatchesQuery(COUNT, 'zebra')).toBe(false);
  });
});

describe('lcMatchesChip', () => {
  it('matches all on the all chip', () => {
    expect(lcMatchesChip(COUNT, ALL)).toBe(true);
  });
  it('matches an area chip on the learning area', () => {
    expect(lcMatchesChip(COUNT, { type: 'area', id: 'mathematics' })).toBe(true);
    expect(lcMatchesChip(COUNT, { type: 'area', id: 'mathematics-x' })).toBe(false);
  });
  it('matches a playground chip when the learning lists it', () => {
    expect(lcMatchesChip(PAINT, { type: 'playground', id: 'paint-playground' })).toBe(true);
    expect(lcMatchesChip(COUNT, { type: 'playground', id: 'paint-playground' })).toBe(false);
  });
});

describe('lcFilterLearnings', () => {
  it('keeps learnings matching both chip and query', () => {
    expect(lcFilterLearnings([COUNT, PAINT], 'mix', ALL)).toEqual([PAINT]);
  });
});

describe('lcTalkColumn', () => {
  it('wraps a heading and its items as a column of list entries', () => {
    expect(lcTalkColumn('Ask them to…', ['Compare', 'Predict'])).toBe(
      '<div class="lc-talk-col"><div class="lc-talk-ch">Ask them to…</div>' +
      '<ul class="lc-talk-ul"><li>Compare</li><li>Predict</li></ul></div>'
    );
  });
  it('renders an empty list for no items', () => {
    expect(lcTalkColumn('…about', [])).toBe(
      '<div class="lc-talk-col"><div class="lc-talk-ch">…about</div><ul class="lc-talk-ul"></ul></div>'
    );
  });
});

describe('lcTalkColumnsHtml', () => {
  const TALK = { actions: ['Name / point out', 'Compare'], topics: ['Colour', 'Shape'] };
  it('emits an actions column then a topics column with sentence-frame headings', () => {
    const html = lcTalkColumnsHtml(TALK);
    expect(html).toBe(lcTalkColumn('Ask them to…', TALK.actions) + lcTalkColumn('…about', TALK.topics));
    expect(html.indexOf('Ask them to…')).toBeLessThan(html.indexOf('…about'));
  });
  it('includes every action and topic', () => {
    const html = lcTalkColumnsHtml(TALK);
    ['Name / point out', 'Compare', 'Colour', 'Shape'].forEach(t => expect(html).toContain('<li>' + t + '</li>'));
  });
});

describe('lcFilter', () => {
  it('returns all groups unchanged for the all chip and empty query', () => {
    expect(lcFilter(GROUPS, '', ALL)).toEqual(GROUPS);
  });
  it('narrows by search and drops emptied groups', () => {
    const out = lcFilter(GROUPS, 'count', ALL);
    expect(out.map(g => g.id)).toEqual(['mathematics']);
    expect(out[0].learnings).toEqual([COUNT]);
  });
  it('narrows by area chip to that area only', () => {
    const out = lcFilter(GROUPS, '', { type: 'area', id: 'expressive-arts-design' });
    expect(out.map(g => g.id)).toEqual(['expressive-arts-design']);
  });
  it('narrows by playground chip across areas', () => {
    const out = lcFilter(GROUPS, '', { type: 'playground', id: 'paint-playground' });
    expect(out.map(g => g.id)).toEqual(['expressive-arts-design']);
  });
});
