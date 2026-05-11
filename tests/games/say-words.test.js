const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/say-words/'

async function waitForTiles(page) {
  await expect(page.locator('.tile').first()).toBeVisible({ timeout: 5000 })
}

test('page loads with tiles showing images and labels', async ({ page }) => {
  await page.goto(URL)
  await waitForTiles(page)
  await expect(page.locator('.tile-label').first()).not.toBeEmpty()
  await expect(page.locator('.tile-img img').first()).toBeVisible()
})

test('tiles are speakable', async ({ page }) => {
  await page.goto(URL)
  await waitForTiles(page)
  await expect(page.locator('.tile.speakable').first()).toBeVisible()
  const count = await page.locator('.tile.speakable').count()
  expect(count).toBeGreaterThan(0)
})


test('activity title is speakable', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.activity-title.speakable')).toBeVisible()
})

test('next page button advances to next page', async ({ page }) => {
  await page.goto(URL)
  await waitForTiles(page)
  const firstLabel = await page.locator('.tile-label').first().textContent()
  await page.locator('#btn-next').click()
  await expect(page.locator('.tile-label').first()).not.toHaveText(firstLabel)
})

test('filter bar is visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#filter-bar')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('#filter-bar button').first()).toBeVisible()
})

test('nav bar has link to word-match', async ({ page }) => {
  await page.goto(URL)
  const href = await page.locator('.nav-bar a[href*="word-match"]').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/activities/word-match/')
})
