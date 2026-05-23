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

async function startAndShowPreview(page) {
  await startGame(page)
  const placed = await page.evaluate(() => {
    const state = window.gameState
    const hand = state.hands[state.players[state.turnIndex].id]
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
  if (!placed) return null
  await page.locator('[data-tile-id="' + placed.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
  return placed
}

test('preview tile is shown after endpoint tap', async ({ page }) => {
  const placed = await startAndShowPreview(page)
  if (!placed) return
  await expect(page.getByTestId('domino-preview-tile')).toHaveCount(1)
})

test('preview tile is clickable (not pointer-events none)', async ({ page }) => {
  const placed = await startAndShowPreview(page)
  if (!placed) return
  const pointerEvents = await page.getByTestId('domino-preview-tile').evaluate(el => {
    return window.getComputedStyle(el).pointerEvents
  })
  expect(pointerEvents).not.toBe('none')
})

test('tapping preview tile keeps preview visible', async ({ page }) => {
  const placed = await startAndShowPreview(page)
  if (!placed) return
  await page.getByTestId('domino-preview-tile').click()
  await expect(page.getByTestId('domino-preview-tile')).toHaveCount(1)
})

test('tapping preview tile changes its orientation class', async ({ page }) => {
  const placed = await startAndShowPreview(page)
  if (!placed) return
  const classBefore = await page.getByTestId('domino-preview-tile').getAttribute('class')
  await page.getByTestId('domino-preview-tile').click()
  const classAfter = await page.getByTestId('domino-preview-tile').getAttribute('class')
  expect(classAfter).not.toBe(classBefore)
})

test('tapping preview tile 8 times returns to original class', async ({ page }) => {
  const placed = await startAndShowPreview(page)
  if (!placed) return
  const classBefore = await page.getByTestId('domino-preview-tile').getAttribute('class')
  for (let i = 0; i < 8; i++) {
    await page.getByTestId('domino-preview-tile').click()
  }
  const classAfter = await page.getByTestId('domino-preview-tile').getAttribute('class')
  expect(classAfter).toBe(classBefore)
})

test('rotation 0 preview tile has horizontal class', async ({ page }) => {
  await startGame(page)
  const placed = await page.evaluate(() => {
    const state = window.gameState
    const hand = state.hands[state.players[state.turnIndex].id]
    const endpoints = state.board.endpoints
    for (let t = 0; t < hand.length; t++) {
      for (let e = 0; e < endpoints.length; e++) {
        if (window.validatePlacement(hand[t], endpoints[e], 0, state.board.tiles).valid) {
          return { tileId: hand[t].id, endpointIndex: e }
        }
      }
    }
    return null
  })
  if (!placed) return
  await page.locator('[data-tile-id="' + placed.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
  const cls = await page.getByTestId('domino-preview-tile').getAttribute('class')
  expect(cls).toContain('domino-tile-horizontal')
})

test('preview rotation updates turnState previewRotation', async ({ page }) => {
  const placed = await startAndShowPreview(page)
  if (!placed) return
  const rotBefore = await page.evaluate(() => window.turnState.previewRotation)
  await page.getByTestId('domino-preview-tile').click()
  const rotAfter = await page.evaluate(() => window.turnState.previewRotation)
  expect(rotAfter).not.toBe(rotBefore)
})
