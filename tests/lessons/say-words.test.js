const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/say-words/'

test('page loads with tile grid', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#tile-grid .tile').first()).toBeVisible({ timeout: 5000 })
})

test('filter bar is visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#nav-filter-slot')).toBeVisible()
})

test('filter bar is in nav-bar sidebar', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar #nav-filter-slot')).toBeVisible()
})

test('gamepad button links to word-match', async ({ page }) => {
  await page.goto(URL)
  const link = page.locator('.nav-bar a[href*="word-match"]')
  await expect(link).toBeVisible()
  const text = await link.textContent()
  expect(text).toContain('\uD83C\uDFAE')
})

test('filter bar animals button has paw emoji', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#tile-grid .tile').first().waitFor()
  const btn = page.locator('#nav-filter-slot button[data-tag="animals"]')
  await expect(btn).toContainText('\uD83D\uDC3E')
})

test('filter bar fruit button has apple emoji', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#tile-grid .tile').first().waitFor()
  const btn = page.locator('#nav-filter-slot button[data-tag="fruit"]')
  await expect(btn).toContainText('\uD83C\uDF4E')
})

test('filter bar emotions button has face emoji', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#tile-grid .tile').first().waitFor()
  const btn = page.locator('#nav-filter-slot button[data-tag="emotions"]')
  await expect(btn).toContainText('\uD83D\uDE0A')
})

test('filter bar vehicles button has car emoji', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#tile-grid .tile').first().waitFor()
  const btn = page.locator('#nav-filter-slot button[data-tag="vehicles"]')
  await expect(btn).toContainText('\uD83D\uDE97')
})

test('lesson nav button is visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-lesson-btn')).toBeVisible()
  await expect(page.locator('.nav-lesson-btn')).toHaveText('\uD83D\uDCDA')
})

test('lesson popout shows all 6 lessons', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.nav-lesson-btn').click()
  await expect(page.locator('.nav-lesson-popout')).toBeVisible()
  await expect(page.locator('.nav-lesson-item')).toHaveCount(6)
  await expect(page.locator('.nav-lesson-item').first()).toContainText('Lesson 1: Farm Animals')
  await expect(page.locator('.nav-lesson-item').last()).toContainText('Lesson 6: Exotic Fruits')
})

async function startLesson(page) {
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item').first().click()
}

test('clicking lesson item shows guidance overlay', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toBeVisible()
})

test('first step shows farm intro and find-cow instruction, no Next button', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toContainText("Let's visit the farm!")
  await expect(page.locator('#guidance-overlay')).toContainText('Find the cow')
  await expect(page.locator('#guidance-overlay [data-action="next"]')).not.toBeVisible()
})

test('tapping cow tile shows feedback', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#nav-filter-slot button[data-tag="animals"]').click()
  await page.locator('#tile-grid .tile').first().waitFor()
  await startLesson(page)
  await page.locator('.tile').filter({ hasText: 'Cow' }).click()
  await expect(page.locator('#guidance-overlay')).toContainText('Moo!')
  await expect(page.locator('#guidance-overlay [data-action="next"]')).not.toBeVisible()
})

test('close button stops lesson and hides overlay', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toBeVisible()
  await page.locator('#guidance-overlay button[title="Stop lesson"]').click({ delay: 700 })
  await expect(page.locator('#guidance-overlay')).not.toBeVisible()
})

test('starting farm lesson auto-switches filter to animals', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#tile-grid .tile').first().waitFor()
  await startLesson(page)
  const animalsBtn = page.locator('#nav-filter-slot button[data-tag="animals"]')
  await expect(animalsBtn).toHaveCSS('color', 'rgb(255, 255, 255)')
})

test('stopping lesson resets filter to all', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#tile-grid .tile').first().waitFor()
  await startLesson(page)
  await page.locator('#guidance-overlay button[title="Stop lesson"]').click({ delay: 700 })
  const allBtn = page.locator('#nav-filter-slot button[data-tag="all"]')
  await expect(allBtn).toHaveCSS('color', 'rgb(255, 255, 255)')
})
