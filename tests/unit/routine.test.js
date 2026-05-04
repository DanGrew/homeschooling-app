import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { toMins, getTodayKey, buildOrderedDays } = require('../../app/routine/routine-logic.js');

const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const makeRoutine = (rollingWindow, windowRadius, dayKeys) => ({
  meta: { rollingWindow, windowRadius },
  days: dayKeys.map(k => ({ key: k, label: k })),
  activities: {},
});

describe('toMins', () => {
  it('converts midnight', () => expect(toMins('00:00')).toBe(0));
  it('converts noon', () => expect(toMins('12:00')).toBe(720));
  it('converts end of day', () => expect(toMins('23:59')).toBe(1439));
  it('converts half hour', () => expect(toMins('08:30')).toBe(510));
  it('converts quarter hour', () => expect(toMins('09:15')).toBe(555));
});

describe('getTodayKey', () => {
  it('returns a valid day key', () => {
    expect(ALL_DAYS).toContain(getTodayKey());
  });

  it('matches current day of week', () => {
    const expected = ALL_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    expect(getTodayKey()).toBe(expected);
  });
});

describe('buildOrderedDays', () => {
  it('returns empty when no routine data', () => {
    expect(buildOrderedDays(null, 'monday')).toEqual({ days: [], focusedIndex: 0 });
  });

  it('non-rolling: returns days in original order, focusedIndex 0', () => {
    const R = makeRoutine(false, 0, ['monday', 'tuesday', 'wednesday']);
    const { days, focusedIndex } = buildOrderedDays(R, 'tuesday');
    expect(days.map(d => d.key)).toEqual(['monday', 'tuesday', 'wednesday']);
    expect(focusedIndex).toBe(0);
  });

  it('rolling: today is centred', () => {
    const R = makeRoutine(true, 3, ALL_DAYS);
    const { days, focusedIndex } = buildOrderedDays(R, 'wednesday');
    expect(days[focusedIndex].key).toBe('wednesday');
  });

  it('rolling: window radius is respected', () => {
    const R = makeRoutine(true, 2, ALL_DAYS);
    const { days } = buildOrderedDays(R, 'wednesday');
    expect(days).toHaveLength(5); // radius 2 = 2 before + today + 2 after
  });

  it('rolling: default radius is 3 when not specified', () => {
    const R = { meta: { rollingWindow: true }, days: ALL_DAYS.map(k => ({ key: k, label: k })), activities: {} };
    const { days } = buildOrderedDays(R, 'wednesday');
    expect(days).toHaveLength(7); // radius 3 = 3 + today + 3
  });

  it('rolling: wraps around week boundary (sunday → monday)', () => {
    const R = makeRoutine(true, 2, ALL_DAYS);
    const { days, focusedIndex } = buildOrderedDays(R, 'monday');
    expect(days[focusedIndex].key).toBe('monday');
    expect(days[0].key).toBe('saturday'); // 2 before monday wraps to saturday
  });

  it('rolling: omits days not in routine data', () => {
    const R = makeRoutine(true, 3, ['monday', 'wednesday', 'friday']);
    const { days } = buildOrderedDays(R, 'wednesday');
    days.forEach(d => expect(['monday', 'wednesday', 'friday']).toContain(d.key));
  });
});
