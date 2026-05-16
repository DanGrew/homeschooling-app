const { test, expect } = require('@playwright/test')

test('page loads with a title and numbered dots', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#title')).not.toBeEmpty({ timeout: 5000 })
  await expect(page.locator('.picture-title')).toBeVisible()
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
  const dotCount = await page.locator('#svg circle[id^="c"]').count()
  for (let n = 1; n <= dotCount; n++) {
    await page.locator('#c' + n).click({ force: true })
  }
  await expect(page.getByTestId('success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 2000 })
})

test('tapping a dot out of order triggers wrong-flash', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#c1')).toBeVisible({ timeout: 5000 })
  await page.locator('#c2').click({ force: true })
  await expect(page.locator('#c2')).toHaveClass(/wrong-flash/)
  await expect(page.locator('#c2')).not.toHaveAttribute('fill', '#2ECC71')
})

test('tapping dot 1 does not wrong-flash', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#c1')).toBeVisible({ timeout: 5000 })
  await page.locator('#c1').click({ force: true })
  const cls = await page.locator('#c1').getAttribute('class')
  expect(cls || '').not.toMatch(/wrong-flash/)
})

test('paginator bar is visible with prev and next buttons', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#c1')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('#paginator-bar button', { hasText: 'Next' })).toBeVisible()
  await expect(page.locator('#paginator-bar button', { hasText: 'Prev' })).toBeVisible()
  await expect(page.locator('#paginator-bar span')).toContainText('Page 1 of')
})

test('next paginator button advances to next shape', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  await expect(page.locator('#c1')).toBeVisible({ timeout: 5000 })
  const titleBefore = await page.locator('#title').textContent()
  await page.locator('#paginator-bar button', { hasText: 'Next' }).click()
  await expect(page.locator('#title')).not.toHaveText(titleBefore)
})

test('home nav button points to games index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/connect-the-dots/')
  const href = await page.locator('.nav-btn').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/games/')
})
