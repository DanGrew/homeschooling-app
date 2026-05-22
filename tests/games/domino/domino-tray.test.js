const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/domino/'

async function startGame(page) {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('domino-start-btn').click()
}

test('tray visible after game starts', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-tray')).toBeVisible()
})

test('tray is outside board viewport', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-board-viewport').locator('[data-testid="domino-tray"]')).toHaveCount(0)
})

test('tray shows 7 tiles for active player', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-tray-tile')).toHaveCount(7)
})

test('tray shows active player name', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-tray-name')).toBeVisible()
})

test('tray shows active player icon', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-tray-icon')).toBeVisible()
})

test('tray tiles are inside tray tiles container', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-tray-tiles').getByTestId('domino-tray-tile')).toHaveCount(7)
})
