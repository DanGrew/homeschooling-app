const { test, expect } = require('@playwright/test')

test('page loads with keys and note display', async ({ page }) => {
  await page.goto('/app/lessons/piano/')
  await expect(page.locator('#keys-wrap')).toBeVisible()
  await expect(page.locator('#note-display')).toBeVisible()
  const keys = page.locator('#keys-wrap [data-note]')
  expect(await keys.count()).toBe(10)
})

test('nav link points to lessons index', async ({ page }) => {
  await page.goto('/app/lessons/piano/')
  const href = await page.locator('#header a').first().getAttribute('href')
  expect(href).toBe('../index.html')
})

test('game link is visible', async ({ page }) => {
  await page.goto('/app/lessons/piano/')
  await expect(page.getByRole('link', { name: /Game/ })).toBeVisible()
})
