import { describe, it, expect } from 'vitest'
import { hourToAngles, hourToSky, nextDegrees, generateChoices, parseTime, numeralToMinuteDeg, nextMinuteDeg } from '../../core/clock/clock-core.js'

describe('hourToAngles', () => {
  it('returns zero degrees for hour 0 (12 o\'clock)', () => {
    expect(hourToAngles(0).hourDeg).toBe(0)
  })

  it('returns zero degrees for hour 12 (12 o\'clock)', () => {
    expect(hourToAngles(12).hourDeg).toBe(0)
  })

  it('returns 90 degrees for hour 3', () => {
    expect(hourToAngles(3).hourDeg).toBe(90)
  })

  it('returns 180 degrees for hour 6', () => {
    expect(hourToAngles(6).hourDeg).toBe(180)
  })

  it('returns 270 degrees for hour 9', () => {
    expect(hourToAngles(9).hourDeg).toBe(270)
  })

  it('treats 24h hours as 12h clock (15 same as 3)', () => {
    expect(hourToAngles(15).hourDeg).toBe(hourToAngles(3).hourDeg)
  })

  it('always returns minuteDeg of 0', () => {
    [0, 7, 12, 15, 18, 22].forEach(h => {
      expect(hourToAngles(h).minuteDeg).toBe(0)
    })
  })
})

describe('hourToSky', () => {
  it('returns topColor and bottomColor strings', () => {
    [0, 7, 12, 18, 21].forEach(h => {
      const sky = hourToSky(h)
      expect(typeof sky.topColor).toBe('string')
      expect(typeof sky.bottomColor).toBe('string')
    })
  })

  it('shows sun during daytime hours', () => {
    [7, 8, 10, 12, 13, 15, 18, 19].forEach(h => {
      const sky = hourToSky(h)
      expect(sky.sun).toBe(true)
      expect(sky.moon).toBe(false)
    })
  })

  it('shows moon during night hours', () => {
    [0, 21, 22].forEach(h => {
      const sky = hourToSky(h)
      expect(sky.sun).toBe(false)
      expect(sky.moon).toBe(true)
    })
  })

  it('midnight (hour 0) shows moon not sun', () => {
    const sky = hourToSky(0)
    expect(sky.sun).toBe(false)
    expect(sky.moon).toBe(true)
  })

  it('celestialX and celestialY are within 0–100', () => {
    [0, 7, 8, 10, 12, 13, 15, 18, 19, 21, 22].forEach(h => {
      const sky = hourToSky(h)
      expect(sky.celestialX).toBeGreaterThanOrEqual(0)
      expect(sky.celestialX).toBeLessThanOrEqual(100)
      expect(sky.celestialY).toBeGreaterThanOrEqual(0)
      expect(sky.celestialY).toBeLessThanOrEqual(100)
    })
  })

  it('noon (hour 13) sun is near zenith — center and high', () => {
    const sky = hourToSky(13)
    expect(sky.celestialX).toBeCloseTo(50, 0)
    expect(sky.celestialY).toBeLessThan(10)
  })

  it('morning (hour 7) sun is on the left', () => {
    expect(hourToSky(7).celestialX).toBeLessThan(20)
  })

  it('evening (hour 18) sun is on the right', () => {
    expect(hourToSky(18).celestialX).toBeGreaterThan(80)
  })

  it('sun moves left to right across the day', () => {
    const x7  = hourToSky(7).celestialX
    const x12 = hourToSky(12).celestialX
    const x13 = hourToSky(13).celestialX
    const x18 = hourToSky(18).celestialX
    expect(x7).toBeLessThan(x12)
    expect(x12).toBeLessThan(x13)
    expect(x13).toBeLessThan(x18)
  })

  it('each preset has a unique celestialX', () => {
    const hours = [7, 8, 10, 12, 13, 15, 18, 19]
    const xs = hours.map(h => hourToSky(h).celestialX)
    const unique = new Set(xs.map(x => Math.round(x)))
    expect(unique.size).toBe(hours.length)
  })
})

