const { test, expect } = require('@playwright/test')

test('page loads with an image and word label', async ({ page }) => {
  await page.goto('/app/games/say-words.html')
  await expect(page.locator('#label')).not.toBeEmpty({ timeout: 5000 })
  await expect(page.locator('#picture svg')).toBeVisible()
  await expect(page.locator('#phonetic')).not.toBeEmpty()
})

test('next button cycles to the next word', async ({ page }) => {
  await page.goto('/app/games/say-words.html')
  await expect(page.locator('#label')).not.toBeEmpty({ timeout: 5000 })
  const firstLabel = await page.locator('#label').textContent()
  await page.getByRole('button', { name: '→' }).click()
  await expect(page.locator('#label')).not.toHaveText(firstLabel)
})

test('say it button is visible', async ({ page }) => {
  await page.goto('/app/games/say-words.html')
  await expect(page.getByRole('button', { name: /Say it/ })).toBeVisible()
})
