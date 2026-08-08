import { extractTags, filterItems, active, ACTIVE_STYLES, tagIcon, optIcon, collapsedBtn, expandedBtn, btnStyle } from '../../core/filter-bar/filter-bar-core.js';

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
  it('includes the trailing font and cursor styles', () => {
    const style = active(true, '#3498DB');
    expect(style).toContain('font-family:inherit;font-size:0.95em;cursor:pointer;');
  });
});

describe('tagIcon', () => {
  it('"all" returns star', () => {
    expect(tagIcon('all')).toBe('\u2726');
  });
  it('known tag returns emoji', () => {
    expect(tagIcon('animals')).toBe('\uD83D\uDC3E');
    expect(tagIcon('fruit')).toBe('\uD83C\uDF4E');
  });
  it('every registered tag maps to its own distinct emoji', () => {
    expect(tagIcon('emotions')).toBe('\uD83D\uDE0A');
    expect(tagIcon('vehicles')).toBe('\uD83D\uDE97');
    expect(tagIcon('medical')).toBe('\uD83C\uDFE5');
    expect(tagIcon('vegetables')).toBe('\uD83E\uDD66');
    expect(tagIcon('dairy')).toBe('\uD83E\uDDC0');
    expect(tagIcon('bakery')).toBe('\uD83E\uDD50');
    expect(tagIcon('groceries')).toBe('\uD83D\uDED2');
    expect(tagIcon('paw-patrol')).toBe('\uD83D\uDC3E\uD83D\uDE93');
    expect(tagIcon('claude')).toBe('\uD83E\uDD16');
  });
  it('unknown tag returns uppercased first char', () => {
    expect(tagIcon('custom')).toBe('C');
  });
});

describe('optIcon', () => {
  it('uses opt.icon when provided', () => {
    expect(optIcon({ icon: '\u25B6\uFE0F', value: 'linear', label: 'Linear' })).toBe('\u25B6\uFE0F');
  });
  it('"all" value returns star', () => {
    expect(optIcon({ value: 'all', label: 'All' })).toBe('\u2726');
  });
  it('known tag value returns emoji', () => {
    expect(optIcon({ value: 'animals', label: 'Animals' })).toBe('\uD83D\uDC3E');
  });
  it('unknown value returns lowercase first char of label', () => {
    expect(optIcon({ value: 'xyz', label: 'custom' })).toBe('c');
  });
});

describe('collapsedBtn', () => {
  it('active state uses colour for border and background', () => {
    const s = collapsedBtn(true, '#E74C3C');
    expect(s).toContain('border:2px solid #E74C3C');
    expect(s).toContain('background:#E74C3C');
    expect(s).toContain('color:white');
  });
  it('inactive state uses neutral colours', () => {
    const s = collapsedBtn(false, '#E74C3C');
    expect(s).toContain('border:2px solid #ddd');
    expect(s).toContain('background:#fff');
    expect(s).toContain('color:#333');
  });
  it('produces fixed 40x40 dimensions', () => {
    const s = collapsedBtn(false, '#000');
    expect(s).toContain('width:40px');
    expect(s).toContain('height:40px');
  });
  it('includes the trailing padding, font-size and flex-shrink styles', () => {
    const s = collapsedBtn(false, '#000');
    expect(s).toContain('padding:0;font-size:1.2em;flex-shrink:0;');
  });
});

describe('expandedBtn', () => {
  it('active state uses colour', () => {
    const s = expandedBtn(true, '#2ECC71');
    expect(s).toContain('background:#2ECC71');
    expect(s).toContain('color:white');
  });
  it('inactive state uses neutral colours', () => {
    const s = expandedBtn(false, '#2ECC71');
    expect(s).toContain('border:2px solid #ddd');
    expect(s).toContain('background:#fff');
    expect(s).toContain('color:#333');
  });
  it('full-width layout', () => {
    const s = expandedBtn(false, '#000');
    expect(s).toContain('width:100%');
  });
  it('includes the trailing text-align and flex-shrink styles', () => {
    const s = expandedBtn(false, '#000');
    expect(s).toContain('text-align:left;flex-shrink:0;');
  });
});

describe('btnStyle', () => {
  it('collapsed → collapsedBtn output', () => {
    expect(btnStyle(false, true, '#2ECC71')).toBe(collapsedBtn(true, '#2ECC71'));
    expect(btnStyle(false, false, '#2ECC71')).toBe(collapsedBtn(false, '#2ECC71'));
  });
  it('expanded → expandedBtn output', () => {
    expect(btnStyle(true, true, '#3498DB')).toBe(expandedBtn(true, '#3498DB'));
    expect(btnStyle(true, false, '#3498DB')).toBe(expandedBtn(false, '#3498DB'));
  });
});
