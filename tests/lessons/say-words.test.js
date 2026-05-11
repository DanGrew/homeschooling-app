const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/say-words/'

test('page loads with tile grid', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#tile-grid .tile').first()).toBeVisible({ timeout: 5000 })
})

test('filter bar is visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#filter-bar')).toBeVisible()
})

test('filter bar appears after title in game-area', async ({ page }) => {
  await page.goto(URL)
  const children = page.locator('.game-area > *')
  const firstId = await children.nth(0).getAttribute('class')
  const secondId = await children.nth(1).getAttribute('id')
  expect(firstId).toMatch(/activity-title/)
  expect(secondId).toBe('filter-bar')
})

test('gamepad button links to word-match', async ({ page }) => {
  await page.goto(URL)
  const link = page.locator('.nav-bar a[href*="word-match"]')
  await expect(link).toBeVisible()
  const text = await link.textContent()
  expect(text).toContain('\uD83C\uDFAE')
})
