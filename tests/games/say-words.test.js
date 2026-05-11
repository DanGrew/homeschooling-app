const { test, expect } = require('@playwright/test')

test('page loads with tiles showing images and labels', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/say-words/')
  await expect(page.locator('.tile').first()).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.tile-label').first()).not.toBeEmpty()
  await expect(page.locator('.tile-img img').first()).toBeVisible()
})

test('next page button advances to next page', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/say-words/')
  await expect(page.locator('.tile').first()).toBeVisible({ timeout: 5000 })
  const firstLabel = await page.locator('.tile-label').first().textContent()
  await page.getByRole('button', { name: /Next/ }).click()
  await expect(page.locator('.tile-label').first()).not.toHaveText(firstLabel)
})

test('filter bar is visible', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/say-words/')
  await expect(page.locator('#filter-bar')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('#filter-bar button').first()).toBeVisible()
})

test('nav bar has link to word-match', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/say-words/')
  const href = await page.locator('.nav-bar a[href*="word-match"]').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/activities/word-match/')
})
