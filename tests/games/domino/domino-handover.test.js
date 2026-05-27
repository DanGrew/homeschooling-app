const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/domino/'

async function setupGame(page) {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('domino-start-btn').click()
}

async function startGame(page) {
  await setupGame(page)
  await page.getByTestId('domino-handover-ready').click()
}

test('handover shown at game start', async ({ page }) => {
  await setupGame(page)
  await expect(page.getByTestId('domino-handover')).toBeVisible()
})

test('handover shows first player name', async ({ page }) => {
  await setupGame(page)
  const text = await page.getByTestId('domino-handover-name').textContent()
  expect(text).toMatch(/\u2019s turn$/)
})

test('ready button dismisses handover', async ({ page }) => {
  await setupGame(page)
  await page.getByTestId('domino-handover-ready').click()
  await expect(page.getByTestId('domino-handover')).toHaveCount(0)
})

test('tray interactive after handover dismissed', async ({ page }) => {
  await startGame(page)
  const tile = page.getByTestId('domino-tray-tile').first()
  await tile.click()
  await expect(tile).toHaveClass(/domino-tray-tile-selected/)
})

test('handover shown after draw with next player name', async ({ page }) => {
  await startGame(page)
  const firstName = await page.getByTestId('domino-tray-name').textContent()
  await page.getByTestId('domino-draw-btn').click()
  await expect(page.getByTestId('domino-handover')).toBeVisible()
  const handoverText = await page.getByTestId('domino-handover-name').textContent()
  expect(handoverText).not.toContain(firstName.trim())
})

test('space on ready button does not trigger draw', async ({ page }) => {
  await setupGame(page)
  const pileBefore = await page.evaluate(() => window.gameState.drawPile.length)
  await page.getByTestId('domino-handover-ready').focus()
  await page.keyboard.press('Space')
  await expect(page.getByTestId('domino-handover')).toHaveCount(0)
  const pileAfter = await page.evaluate(() => window.gameState.drawPile.length)
  expect(pileAfter).toBe(pileBefore)
})

test('handover shown after valid placement', async ({ page }) => {
  await startGame(page)

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

  await page.locator('[data-tile-id="' + placed.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
  await page.getByTestId('domino-submit-btn').click()

  await expect(page.getByTestId('domino-handover')).toBeVisible()
})
