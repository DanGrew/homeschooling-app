const { test, expect } = require('@playwright/test')

test('page loads with blue and green blocks on a grid', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/move-blocks/')
  await expect(page.getByText('Move the blue block to the green square!')).toBeVisible()
  await expect(page.locator('#grid .player')).toBeVisible()
  await expect(page.locator('#grid .target')).toBeVisible()
})

test('arrow keys move the player', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/move-blocks/')
  // Player at left edge, clear path to the right, target and obstacle far away
  await page.evaluate(() => { px = 0; py = 2; tx = 4; ty = 4; bx = 4; by = 0; render() })
  await page.keyboard.press('ArrowRight')
  const newX = await page.evaluate(() => px)
  expect(newX).toBe(1)
})

test('reaching the target shows the Well done banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/move-blocks/')
  // Player one step left of target, obstacle out of the way
  await page.evaluate(() => { px = 2; py = 2; tx = 3; ty = 2; bx = 0; by = 0; render() })
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 2000 })
})

test('arrow button tap moves the player', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/move-blocks/')
  await page.evaluate(() => { px = 0; py = 2; tx = 4; ty = 4; bx = 4; by = 0; render() })
  await page.locator('.arr[data-dx="1"]').click()
  const newX = await page.evaluate(() => px)
  expect(newX).toBe(1)
})

test('obstacle blocks movement', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/move-blocks/')
  // Obstacle directly to the right of player
  await page.evaluate(() => { px = 1; py = 2; tx = 4; ty = 4; bx = 2; by = 2; render() })
  await page.keyboard.press('ArrowRight')
  const newX = await page.evaluate(() => px)
  expect(newX).toBe(1)
})
