import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCriterion,
  groupKey,
  formatTime,
  formatDate,
  buildEntryViewModel,
  sortAndGroupEvents,
  GROUP_LABELS,
  fetchLearning
} from '../../core/telemetry/learning-journal-core.js';

describe('formatCriterion', () => {
  it('expands known area prefix and sub', () => {
    expect(formatCriterion('ead.colour-mixing')).toBe('Expressive Arts — colour mixing');
  });
  it('expands uw prefix', () => {
    expect(formatCriterion('uw.cause-effect')).toBe('Understanding the World — cause effect');
  });
  it('expands literacy prefix', () => {
    expect(formatCriterion('literacy.phonics')).toBe('Literacy — phonics');
  });
  it('expands maths prefix', () => {
    expect(formatCriterion('maths.counting-5')).toBe('Maths — counting 5');
  });
  it('returns just area when no sub', () => {
    expect(formatCriterion('cl')).toBe('Communication');
  });
  it('falls back to raw prefix when unknown', () => {
    expect(formatCriterion('xyz.foo')).toBe('xyz — foo');
  });
});

describe('groupKey', () => {
  it('returns Today for current timestamp', () => {
    expect(groupKey(Date.now())).toBe('Today');
  });
  it('returns Older for old timestamp', () => {
    expect(groupKey(0)).toBe('Older');
  });
  it('GROUP_LABELS contains all three groups', () => {
    expect(GROUP_LABELS).toEqual(['Today', 'Earlier This Week', 'Older']);
  });
});

describe('formatTime', () => {
  it('returns a string', () => {
    expect(typeof formatTime(Date.now())).toBe('string');
  });
});

describe('formatDate', () => {
  it('returns a string', () => {
    expect(typeof formatDate(Date.now())).toBe('string');
  });
});

describe('buildEntryViewModel', () => {
  const learning = { id: 'make_orange', title: 'Make Orange', number: 1, source: 'Colour Wheel', criteria: ['ead.colour-mixing'] };
  const event = { type: 'learning_completed', timestamp: Date.now(), learning_id: 'make_orange', activity_id: 'colour-wheel', version: 1 };

  it('uses learning title', () => {
    expect(buildEntryViewModel(event, learning).title).toBe('Make Orange');
  });
  it('falls back to learning_id when no learning', () => {
    expect(buildEntryViewModel(event, null).title).toBe('make_orange');
  });
  it('falls back to lessonId for old events', () => {
    const oldEvent = { type: 'lesson_completed', timestamp: Date.now(), lessonId: 'make_orange', version: 1 };
    expect(buildEntryViewModel(oldEvent, null).title).toBe('make_orange');
  });
  it('returns formatted criteria tags', () => {
    const vm = buildEntryViewModel(event, learning);
    expect(vm.criteriaTags).toEqual(['Expressive Arts — colour mixing']);
  });
  it('returns empty criteriaTags when no learning', () => {
    expect(buildEntryViewModel(event, null).criteriaTags).toEqual([]);
  });
  it('returns timeStr as string', () => {
    expect(typeof buildEntryViewModel(event, learning).timeStr).toBe('string');
  });
  it('returns sourceStr with source and lesson number', () => {
    expect(buildEntryViewModel(event, learning).sourceStr).toBe('Colour Wheel · Lesson 1');
  });
  it('returns empty sourceStr when no source on learning', () => {
    const l = Object.assign({}, learning, { source: '' });
    expect(buildEntryViewModel(event, l).sourceStr).toBe('');
  });
});

describe('sortAndGroupEvents', () => {
  it('sorts events descending by timestamp', () => {
    const events = [
      { timestamp: 100, type: 'learning_completed' },
      { timestamp: 300, type: 'learning_completed' },
      { timestamp: 200, type: 'learning_completed' }
    ];
    const result = sortAndGroupEvents(events);
    const all = result.order.flatMap(l => result.groups[l]);
    expect(all[0].timestamp).toBe(300);
    expect(all[2].timestamp).toBe(100);
  });
  it('groups today events under Today', () => {
    const events = [{ timestamp: Date.now(), type: 'learning_completed' }];
    const result = sortAndGroupEvents(events);
    expect(result.order).toContain('Today');
    expect(result.groups['Today']).toHaveLength(1);
  });
  it('only includes groups with events in order', () => {
    const events = [{ timestamp: Date.now(), type: 'learning_completed' }];
    const result = sortAndGroupEvents(events);
    expect(result.order).not.toContain('Older');
  });
  it('does not mutate original array', () => {
    const events = [{ timestamp: 1 }, { timestamp: 3 }, { timestamp: 2 }];
    sortAndGroupEvents(events);
    expect(events[0].timestamp).toBe(1);
  });
});

describe('fetchLearning', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls fetch with correct URL', async () => {
    const data = { id: 'make_orange', title: 'Make Orange', source: 'Colour Wheel', criteria: [] };
    fetch.mockResolvedValue({ json: () => Promise.resolve(data) });
    await new Promise(resolve => fetchLearning('make_orange', resolve));
    expect(fetch).toHaveBeenCalledWith('../../content/learnings/make_orange.json');
  });

  it('passes fetched data to callback', async () => {
    const data = { id: 'make_orange', title: 'Make Orange', source: 'Colour Wheel', criteria: [] };
    fetch.mockResolvedValue({ json: () => Promise.resolve(data) });
    const result = await new Promise(resolve => fetchLearning('make_orange2', resolve));
    expect(result.title).toBe('Make Orange');
  });

  it('calls callback with null when fetch fails', async () => {
    fetch.mockRejectedValue(new Error('network'));
    const result = await new Promise(resolve => fetchLearning('bad_id', resolve));
    expect(result).toBeNull();
  });

  it('calls callback with null for missing learningId', async () => {
    const result = await new Promise(resolve => fetchLearning(null, resolve));
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns cached result on second call', async () => {
    const data = { id: 'cached_one', title: 'Cached', source: 'X', criteria: [] };
    fetch.mockResolvedValue({ json: () => Promise.resolve(data) });
    await new Promise(resolve => fetchLearning('cached_one', resolve));
    await new Promise(resolve => fetchLearning('cached_one', resolve));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
