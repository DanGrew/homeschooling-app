const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/frogger/'

test('page loads and grid renders', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('frogger-grid')).toBeVisible()
})

test('player element visible on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('frogger-player')).toBeVisible()
})

test('direction controls visible', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('btn-up')).toBeVisible()
  await expect(page.getByTestId('btn-down')).toBeVisible()
  await expect(page.getByTestId('btn-left')).toBeVisible()
  await expect(page.getByTestId('btn-right')).toBeVisible()
})

test('reset overlay hidden on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('frogger-reset-overlay')).toBeHidden()
})

test('player moves up on button press', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  const player = page.getByTestId('frogger-player')
  const before = await player.evaluate(el => el.style.top)
  await page.getByTestId('btn-up').click()
  await page.waitForTimeout(500)
  const after = await player.evaluate(el => el.style.top)
  expect(after).not.toBe(before)
})

test('player moves right on button press', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  const player = page.getByTestId('frogger-player')
  const before = await player.evaluate(el => el.style.left)
  await page.getByTestId('btn-right').click()
  await page.waitForTimeout(500)
  const after = await player.evaluate(el => el.style.left)
  expect(after).not.toBe(before)
})

test('entity elements appear in grid', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)
  const entities = page.getByTestId('frogger-grid').locator('[data-testid^="frogger-entity-"]')
  await expect(entities.first()).toBeVisible()
})
