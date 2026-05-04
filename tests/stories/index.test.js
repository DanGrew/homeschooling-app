const { test, expect } = require('@playwright/test')

test('shows the Stories heading', async ({ page }) => {
  await page.goto('/homeschooling-app/app/stories/')
  await expect(page.getByRole('heading', { name: 'Stories!' })).toBeVisible()
})

test('has a home link', async ({ page }) => {
  await page.goto('/homeschooling-app/app/stories/')
  await expect(page.getByRole('link', { name: /Home/i })).toBeVisible()
})

test('has Bible book section headings', async ({ page }) => {
  await page.goto('/homeschooling-app/app/stories/')
  await expect(page.getByRole('heading', { name: 'Genesis' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Judges' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '1 Samuel' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Jonah' })).toBeVisible()
})

test('has links to all 7 stories', async ({ page }) => {
  await page.goto('/homeschooling-app/app/stories/')
  await expect(page.getByRole('link', { name: 'Adam and Eve' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cain and Abel' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Jacob and Esau' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Joseph' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Samson and Delilah' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'David and Goliath' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Jonah and the Big Fish' })).toBeVisible()
})

test('story links point to the story-time player', async ({ page }) => {
  await page.goto('/homeschooling-app/app/stories/')
  await expect(page.getByRole('link', { name: 'Adam and Eve' })).toHaveAttribute('href', /story=adam-and-eve/)
  await expect(page.getByRole('link', { name: 'Cain and Abel' })).toHaveAttribute('href', /story=cain-and-abel/)
  await expect(page.getByRole('link', { name: 'Jacob and Esau' })).toHaveAttribute('href', /story=jacob-and-esau/)
  await expect(page.getByRole('link', { name: 'Joseph' })).toHaveAttribute('href', /story=joseph/)
  await expect(page.getByRole('link', { name: 'Samson and Delilah' })).toHaveAttribute('href', /story=samson-and-delilah/)
  await expect(page.getByRole('link', { name: 'David and Goliath' })).toHaveAttribute('href', /story=david-and-goliath/)
  await expect(page.getByRole('link', { name: 'Jonah and the Big Fish' })).toHaveAttribute('href', /story=jonah-and-the-big-fish/)
})
