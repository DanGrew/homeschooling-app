const { test, expect } = require('@playwright/test')

test('page loads with grid and tray visible', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  await expect(page.locator('#puzzle-grid')).toBeVisible()
  await expect(page.locator('#tray-bar')).toBeVisible()
  await expect(page.locator('#selected-slot')).toBeVisible()
})

test('grid has correct number of cells', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  await expect(page.locator('[data-row][data-col]')).toHaveCount(9)
})

test('tray has all pieces on load', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
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

test('completing puzzle shows success banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  for (const p of pieces) {
    await page.locator(`#tray-${p.id}`).click()
    await page.locator(`[data-row="${p.correct.row}"][data-col="${p.correct.col}"]`).click()
  }
  await expect(page.locator('#success-banner')).toBeVisible({ timeout: 2000 })
})

test('reset after completion clears grid and restores tray', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/puzzle/')
  const pieces = await page.evaluate(() => window.__puzzleState.getPieces())
  for (const p of pieces) {
    await page.locator(`#tray-${p.id}`).click()
    await page.locator(`[data-row="${p.correct.row}"][data-col="${p.correct.col}"]`).click()
  }
  await page.locator('#success-banner button').click()
  await expect(page.locator('#tray-bar img')).toHaveCount(pieces.length)
  await expect(page.locator('.feedback-correct')).toHaveCount(0)
})
