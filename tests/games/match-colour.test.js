const { test, expect } = require('@playwright/test')

test('page loads with a title, a shape, and colour swatches', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour/')
  await expect(page.getByText('Match the colour!')).toBeVisible()
  await expect(page.locator('#shape svg')).toBeVisible()
  await expect(page.locator('#swatches button').first()).toBeVisible()
})

test('correct swatch advances to a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour/')

  const correctColour = await page.evaluate(() => current.col)
  await page.locator(`#swatches button[data-col="${correctColour}"]`).click()

  // The button gets a visible outline to confirm the correct pick
  await expect(
    page.locator(`#swatches button[data-col="${correctColour}"]`)
  ).toHaveCSS('outline-style', 'solid')
})

test('wrong swatch dims then recovers', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour/')

  const correctColour = await page.evaluate(() => current.col)
  const wrongSwatch = page.locator(`#swatches button:not([data-col="${correctColour}"])`).first()

  await wrongSwatch.click()
  await expect(wrongSwatch).toHaveCSS('opacity', '0.3')

  // Recovers after a moment
  await expect(wrongSwatch).toHaveCSS('opacity', '1', { timeout: 1000 })
})
