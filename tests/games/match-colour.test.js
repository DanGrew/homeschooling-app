const { test, expect } = require('@playwright/test')

test('page loads with a title, a shape, and colour swatches', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour/')
  await expect(page.getByText('Match the colour!')).toBeVisible()
  await expect(page.locator('#shape svg')).toBeVisible()
  await expect(page.locator('#swatches button').first()).toBeVisible()
})

test('correct swatch shows success banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour/')

  const correctColour = await page.evaluate(() => current.col)
  await page.locator(`#swatches button[data-col="${correctColour}"]`).click()

  await expect(page.locator(`#swatches button[data-col="${correctColour}"]`)).toHaveClass(/feedback-correct/)
  await expect(page.getByTestId('success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 2000 })
})

test('tapping Next on banner starts a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour/')

  const correctColour = await page.evaluate(() => current.col)
  await page.locator(`#swatches button[data-col="${correctColour}"]`).click()
  await page.getByRole('button', { name: /Next/ }).click()

  await expect(page.locator('#swatches button').first()).toBeVisible()
})

test('wrong swatch shows red outline then clears', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour/')

  const correctColour = await page.evaluate(() => current.col)
  const wrongSwatch = page.locator(`#swatches button:not([data-col="${correctColour}"])`).first()

  await wrongSwatch.click()
  await expect(wrongSwatch).toHaveClass(/feedback-wrong/)
  await expect(wrongSwatch).not.toHaveClass(/feedback-wrong/, { timeout: 2000 })
})
