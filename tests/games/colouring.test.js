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
