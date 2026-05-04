import { test, expect, describe } from 'vitest'
import { validWord, charFile } from '../../app/activities/word-lesson/word-lesson-logic.js'

describe('validWord', () => {
  test('accepts lowercase letters', () => expect(validWord('cat')).toBe(true))
  test('accepts uppercase letters', () => expect(validWord('CAT')).toBe(true))
  test('accepts mixed case', () => expect(validWord('Cat')).toBe(true))
  test('accepts digits', () => expect(validWord('123')).toBe(true))
  test('accepts alphanumeric mix', () => expect(validWord('abc123')).toBe(true))
  test('rejects empty string', () => expect(validWord('')).toBe(false))
  test('rejects spaces', () => expect(validWord('cat dog')).toBe(false))
  test('rejects hyphen', () => expect(validWord('well-done')).toBe(false))
  test('rejects apostrophe', () => expect(validWord("it's")).toBe(false))
  test('rejects special chars', () => expect(validWord('abc!')).toBe(false))
  test('single letter valid', () => expect(validWord('a')).toBe(true))
  test('single digit valid', () => expect(validWord('0')).toBe(true))
})

describe('charFile', () => {
  test('lowercase a', () => expect(charFile('a')).toBe('lower-a.svg'))
  test('lowercase z', () => expect(charFile('z')).toBe('lower-z.svg'))
  test('uppercase A', () => expect(charFile('A')).toBe('upper-a.svg'))
  test('uppercase Z', () => expect(charFile('Z')).toBe('upper-z.svg'))
  test('uppercase maps to lowercase filename', () => expect(charFile('M')).toBe('upper-m.svg'))
  test('digit 0', () => expect(charFile('0')).toBe('0.svg'))
  test('digit 9', () => expect(charFile('9')).toBe('9.svg'))
})
