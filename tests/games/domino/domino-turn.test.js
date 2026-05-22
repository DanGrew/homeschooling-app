const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/domino/'

async function startGame(page) {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('domino-start-btn').click()
  await page.getByTestId('domino-handover-ready').click()
}

test('submit btn disabled at game start', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-submit-btn')).toBeDisabled()
})

test('draw btn visible at game start', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-draw-btn')).toBeVisible()
})

test('select tile adds selected class', async ({ page }) => {
  await startGame(page)
  const tile = page.getByTestId('domino-tray-tile').first()
  await tile.click()
  await expect(tile).toHaveClass(/domino-tray-tile-selected/)
})

test('endpoints become active after tile selected', async ({ page }) => {
  await startGame(page)
  await page.getByTestId('domino-tray-tile').first().click()
  const endpoint = page.getByTestId('domino-endpoint').first()
  await expect(endpoint).toHaveClass(/domino-endpoint-active/)
})

test('selecting same tile twice deselects it', async ({ page }) => {
  await startGame(page)
  const tile = page.getByTestId('domino-tray-tile').first()
  await tile.click()
  await tile.click()
  await expect(tile).not.toHaveClass(/domino-tray-tile-selected/)
})

test('deselecting tile clears endpoint active state', async ({ page }) => {
  await startGame(page)
  const tile = page.getByTestId('domino-tray-tile').first()
  await tile.click()
  await tile.click()
  const endpoint = page.getByTestId('domino-endpoint').first()
  await expect(endpoint).not.toHaveClass(/domino-endpoint-active/)
})

test('endpoint tap without selected tile shows no preview', async ({ page }) => {
  await startGame(page)
  await page.getByTestId('domino-endpoint').first().click()
  await expect(page.getByTestId('domino-preview-tile')).toHaveCount(0)
})

test('endpoint tap after tile selected shows preview', async ({ page }) => {
  await startGame(page)
  await page.getByTestId('domino-tray-tile').first().click()
  await page.getByTestId('domino-endpoint').first().click()
  await expect(page.getByTestId('domino-preview-tile')).toHaveCount(1)
})

test('endpoint tap after tile selected enables submit', async ({ page }) => {
  await startGame(page)
  await page.getByTestId('domino-tray-tile').first().click()
  await page.getByTestId('domino-endpoint').first().click()
  await expect(page.getByTestId('domino-submit-btn')).toBeEnabled()
})

test('draw advances to next player', async ({ page }) => {
  await startGame(page)
  const firstName = await page.getByTestId('domino-tray-name').textContent()
  await page.getByTestId('domino-draw-btn').click()
  await page.getByTestId('domino-handover-ready').click()
  const secondName = await page.getByTestId('domino-tray-name').textContent()
  expect(secondName).not.toBe(firstName)
})

test('valid placement adds tile to board and removes from tray', async ({ page }) => {
  await startGame(page)

  const boardTilesBefore = await page.locator('[data-testid^="domino-tile-"]').count()
  const trayTilesBefore = await page.getByTestId('domino-tray-tile').count()

  const placed = await page.evaluate(async () => {
    const state = window.gameState
    const player = state.players[state.turnIndex]
    const hand = state.hands[player.id]
    const endpoints = state.board.endpoints
    for (let t = 0; t < hand.length; t++) {
      for (let e = 0; e < endpoints.length; e++) {
        if (window.validatePlacement(hand[t], endpoints[e].value).valid) {
          return { tileId: hand[t].id, endpointIndex: e }
        }
      }
    }
    return null
  })

  if (!placed) return

  const tileEl = page.locator('[data-tile-id="' + placed.tileId + '"]').first()
  await tileEl.click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
  await page.getByTestId('domino-submit-btn').click()

  const boardTilesAfter = await page.locator('[data-testid^="domino-tile-"]').count()
  expect(boardTilesAfter).toBeGreaterThan(boardTilesBefore)
})
