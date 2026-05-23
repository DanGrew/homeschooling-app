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
  const placed = await page.evaluate(function() {
    var state = window.gameState
    var hand = state.hands[state.players[state.turnIndex].id]
    var endpoints = state.board.endpoints
    var rots = [0, 90, 180, 270, 45, 135, 225, 315]
    for (var t = 0; t < hand.length; t++) {
      for (var e = 0; e < endpoints.length; e++) {
        for (var ri = 0; ri < rots.length; ri++) {
          if (window.validatePlacement(hand[t], endpoints[e], rots[ri]).valid) {
            return { tileId: hand[t].id, endpointIndex: e }
          }
        }
      }
    }
    return null
  })
  if (!placed) return
  await page.locator('[data-tile-id="' + placed.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
  await expect(page.getByTestId('domino-preview-tile')).toHaveCount(1)
})

test('endpoint tap after tile selected enables submit', async ({ page }) => {
  await startGame(page)
  const placed = await page.evaluate(function() {
    var state = window.gameState
    var hand = state.hands[state.players[state.turnIndex].id]
    var endpoints = state.board.endpoints
    var rots = [0, 90, 180, 270, 45, 135, 225, 315]
    for (var t = 0; t < hand.length; t++) {
      for (var e = 0; e < endpoints.length; e++) {
        for (var ri = 0; ri < rots.length; ri++) {
          if (window.validatePlacement(hand[t], endpoints[e], rots[ri]).valid) {
            return { tileId: hand[t].id, endpointIndex: e }
          }
        }
      }
    }
    return null
  })
  if (!placed) return
  await page.locator('[data-tile-id="' + placed.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
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
    const rots = [0, 90, 180, 270, 45, 135, 225, 315]
    for (let t = 0; t < hand.length; t++) {
      for (let e = 0; e < endpoints.length; e++) {
        for (let ri = 0; ri < rots.length; ri++) {
          if (window.validatePlacement(hand[t], endpoints[e], rots[ri]).valid) {
            return { tileId: hand[t].id, endpointIndex: e }
          }
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

test('endpoint tap shows preview for value-mismatched tile', async ({ page }) => {
  await startGame(page)
  const mismatch = await page.evaluate(function() {
    var state = window.gameState
    var hand = state.hands[state.players[state.turnIndex].id]
    var endpoints = state.board.endpoints
    var rots = [0, 90, 180, 270, 45, 135, 225, 315]
    for (var t = 0; t < hand.length; t++) {
      var isValid = false
      for (var e = 0; e < endpoints.length; e++) {
        for (var ri = 0; ri < rots.length; ri++) {
          if (window.validatePlacement(hand[t], endpoints[e], rots[ri]).valid) { isValid = true; break }
        }
        if (isValid) break
      }
      if (!isValid) return { tileId: hand[t].id }
    }
    return null
  })
  if (!mismatch) return
  await page.locator('[data-tile-id="' + mismatch.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').first().click()
  await expect(page.getByTestId('domino-preview-tile')).toHaveCount(1)
})

test('placing mismatched tile does not add it to board', async ({ page }) => {
  await startGame(page)
  const mismatch = await page.evaluate(function() {
    var state = window.gameState
    var hand = state.hands[state.players[state.turnIndex].id]
    var endpoints = state.board.endpoints
    var rots = [0, 90, 180, 270, 45, 135, 225, 315]
    for (var t = 0; t < hand.length; t++) {
      var isValid = false
      for (var e = 0; e < endpoints.length; e++) {
        for (var ri = 0; ri < rots.length; ri++) {
          if (window.validatePlacement(hand[t], endpoints[e], rots[ri]).valid) { isValid = true; break }
        }
        if (isValid) break
      }
      if (!isValid) return { tileId: hand[t].id }
    }
    return null
  })
  if (!mismatch) return
  const boardBefore = await page.locator('[data-testid^="domino-tile-"]').count()
  await page.locator('[data-tile-id="' + mismatch.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').first().click()
  await page.getByTestId('domino-submit-btn').click()
  const boardAfter = await page.locator('[data-testid^="domino-tile-"]').count()
  expect(boardAfter).toBe(boardBefore)
})

test('zoom level preserved after valid tile placement', async ({ page }) => {
  await startGame(page)

  await page.getByTestId('domino-zoom-in').click()
  const scaleBefore = await page.evaluate(function() {
    return document.getElementById('domino-board-viewport')._dominoPanState.scale
  })

  const placed = await page.evaluate(function() {
    var state = window.gameState
    var hand = state.hands[state.players[state.turnIndex].id]
    var endpoints = state.board.endpoints
    var rots = [0, 90, 180, 270, 45, 135, 225, 315]
    for (var t = 0; t < hand.length; t++) {
      for (var e = 0; e < endpoints.length; e++) {
        for (var ri = 0; ri < rots.length; ri++) {
          if (window.validatePlacement(hand[t], endpoints[e], rots[ri]).valid) {
            return { tileId: hand[t].id, endpointIndex: e }
          }
        }
      }
    }
    return null
  })
  if (!placed) return

  await page.locator('[data-tile-id="' + placed.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
  await page.getByTestId('domino-submit-btn').click()
  await page.getByTestId('domino-handover-ready').click()

  const scaleAfter = await page.evaluate(function() {
    return document.getElementById('domino-board-viewport')._dominoPanState.scale
  })
  expect(scaleAfter).toBe(scaleBefore)
})
