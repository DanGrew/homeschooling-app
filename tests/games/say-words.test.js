const { test, expect } = require('@playwright/test')

test('page loads with a shape and word label', async ({ page }) => {
  await page.goto('/app/games/say-words.html')
  await expect(page.getByText('What is this?')).toBeVisible()
  await expect(page.locator('#shape svg')).toBeVisible()
  await expect(page.locator('#label')).not.toBeEmpty()
})

test('Next button cycles to the next word', async ({ page }) => {
  await page.goto('/app/games/say-words.html')
  const firstLabel = await page.locator('#label').textContent()
  await page.getByRole('button', { name: /Next/ }).click()
  await expect(page.locator('#label')).not.toHaveText(firstLabel)
})

test('Say it button is visible', async ({ page }) => {
  await page.goto('/app/games/say-words.html')
  await expect(page.getByRole('button', { name: /Say it/ })).toBeVisible()
})
