const { test, expect } = require('@playwright/test')

test('page loads with a title and answer buttons', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/count-shapes/')
  await expect(page.getByText('How many?')).toBeVisible()
  await expect(page.getByRole('button', { name: '1' })).toBeVisible()
  await expect(page.getByRole('button', { name: '5' })).toBeVisible()
})

test('shapes are shown on the board', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/count-shapes/')
  const shapeCount = await page.evaluate(() => count)
  await expect(page.locator('#shapes svg')).toHaveCount(shapeCount)
})

test('correct answer shows green outline and success banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/count-shapes/')

  const shapeCount = await page.evaluate(() => count)
  const correctButton = page.getByRole('button', { name: String(shapeCount) })

  await correctButton.click()
  await expect(correctButton).toHaveClass(/feedback-correct/)
  await expect(page.locator('#success-banner')).toBeVisible()
})

test('tapping Next on banner starts a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/count-shapes/')

  const shapeCount = await page.evaluate(() => count)
  await page.getByRole('button', { name: String(shapeCount) }).click()
  await page.locator('#success-next').click()

  await expect(page.locator('#shapes svg').first()).toBeVisible()
})

test('wrong answer shows red outline then resets', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/count-shapes/')

  const shapeCount = await page.evaluate(() => count)
  const wrongAnswer = shapeCount === 1 ? '2' : '1'
  const wrongButton = page.getByRole('button', { name: wrongAnswer })

  await wrongButton.click()
  await expect(wrongButton).toHaveClass(/feedback-wrong/)
  await expect(wrongButton).not.toHaveClass(/feedback-wrong/, { timeout: 2000 })
})
