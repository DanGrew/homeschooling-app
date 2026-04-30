const { test, expect } = require('@playwright/test')

test('shows the Lessons heading', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('heading', { name: 'Lessons' })).toBeVisible()
})

test('has links to both stories', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('link', { name: 'David and Goliath' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Jonah and the Big Fish' })).toBeVisible()
})

test('has links to all three simulator levels', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('link', { name: 'Grow Tomatoes [Level 1]' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Grow Tomatoes [Level 2]' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Grow Tomatoes [Level 3]' })).toBeVisible()
})
