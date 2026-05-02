const { test, expect } = require('@playwright/test')

test('shows the Lessons heading', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('heading', { name: 'Lessons' })).toBeVisible()
})

test('has category headings', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('heading', { name: 'Words' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Colours' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Music' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'World' })).toBeVisible()
})

test('Words section has Say It and Trace Letters', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('link', { name: 'Say It!' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Trace Letters' })).toBeVisible()
})

test('Colours section has Colour Wheel', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('link', { name: 'Colour Wheel' })).toBeVisible()
})

test('Music section has Piano', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('link', { name: 'Piano' })).toBeVisible()
})

test('World section has all three simulator levels', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('link', { name: 'Grow Tomatoes [Level 1]' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Grow Tomatoes [Level 2]' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Grow Tomatoes [Level 3]' })).toBeVisible()
})

test('stories are not on the lessons page', async ({ page }) => {
  await page.goto('/app/lessons/')
  await expect(page.getByRole('link', { name: 'David and Goliath' })).not.toBeVisible()
  await expect(page.getByRole('link', { name: 'Jonah and the Big Fish' })).not.toBeVisible()
})
