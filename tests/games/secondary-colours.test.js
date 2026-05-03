const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/secondary-colours/'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const cfg = {
      palette: ['red', 'yellow', 'blue', 'orange', 'green', 'purple'],
      targets: ['red-orange']
    }
    Object.defineProperty(window, 'CM_CONFIG', { get: () => cfg, set: () => {}, configurable: true })
  })
})

test('page loads with target label and 6-colour palette', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#cm-target-label')).toHaveText('Red-Orange')
  for (const c of ['red', 'yellow', 'blue', 'orange', 'green', 'purple']) {
    await expect(page.locator(`#cm-sw-${c}`)).toBeVisible()
  }
})

test('correct tertiary mix shows green outline', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#cm-sw-red').click()
  await page.locator('#cm-slot-a').click()
  await page.locator('#cm-sw-orange').click()
  await page.locator('#cm-slot-b').click()
  // red + orange = red-orange: correct
  await expect(page.locator('#cm-slot-a')).toHaveClass(/feedback-correct/)
  await expect(page.locator('#cm-slot-b')).toHaveClass(/feedback-correct/)
})

test('secondary + secondary wrong mix shows actual colour not grey', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#cm-sw-orange').click()
  await page.locator('#cm-slot-a').click()
  await page.locator('#cm-sw-purple').click()
  await page.locator('#cm-slot-b').click()
  // orange + purple = brown (#7A3A20): wrong
  await expect(page.locator('#cm-result')).toHaveCSS('background-color', 'rgb(122, 58, 32)')
  await expect(page.locator('#cm-slot-a')).toHaveCSS('outline-color', 'rgb(231, 76, 60)')
})

test('non-adjacent primary + secondary wrong mix shows actual colour', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#cm-sw-red').click()
  await page.locator('#cm-slot-a').click()
  await page.locator('#cm-sw-green').click()
  await page.locator('#cm-slot-b').click()
  // red + green = brown (#6B5030): wrong
  await expect(page.locator('#cm-result')).toHaveCSS('background-color', 'rgb(107, 80, 48)')
  await expect(page.locator('#cm-slot-a')).toHaveCSS('outline-color', 'rgb(231, 76, 60)')
})

test('home nav button points to games index', async ({ page }) => {
  await page.goto(URL)
  const href = await page.locator('.nav-btn').first().getAttribute('href')
  expect(href).toBe('/homeschooling-app/app/games/')
})
