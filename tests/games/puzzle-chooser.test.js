const { test, expect } = require('@playwright/test')

const CHOOSER_URL = '/homeschooling-app/app/activities/puzzle/'

test('chooser loads showing all puzzle cards', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await expect(page.locator('.puzzle-card')).toHaveCount(8)
})

test('puzzle cards show thumbnails', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await expect(page.locator('.puzzle-card img').first()).toHaveAttribute('src', /bluey-family/)
})

test('grid picker hidden until card selected', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await expect(page.locator('#grid-picker')).not.toHaveClass(/visible/)
})

test('selecting a card reveals grid buttons', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await page.locator('.puzzle-card').first().click()
  await page.waitForSelector('.grid-btn')
  await expect(page.locator('#grid-picker')).toHaveClass(/visible/)
})

test('grid buttons show correct difficulty labels', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await page.locator('.puzzle-card').first().click()
  await page.waitForSelector('.grid-btn')
  const labels = await page.locator('.grid-btn-label').allTextContents()
  expect(labels).toEqual(['Easy', 'Medium', 'Hard'])
})

test('grid buttons show correct grid dimensions', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await page.locator('.puzzle-card').first().click()
  await page.waitForSelector('.grid-btn')
  const sizes = await page.locator('.grid-btn-size').allTextContents()
  expect(sizes).toEqual(['4\u00d73', '5\u00d73', '8\u00d75'])
})

test('clicking grid button passes correct params to play page', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await page.locator('.puzzle-card').first().click()
  await page.waitForSelector('.grid-btn')
  await page.locator('.grid-btn').first().click()
  await page.waitForSelector('#tray-bar [data-piece-id]')
  const puzzleId = await page.evaluate(() => sessionStorage.getItem('puzzle-id'))
  const grid = await page.evaluate(() => sessionStorage.getItem('puzzle-grid'))
  expect(puzzleId).toBe('bluey-family')
  expect(grid).toBe('4x3')
})

test('game loads correctly after navigating from chooser', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await page.locator('.puzzle-card').first().click()
  await page.waitForSelector('.grid-btn')
  await page.locator('.grid-btn').first().click()
  await page.waitForSelector('#tray-bar [data-piece-id]')
  await expect(page.locator('#puzzle-grid')).toBeVisible()
  await expect(page.locator('#tray-bar')).toBeVisible()
})

test('selecting different card updates grid buttons', async ({ page }) => {
  await page.goto(CHOOSER_URL)
  await page.waitForSelector('.puzzle-card')
  await page.locator('.puzzle-card').first().click()
  await page.waitForSelector('.grid-btn')
  await page.locator('.puzzle-card').nth(2).click()
  const sizes = await page.locator('.grid-btn-size').allTextContents()
  expect(sizes).toEqual(['3\u00d74', '3\u00d75', '5\u00d78'])
})
