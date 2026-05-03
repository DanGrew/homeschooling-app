const { test, expect } = require('@playwright/test')

test('page loads with a title and options', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour-shape/')
  await expect(page.getByText('Match the colour and shape!')).toBeVisible()
  await expect(page.locator('#shape svg')).toBeVisible()
  await expect(page.locator('#options button').first()).toBeVisible()
})

test('correct option advances to a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour-shape/')
  const { col, type } = await page.evaluate(() => ({ col: current.col, type: current.type }))
  await page.locator(`#options button[data-col="${col}"][data-type="${type}"]`).click()
  await expect(
    page.locator(`#options button[data-col="${col}"][data-type="${type}"]`)
  ).toHaveCSS('outline-style', 'solid')
})

test('wrong option dims then recovers', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour-shape/')
  const col = await page.evaluate(() => current.col)
  const wrongButton = page.locator(`#options button:not([data-col="${col}"])`).first()
  await wrongButton.click()
  await expect(wrongButton).toHaveCSS('opacity', '0.3')
  await expect(wrongButton).toHaveCSS('opacity', '1', { timeout: 1000 })
})
