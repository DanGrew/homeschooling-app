const { test, expect } = require('@playwright/test')

test('page loads with a title and shape options', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-shape/')
  await expect(page.getByText('Match the shape!')).toBeVisible()
  await expect(page.locator('#shape svg')).toBeVisible()
  await expect(page.locator('#options button').first()).toBeVisible()
})

test('correct shape advances to a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-shape/')
  const correctType = await page.evaluate(() => current.type)
  await page.locator(`#options button[data-type="${correctType}"]`).click()
  await expect(page.locator(`#options button[data-type="${correctType}"]`)).toHaveCSS('outline-style', 'solid')
})

test('wrong shape dims then recovers', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-shape/')
  const correctType = await page.evaluate(() => current.type)
  const wrongButton = page.locator(`#options button:not([data-type="${correctType}"])`).first()
  await wrongButton.click()
  await expect(wrongButton).toHaveCSS('opacity', '0.3')
  await expect(wrongButton).toHaveCSS('opacity', '1', { timeout: 1000 })
})
