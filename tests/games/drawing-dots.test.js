const { test, expect } = require('@playwright/test')

test('page loads with a title and dots', async ({ page }) => {
  await page.goto('/app/games/drawing-dots-1.html')
  await expect(page.locator('.game-title')).toBeVisible()
  await expect(page.locator('#dot0')).toBeVisible()
})

test('tapping a dot selects it', async ({ page }) => {
  await page.goto('/app/games/drawing-dots-1.html')
  await page.evaluate(() => tap(0))
  await expect(page.locator('#dot0 circle')).toHaveAttribute('fill', '#F39C12')
})

test('connecting all edges shows Well done', async ({ page }) => {
  await page.goto('/app/games/drawing-dots-1.html')
  const edges = await page.evaluate(() => filtered[shapeIdx].edges)
  for (const [a, b] of edges) {
    await page.evaluate((i) => { selectedDot = null; tap(i) }, a)
    await page.evaluate((i) => tap(i), b)
  }
  // Banner slides up from off-screen when complete
  await expect(page.locator('#dd-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 3000 })
})
