const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/word-builder/'

test('page loads with slots and tiles', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wb-tiles button').first()).toBeVisible({ timeout: 10000 })
  await expect(page.locator('#wb-slots > div').first()).toBeVisible()
})

test('tiles are rendered', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wb-tiles button').first()).toBeVisible({ timeout: 10000 })
})

test('picture is shown by default', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wb-picture-toggle')).toBeVisible({ timeout: 5000 })
  const display = await page.locator('#wb-picture').evaluate(el => el.style.display)
  expect(display).not.toBe('none')
})

test('picture toggle hides and shows picture', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wb-picture-toggle')).toBeVisible({ timeout: 5000 })
  await page.locator('#wb-picture-toggle').click()
  await expect(page.locator('#wb-picture')).toBeHidden()
  await page.locator('#wb-picture-toggle').click()
  const display = await page.locator('#wb-picture').evaluate(el => el.style.display)
  expect(display).not.toBe('none')
})

test('mode buttons are rendered', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wb-mode-distractors')).toBeVisible({ timeout: 3000 })
  await expect(page.locator('#wb-mode-alphabet')).toBeVisible()
})

test('full alphabet mode shows 26 tiles', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wb-tiles button').first()).toBeVisible({ timeout: 10000 })
  await page.locator('#wb-mode-alphabet').click()
  await expect(page.locator('#wb-tiles button')).toHaveCount(26, { timeout: 3000 })
})

test('speak button rendered', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wb-actions button')).toBeVisible({ timeout: 10000 })
})

test('paginator bar is rendered', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#paginator-bar')).toBeVisible({ timeout: 3000 })
})

test('nav bar title is Word Builder', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar')).toBeVisible({ timeout: 3000 })
})
