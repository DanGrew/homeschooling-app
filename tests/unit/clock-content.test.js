import { createRequire } from 'module'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const PROFILE_DIR = join(__dirname, '../../content/clock/profiles')
const profiles = readdirSync(PROFILE_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => require(join(PROFILE_DIR, f)))

const TIME_RE = /^\d{2}:\d{2}$/

function validatePreset(p, context) {
  describe(context, () => {
    it('has string id',    () => { expect(typeof p.id).toBe('string');    expect(p.id.length).toBeGreaterThan(0); })
    it('has string label', () => { expect(typeof p.label).toBe('string'); expect(p.label.length).toBeGreaterThan(0); })
    it('has valid time string', () => { expect(p.time).toMatch(TIME_RE); })
    it('has non-empty tags array of strings', () => {
      expect(Array.isArray(p.tags)).toBe(true)
      expect(p.tags.length).toBeGreaterThan(0)
      p.tags.forEach(t => expect(typeof t).toBe('string'))
    })
    it('optional emoji is a string when present',    () => { if (p.emoji    !== undefined) expect(typeof p.emoji).toBe('string') })
    it('optional spoken is a string when present',   () => { if (p.spoken   !== undefined) expect(typeof p.spoken).toBe('string') })
    it('optional spoken24 is a string when present', () => { if (p.spoken24 !== undefined) expect(typeof p.spoken24).toBe('string') })
  })
}

describe('clock profiles', () => {
  it('profiles directory contains at least one profile', () => {
    expect(profiles.length).toBeGreaterThan(0)
  })

  it('has no duplicate profile ids across files', () => {
    const ids = profiles.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  profiles.forEach(profile => {
    describe('profile: ' + profile.id, () => {
      it('has string id',    () => { expect(typeof profile.id).toBe('string') })
      it('has string label', () => { expect(typeof profile.label).toBe('string') })
      it('has non-empty presets array', () => {
        expect(Array.isArray(profile.presets)).toBe(true)
        expect(profile.presets.length).toBeGreaterThan(0)
      })
      it('has no duplicate preset ids', () => {
        const ids = profile.presets.map(p => p.id)
        expect(new Set(ids).size).toBe(ids.length)
      })
      profile.presets.forEach(p => validatePreset(p, 'profile ' + profile.id + ' preset: ' + p.id))
    })
  })
})
