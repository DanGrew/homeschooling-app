const { test, expect } = require('@playwright/test')

test('notification appears top-right on trigger', async ({ page }) => {
  await page.goto('/homeschooling-app/app/test-harness/learning-moment.html')
  await page.click('#trigger')
  const el = page.locator('[data-testid="learning-moment"]')
  await expect(el).toBeVisible()
  const box = await el.boundingBox()
  const viewport = page.viewportSize()
  expect(box.x + box.width).toBeGreaterThan(viewport.width * 0.5)
})

test('message text visible after trigger', async ({ page }) => {
  await page.goto('/homeschooling-app/app/test-harness/learning-moment.html')
  await page.click('#trigger')
  await expect(page.locator('[data-testid="learning-moment-msg"]')).toHaveText('You made orange!')
})

test('notification absent after 2 seconds', async ({ page }) => {
  await page.goto('/homeschooling-app/app/test-harness/learning-moment.html')
  await page.click('#trigger')
  await expect(page.locator('[data-testid="learning-moment"]')).toBeVisible()
  await page.waitForTimeout(2500)
  const el = page.locator('[data-testid="learning-moment"]')
  const opacity = await el.evaluate(node => node.style.opacity)
  expect(opacity).toBe('0')
})
