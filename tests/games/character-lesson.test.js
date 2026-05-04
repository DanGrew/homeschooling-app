const { test, expect } = require('@playwright/test')

// --- shared navigation / filter tests (both modes) ---

test('page loads with ball and first character label', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/')
  await expect(page.locator('#ball')).toBeVisible()
  await expect(page.locator('#char-label')).not.toBeEmpty()
})

test('filter buttons switch character set', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/')
  await page.getByRole('button', { name: 'A–Z', exact: true }).click()
  const label = await page.locator('#char-label').textContent()
  expect(label).toMatch(/[A-Z]/)

  await page.getByRole('button', { name: '0–9', exact: true }).click()
  const label2 = await page.locator('#char-label').textContent()
  expect(label2).toMatch(/[0-9]/)
})

test('next button advances character', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower')
  const first = await page.locator('#char-label').textContent()
  await page.locator('#btn-next').click()
  const second = await page.locator('#char-label').textContent()
  expect(second).not.toBe(first)
})

test('prev button goes back', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=b&filter=lower')
  await expect(page.locator('#char-label')).toHaveText('b')
  await page.locator('#btn-prev').click()
  await expect(page.locator('#char-label')).toHaveText('a')
})

test('URL params set initial character and filter', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=m&filter=lower')
  await expect(page.locator('#char-label')).toHaveText('m')
  await expect(page.getByRole('button', { name: 'a–z', exact: true })).toHaveClass(/active/)
})

test('speak button is visible in both modes', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/')
  await expect(page.locator('#btn-speak')).toBeVisible()
  await page.goto('/homeschooling-app/app/activities/character-lesson/?mode=trace')
  await expect(page.locator('#btn-speak')).toBeVisible()
})

// --- lesson mode ---

test('defaults to lesson mode', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/')
  await expect(page.locator('#btn-trace')).toBeVisible()
  await expect(page.locator('#btn-tryit')).toBeVisible()
  await expect(page.locator('#btn-watch')).not.toBeVisible()
})

test('trace button is enabled on load', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower')
  await expect(page.locator('#btn-trace')).not.toBeDisabled()
})

test('trace button disables during animation', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-trace').click()
  await expect(page.locator('#btn-trace')).toBeDisabled()
})

test('try-it button disables during animation', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-trace').click()
  await expect(page.locator('#btn-tryit')).toBeDisabled()
})

test('try-it button re-enables after animation completes', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=l&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-trace').click()
  await expect(page.locator('#btn-tryit')).not.toBeDisabled({ timeout: 5000 })
})

test('trace button re-enables after animation completes', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=l&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-trace').click()
  await expect(page.locator('#btn-trace')).not.toBeDisabled({ timeout: 5000 })
})

// --- mode switching ---

test('try-it button switches to trace mode', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-tryit').click()
  await expect(page.locator('#btn-watch')).toBeVisible()
  await expect(page.locator('#btn-trace')).not.toBeVisible()
  await expect(page.locator('#btn-tryit')).not.toBeVisible()
})

test('watch button switches back to lesson mode', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower&mode=trace')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-watch').click()
  await expect(page.locator('#btn-trace')).toBeVisible()
  await expect(page.locator('#btn-tryit')).toBeVisible()
  await expect(page.locator('#btn-watch')).not.toBeVisible()
})

test('mode=trace param starts in trace mode', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?mode=trace')
  await expect(page.locator('#btn-watch')).toBeVisible()
  await expect(page.locator('#btn-trace')).not.toBeVisible()
})

// --- trace mode ---

test('success banner hidden on load in trace mode', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?mode=trace')
  await expect(page.locator('#success-banner')).not.toHaveClass(/visible/)
})

test('ball positioned at path start in trace mode', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower&mode=trace')
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

test('navigating to new char resets engine in trace mode', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower&mode=trace')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-next').click()
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  const dist = await page.evaluate(() => engine.currentDist)
  expect(dist).toBe(0)
})

// --- nav ---

test('home nav button points to lessons index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/')
  const href = await page.locator('.nav-btn').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/lessons/')
})

test('completing trace shows success banner directly for chars without a dot', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=a&filter=lower&mode=trace')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.evaluate(() => { engine.done = true; engine.onComplete() })
  await expect(page.locator('#success-banner')).toHaveClass(/visible/)
})

test('completing trace pulses the dot for chars with a dot', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=i&filter=lower&mode=trace')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.evaluate(() => { engine.done = true; engine.onComplete() })
  await expect(page.locator('.dot-pulse')).toBeVisible()
})

test('tapping pulsing dot after trace shows success banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=i&filter=lower&mode=trace')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.evaluate(() => { engine.done = true; engine.onComplete() })
  await page.waitForSelector('.dot-pulse')
  await page.evaluate(() => dotEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
  await expect(page.locator('#success-banner')).toHaveClass(/visible/)
})
