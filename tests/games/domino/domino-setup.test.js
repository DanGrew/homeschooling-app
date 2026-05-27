const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/domino/'

test('setup screen visible on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#domino-setup')).toBeVisible()
})

test('game screen hidden on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#domino-game')).toBeHidden()
})

test('start button disabled until avatars selected', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('domino-start-btn')).toBeDisabled()
})

test('player count buttons 2 and 3 visible', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('player-count-2')).toBeVisible()
  await expect(page.getByTestId('player-count-3')).toBeVisible()
})

test('player count 1 not present', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('player-count-1')).not.toBeAttached()
})

test('match type buttons visible', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('match-type-colours')).toBeVisible()
  await expect(page.getByTestId('match-type-shapes')).toBeVisible()
  await expect(page.getByTestId('match-type-numbers')).toBeVisible()
  await expect(page.getByTestId('match-type-animals')).toBeVisible()
})

test('two player panels shown by default', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('player-panel-0')).toBeVisible()
  await expect(page.getByTestId('player-panel-1')).toBeVisible()
  await expect(page.getByTestId('player-panel-2')).not.toBeAttached()
})

test('selecting 3 players shows third player panel', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('player-count-3').click()
  await expect(page.getByTestId('player-panel-2')).toBeVisible()
})

test('start enabled after both avatars selected', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await expect(page.getByTestId('domino-start-btn')).toBeEnabled()
})

test('taken avatar disabled for other player', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await expect(page.getByTestId('avatar-1-cat')).toBeDisabled()
})

test('selecting avatar sets name field', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  const name = await page.getByTestId('player-name-0').inputValue()
  expect(name.length).toBeGreaterThan(0)
})

test('selecting new avatar overrides existing name', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('player-name-0').fill('My Custom Name')
  await page.getByTestId('avatar-0-dog').click()
  const name = await page.getByTestId('player-name-0').inputValue()
  expect(name).not.toBe('My Custom Name')
})

test('start transitions to game screen', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('domino-start-btn').click()
  await expect(page.locator('#domino-game')).toBeVisible()
  await expect(page.locator('#domino-setup')).toBeHidden()
})
