const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/frogger/'

async function pickScenario(page) {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('scenario-btn').first().click()
  await page.waitForTimeout(200)
}

test('scenario picker shown on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('frogger-picker')).toBeVisible()
  await expect(page.getByTestId('scenario-btn').first()).toBeVisible()
})

test('page loads and grid renders after scenario selected', async ({ page }) => {
  await pickScenario(page)
  await expect(page.getByTestId('frogger-grid')).toBeVisible()
})

test('player element visible after scenario selected', async ({ page }) => {
  await pickScenario(page)
  await expect(page.getByTestId('frogger-player')).toBeVisible()
})

test('direction controls visible after scenario selected', async ({ page }) => {
  await pickScenario(page)
  await expect(page.getByTestId('btn-up')).toBeVisible()
  await expect(page.getByTestId('btn-down')).toBeVisible()
  await expect(page.getByTestId('btn-left')).toBeVisible()
  await expect(page.getByTestId('btn-right')).toBeVisible()
})

test('reset overlay hidden after scenario selected', async ({ page }) => {
  await pickScenario(page)
  await expect(page.getByTestId('frogger-reset-overlay')).toBeHidden()
})

test('player moves up on button press', async ({ page }) => {
  await pickScenario(page)
  const player = page.getByTestId('frogger-player')
  const before = await player.evaluate(el => el.style.top)
  await page.getByTestId('btn-up').click()
  await page.waitForTimeout(500)
  const after = await player.evaluate(el => el.style.top)
  expect(after).not.toBe(before)
})

test('player moves right on button press', async ({ page }) => {
  await pickScenario(page)
  const player = page.getByTestId('frogger-player')
  const before = await player.evaluate(el => el.style.left)
  await page.getByTestId('btn-right').click()
  await page.waitForTimeout(500)
  const after = await player.evaluate(el => el.style.left)
  expect(after).not.toBe(before)
})

test('entity elements appear in grid', async ({ page }) => {
  await pickScenario(page)
  await page.waitForTimeout(3000)
  const entities = page.getByTestId('frogger-grid').locator('[data-testid^="frogger-entity-"]')
  await expect(entities.first()).toBeVisible()
})
