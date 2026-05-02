const { test, expect } = require('@playwright/test')

test('shows the story title', async ({ page }) => {
  await page.goto('/app/lessons/story-time/?story=david-and-goliath')
  await expect(page.locator('#story-title')).toHaveText('David and Goliath')
})

test('loads and displays the story words', async ({ page }) => {
  await page.goto('/app/lessons/story-time/?story=david-and-goliath')
  // Words render after the annotation JSON is fetched
  await expect(page.locator('#words')).not.toHaveText('Loading\u2026', { timeout: 5000 })
  await expect(page.locator('#words span').first()).toBeVisible()
})

test('speed buttons change the audio playback rate', async ({ page }) => {
  await page.goto('/app/lessons/story-time/?story=david-and-goliath')
  await expect(page.locator('#words span').first()).toBeVisible({ timeout: 5000 })
  await page.locator('.speed-btn[data-speed="0.5"]').click()
  const rate = await page.evaluate(() => document.getElementById('aud').playbackRate)
  expect(rate).toBe(0.5)
})

test('Play and Stop buttons are visible', async ({ page }) => {
  await page.goto('/app/lessons/story-time/?story=david-and-goliath')
  await expect(page.locator('#playbtn')).toBeVisible()
  await expect(page.locator('#stopbtn')).toBeVisible()
})

test('nav link points to lessons index not home', async ({ page }) => {
  await page.goto('/app/lessons/story-time/?story=david-and-goliath')
  const href = await page.locator('#panel-header a').getAttribute('href')
  expect(href).toBe('../index.html')
})
