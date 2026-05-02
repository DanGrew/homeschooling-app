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

// Multi-touch pointer ID tests
// setPointerCapture throws with synthetic pointerIds — stub it so engine logic is testable
async function setupMultiTouchTest(page) {
  await page.goto('/app/games/character-trace?char=a&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.evaluate(() => { document.getElementById('svg').setPointerCapture = () => {} })
}

async function ballScreenPos(page) {
  return page.evaluate(() => {
    const svg = document.getElementById('svg')
    const ball = document.getElementById('ball')
    const pt = svg.createSVGPoint()
    pt.x = parseFloat(ball.getAttribute('cx'))
    pt.y = parseFloat(ball.getAttribute('cy'))
    const s = pt.matrixTransform(svg.getScreenCTM())
    return { x: s.x, y: s.y }
  })
}

async function ptr(page, type, x, y, pointerId) {
  await page.evaluate(({ type, x, y, pointerId }) => {
    document.getElementById('svg').dispatchEvent(
      new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId })
    )
  }, { type, x, y, pointerId })
}

test('trace activates when primary finger touches ball', async ({ page }) => {
  await setupMultiTouchTest(page)
  const pos = await ballScreenPos(page)
  await ptr(page, 'pointerdown', pos.x, pos.y, 1)
  expect(await page.evaluate(() => engine.active)).toBe(true)
  expect(await page.evaluate(() => engine.activePointerId)).toBe(1)
})

test('second finger pointerup does not kill active trace', async ({ page }) => {
  await setupMultiTouchTest(page)
  const pos = await ballScreenPos(page)
  await ptr(page, 'pointerdown', pos.x, pos.y, 1)
  expect(await page.evaluate(() => engine.active)).toBe(true)

  await ptr(page, 'pointerup', pos.x + 60, pos.y + 60, 2)

  expect(await page.evaluate(() => engine.active)).toBe(true)
})

test('second finger pointercancel does not kill active trace', async ({ page }) => {
  await setupMultiTouchTest(page)
  const pos = await ballScreenPos(page)
  await ptr(page, 'pointerdown', pos.x, pos.y, 1)
  expect(await page.evaluate(() => engine.active)).toBe(true)

  await ptr(page, 'pointercancel', pos.x + 40, pos.y + 40, 2)

  expect(await page.evaluate(() => engine.active)).toBe(true)
})

test('second finger pointerdown while tracing does not reset', async ({ page }) => {
  await setupMultiTouchTest(page)
  const pos = await ballScreenPos(page)
  await ptr(page, 'pointerdown', pos.x, pos.y, 1)
  expect(await page.evaluate(() => engine.active)).toBe(true)

  await ptr(page, 'pointerdown', pos.x + 80, pos.y + 80, 2)

  expect(await page.evaluate(() => engine.active)).toBe(true)
  expect(await page.evaluate(() => engine.activePointerId)).toBe(1)
})

test('primary finger pointerup resets stroke', async ({ page }) => {
  await setupMultiTouchTest(page)
  const pos = await ballScreenPos(page)
  await ptr(page, 'pointerdown', pos.x, pos.y, 1)
  expect(await page.evaluate(() => engine.active)).toBe(true)

  await ptr(page, 'pointerup', pos.x, pos.y, 1)

  expect(await page.evaluate(() => engine.active)).toBe(false)
  expect(await page.evaluate(() => engine.activePointerId)).toBe(null)
})

test('primary finger pointercancel resets stroke', async ({ page }) => {
  await setupMultiTouchTest(page)
  const pos = await ballScreenPos(page)
  await ptr(page, 'pointerdown', pos.x, pos.y, 1)
  expect(await page.evaluate(() => engine.active)).toBe(true)

  await ptr(page, 'pointercancel', pos.x, pos.y, 1)

  expect(await page.evaluate(() => engine.active)).toBe(false)
})
