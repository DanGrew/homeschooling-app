import { extractTags, filterItems, active, ACTIVE_STYLES } from '../../core/filter-bar/filter-bar-core.js';

const item = (tags) => ({ tags });

const ITEMS = [
  item(['animals', 'easy']),
  item(['animals', 'hard']),
  item(['food', 'easy']),
  item(['food']),
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

describe('filterItems', () => {
  it('"all" tag returns everything', () => {
    expect(filterItems(ITEMS, 'all')).toHaveLength(ITEMS.length);
  });

  it('specific tag filters correctly', () => {
    const result = filterItems(ITEMS, 'animals');
    expect(result).toHaveLength(2);
    result.forEach(p => expect(p.tags).toContain('animals'));
  });

  it('no matching tag returns empty', () => {
    expect(filterItems(ITEMS, 'nonexistent')).toHaveLength(0);
  });

  it('items with no tags excluded by specific tag filter', () => {
    const result = filterItems(ITEMS, 'easy');
    result.forEach(p => expect(p.tags || []).toContain('easy'));
  });

  it('item missing tags property is excluded by specific tag filter', () => {
    const noTags = [{}, { tags: ['animals'] }];
    const result = filterItems(noTags, 'animals');
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
  it('active state uses colour for border and background', () => {
    const style = active(true, '#3498DB');
    expect(style).toContain('border:2px solid #3498DB');
    expect(style).toContain('background:#3498DB');
    expect(style).toContain('color:white');
  });
  it('inactive state uses neutral colours', () => {
    const style = active(false, '#3498DB');
    expect(style).toContain('border:2px solid #ddd');
    expect(style).toContain('background:#fff');
    expect(style).toContain('color:#333');
  });
});
