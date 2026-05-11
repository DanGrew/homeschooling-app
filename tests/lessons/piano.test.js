const { test, expect } = require('@playwright/test')

test('page loads with keys and song display', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/lesson.html')
  await expect(page.locator('#keys-wrap')).toBeVisible()
  await expect(page.locator('#section-display')).toBeVisible()
  const keys = page.locator('#keys-wrap [data-note]')
  expect(await keys.count()).toBe(12)
})

test('nav link points to lessons index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/lesson.html')
  await expect(page.locator('a[href*="lessons/"]')).toBeVisible()
})

test('game link is visible', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/lesson.html')
  await expect(page.locator('.nav-bar a[href*="game.html"]')).toBeVisible()
})
