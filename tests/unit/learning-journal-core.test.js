import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCriterion,
  groupKey,
  formatTime,
  formatDate,
  buildEntryViewModel,
  sortAndGroupEvents,
  GROUP_LABELS
} from '../../core/telemetry/learning-journal-core.js';

describe('formatCriterion', () => {
  it('expands known area prefix and sub', () => {
    expect(formatCriterion('ead.colour-mixing')).toBe('Expressive Arts — colour mixing');
  });
  it('expands uw prefix', () => {
    expect(formatCriterion('uw.cause-effect')).toBe('Understanding the World — cause effect');
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
  const lesson = { id: 'make_orange', title: 'Make Orange', number: 1, criteria: ['ead.colour-mixing'] };
  const event = { type: 'lesson_completed', timestamp: Date.now(), lessonId: 'make_orange', activityId: 'colour-wheel', version: 1 };

  it('uses lesson title', () => {
    expect(buildEntryViewModel(event, lesson).title).toBe('Make Orange');
  });
  it('falls back to lessonId when no lesson', () => {
    expect(buildEntryViewModel(event, null).title).toBe('make_orange');
  });
  it('returns formatted criteria tags', () => {
    const vm = buildEntryViewModel(event, lesson);
    expect(vm.criteriaTags).toEqual(['Expressive Arts — colour mixing']);
  });
  it('returns empty criteriaTags when no lesson', () => {
    expect(buildEntryViewModel(event, null).criteriaTags).toEqual([]);
  });
  it('returns timeStr as string', () => {
    expect(typeof buildEntryViewModel(event, lesson).timeStr).toBe('string');
  });
  it('returns empty sourceStr when no activityId on event', () => {
    const e = Object.assign({}, event, { activityId: null });
    expect(buildEntryViewModel(e, lesson).sourceStr).toBe('');
  });
});

describe('sortAndGroupEvents', () => {
  it('sorts events descending by timestamp', () => {
    const events = [
      { timestamp: 100, type: 'lesson_completed' },
      { timestamp: 300, type: 'lesson_completed' },
      { timestamp: 200, type: 'lesson_completed' }
    ];
    const result = sortAndGroupEvents(events);
    const all = result.order.flatMap(l => result.groups[l]);
    expect(all[0].timestamp).toBe(300);
    expect(all[2].timestamp).toBe(100);
  });
  it('groups today events under Today', () => {
    const events = [{ timestamp: Date.now(), type: 'lesson_completed' }];
    const result = sortAndGroupEvents(events);
    expect(result.order).toContain('Today');
    expect(result.groups['Today']).toHaveLength(1);
  });
  it('only includes groups with events in order', () => {
    const events = [{ timestamp: Date.now(), type: 'lesson_completed' }];
    const result = sortAndGroupEvents(events);
    expect(result.order).not.toContain('Older');
  });
  it('does not mutate original array', () => {
    const events = [{ timestamp: 1 }, { timestamp: 3 }, { timestamp: 2 }];
    sortAndGroupEvents(events);
    expect(events[0].timestamp).toBe(1);
  });
});
