const { test, expect } = require('@playwright/test')

const PLAY_URL = '/homeschooling-app/app/activities/puzzle/play.html?puzzle=paw-patrol&grid=4x3'

async function completePuzzle(page) {
  await page.goto(PLAY_URL)
  await page.waitForSelector('#tray-bar [data-piece-id]')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  for (const p of pieces) {
    await page.locator(`#tray-${p.id}`).click()
    await page.locator(`[data-row="${p.correct.row}"][data-col="${p.correct.col}"]`).click()
  }
  return pieces
}

const bannerShown = (page) =>
  expect(page.locator('#success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')

const slotHasPiece = (page) =>
  expect(page.locator('#selected-slot')).not.toHaveCSS('background-image', 'none')

const slotEmpty = (page) =>
  expect(page.locator('#selected-slot')).toHaveCSS('background-image', 'none')

test('page loads with grid and tray visible', async ({ page }) => {
  await page.goto(PLAY_URL)
  await expect(page.locator('#puzzle-grid')).toBeVisible()
  await expect(page.locator('#tray-bar')).toBeVisible()
  await expect(page.locator('#selected-slot')).toBeVisible()
})

test('grid has correct number of cells matching piece count', async ({ page }) => {
  await page.goto(PLAY_URL)
  await page.waitForSelector('[data-row][data-col]')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  await expect(page.locator('[data-row][data-col]')).toHaveCount(pieces.length)
})

test('tray has all pieces on load', async ({ page }) => {
  await page.goto(PLAY_URL)
  await page.waitForSelector('#tray-bar [data-piece-id]')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  await expect(page.locator('#tray-bar [data-piece-id]')).toHaveCount(pieces.length)
})

test('tray tiles render with background image', async ({ page }) => {
  await page.goto(PLAY_URL)
  await page.waitForSelector('#tray-bar [data-piece-id]')
  await expect(page.locator('#tray-bar [data-piece-id]').first()).not.toHaveCSS('background-image', 'none')
})

test('selecting a tray tile shows it in the selected slot', async ({ page }) => {
  await page.goto(PLAY_URL)
  await page.waitForSelector('#tray-bar [data-piece-id]')
  await page.locator('#tray-bar [data-piece-id]').first().click()
  await slotHasPiece(page)
})

test('selecting a tray tile highlights it', async ({ page }) => {
  await page.goto(PLAY_URL)
  await page.waitForSelector('#tray-bar [data-piece-id]')
  const tile = page.locator('#tray-bar [data-piece-id]').first()
  await tile.click()
  const border = await tile.evaluate(el => el.style.borderColor)
  expect(border).not.toBe('transparent')
})

test('placing a tile removes it from tray view', async ({ page }) => {
  await page.goto(PLAY_URL)
  await page.waitForSelector('#tray-bar [data-piece-id]')
  const tile = page.locator('#tray-bar [data-piece-id]').first()
  const pieceId = await tile.getAttribute('id')
  await tile.click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await expect(page.locator(`#${pieceId}`)).not.toBeVisible()
})

test('placing a tile sets background image on cell', async ({ page }) => {
  await page.goto(PLAY_URL)
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  const p = pieces.find(p => p.correct.row === 0 && p.correct.col === 0)
  await page.locator(`#tray-${p.id}`).click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await expect(page.locator('[data-row="0"][data-col="0"]')).not.toHaveCSS('background-image', 'none')
})

test('correct placement gives feedback-correct class', async ({ page }) => {
  await page.goto(PLAY_URL)
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  const p = pieces.find(p => p.correct.row === 0 && p.correct.col === 0)
  await page.locator(`#tray-${p.id}`).click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await expect(page.locator('[data-row="0"][data-col="0"]')).toHaveClass(/feedback-correct/)
})

test('wrong placement gives feedback-wrong class', async ({ page }) => {
  await page.goto(PLAY_URL)
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  const p = pieces.find(p => !(p.correct.row === 0 && p.correct.col === 0))
  await page.locator(`#tray-${p.id}`).click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await expect(page.locator('[data-row="0"][data-col="0"]')).toHaveClass(/feedback-wrong/)
})

test('tapping empty cell with nothing selected does nothing', async ({ page }) => {
  await page.goto(PLAY_URL)
  await page.locator('[data-row="1"][data-col="1"]').click()
  await expect(page.locator('[data-row="1"][data-col="1"]')).toHaveCSS('background-image', 'none')
})

test('tapping placed tile lifts it back to selected slot', async ({ page }) => {
  await page.goto(PLAY_URL)
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  const p = pieces.find(p => p.correct.row === 1 && p.correct.col === 1)
  await page.locator(`#tray-${p.id}`).click()
  await page.locator('[data-row="1"][data-col="1"]').click()
  await page.locator('[data-row="1"][data-col="1"]').click()
  await slotHasPiece(page)
  await expect(page.locator(`#tray-${p.id}`)).toBeVisible()
})

test('completing puzzle shows success banner', async ({ page }) => {
  await completePuzzle(page)
  await bannerShown(page)
})

test('cells are locked after completion — placed tile cannot be lifted', async ({ page }) => {
  const pieces = await completePuzzle(page)
  await bannerShown(page)
  const p = pieces[0]
  await page.locator(`[data-row="${p.correct.row}"][data-col="${p.correct.col}"]`).click()
  await slotEmpty(page)
})

test('guide toggle is disabled after completion', async ({ page }) => {
  await completePuzzle(page)
  await expect(page.locator('#ref-toggle')).toBeDisabled()
})

test('reference image reaches full opacity after reveal', async ({ page }) => {
  await completePuzzle(page)
  await expect(page.locator('#reference-img')).toHaveCSS('opacity', '1')
})

test('completion banner shows choose another button', async ({ page }) => {
  await completePuzzle(page)
  await bannerShown(page)
  await expect(page.locator('#success-banner button')).toContainText('Choose another')
})

test('clicking choose another navigates to chooser', async ({ page }) => {
  await completePuzzle(page)
  await bannerShown(page)
  await page.locator('#success-banner button').click()
  await page.waitForSelector('.puzzle-card')
  await expect(page.locator('.puzzle-card').first()).toBeVisible()
})
