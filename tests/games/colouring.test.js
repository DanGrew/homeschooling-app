const { test, expect } = require('@playwright/test')

test('page loads with a picture title and SVG', async ({ page }) => {
  await page.goto('/app/games/colouring.html')
  await expect(page.locator('#svg')).toBeVisible()
  await expect(page.locator('#title')).not.toBeEmpty()
})

test('clicking a shape colours it in', async ({ page }) => {
  await page.goto('/app/games/colouring.html')
  // Colourable shapes have cursor:pointer; noColour shapes don't and have no click handler
  const shape = page.locator('#svg [style*="cursor"]').first()
  const fillBefore = await shape.getAttribute('fill')
  await shape.click()
  await expect(shape).not.toHaveAttribute('fill', fillBefore)
})
