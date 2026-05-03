const { test, expect } = require('@playwright/test')

test('page loads with a title and shape options', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-shape/')
  await expect(page.getByText('Match the shape!')).toBeVisible()
  await expect(page.locator('#shape svg')).toBeVisible()
  await expect(page.locator('#options button').first()).toBeVisible()
})

test('correct shape shows success banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-shape/')
  const correctType = await page.evaluate(() => current.type)
  await page.locator(`#options button[data-type="${correctType}"]`).click()
  await expect(page.locator(`#options button[data-type="${correctType}"]`)).toHaveClass(/feedback-correct/)
  await expect(page.locator('#success-banner')).toBeVisible()
})

test('tapping Next on banner starts a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-shape/')
  const correctType = await page.evaluate(() => current.type)
  await page.locator(`#options button[data-type="${correctType}"]`).click()
  await page.locator('#success-next').click()
  await expect(page.locator('#options button').first()).toBeVisible()
})

test('wrong shape shows red outline then clears', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/match-shape/')
  const correctType = await page.evaluate(() => current.type)
  const wrongButton = page.locator(`#options button:not([data-type="${correctType}"])`).first()
  await wrongButton.click()
  await expect(wrongButton).toHaveClass(/feedback-wrong/)
  await expect(wrongButton).not.toHaveClass(/feedback-wrong/, { timeout: 1000 })
})
