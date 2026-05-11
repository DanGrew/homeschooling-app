const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/word-lesson/'

test('page loads and shows a word', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#word-label')).not.toBeEmpty({ timeout: 5000 })
})

test('filter bar rendered and centred', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#filter-bar')).toBeVisible({ timeout: 3000 })
  const row = page.locator('#filter-bar > div').first()
  await expect(row).toHaveCSS('justify-content', 'center')
})

test('filter bar has All option active by default', async ({ page }) => {
  await page.goto(URL)
  const allBtn = page.locator('#filter-bar button[data-value="all"]')
  await expect(allBtn).toBeVisible({ timeout: 3000 })
  const bg = await allBtn.evaluate(el => el.style.background)
  expect(bg).toMatch(/#3498DB/i)
})

test('filter bar appears after title', async ({ page }) => {
  await page.goto(URL)
  const children = page.locator('.game-area > *')
  const firstClass = await children.nth(0).getAttribute('class')
  const secondId = await children.nth(1).getAttribute('id')
  expect(firstClass).toMatch(/activity-title/)
  expect(secondId).toBe('filter-bar')
})
