const { test, expect } = require('@playwright/test')

test('page loads with a title and options', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour-shape/')
  await expect(page.getByText('Match the colour and shape!')).toBeVisible()
  await expect(page.locator('#shape svg')).toBeVisible()
  await expect(page.locator('#options button').first()).toBeVisible()
})

test('correct option shows success banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour-shape/')
  const { col, type } = await page.evaluate(() => ({ col: current.col, type: current.type }))
  await page.locator(`#options button[data-col="${col}"][data-type="${type}"]`).click()
  await expect(page.locator(`#options button[data-col="${col}"][data-type="${type}"]`)).toHaveClass(/feedback-correct/)
  await expect(page.locator('#success-banner')).toBeVisible()
})

test('tapping Next on banner starts a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour-shape/')
  const { col, type } = await page.evaluate(() => ({ col: current.col, type: current.type }))
  await page.locator(`#options button[data-col="${col}"][data-type="${type}"]`).click()
  await page.locator('#success-next').click()
  await expect(page.locator('#options button').first()).toBeVisible()
})

test('wrong option shows red outline then clears', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-colour-shape/')
  const col = await page.evaluate(() => current.col)
  const wrongButton = page.locator(`#options button:not([data-col="${col}"])`).first()
  await wrongButton.click()
  await expect(wrongButton).toHaveClass(/feedback-wrong/)
  await expect(wrongButton).not.toHaveClass(/feedback-wrong/, { timeout: 1000 })
})
