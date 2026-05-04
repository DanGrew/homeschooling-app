const { test, expect } = require('@playwright/test')

test('page loads with a title and dots', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/drawing-dots/')
  await expect(page.locator('#dot0')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.game-title')).toBeVisible()
})

test('tapping a dot selects it', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/drawing-dots/')
  await expect(page.locator('#dot0')).toBeVisible({ timeout: 5000 })
  await page.evaluate(() => tap(0))
  await expect(page.locator('#dot0 circle')).toHaveAttribute('fill', '#F39C12')
})

test('level filter row appears', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/drawing-dots/')
  await expect(page.locator('#dot0')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('button[data-level="1"]')).toBeVisible()
  await expect(page.locator('button[data-level="2"]')).toBeVisible()
})

test('connecting all edges shows Well done', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/drawing-dots/')
  await expect(page.locator('#dot0')).toBeVisible({ timeout: 5000 })
  const edges = await page.evaluate(() => filtered[shapeIdx].edges)
  for (const [a, b] of edges) {
    await page.evaluate((i) => { selectedDot = null; tap(i) }, a)
    await page.evaluate((i) => tap(i), b)
  }
  await expect(page.locator('#dd-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 3000 })
})

test('connecting non-adjacent dots triggers dot-wrong flash', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/drawing-dots/')
  await expect(page.locator('#dot0')).toBeVisible({ timeout: 5000 })
  const pair = await page.evaluate(() => {
    const n = filtered[shapeIdx].dots.length
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (i !== j && adj[i].indexOf(j) < 0) return { from: i, to: j }
    return null
  })
  await page.evaluate((i) => tap(i), pair.from)
  await page.evaluate((i) => tap(i), pair.to)
  await expect(page.locator(`#dot${pair.to} circle`)).toHaveClass(/dot-wrong/)
})

test('home nav button points to games index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/drawing-dots/')
  const href = await page.locator('.nav-btn').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/games/')
})
