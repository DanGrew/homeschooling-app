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

test('all three special brush buttons visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-glitter-btn"]')).toBeVisible()
  await expect(page.locator('[data-testid="paint-stamp-btn"]')).toBeVisible()
  await expect(page.locator('[data-testid="paint-rainbow-btn"]')).toBeVisible()
})

test('rainbow brush disables colour palette', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-rainbow-btn"]')
  const opacity = await page.locator('#paint-colour-slot').evaluate(el => el.style.opacity)
  expect(opacity).toBe('0.35')
})

test('switching from rainbow to pencil re-enables palette', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-rainbow-btn"]')
  await page.click('[data-testid="paint-pencil-btn"]')
  const opacity = await page.locator('#paint-colour-slot').evaluate(el => el.style.opacity)
  expect(opacity).toBe('1')
})

test('star stamp places pixels on tap', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-stamp-btn"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  await page.mouse.click(cx, cy)
  const hasPixels = await page.locator('[data-testid="paint-draw"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(hasPixels).toBe(true)
})

test('glitter brush produces pixels on drag', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-glitter-btn"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 50, cy + 30)
  await page.mouse.up()
  const hasPixels = await page.locator('[data-testid="paint-draw"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(hasPixels).toBe(true)
})

test('eraser button visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-eraser-btn"]')).toBeVisible()
})

test('undo button visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-undo-btn"]')).toBeVisible()
})

test('clear button visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-clear-btn"]')).toBeVisible()
})

test('undo reverts last pencil stroke', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-pencil-btn"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 60, cy)
  await page.mouse.up()
  await page.click('[data-testid="paint-undo-btn"]')
  const hasPixels = await page.locator('[data-testid="paint-draw"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(hasPixels).toBe(false)
})

test('eraser removes drawn pixels', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-pencil-btn"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 60, cy)
  await page.mouse.up()
  await page.click('[data-testid="paint-eraser-btn"]')
  await page.mouse.move(cx - 5, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 65, cy)
  await page.mouse.up()
  const hasPixels = await page.locator('[data-testid="paint-draw"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(hasPixels).toBe(false)
})

test('long-press clear wipes canvas', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-pencil-btn"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 60, cy)
  await page.mouse.up()
  await page.locator('[data-testid="paint-clear-btn"]').evaluate(function(el) {
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 99 }))
  })
  await page.waitForTimeout(900)
  await page.locator('[data-testid="paint-clear-btn"]').evaluate(function(el) {
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 99 }))
  })
  const hasPixels = await page.locator('[data-testid="paint-draw"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(hasPixels).toBe(false)
})

test('short press clear does not wipe canvas', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-pencil-btn"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 60, cy)
  await page.mouse.up()
  await page.click('[data-testid="paint-clear-btn"]')
  const hasPixels = await page.locator('[data-testid="paint-draw"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(hasPixels).toBe(true)
})

test('background button visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-bg-btn"]')).toBeVisible()
})

test('clicking background button opens panel', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-bg-panel"]')).toBeHidden()
  await page.click('[data-testid="paint-bg-btn"]')
  await expect(page.locator('[data-testid="paint-bg-panel"]')).toBeVisible()
})

test('close button hides background panel', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-bg-btn"]')
  await page.click('[data-testid="paint-bg-close-btn"]')
  await expect(page.locator('[data-testid="paint-bg-panel"]')).toBeHidden()
})

test('background panel shows tiles matching manifest', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-bg-btn"]')
  await page.waitForSelector('#paint-bg-grid img')
  const manifestCount = require('fs').existsSync('content/paint-playground/backgrounds.json')
    ? JSON.parse(require('fs').readFileSync('content/paint-playground/backgrounds.json', 'utf8')).length
    : 0
  const count = await page.locator('#paint-bg-grid img').count()
  expect(count).toBe(manifestCount)
})

test('selecting background renders pixels on bg canvas', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-bg-btn"]')
  await page.waitForLoadState('networkidle')
  await page.locator('#paint-bg-grid img').first().click()
  await page.waitForFunction(function() {
    var canvas = document.getElementById('paint-bg')
    var ctx = canvas.getContext('2d')
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true }
    return false
  })
  const hasPixels = await page.locator('[data-testid="paint-bg"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(hasPixels).toBe(true)
})

test('selecting background closes panel and preserves draw strokes', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-pencil-btn"]')
  const vpBox = await page.locator('#paint-viewport').boundingBox()
  const cx = vpBox.x + vpBox.width / 2
  const cy = vpBox.y + vpBox.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 60, cy)
  await page.mouse.up()
  await page.click('[data-testid="paint-bg-btn"]')
  await page.waitForSelector('#paint-bg-grid img')
  await page.locator('#paint-bg-grid img').first().click()
  await expect(page.locator('[data-testid="paint-bg-panel"]')).toBeHidden()
  const drawHasPixels = await page.locator('[data-testid="paint-draw"]').evaluate(function(canvas) {
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) return true; }
    return false;
  })
  expect(drawHasPixels).toBe(true)
})

test('three size buttons visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="paint-size-sm-btn"]')).toBeVisible()
  await expect(page.locator('[data-testid="paint-size-md-btn"]')).toBeVisible()
  await expect(page.locator('[data-testid="paint-size-lg-btn"]')).toBeVisible()
})

test('medium size active by default', async ({ page }) => {
  await page.goto(URL)
  const active = await page.locator('[data-testid="paint-size-md-btn"]').getAttribute('data-active')
  expect(active).not.toBeNull()
})

test('clicking large size activates it and deactivates medium', async ({ page }) => {
  await page.goto(URL)
  await page.click('[data-testid="paint-size-lg-btn"]')
  const lgActive = await page.locator('[data-testid="paint-size-lg-btn"]').getAttribute('data-active')
  const mdActive = await page.locator('[data-testid="paint-size-md-btn"]').getAttribute('data-active')
  expect(lgActive).not.toBeNull()
  expect(mdActive).toBeNull()
})
