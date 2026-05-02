const { test, expect } = require('@playwright/test')

test('shows the Games heading', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('heading', { name: 'Games!' })).toBeVisible()
})

test('has all six category headings', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('heading', { name: 'Numbers' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Colours' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Music' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Puzzles' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Letters' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'World' })).toBeVisible()
})

test('Numbers section has Count Shapes', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('link', { name: 'Count Shapes' })).toBeVisible()
})

test('Colours section has matching and colouring games', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('link', { name: 'Colour Match' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Shape Match' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Colour & Shape Match' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Colour Me' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Colour with Palette' })).toBeVisible()
})

test('Music section has Piano Game', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('link', { name: 'Piano Game' })).toBeVisible()
})

test('Puzzles section has puzzle games', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('link', { name: 'Move the Block' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Connect the Dots' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Drawing Dots' })).toBeVisible()
})

test('Letters section has Trace Letters', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('heading', { name: 'Letters' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Trace Letters' })).toBeVisible()
})

test('World section has shopping games', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('link', { name: 'Shopping Play' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Shopping Scan' })).toBeVisible()
})

test('Say It is not on the games page', async ({ page }) => {
  await page.goto('/app/games/')
  await expect(page.getByRole('link', { name: 'Say It!' })).not.toBeVisible()
})
