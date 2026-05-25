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

test('rapid successive calls show only one notification — latest message wins', async ({ page }) => {
  await page.goto('/homeschooling-app/app/test-harness/learning-moment.html')
  await page.evaluate(() => {
    window._showLearningMoment('First')
    window._showLearningMoment('Second')
    window._showLearningMoment('Third')
  })
  await expect(page.locator('[data-testid="learning-moment-msg"]')).toHaveText('Third')
  expect(await page.locator('[data-testid="learning-moment"]').count()).toBe(1)
})

test('notification replaced mid-display when new call arrives', async ({ page }) => {
  await page.goto('/homeschooling-app/app/test-harness/learning-moment.html')
  await page.evaluate(() => window._showLearningMoment('First'))
  await expect(page.locator('[data-testid="learning-moment-msg"]')).toHaveText('First')
  await page.evaluate(() => window._showLearningMoment('Second'))
  await expect(page.locator('[data-testid="learning-moment-msg"]')).toHaveText('Second')
})

test('recordLearningEvent with moment shows notification', async ({ page }) => {
  await page.goto('/homeschooling-app/app/test-harness/learning-moment.html')
  await page.evaluate(() => window._recordLearningEvent(
    { version: 1, type: 'learning_completed', timestamp: Date.now(), learning_id: 'test', activity_id: 'test' },
    'You solved the puzzle!'
  ))
  await expect(page.locator('[data-testid="learning-moment-msg"]')).toHaveText('You solved the puzzle!')
})

test('recordLearningEvent without moment shows default notification', async ({ page }) => {
  await page.goto('/homeschooling-app/app/test-harness/learning-moment.html')
  await page.evaluate(() => window._recordLearningEvent(
    { version: 1, type: 'learning_completed', timestamp: Date.now(), learning_id: 'test', activity_id: 'test' }
  ))
  await expect(page.locator('[data-testid="learning-moment-msg"]')).toHaveText('Learning Moment! - Well Done!')
})
