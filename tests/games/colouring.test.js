const { test, expect } = require('@playwright/test')

test('page loads with a picture title and SVG', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring/')
  await expect(page.locator('#title')).not.toBeEmpty({ timeout: 5000 })
  await expect(page.locator('#svg')).toBeVisible()
})

test('clicking a shape colours it in', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring/')
  await expect(page.locator('#title')).not.toBeEmpty({ timeout: 5000 })
  const shape = page.locator('#svg [style*="cursor"]').first()
  const fillBefore = await shape.getAttribute('fill')
  await shape.click()
  await expect(shape).not.toHaveAttribute('fill', fillBefore)
})

test('banner slides up when all shapes coloured', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring/')
  await expect(page.locator('#title')).not.toBeEmpty({ timeout: 5000 })
  const shapes = page.locator('#svg [style*="cursor"]')
  const count = await shapes.count()
  for (let i = 0; i < count; i++) await shapes.nth(i).click()
  await expect(page.getByTestId('success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 2000 })
})

test('paginator bar is visible with prev and next buttons', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring/')
  await expect(page.locator('#title')).not.toBeEmpty({ timeout: 5000 })
  await expect(page.locator('#paginator-bar button', { hasText: 'Next' })).toBeVisible()
  await expect(page.locator('#paginator-bar button', { hasText: 'Prev' })).toBeVisible()
  await expect(page.locator('#paginator-bar span')).toContainText('Page 1 of')
})

test('next paginator button advances to next picture', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring/')
  await expect(page.locator('#title')).not.toBeEmpty({ timeout: 5000 })
  const titleBefore = await page.locator('#title').textContent()
  await page.locator('#paginator-bar button', { hasText: 'Next' }).click()
  await expect(page.locator('#title')).not.toHaveText(titleBefore)
})

test('next button on banner advances to next picture and hides banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring/')
  await expect(page.locator('#title')).not.toBeEmpty({ timeout: 5000 })
  const titleBefore = await page.locator('#title').textContent()
  const shapes = page.locator('#svg [style*="cursor"]')
  const count = await shapes.count()
  for (let i = 0; i < count; i++) await shapes.nth(i).click()
  await expect(page.getByTestId('success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 2000 })
  await page.getByRole('button', { name: /Next/ }).click()
  await expect(page.getByTestId('success-banner')).not.toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 2000 })
  expect(await page.locator('#title').textContent()).not.toBe(titleBefore)
})
