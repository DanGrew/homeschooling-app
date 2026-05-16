const { test, expect } = require('@playwright/test')

test('page loads with an SVG, a colour palette, and a reference image', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring-palette/')
  await expect(page.locator('#palette .swatch').first()).toBeVisible({ timeout: 5000 })
  await expect(page.locator('#svg')).toBeVisible()
  await expect(page.locator('#ref')).toBeVisible()
})

test('clicking a palette swatch selects it', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring-palette/')
  const swatch = page.locator('#palette .swatch').first()
  await swatch.waitFor({ timeout: 5000 })
  await swatch.click()
  await expect(swatch).toHaveClass(/selected/)
})

test('paginator bar is visible with prev and next buttons', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring-palette/')
  await page.locator('#palette .swatch').first().waitFor({ timeout: 5000 })
  await expect(page.locator('#paginator-bar button', { hasText: 'Next' })).toBeVisible()
  await expect(page.locator('#paginator-bar button', { hasText: 'Prev' })).toBeVisible()
  await expect(page.locator('#paginator-bar span')).toContainText('Page 1 of')
})

test('next button advances to next picture', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring-palette/')
  await page.locator('#palette .swatch').first().waitFor({ timeout: 5000 })
  const firstTitle = await page.locator('.picture-title span').textContent()
  await page.locator('#paginator-bar button', { hasText: 'Next' }).click()
  await expect(page.locator('.picture-title span')).not.toHaveText(firstTitle)
})

test('selecting a colour then clicking a shape applies that colour', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colouring-palette/')
  const swatch = page.locator('#palette .swatch').first()
  await swatch.waitFor({ timeout: 5000 })
  await swatch.click()
  const chosenColour = await swatch.getAttribute('data-colour')
  const shape = page.locator('#svg [style*="cursor"]').first()
  await shape.click()
  await expect(shape).toHaveAttribute('fill', chosenColour)
})
