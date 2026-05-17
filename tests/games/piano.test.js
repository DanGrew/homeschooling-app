const { test, expect } = require('@playwright/test')

const LESSON_URL = '/homeschooling-app/app/activities/piano/lesson.html'

test('lesson page songs button is visible in nav', async ({ page }) => {
  await page.goto(LESSON_URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.nav-bar .nav-btn-container button')).toBeVisible()
})

test('lesson page songs button contains book emoji', async ({ page }) => {
  await page.goto(LESSON_URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.nav-bar .nav-btn-container button')).toContainText('\uD83D\uDCDA')
})

test('lesson page songs button has Songs label', async ({ page }) => {
  await page.goto(LESSON_URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.nav-bar .nav-btn-container button [data-nav-label]')).toHaveText('Songs')
})

test('lesson page songs popout opens when button clicked', async ({ page }) => {
  await page.goto(LESSON_URL)
  await page.waitForLoadState('networkidle')
  await page.locator('.nav-bar .nav-btn-container button').click()
  await expect(page.locator('.nav-custom-popout')).toBeVisible()
})

test('lesson page songs popout uses fixed positioning', async ({ page }) => {
  await page.goto(LESSON_URL)
  await page.waitForLoadState('networkidle')
  await page.locator('.nav-bar .nav-btn-container button').click()
  const pos = await page.locator('.nav-custom-popout').evaluate(el => getComputedStyle(el).position)
  expect(pos).toBe('fixed')
})

test('lesson page songs popout closes when clicking outside', async ({ page }) => {
  await page.goto(LESSON_URL)
  await page.waitForLoadState('networkidle')
  await page.locator('.nav-bar .nav-btn-container button').click()
  await expect(page.locator('.nav-custom-popout')).toBeVisible()
  await page.locator('.game-area').click()
  await expect(page.locator('.nav-custom-popout')).not.toBeVisible()
})

test('page loads with keys and play button', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/game.html')
  await expect(page.locator('#keys-wrap')).toBeVisible()
  await expect(page.locator('#btn-play')).toBeVisible()
  const keys = page.locator('#keys-wrap [data-note]')
  expect(await keys.count()).toBe(12)
})

test('nav link points to games index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/game.html')
  await expect(page.locator('a[href*="games/"]')).toBeVisible()
})

test('lesson link is visible', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/game.html')
  await expect(page.locator('.nav-bar a[href*="lesson.html"]')).toBeVisible()
})

test('pause and stop buttons hidden before play', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/game.html')
  await expect(page.locator('#btn-pause')).toBeHidden()
  await expect(page.locator('#btn-stop')).toBeHidden()
})

test('score overlay hidden on load', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/game.html')
  await expect(page.locator('#score-overlay')).toBeHidden()
})

test('play again button exists', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/piano/game.html')
  await expect(page.locator('#btn-play-again')).toBeAttached()
})