describe('nextDegrees', () => {
  it('always returns a positive value', () => {
    const pairs = [[0,7],[7,12],[12,15],[15,18],[18,21],[21,22],[22,0]]
    pairs.forEach(([from, to]) => {
      expect(nextDegrees(from, to)).toBeGreaterThan(0)
    })
  })

  it('7am to 12pm is 150 degrees forward', () => {
    expect(nextDegrees(7, 12)).toBeCloseTo(150)
  })

  it('12pm to 3pm is 90 degrees forward', () => {
    expect(nextDegrees(12, 15)).toBeCloseTo(90)
  })

  it('same hour returns 360 (full rotation)', () => {
    expect(nextDegrees(7, 7)).toBeCloseTo(360)
    expect(nextDegrees(12, 12)).toBeCloseTo(360)
  })

  it('wraps forward when target is earlier on clock face (e.g. 10pm to midnight)', () => {
    const deg = nextDegrees(22, 0)
    expect(deg).toBeCloseTo(60)
    expect(deg).toBeGreaterThan(0)
  })

  it('treats 24h hours correctly (15 same as 3 on clock)', () => {
    expect(nextDegrees(12, 15)).toBe(nextDegrees(12, 3))
  })
})

describe('parseTime', () => {
  it('parses hour and minute from HH:MM string', () => {
    expect(parseTime('07:30')).toEqual({ hour: 7, minute: 30 })
  })
  it('handles midnight', () => {
    expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 })
  })
  it('handles noon with minutes', () => {
    expect(parseTime('12:45')).toEqual({ hour: 12, minute: 45 })
  })
  it('handles hour-only times', () => {
    expect(parseTime('09:00')).toEqual({ hour: 9, minute: 0 })
  })
})

describe('numeralToMinuteDeg', () => {
  it('numeral 12 returns 0 degrees', () => { expect(numeralToMinuteDeg(12)).toBe(0) })
  it('numeral 3 returns 90 degrees',  () => { expect(numeralToMinuteDeg(3)).toBe(90) })
  it('numeral 6 returns 180 degrees', () => { expect(numeralToMinuteDeg(6)).toBe(180) })
  it('numeral 9 returns 270 degrees', () => { expect(numeralToMinuteDeg(9)).toBe(270) })
  it('numeral 1 returns 30 degrees',  () => { expect(numeralToMinuteDeg(1)).toBe(30) })
})

describe('nextMinuteDeg', () => {
  it('same minute returns 0',                 () => { expect(nextMinuteDeg(15, 15)).toBe(0) })
  it('0 to 0 returns 0',                      () => { expect(nextMinuteDeg(0, 0)).toBe(0) })
  it('forward advance returns correct degrees', () => { expect(nextMinuteDeg(0, 30)).toBe(180) })
  it('15 to 45 forward is 180 degrees',       () => { expect(nextMinuteDeg(15, 45)).toBe(180) })
  it('crossing 12 returns degrees through 360', () => { expect(nextMinuteDeg(45, 15)).toBe(180) })
  it('55 min to 0 min (step to 12) is 30 degrees', () => { expect(nextMinuteDeg(55, 0)).toBeCloseTo(30) })
})

describe('generateChoices', () => {
  const PRESETS = [0,1,2,3,4,5,6,7,8,9].map(i => ({ label: 'P' + i }))

  it('always includes the correct index', () => {
    for (let i = 0; i < 20; i++) {
      const correct = Math.floor(Math.random() * PRESETS.length)
      expect(generateChoices(PRESETS, correct, 4)).toContain(correct)
    }
  })

  it('returns exactly n indices', () => {
    expect(generateChoices(PRESETS, 0, 4)).toHaveLength(4)
    expect(generateChoices(PRESETS, 0, 3)).toHaveLength(3)
  })

  it('returns no duplicates', () => {
    const choices = generateChoices(PRESETS, 0, 4)
    expect(new Set(choices).size).toBe(choices.length)
  })

  it('all indices are valid preset positions', () => {
    generateChoices(PRESETS, 0, 4).forEach(i => {
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(PRESETS.length)
    })
  })

  it('caps at presets length when n exceeds pool', () => {
    const small = [{}, {}, {}]
    const choices = generateChoices(small, 0, 10)
    expect(choices.length).toBeLessThanOrEqual(small.length)
  })
})
