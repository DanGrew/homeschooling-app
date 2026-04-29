const { test, expect } = require('@playwright/test')

test('page loads with a title and answer buttons', async ({ page }) => {
  await page.goto('/app/games/count-shapes.html')
  await expect(page.getByText('How many?')).toBeVisible()
  await expect(page.getByRole('button', { name: '1' })).toBeVisible()
  await expect(page.getByRole('button', { name: '5' })).toBeVisible()
})

test('shapes are shown on the board', async ({ page }) => {
  await page.goto('/app/games/count-shapes.html')
  const shapeCount = await page.evaluate(() => count)
  await expect(page.locator('#shapes svg')).toHaveCount(shapeCount)
})

test('correct answer turns green and moves to a new round', async ({ page }) => {
  await page.goto('/app/games/count-shapes.html')

  const shapeCount = await page.evaluate(() => count)
  const correctButton = page.getByRole('button', { name: String(shapeCount) })

  await correctButton.click()
  await expect(correctButton).toHaveCSS('background-color', 'rgb(46, 204, 113)') // green

  // After a moment, a new round starts
  await expect(page.locator('#shapes svg').first()).toBeVisible({ timeout: 2000 })
})

test('wrong answer turns red then resets', async ({ page }) => {
  await page.goto('/app/games/count-shapes.html')

  const shapeCount = await page.evaluate(() => count)
  const wrongAnswer = shapeCount === 1 ? '2' : '1'
  const wrongButton = page.getByRole('button', { name: wrongAnswer })

  await wrongButton.click()
  await expect(wrongButton).toHaveCSS('background-color', 'rgb(231, 76, 60)') // red

  // Resets back to grey
  await expect(wrongButton).toHaveCSS('background-color', 'rgb(232, 232, 232)', { timeout: 2000 })
})
