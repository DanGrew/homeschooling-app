const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/letter-shapes/'

test.use({ viewport: { width: 820, height: 1180 } })

test('frame renders legend and three mode tabs', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.legend .leg')).toHaveCount(5)
  await expect(page.locator('.tab')).toHaveCount(3)
  await expect(page.locator('.tab.on')).toHaveText('Identify')
})

test('identify shows the grouped picker and the letter drawn in stroke colours', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.grplabel').first()).toHaveText('curly caterpillars')
  await expect(page.locator('.pick.on[data-letter="a"]')).toBeVisible()
  await expect(page.locator('.glyph svg')).toBeVisible()
})

test('identify chips reveal correctness on tap', async ({ page }) => {
  await page.goto(URL)
  const circle = page.locator('.chip[data-shape="circle"]')
  const dot = page.locator('.chip[data-shape="dot"]')
  await expect(circle).toHaveAttribute('data-has', 'true')
  await expect(dot).toHaveAttribute('data-has', 'false')
  await circle.click()
  await expect(circle.locator('.tick')).toBeVisible()
  await dot.click()
  await expect(dot.locator('.tick')).toBeHidden()
})

test('match glows every letter that contains the picked shape', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.tab[data-mode="match"]').click()
  await page.locator('.pick.shape[data-shape="circle"]').click()
  await expect(page.locator('.abc .letterbtn').filter({ hasText: 'a' }).first()).toHaveClass(/on/)
  await expect(page.locator('.abc .letterbtn').filter({ hasText: 'o' }).first()).toHaveClass(/on/)
  await page.locator('.pick.shape[data-shape="dot"]').click()
  const iBtn = page.locator('.abc .letterbtn').filter({ hasText: 'i' }).first()
  await expect(iBtn).toHaveClass(/on/)
})

test('order shares the selected letter and ticks on completion', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.tab[data-mode="order"]').click()
  await page.locator('.pick[data-letter="c"]').click()
  await expect(page.locator('.panel-title')).toContainText('Make')
  await expect(page.locator('.slot')).toHaveCount(1)
  await page.locator('.tile').first().click()
  await expect(page.locator('.hint.done')).toContainText("that's how you make c")
})
