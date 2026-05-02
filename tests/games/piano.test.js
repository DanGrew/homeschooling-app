const { test, expect } = require('@playwright/test')

test('page loads with keys and play button', async ({ page }) => {
  await page.goto('/app/games/piano/')
  await expect(page.locator('#keys-wrap')).toBeVisible()
  await expect(page.locator('#btn-play')).toBeVisible()
  const keys = page.locator('#keys-wrap [data-note]')
  expect(await keys.count()).toBe(10)
})

test('nav link points to games index', async ({ page }) => {
  await page.goto('/app/games/piano/')
  const href = await page.locator('#header a').first().getAttribute('href')
  expect(href).toBe('../index.html')
})

test('lesson link is visible', async ({ page }) => {
  await page.goto('/app/games/piano/')
  await expect(page.getByRole('link', { name: /Lesson/ })).toBeVisible()
})

test('pause and stop buttons hidden before play', async ({ page }) => {
  await page.goto('/app/games/piano/')
  await expect(page.locator('#btn-pause')).toBeHidden()
  await expect(page.locator('#btn-stop')).toBeHidden()
})
