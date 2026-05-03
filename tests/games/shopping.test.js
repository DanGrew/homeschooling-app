const { test, expect } = require('@playwright/test')

test('page loads with items to choose from', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/shopping-play/')
  await expect(page.getByText('Choose items for your list:')).toBeVisible()
  await expect(page.locator('#tiles .ctile').first()).toBeVisible()
})

test('clicking an item adds it to the shopping list', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/shopping-play/')
  const itemName = await page.locator('#tiles .ctile').first().locator('.ctile-name').textContent()
  await page.locator('#tiles .ctile').first().click()
  await expect(page.locator('#list-items')).toContainText(itemName)
})

test('Find it button enables once an item is added', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/shopping-play/')
  await expect(page.locator('#btn-find')).toBeDisabled()
  await page.locator('#tiles .ctile').first().click()
  await expect(page.locator('#btn-find')).toBeEnabled()
})
