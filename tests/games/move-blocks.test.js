const { test, expect } = require('@playwright/test')

test('page loads with blue and green blocks on a grid', async ({ page }) => {
  await page.goto('/app/games/move-blocks.html')
  await expect(page.getByText('Move the blue block to the green square!')).toBeVisible()
  await expect(page.locator('#grid .player')).toBeVisible()
  await expect(page.locator('#grid .target')).toBeVisible()
})

test('arrow keys move the player', async ({ page }) => {
  await page.goto('/app/games/move-blocks.html')
  // Player at left edge, clear path to the right, target and obstacle far away
  await page.evaluate(() => { px = 0; py = 2; tx = 4; ty = 4; bx = 4; by = 0; render() })
  await page.keyboard.press('ArrowRight')
  const newX = await page.evaluate(() => px)
  expect(newX).toBe(1)
})

test('reaching the target shows the Well done banner', async ({ page }) => {
  await page.goto('/app/games/move-blocks.html')
  // Player one step left of target, obstacle out of the way
  await page.evaluate(() => { px = 2; py = 2; tx = 3; ty = 2; bx = 0; by = 0; render() })
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#done')).toBeVisible()
})
