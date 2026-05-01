const { test, expect } = require('@playwright/test')

const URL = '/app/lessons/colour-wheel.html'

test('page loads with colour wheel and palette', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wheel-svg path')).toHaveCount(12)
  await expect(page.locator('#lsn-palette div')).toHaveCount(6)
})

test('clicking a swatch selects it', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await expect(page.locator('#lsn-sw-red')).toHaveCSS('outline-style', 'solid')
})

test('assigning a colour to a slot fills it', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await expect(page.locator('#lsn-slot-a')).toHaveCSS('background-color', 'rgb(231, 76, 60)')
})

test('valid mix shows correct result colour', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-yellow').click()
  await page.locator('#lsn-slot-b').click()
  // red + yellow = orange (#E67E22)
  await expect(page.locator('#lsn-result')).toHaveCSS('background-color', 'rgb(230, 126, 34)')
})

test('non-wheel mix shows realistic paint colour', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-green').click()
  await page.locator('#lsn-slot-b').click()
  // red + green = brown (#6B5030)
  await expect(page.locator('#lsn-result')).toHaveCSS('background-color', 'rgb(107, 80, 48)')
})

test('same colour in both slots shows that colour', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-b').click()
  // red + red = red (#E74C3C)
  await expect(page.locator('#lsn-result')).toHaveCSS('background-color', 'rgb(231, 76, 60)')
})
