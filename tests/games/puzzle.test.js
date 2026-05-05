const { test, expect } = require('@playwright/test')

async function completePuzzle(page) {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  await page.waitForSelector('#tray-bar img')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  for (const p of pieces) {
    await page.locator(`#tray-${p.id}`).click()
    await page.locator(`[data-row="${p.correct.row}"][data-col="${p.correct.col}"]`).click()
  }
  return pieces
}

test('page loads with grid and tray visible', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  await expect(page.locator('#puzzle-grid')).toBeVisible()
  await expect(page.locator('#tray-bar')).toBeVisible()
  await expect(page.locator('#selected-slot')).toBeVisible()
})

test('grid has correct number of cells matching piece count', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  await page.waitForSelector('[data-row][data-col]')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  await expect(page.locator('[data-row][data-col]')).toHaveCount(pieces.length)
})

test('tray has all pieces on load', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  await page.waitForSelector('#tray-bar img')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  await expect(page.locator('#tray-bar img')).toHaveCount(pieces.length)
})

test('selecting a tray tile shows it in the selected slot', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  await page.locator('#tray-bar img').first().click()
  await expect(page.locator('#selected-slot img')).toBeVisible()
})

test('selecting a tray tile highlights it', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  const tile = page.locator('#tray-bar img').first()
  await tile.click()
  const border = await tile.evaluate(el => el.style.borderColor)
  expect(border).not.toBe('transparent')
})

test('placing a tile removes it from tray view', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  const tile = page.locator('#tray-bar img').first()
  const pieceId = await tile.getAttribute('id')
  await tile.click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await expect(page.locator(`#${pieceId}`)).not.toBeVisible()
})

test('correct placement gives feedback-correct class', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  const p = pieces.find(p => p.correct.row === 0 && p.correct.col === 0)
  await page.locator(`#tray-${p.id}`).click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await expect(page.locator('[data-row="0"][data-col="0"]')).toHaveClass(/feedback-correct/)
})

test('wrong placement gives feedback-wrong class', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  const p = pieces.find(p => !(p.correct.row === 0 && p.correct.col === 0))
  await page.locator(`#tray-${p.id}`).click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await expect(page.locator('[data-row="0"][data-col="0"]')).toHaveClass(/feedback-wrong/)
})

test('tapping empty cell with nothing selected does nothing', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  await page.locator('[data-row="1"][data-col="1"]').click()
  await expect(page.locator('[data-row="1"][data-col="1"] img')).toHaveCount(0)
})

test('tapping placed tile lifts it back to selected slot', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  const p = pieces.find(p => p.correct.row === 1 && p.correct.col === 1)
  await page.locator(`#tray-${p.id}`).click()
  await page.locator('[data-row="1"][data-col="1"]').click()
  await page.locator('[data-row="1"][data-col="1"]').click()
  await expect(page.locator('#selected-slot img')).toBeVisible()
  await expect(page.locator(`#tray-${p.id}`)).toBeVisible()
})

const bannerShown = (page) =>
  expect(page.locator('#success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')

test('completing puzzle shows success banner', async ({ page }) => {
  await completePuzzle(page)
  await bannerShown(page)
})

test('cells are locked after completion — placed tile cannot be lifted', async ({ page }) => {
  const pieces = await completePuzzle(page)
  await bannerShown(page)
  const p = pieces[0]
  await page.locator(`[data-row="${p.correct.row}"][data-col="${p.correct.col}"]`).click()
  await expect(page.locator('#selected-slot img')).toHaveCount(0)
})

test('guide toggle is disabled after completion', async ({ page }) => {
  await completePuzzle(page)
  await expect(page.locator('#ref-toggle')).toBeDisabled()
})

test('reference image reaches full opacity after reveal', async ({ page }) => {
  await completePuzzle(page)
  await expect(page.locator('#reference-img')).toHaveCSS('opacity', '1')
})

test('reset after completion clears grid and restores tray', async ({ page }) => {
  await completePuzzle(page)
  await bannerShown(page)
  await page.locator('#success-banner button').click()
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  await expect(page.locator('#tray-bar img')).toHaveCount(pieces.length)
  await expect(page.locator('.feedback-correct')).toHaveCount(0)
})

test('guide toggle re-enabled after reset', async ({ page }) => {
  await completePuzzle(page)
  await bannerShown(page)
  await page.locator('#success-banner button').click()
  await expect(page.locator('#ref-toggle')).not.toBeDisabled()
})

test('puzzle unlocks after reset — piece can be lifted', async ({ page }) => {
  await completePuzzle(page)
  await bannerShown(page)
  await page.locator('#success-banner button').click()
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  const p = pieces.find(p => p.correct.row === 0 && p.correct.col === 0)
  await page.locator(`#tray-${p.id}`).click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await page.locator('[data-row="0"][data-col="0"]').click()
  await expect(page.locator('#selected-slot img')).toBeVisible()
})
