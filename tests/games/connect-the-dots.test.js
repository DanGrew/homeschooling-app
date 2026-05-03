const { test, expect } = require('@playwright/test')

test('page loads with a title and numbered dots', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#title')).not.toBeEmpty({ timeout: 5000 })
  await expect(page.locator('.game-title')).toBeVisible()
  await expect(page.locator('#c1')).toBeVisible()
})

test('clicking dot 1 turns it green', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#c1')).toBeVisible({ timeout: 5000 })
  // The number text sits on top of the circle and intercepts clicks — force bypasses that
  await page.locator('#c1').click({ force: true })
  await expect(page.locator('#c1')).toHaveAttribute('fill', '#2ECC71')
})

test('level filter row appears', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#c1')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('button[data-level="1"]')).toBeVisible()
})

test('clicking all dots in order shows Well done', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#c1')).toBeVisible({ timeout: 5000 })
  const dotCount = await page.evaluate(() => filtered[filtIdx].dots.length)
  for (let n = 1; n <= dotCount; n++) {
    await page.evaluate((dot) => tap(dot), n)
  }
  await expect(page.locator('#success-banner')).toBeVisible()
})

test('home nav button points to games index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  const href = await page.locator('.nav-btn').first().getAttribute('href')
  expect(href).toBe('/homeschooling-app/app/games/')
})
