const { test, expect } = require('@playwright/test')

test('home page shows the title', async ({ page }) => {
  await page.goto('/homeschooling-app/app/')
  await expect(page.getByText("Let's Learn!")).toBeVisible()
})

test('home page has links to all sections', async ({ page }) => {
  await page.goto('/homeschooling-app/app/')
  await expect(page.getByRole('link', { name: 'Lessons' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Worksheets' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Games' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Stories' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Physical Play' })).toBeVisible()
})

test('home page info section has Curriculum link', async ({ page }) => {
  await page.goto('/homeschooling-app/app/')
  await expect(page.getByRole('link', { name: 'Curriculum' })).toBeVisible()
})
