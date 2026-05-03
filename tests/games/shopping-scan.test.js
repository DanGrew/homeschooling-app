const { test, expect } = require('@playwright/test')

// Force stub mode by removing BarcodeDetector before the page loads.
// In stub mode the game shows a text input to simulate scanning a barcode.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { delete window.BarcodeDetector })
})

test('page loads with items to choose from', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/shopping-scan/')
  await expect(page.getByText('Choose items for your list:')).toBeVisible()
  await expect(page.locator('#tiles .ctile').first()).toBeVisible()
})

test('adding an item enables the Scan it button', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/shopping-scan/')
  await expect(page.locator('#btn-scan-it')).toBeDisabled()
  await page.locator('#tiles .ctile').first().click()
  await expect(page.locator('#btn-scan-it')).toBeEnabled()
})

test('clicking Scan it shows the barcode stub input', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/shopping-scan/')
  await page.locator('#tiles .ctile').first().click()
  await page.locator('#btn-scan-it').click()
  await expect(page.locator('#stub-input')).toBeVisible()
})

test('entering a barcode marks the item as found', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/shopping-scan/')
  await page.locator('#tiles .ctile').filter({ hasText: 'Milk' }).click()
  await page.locator('#btn-scan-it').click()
  await page.locator('#stub-input').fill('00348188')
  await page.locator('#stub-btn').click()
  await expect(page.locator('.sc-row.found')).toBeVisible()
})

test('home nav button points to games index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/shopping-scan/')
  const href = await page.locator('.nav-btn').first().getAttribute('href')
  expect(href).toBe('/homeschooling-app/app/games/')
})
