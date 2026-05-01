const { test, expect } = require('@playwright/test')

test('page loads with controls and empty message', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  await expect(page.locator('#input-chars')).toBeVisible()
  await expect(page.locator('#empty-msg')).toBeVisible()
  await expect(page.locator('#btn-print')).toBeVisible()
})

test('typing characters renders cells', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  await page.locator('#input-chars').fill('abc')
  await page.waitForSelector('.cell')
  const cells = await page.locator('.cell').count()
  expect(cells).toBe(4 * 3)
})

test('empty message hides when chars entered', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  await page.locator('#input-chars').fill('a')
  await page.waitForSelector('.cell')
  await expect(page.locator('#empty-msg')).toBeHidden()
})

test('columns + button increases column count', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  await page.locator('#input-chars').fill('a')
  await page.waitForSelector('.cell')
  await page.locator('#cols-inc').click()
  const val = await page.locator('#cols-val').textContent()
  expect(parseInt(val)).toBe(5)
  const cells = await page.locator('.cell').count()
  expect(cells).toBe(5 * 3)
})

test('columns − button decreases column count', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  await page.locator('#input-chars').fill('a')
  await page.waitForSelector('.cell')
  await page.locator('#cols-dec').click()
  const val = await page.locator('#cols-val').textContent()
  expect(parseInt(val)).toBe(3)
  const cells = await page.locator('.cell').count()
  expect(cells).toBe(3 * 3)
})

test('rows + button increases row count', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  await page.locator('#input-chars').fill('a')
  await page.waitForSelector('.cell')
  await page.locator('#rows-inc').click()
  const val = await page.locator('#rows-val').textContent()
  expect(parseInt(val)).toBe(4)
  const cells = await page.locator('.cell').count()
  expect(cells).toBe(4 * 4)
})

test('size buttons update cell height', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  await page.locator('#input-chars').fill('a')
  await page.waitForSelector('.cell')
  await page.getByRole('button', { name: 'L', exact: true }).click()
  const height = await page.locator('.cell').first().evaluate(el => el.offsetHeight)
  expect(height).toBe(180)
})

test('columns cannot go below 1', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  for (let i = 0; i < 10; i++) await page.locator('#cols-dec').click()
  const val = await page.locator('#cols-val').textContent()
  expect(parseInt(val)).toBe(1)
})

test('characters cycle to fill grid', async ({ page }) => {
  await page.goto('/app/worksheets/character-worksheet')
  await page.locator('#input-chars').fill('ab')
  await page.waitForSelector('.cell')
  const cells = await page.locator('.cell').count()
  expect(cells).toBe(4 * 3)
})
