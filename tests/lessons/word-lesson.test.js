const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/word-lesson/'

test('page loads and shows a word', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#word-label')).not.toBeEmpty({ timeout: 5000 })
})

test('filter bar rendered in nav-bar sidebar', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar #nav-filter-slot')).toBeVisible({ timeout: 3000 })
})

test('filter bar has All option active by default', async ({ page }) => {
  await page.goto(URL)
  const allBtn = page.locator('#nav-filter-slot button[data-value="all"]')
  await expect(allBtn).toBeVisible({ timeout: 3000 })
  const bg = await allBtn.evaluate(el => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(52, 152, 219)')
})

test('filter bar is in nav-bar not game-area', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar #nav-filter-slot')).toBeVisible()
  const firstClass = await page.locator('.game-area > *').nth(0).getAttribute('class')
  expect(firstClass).toMatch(/activity-header/)
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
  const allBtn = page.locator('#nav-filter-slot button[data-value="all"]')
  await expect(allBtn).toHaveCSS('color', 'rgb(255, 255, 255)')
})
