import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const presets = require('../../content/clock/presets.json')
const profiles = require('../../content/clock/profiles.json')

const TIME_RE = /^\d{2}:\d{2}$/

function validatePreset(p, context) {
  describe(context, () => {
    it('has string id', () => { expect(typeof p.id).toBe('string'); expect(p.id.length).toBeGreaterThan(0); })
    it('has string label', () => { expect(typeof p.label).toBe('string'); expect(p.label.length).toBeGreaterThan(0); })
    it('has valid time string', () => { expect(p.time).toMatch(TIME_RE); })
    it('has non-empty tags array of strings', () => {
      expect(Array.isArray(p.tags)).toBe(true)
      expect(p.tags.length).toBeGreaterThan(0)
      p.tags.forEach(t => expect(typeof t).toBe('string'))
    })
  })
}

describe('presets.json', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(presets)).toBe(true)
    expect(presets.length).toBeGreaterThan(0)
  })

  it('has no duplicate ids', () => {
    const ids = presets.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('global presets have emoji, spoken, spoken24', () => {
    presets.forEach(p => {
      expect(typeof p.emoji).toBe('string')
      expect(typeof p.spoken).toBe('string')
      expect(typeof p.spoken24).toBe('string')
    })
  })

  presets.forEach(p => validatePreset(p, 'preset: ' + p.id))
})

describe('profiles.json', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(profiles)).toBe(true)
    expect(profiles.length).toBeGreaterThan(0)
  })

  it('has no duplicate profile ids', () => {
    const ids = profiles.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  profiles.forEach(profile => {
    describe('profile: ' + profile.id, () => {
      it('has string id', () => { expect(typeof profile.id).toBe('string') })
      it('has string label', () => { expect(typeof profile.label).toBe('string') })
      it('has non-empty presets array', () => {
        expect(Array.isArray(profile.presets)).toBe(true)
        expect(profile.presets.length).toBeGreaterThan(0)
      })

      it('has no duplicate preset ids within profile', () => {
        const ids = profile.presets.map(p => p.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      profile.presets.forEach(p => validatePreset(p, 'profile ' + profile.id + ' preset: ' + p.id))
    })
  })
})
