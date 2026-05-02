const { test, expect } = require('@playwright/test')

test('shows the Stories heading', async ({ page }) => {
  await page.goto('/app/stories/')
  await expect(page.getByRole('heading', { name: 'Stories!' })).toBeVisible()
})

test('has links to both stories', async ({ page }) => {
  await page.goto('/app/stories/')
  await expect(page.getByRole('link', { name: 'David and Goliath' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Jonah and the Big Fish' })).toBeVisible()
})

test('story links point to the story-time player', async ({ page }) => {
  await page.goto('/app/stories/')
  const david = page.getByRole('link', { name: 'David and Goliath' })
  await expect(david).toHaveAttribute('href', /story=david-and-goliath/)
  const jonah = page.getByRole('link', { name: 'Jonah and the Big Fish' })
  await expect(jonah).toHaveAttribute('href', /story=jonah-and-the-big-fish/)
})

test('has a home link', async ({ page }) => {
  await page.goto('/app/stories/')
  await expect(page.getByRole('link', { name: /Home/i })).toBeVisible()
})
