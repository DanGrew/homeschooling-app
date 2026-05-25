const { test, expect } = require('@playwright/test')

test('Grow Tomatoes hub shows three level tiles', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/simulator/grow-tomatoes.html')
  await expect(page.getByRole('link', { name: 'Level 1' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Level 2' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Level 3' })).toBeVisible()
})

test('lessons Grow Tomatoes tile navigates to hub', async ({ page }) => {
  await page.goto('/homeschooling-app/app/lessons/')
  await page.click('a[href*="grow-tomatoes.html"]')
  await expect(page.getByRole('heading', { name: 'Grow Tomatoes' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Level 1' })).toBeVisible()
})

test('hub Level 1 tile navigates to simulator', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/simulator/grow-tomatoes.html')
  await page.click('a[href*="grow-tomatoes-level-1"]')
  await expect(page).toHaveURL(/grow-tomatoes-level-1/)
})

test('hub Level 2 tile navigates to simulator', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/simulator/grow-tomatoes.html')
  await page.click('a[href*="grow-tomatoes-level-2"]')
  await expect(page).toHaveURL(/grow-tomatoes-level-2/)
})

test('hub Level 3 tile navigates to simulator', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/simulator/grow-tomatoes.html')
  await page.click('a[href*="grow-tomatoes-level-3"]')
  await expect(page).toHaveURL(/grow-tomatoes-level-3/)
})
