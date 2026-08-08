import { describe, it, expect } from 'vitest'
import { hourToAngles, hourToSky, nextDegrees, parseTime, numeralToMinuteDeg, nextMinuteDeg, presetSkyColour, manifestToOptions, findOptionByValue } from '../../core/clock/clock-core.js'

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

  // Pins the exact colour bucket (incl. every "< N" boundary) and the exact
  // celestial arc position for every distinct hour, so a boundary or
  // arithmetic tweak in hourColors/hourToSky changes an asserted value.
  const EXACT = [
    [0,  '#0D1458', '#1A237E', false, 28.499999999999996, 8.287187078897965],
    [1,  '#0D1458', '#1A237E', false, 38.87078106059161, 5.090373558749814],
    [4,  '#0D1458', '#1A237E', false, 71.49999999999999, 8.287187078897961],
    [5,  '#0D1458', '#1A237E', false, 80.40559159102155, 13.372583002030478],
    [6,  '#FF7043', '#FFB74D', true, 7, 36],
    [7,  '#FF7043', '#FFB74D', true, 8.078099776181585, 28.87933011339794],
    [8,  '#FF7043', '#FFB74D', true, 11.258338680195976, 22.115720348238142],
    [9,  '#81D4FA', '#E1F5FE', true, 16.381246253874718, 16.04832634052053],
    [10, '#81D4FA', '#E1F5FE', true, 23.189938520074456, 10.981392561023046],
    [11, '#039BE5', '#B3E5FC', true, 31.342999217945, 7.168996227122587],
    [12, '#039BE5', '#B3E5FC', true, 40.43159983987848, 4.802306810181644],
    [13, '#039BE5', '#B3E5FC', true, 49.99999999999999, 4],
    [14, '#039BE5', '#B3E5FC', true, 59.56840016012151, 4.802306810181644],
    [16, '#039BE5', '#B3E5FC', true, 76.81006147992554, 10.981392561023043],
    [17, '#EF6C00', '#FFA726', true, 83.61875374612528, 16.048326340520525],
    [18, '#EF6C00', '#FFA726', true, 88.74166131980402, 22.115720348238135],
    [19, '#4527A0', '#7E57C2', true, 91.92190022381841, 28.879330113397934],
    [20, '#1A237E', '#3949AB', false, 7, 36],
    [21, '#1A237E', '#3949AB', false, 8.465189469570063, 27.717790556719336],
    [22, '#1A237E', '#3949AB', false, 12.760907637269135, 20],
    [23, '#1A237E', '#3949AB', false, 19.594408408978452, 13.372583002030481],
  ]

  EXACT.forEach(([hour, top, bottom, sun, cx, cy]) => {
    it(`hour ${hour} pins exact colour, sun/moon and celestial position`, () => {
      const sky = hourToSky(hour)
      expect(sky.topColor).toBe(top)
      expect(sky.bottomColor).toBe(bottom)
      expect(sky.sun).toBe(sun)
      expect(sky.moon).toBe(!sun)
      expect(sky.celestialX).toBeCloseTo(cx, 9)
      expect(sky.celestialY).toBeCloseTo(cy, 9)
    })
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

describe('presetSkyColour', () => {
  // Every bucket's lower and upper hour, both edges of the boundary — pins
  // the from/to/bg/fg literals for each of the seven buckets and the
  // `>=`/`<=` edges.
  const EXACT = [
    ['00:00', 0, 4,  '#1a1a2e', '#ffffff'],
    ['04:59', 0, 4,  '#1a1a2e', '#ffffff'],
    ['05:00', 5, 7,  '#ff7043', '#ffffff'],
    ['07:59', 5, 7,  '#ff7043', '#ffffff'],
    ['08:00', 8, 11, '#b3e5fc', '#333333'],
    ['11:59', 8, 11, '#b3e5fc', '#333333'],
    ['12:00', 12, 14, '#fff9c4', '#333333'],
    ['14:59', 12, 14, '#fff9c4', '#333333'],
    ['15:00', 15, 17, '#ffe0b2', '#333333'],
    ['17:59', 15, 17, '#ffe0b2', '#333333'],
    ['18:00', 18, 20, '#7e57c2', '#ffffff'],
    ['20:59', 18, 20, '#7e57c2', '#ffffff'],
    ['21:00', 21, 23, '#1a237e', '#ffffff'],
    ['23:59', 21, 23, '#1a237e', '#ffffff'],
  ]

  EXACT.forEach(([time, from, to, bg, fg]) => {
    it(`${time} pins bucket [${from},${to}] bg ${bg} / fg ${fg}`, () => {
      expect(presetSkyColour(time)).toEqual({ from, to, bg, fg })
    })
  })

  it('falls back to the default colours for an hour above every bucket', () => {
    expect(presetSkyColour('25:00')).toEqual({ bg: 'rgba(255,255,255,0.88)', fg: '#333333' })
  })

  it('falls back to the default colours for an hour below every bucket', () => {
    expect(presetSkyColour('-1:00')).toEqual({ bg: 'rgba(255,255,255,0.88)', fg: '#333333' })
  })
})

describe('manifestToOptions', () => {
  it('maps id/label/icon into value/label/icon options', () => {
    const manifest = [{ id: 'a', label: 'A', icon: '🅰️', extra: 1 }, { id: 'b', label: 'B', icon: '🅱️' }]
    expect(manifestToOptions(manifest)).toEqual([
      { value: 'a', label: 'A', icon: '🅰️' },
      { value: 'b', label: 'B', icon: '🅱️' }
    ])
  })

  it('returns empty array for empty manifest', () => {
    expect(manifestToOptions([])).toEqual([])
  })
})

describe('findOptionByValue', () => {
  const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
  it('returns the matching option', () => {
    expect(findOptionByValue(options, 'b')).toEqual({ value: 'b', label: 'B' })
  })
  it('returns null when no option matches', () => {
    expect(findOptionByValue(options, 'z')).toBe(null)
  })
})
