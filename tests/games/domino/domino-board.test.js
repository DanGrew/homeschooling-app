const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/domino/'

async function startGame(page) {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('domino-start-btn').click()
  await page.getByTestId('domino-handover-ready').click()
}

test('board viewport visible after game starts', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-board-viewport')).toBeVisible()
})

test('setup screen hidden after game starts', async ({ page }) => {
  await startGame(page)
  await expect(page.locator('#domino-setup')).toBeHidden()
})

test('board world rendered inside viewport', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-board-world')).toBeAttached()
})

test('starting tile rendered on board', async ({ page }) => {
  await startGame(page)
  await expect(page.locator('[data-testid^="domino-tile-"]').first()).toBeAttached()
})

test('two endpoint markers rendered', async ({ page }) => {
  await startGame(page)
  await expect(page.getByTestId('domino-endpoint')).toHaveCount(2)
})

test('board world has a transform applied', async ({ page }) => {
  await startGame(page)
  const transform = await page.getByTestId('domino-board-world').evaluate(function(el) {
    return el.style.transform
  })
  expect(transform).toMatch(/translate/)
})

test('pan moves the board world', async ({ page }) => {
  await startGame(page)
  const viewport = page.getByTestId('domino-board-viewport')
  const box = await viewport.boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  const before = await page.getByTestId('domino-board-world').evaluate(function(el) {
    return el.style.transform
  })

  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 80, cy + 60)
  await page.mouse.up()

  const after = await page.getByTestId('domino-board-world').evaluate(function(el) {
    return el.style.transform
  })

  expect(after).not.toBe(before)
})

test('zoom in button increases scale', async ({ page }) => {
  await startGame(page)
  const before = await page.getByTestId('domino-board-world').evaluate(el => el.style.transform)
  await page.getByTestId('domino-zoom-in').click()
  const after = await page.getByTestId('domino-board-world').evaluate(el => el.style.transform)
  expect(after).not.toBe(before)
  expect(after).toMatch(/scale\(2\.25\)/)
})

test('zoom out button decreases scale', async ({ page }) => {
  await startGame(page)
  await page.getByTestId('domino-zoom-out').click()
  const transform = await page.getByTestId('domino-board-world').evaluate(el => el.style.transform)
  expect(transform).toMatch(/scale\(1\.75\)/)
})
