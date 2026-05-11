const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/character-lesson/'

test('page loads with SVG trace path', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#svg')).toBeVisible({ timeout: 5000 })
})

test('filter bar rendered with All option active', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#filter-bar')).toBeVisible({ timeout: 3000 })
  const allBtn = page.locator('#filter-bar button[data-value="all"]')
  await expect(allBtn).toBeVisible()
  const bg = await allBtn.evaluate(el => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(52, 152, 219)')
})

test('filter bar has a-z, A-Z, 0-9 options', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#filter-bar button[data-value="lower"]')).toBeVisible({ timeout: 3000 })
  await expect(page.locator('#filter-bar button[data-value="upper"]')).toBeVisible()
  await expect(page.locator('#filter-bar button[data-value="digit"]')).toBeVisible()
})

test('clicking a-z filter activates it', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#filter-bar button[data-value="lower"]').click({ timeout: 3000 })
  const btn = page.locator('#filter-bar button[data-value="lower"]')
  const bg = await btn.evaluate(el => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(52, 152, 219)')
})

test('filter bar is centred', async ({ page }) => {
  await page.goto(URL)
  const row = page.locator('#filter-bar > div').first()
  await expect(row).toHaveCSS('justify-content', 'center')
})
