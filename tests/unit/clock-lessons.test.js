import { createRequire } from 'module'
import { readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const LEARNINGS_DIR = join(__dirname, '../../content/learnings')
const PROFILE_DIR   = join(__dirname, '../../content/clock/profiles')

const KNOWN_PROFILES = ['times_of_day', 'child-day', 'baker', 'farmer', 'doctor']

const clockLessons = readdirSync(LEARNINGS_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => require(join(LEARNINGS_DIR, f)))
  .filter(l => l.source === 'Clock')

function loadProfile(id) {
  const path = join(PROFILE_DIR, id + '.json')
  return existsSync(path) ? require(path) : null
}

describe('clock lessons', () => {
  it('has at least one clock lesson', () => {
    expect(clockLessons.length).toBeGreaterThan(0)
  })

  it('has no duplicate ids', () => {
    const ids = clockLessons.map(l => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  clockLessons.forEach(lesson => {
    describe('lesson: ' + lesson.id, () => {
      it('has required string fields', () => {
        expect(typeof lesson.id).toBe('string')
        expect(typeof lesson.title).toBe('string')
        expect(typeof lesson.guide).toBe('string')
        expect(typeof lesson.source).toBe('string')
      })

      it('has positive lesson number', () => {
        expect(typeof lesson.number).toBe('number')
        expect(lesson.number).toBeGreaterThan(0)
      })

      it('has non-empty criteria array of strings', () => {
        expect(Array.isArray(lesson.criteria)).toBe(true)
        expect(lesson.criteria.length).toBeGreaterThan(0)
        lesson.criteria.forEach(c => expect(typeof c).toBe('string'))
      })

      it('has non-empty steps array', () => {
        expect(Array.isArray(lesson.steps)).toBe(true)
        expect(lesson.steps.length).toBeGreaterThan(0)
      })

      lesson.steps.forEach((step, i) => {
        it('step ' + i + ' has expect field', () => {
          expect(step.expect).toBeDefined()
        })
        it('step ' + i + ' with badge expects correct event', () => {
          if (!lesson.id.startsWith('clock-lesson-')) return
          if (step.badge === undefined) return
          const clockBadgeEvents = { 'AM': 'BADGE_AM_TAPPED', 'PM': 'BADGE_PM_TAPPED', '24hr': 'BADGE_24HR_TAPPED', 'preset-label': 'BADGE_PRESET_LABEL_TAPPED' }
          const expected = clockBadgeEvents[step.badge] || 'BADGE_TAPPED'
          expect(step.expect).toBe(expected)
        })
        it('step ' + i + ' feedback only on last step', () => {
          if (!lesson.id.startsWith('clock-lesson-')) return
          if (i < lesson.steps.length - 1) expect(step.feedback).toBeUndefined()
        })
      })

      it('pageControls reference known profile ids when present', () => {
        const controls = lesson.pageControls || []
        controls
          .filter(c => c.startsWith('LOAD_PROFILE_'))
          .map(c => c.replace('LOAD_PROFILE_', '').toLowerCase().replace(/_/g, '-'))
          .forEach(id => expect(KNOWN_PROFILES).toContain(id))
      })

      it('filter tag matches at least one preset in profile when both present', () => {
        if (!lesson.filter || !lesson.pageControls) return
        const profileControl = (lesson.pageControls || []).find(c => c.startsWith('LOAD_PROFILE_'))
        if (!profileControl) return
        const profileId = profileControl.replace('LOAD_PROFILE_', '').toLowerCase().replace(/_/g, '-')
        const profile = loadProfile(profileId)
        if (!profile) return
        const tag = lesson.filter
        const matches = profile.presets.filter(p => p.tags && p.tags.includes(tag))
        expect(matches.length).toBeGreaterThan(0)
      })
    })
  })
})
