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

test('identify chips reveal correctness and advance the count on tap', async ({ page }) => {
  await page.goto(URL)
  const circle = page.locator('.chip[data-shape="circle"]')
  const dot = page.locator('.chip[data-shape="dot"]')
  await expect(circle).toHaveAttribute('data-has', 'true')
  await expect(page.locator('.count')).toHaveText('0/2')
  await circle.click()
  await expect(circle.locator('.tick')).toBeVisible()
  await expect(page.locator('.count')).toHaveText('1/2')
  await dot.click()
  await expect(dot.locator('.tick')).toBeHidden()
  await expect(page.locator('.count')).toHaveText('1/2')
})

test('match starts unticked and reveals letters on tap with a count', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.tab[data-mode="match"]').click()
  await page.locator('.pick.shape[data-shape="circle"]').click()
  const aCell = page.locator('.letterbtn[data-cell="a"]')
  const bCell = page.locator('.letterbtn[data-cell="b"]')
  await expect(aCell).not.toHaveClass(/found/)
  await aCell.click()
  await expect(aCell).toHaveClass(/found/)
  await expect(page.locator('.count')).toContainText('1/')
  await bCell.click()
  await expect(bCell).toHaveClass(/wrong/)
})

test('order rejects wrong tiles and only places the correct next stroke', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.tab[data-mode="order"]').click()
  await page.locator('.pick[data-letter="c"]').click()
  await expect(page.locator('.panel-title')).toContainText('Make')
  await expect(page.locator('.slot')).toHaveCount(1)
  await page.locator('.tile').nth(1).click()
  await expect(page.locator('.tile.wrong')).toHaveCount(1)
  await expect(page.locator('.slot.filled')).toHaveCount(0)
  await page.locator('.tile').first().click()
  await expect(page.locator('.hint.done')).toContainText("that's how you make c")
})
