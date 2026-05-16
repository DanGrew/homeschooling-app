import { extractTags, extractLevels, filterItems, active, ACTIVE_STYLES } from '../../core/filter-bar/filter-bar-core.js';

const item = (tags, level) => ({ tags, level });

const ITEMS = [
  item(['animals', 'easy'], 1),
  item(['animals', 'hard'], 2),
  item(['food', 'easy'], 1),
  item(['food'], undefined),
];

describe('extractTags', () => {
  it('always includes "all" first', () => {
    expect(extractTags(ITEMS)[0]).toBe('all');
  });

  it('collects unique tags from all items', () => {
    const tags = extractTags(ITEMS);
    expect(tags).toContain('animals');
    expect(tags).toContain('food');
    expect(tags).toContain('easy');
    expect(tags).toContain('hard');
  });

  it('no duplicates', () => {
    const tags = extractTags(ITEMS);
    expect(tags.length).toBe(new Set(tags).size);
  });

  it('empty items returns ["all"]', () => {
    expect(extractTags([])).toEqual(['all']);
  });

  it('items with no tags returns ["all"]', () => {
    expect(extractTags([{ tags: [] }, {}])).toEqual(['all']);
  });
  it('tags sorted a-z after "all"', () => {
    const tags = extractTags(ITEMS);
    const rest = tags.slice(1);
    expect(rest).toEqual([...rest].sort());
  });
});

describe('extractLevels', () => {
  it('returns sorted unique levels', () => {
    expect(extractLevels(ITEMS)).toEqual([1, 2]);
  });

  it('excludes items with no level', () => {
    const levels = extractLevels(ITEMS);
    expect(levels).not.toContain(undefined);
  });

  it('sorts numerically not lexicographically', () => {
    const items = [item([], 10), item([], 2), item([], 1)];
    expect(extractLevels(items)).toEqual([1, 2, 10]);
  });

  it('empty items returns []', () => {
    expect(extractLevels([])).toEqual([]);
  });
});

describe('filterItems', () => {
  it('"all" tag + "all" level returns everything', () => {
    expect(filterItems(ITEMS, 'all', 'all')).toHaveLength(ITEMS.length);
  });

  it('specific tag filters correctly', () => {
    const result = filterItems(ITEMS, 'animals', 'all');
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.tags).toContain('animals'));
  });

  it('specific level filters correctly', () => {
    const result = filterItems(ITEMS, 'all', 1);
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.level).toBe(1));
  });

  it('tag + level combined', () => {
    const result = filterItems(ITEMS, 'animals', 1);
    expect(result).toHaveLength(1);
    expect(result[0].tags).toContain('animals');
    expect(result[0].level).toBe(1);
  });

  it('no matching tag returns empty', () => {
    expect(filterItems(ITEMS, 'nonexistent', 'all')).toHaveLength(0);
  });

  it('no matching level returns empty', () => {
    expect(filterItems(ITEMS, 'all', 99)).toHaveLength(0);
  });

  it('tag + level combo with no overlap returns empty', () => {
    expect(filterItems(ITEMS, 'food', 2)).toHaveLength(0);
  });

  it('items with no tags excluded by specific tag filter', () => {
    const result = filterItems(ITEMS, 'easy', 'all');
    result.forEach(p => expect(p.tags || []).toContain('easy'));
  });

  it('item missing tags property is excluded by specific tag filter', () => {
    const noTags = [{ level: 1 }, { tags: ['animals'], level: 1 }];
    const result = filterItems(noTags, 'animals', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].tags).toContain('animals');
  });
});

describe('ACTIVE_STYLES', () => {
  it('active state returns provided colour', () => {
    const s = ACTIVE_STYLES['true']('#3498DB');
    expect(s.border).toBe('#3498DB');
    expect(s.bg).toBe('#3498DB');
    expect(s.color).toBe('white');
  });
  it('inactive state returns neutral colours', () => {
    const s = ACTIVE_STYLES['false']();
    expect(s.border).toBe('#ddd');
    expect(s.bg).toBe('#fff');
    expect(s.color).toBe('#333');
  });
});

describe('active', () => {
  it('returns a CSS string', () => {
    expect(typeof active(true, '#3498DB')).toBe('string');
  });
  it('active string contains the colour', () => {
    expect(active(true, '#3498DB')).toContain('#3498DB');
  });
  it('inactive string contains #ddd', () => {
    expect(active(false, '#3498DB')).toContain('#ddd');
  });
  it('always contains cursor:pointer', () => {
    expect(active(true, '#fff')).toContain('cursor:pointer');
    expect(active(false, '#fff')).toContain('cursor:pointer');
  });
});
