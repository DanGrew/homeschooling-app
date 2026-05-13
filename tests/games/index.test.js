const { test, expect } = require('@playwright/test')

test('shows the Games heading', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('heading', { name: 'Games!' })).toBeVisible()
})

test('has all category headings', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('heading', { name: 'Words' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Numbers' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Colours' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Music' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Puzzles' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Time' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'World' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Thinking' })).toBeVisible()
})

test('Words section has Word Match', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.locator('a[href*="activities/word-match/"]')).toBeVisible()
})

test('Numbers section has Count Shapes', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('link', { name: 'Count Shapes' })).toBeVisible()
})

test('Colours section has matching and colouring games', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.locator('a[href*="activities/match-colour/"]')).toBeVisible()
  await expect(page.locator('a[href*="activities/match-shape/"]')).toBeVisible()
  await expect(page.locator('a[href*="activities/match-colour-shape/"]')).toBeVisible()
  await expect(page.locator('a[href*="activities/colouring/"]')).toBeVisible()
  await expect(page.locator('a[href*="activities/colouring-palette/"]')).toBeVisible()
})

test('Music section has Piano Game', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('link', { name: 'Piano Game' })).toBeVisible()
})

test('Puzzles section has puzzle games', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('link', { name: 'Move the Block' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Connect the Dots' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Drawing Dots' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Puzzle', exact: true })).toBeVisible()
})

test('Thinking section has Logic Puzzle', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('link', { name: 'Logic Puzzle' })).toBeVisible()
})

test('Time section has What Time Is It', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('link', { name: 'What Time Is It?' })).toBeVisible()
})

test('World section has shopping games', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('link', { name: 'Shopping Play' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Shopping Scan' })).toBeVisible()
})

test('Say It is not on the games page', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/')
  await expect(page.getByRole('link', { name: 'Say It!' })).not.toBeVisible()
})
