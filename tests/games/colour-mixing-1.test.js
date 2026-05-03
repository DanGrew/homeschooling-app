const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/colour-mixing-1/'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const cfg = { palette: ['red', 'yellow', 'blue'], targets: ['orange'] }
    Object.defineProperty(window, 'CM_CONFIG', { get: () => cfg, set: () => {}, configurable: true })
  })
})

test('page loads with target label and 3-colour palette', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#cm-target-label')).toHaveText('Orange')
  await expect(page.locator('#cm-sw-red')).toBeVisible()
  await expect(page.locator('#cm-sw-yellow')).toBeVisible()
  await expect(page.locator('#cm-sw-blue')).toBeVisible()
})

test('correct mix shows green outline on both slots', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#cm-sw-red').click()
  await page.locator('#cm-slot-a').click()
  await page.locator('#cm-sw-yellow').click()
  await page.locator('#cm-slot-b').click()
  // red + yellow = orange: correct
  await expect(page.locator('#cm-slot-a')).toHaveCSS('outline-color', 'rgb(39, 174, 96)')
  await expect(page.locator('#cm-slot-b')).toHaveCSS('outline-color', 'rgb(39, 174, 96)')
})

test('correct mix shows success banner', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#cm-sw-red').click()
  await page.locator('#cm-slot-a').click()
  await page.locator('#cm-sw-yellow').click()
  await page.locator('#cm-slot-b').click()
  await expect(page.locator('#success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 2000 })
})

test('wrong mix shows red outline on both slots', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#cm-sw-red').click()
  await page.locator('#cm-slot-a').click()
  await page.locator('#cm-sw-blue').click()
  await page.locator('#cm-slot-b').click()
  // red + blue = purple: wrong
  await expect(page.locator('#cm-slot-a')).toHaveCSS('outline-color', 'rgb(231, 76, 60)')
  await expect(page.locator('#cm-slot-b')).toHaveCSS('outline-color', 'rgb(231, 76, 60)')
})

test('wrong mix shows actual result colour not grey', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#cm-sw-red').click()
  await page.locator('#cm-slot-a').click()
  await page.locator('#cm-sw-blue').click()
  await page.locator('#cm-slot-b').click()
  // red + blue = purple (#9B59B6)
  await expect(page.locator('#cm-result')).toHaveCSS('background-color', 'rgb(155, 89, 182)')
})

test('wrong mix keeps slot colours without resetting', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#cm-sw-red').click()
  await page.locator('#cm-slot-a').click()
  await page.locator('#cm-sw-blue').click()
  await page.locator('#cm-slot-b').click()
  await expect(page.locator('#cm-slot-a')).toHaveCSS('background-color', 'rgb(231, 76, 60)')
  await expect(page.locator('#cm-slot-b')).toHaveCSS('background-color', 'rgb(52, 152, 219)')
})
