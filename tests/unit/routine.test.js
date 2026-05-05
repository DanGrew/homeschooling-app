import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { toMins, getTodayKey, buildOrderedDays, pixelsPerMin, formatTimeLabel, slotLineClass, blockLayout, focusedScrollX, nowScrollTop } = require('../../core/routine/routine-core.js');

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

  it('rolling: focusedIndex falls back to windowRadius when today not in routine data', () => {
    const R = makeRoutine(true, 2, ['monday', 'tuesday', 'thursday', 'friday']);
    const { focusedIndex } = buildOrderedDays(R, 'wednesday');
    expect(focusedIndex).toBe(2); // windowRadius = 2
  });
});

describe('pixelsPerMin', () => {
  it('15-min slot', () => expect(pixelsPerMin(15)).toBeCloseTo(28 / 15));
  it('30-min slot', () => expect(pixelsPerMin(30)).toBeCloseTo(44 / 30));
  it('60-min slot', () => expect(pixelsPerMin(60)).toBeCloseTo(64 / 60));
});

describe('formatTimeLabel', () => {
  it('midnight', () => expect(formatTimeLabel(0)).toBe('00:00'));
  it('noon', () => expect(formatTimeLabel(720)).toBe('12:00'));
  it('half past eight', () => expect(formatTimeLabel(8 * 60 + 30)).toBe('08:30'));
  it('end of day', () => expect(formatTimeLabel(23 * 60 + 59)).toBe('23:59'));
});

describe('slotLineClass', () => {
  it('exact hour returns "hour"', () => expect(slotLineClass(120, 30)).toBe('hour'));
  it('slot boundary returns "slot"', () => expect(slotLineClass(90, 30)).toBe('slot'));
  it('15-min mark with 30-min slot returns ""', () => expect(slotLineClass(15, 30)).toBe(''));
  it('hour takes priority over slot', () => expect(slotLineClass(60, 60)).toBe('hour'));
});

describe('blockLayout', () => {
  it('top is offset from grid start', () => {
    expect(blockLayout(120, 180, 0, 1).top).toBe(120);
  });
  it('height reflects duration', () => {
    expect(blockLayout(120, 180, 0, 1).height).toBe(60);
  });
  it('minimum height 20', () => {
    expect(blockLayout(120, 121, 0, 1).height).toBe(20);
  });
  it('respects ppm scaling', () => {
    const { top, height } = blockLayout(60, 90, 0, 2);
    expect(top).toBe(120);
    expect(height).toBe(60);
  });
});

describe('focusedScrollX', () => {
  it('centers column in container', () => {
    expect(focusedScrollX(200, 100, 400)).toBe(Math.max(0, 200 - (400 / 2 - 100 / 2)));
  });
  it('clamps to 0', () => {
    expect(focusedScrollX(0, 100, 400)).toBe(0);
  });
});

describe('nowScrollTop', () => {
  it('centers now-line in container', () => {
    const top = nowScrollTop(480, 0, 1, 600, 36);
    expect(top).toBe(Math.max(0, 36 + 480 - 300));
  });
  it('clamps to 0', () => {
    expect(nowScrollTop(0, 0, 1, 600, 36)).toBe(0);
  });
});
