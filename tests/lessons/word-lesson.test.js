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
  const bg = await allBtn.evaluate(el => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(52, 152, 219)')
})

test('filter bar appears after title', async ({ page }) => {
  await page.goto(URL)
  const children = page.locator('.game-area > *')
  const firstClass = await children.nth(0).getAttribute('class')
  const secondId = await children.nth(1).getAttribute('id')
  expect(firstClass).toMatch(/activity-title/)
  expect(secondId).toBe('filter-bar')
})

async function startLesson(page) {
  await expect(page.locator('#word-label')).not.toBeEmpty({ timeout: 5000 })
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item').first().click()
}

test('lesson nav shows 5 lessons', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.nav-lesson-btn').click()
  await expect(page.locator('.nav-lesson-item')).toHaveCount(5)
  await expect(page.locator('.nav-lesson-item').first()).toContainText('Lesson 1: Farm Animals')
})

test('starting farm lesson constrains paginator to lesson words', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#word-label')).toHaveText('Cow')
})

test('starting lesson shows guidance overlay', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toBeVisible()
})

test('stopping lesson restores full word list', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await page.locator('#guidance-overlay button[title="Stop lesson"]').click({ delay: 700 })
  const allBtn = page.locator('#filter-bar button[data-value="all"]')
  await expect(allBtn).toHaveCSS('color', 'rgb(255, 255, 255)')
})
