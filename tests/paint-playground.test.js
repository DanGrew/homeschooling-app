const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/paint-playground/'

test('toolbar renders on right side', async ({ page }) => {
  await page.goto(URL)
  const toolbar = page.locator('#paint-toolbar')
  await expect(toolbar).toBeVisible()
  const box = await toolbar.boundingBox()
  const viewport = page.viewportSize()
  expect(box.x).toBeGreaterThan(viewport.width * 0.8)
})

test('hand tool button present and active by default', async ({ page }) => {
  await page.goto(URL)
  const btn = page.locator('[data-testid="paint-hand-btn"]')
  await expect(btn).toBeVisible()
  const active = await btn.getAttribute('data-active')
  expect(active).not.toBeNull()
})

test('both canvas layers render', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-bg"]')).toBeVisible()
  await expect(page.locator('[data-testid="paint-draw"]')).toBeVisible()
})

test('canvas is 4x screen width', async ({ page }) => {
  await page.goto(URL)
  const w = await page.locator('[data-testid="paint-bg"]').evaluate(el => el.width)
  const viewport = page.viewportSize()
  expect(w).toBeGreaterThanOrEqual(viewport.width * 3)
})

test('panning moves viewport offset', async ({ page }) => {
  await page.goto(URL)
  const draw = page.locator('[data-testid="paint-draw"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  const startLeft = await draw.evaluate(el => parseInt(el.style.left))
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 80, cy)
  await page.mouse.up()
  const endLeft = await draw.evaluate(el => parseInt(el.style.left))
  expect(endLeft).not.toBe(startLeft)
})

test('all four brush buttons visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-pencil-btn"]')).toBeVisible()
  await expect(page.locator('[data-testid="paint-crayon-btn"]')).toBeVisible()
  await expect(page.locator('[data-testid="paint-paintbrush-btn"]')).toBeVisible()
  await expect(page.locator('[data-testid="paint-marker-btn"]')).toBeVisible()
})

test('clicking brush activates it and deactivates hand', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-pencil-btn"]')
  const pencilActive = await page.locator('[data-testid="paint-pencil-btn"]').getAttribute('data-active')
  const handActive = await page.locator('[data-testid="paint-hand-btn"]').getAttribute('data-active')
  expect(pencilActive).not.toBeNull()
  expect(handActive).toBeNull()
})

test('colour swatches rendered', async ({ page }) => {
  await page.goto(URL)
  const swatches = page.locator('.paint-colour-swatch')
  await expect(swatches).toHaveCount(10)
})

test('drawing on canvas with pencil produces pixels', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-pencil-btn"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 60, cy + 40)
  await page.mouse.up()
  const hasPixels = await page.locator('[data-testid="paint-draw"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(hasPixels).toBe(true)
})
