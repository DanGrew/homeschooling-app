const { test, expect } = require('@playwright/test')

test('page loads with ball and first character label', async ({ page }) => {
  await page.goto('/app/games/character-trace')
  await expect(page.locator('#ball')).toBeVisible()
  await expect(page.locator('#char-label')).not.toBeEmpty()
})

test('filter buttons switch character set', async ({ page }) => {
  await page.goto('/app/games/character-trace')

  await page.getByRole('button', { name: 'A–Z', exact: true }).click()
  const label = await page.locator('#char-label').textContent()
  expect(label).toMatch(/[A-Z]/)

  await page.getByRole('button', { name: '0–9', exact: true }).click()
  const label2 = await page.locator('#char-label').textContent()
  expect(label2).toMatch(/[0-9]/)
})

test('next button advances character', async ({ page }) => {
  await page.goto('/app/games/character-trace?char=a&filter=lower')
  const first = await page.locator('#char-label').textContent()
  await page.locator('#btn-next').click()
  const second = await page.locator('#char-label').textContent()
  expect(second).not.toBe(first)
})

test('prev button goes back', async ({ page }) => {
  await page.goto('/app/games/character-trace?char=b&filter=lower')
  await page.locator('#btn-prev').click()
  const label = await page.locator('#char-label').textContent()
  expect(label).toBe('a')
})

test('URL params set initial character and filter', async ({ page }) => {
  await page.goto('/app/games/character-trace?char=m&filter=lower')
  const label = await page.locator('#char-label').textContent()
  expect(label).toBe('m')
  await expect(page.getByRole('button', { name: 'a–z', exact: true })).toHaveClass(/active/)
})

test('success banner hidden on load', async ({ page }) => {
  await page.goto('/app/games/character-trace')
  await expect(page.locator('#success-banner')).not.toHaveClass(/visible/)
})

test('ball positioned at path start on load', async ({ page }) => {
  await page.goto('/app/games/character-trace?char=a&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)

  const { ballX, ballY, startX, startY } = await page.evaluate(() => {
    const ball = document.getElementById('ball')
    const start = engine.strokes[0].mp.getPointAtLength(0)
    return {
      ballX: parseFloat(ball.getAttribute('cx')),
      ballY: parseFloat(ball.getAttribute('cy')),
      startX: start.x,
      startY: start.y
    }
  })
  expect(Math.abs(ballX - startX)).toBeLessThan(1)
  expect(Math.abs(ballY - startY)).toBeLessThan(1)
})


test('navigating to new char resets engine', async ({ page }) => {
  await page.goto('/app/games/character-trace?char=a&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-next').click()
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  const dist = await page.evaluate(() => engine.currentDist)
  expect(dist).toBe(0)
})
