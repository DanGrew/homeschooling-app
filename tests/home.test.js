const { test, expect } = require('@playwright/test')

test('home page shows the title', async ({ page }) => {
  await page.goto('/app/')
  await expect(page.getByText("Let's Learn!")).toBeVisible()
})

test('home page has links to all three sections', async ({ page }) => {
  await page.goto('/app/')
  await expect(page.getByRole('link', { name: 'Lessons' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Worksheets' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Games' })).toBeVisible()
})
