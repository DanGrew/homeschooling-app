const { test, expect } = require('@playwright/test')

test('page loads with panel and empty message', async ({ page }) => {
  await page.goto('/homeschooling-app/app/worksheets/colouring-sheets/')
  await expect(page.locator('#panel')).toBeVisible()
  await expect(page.locator('#empty-msg')).toBeVisible()
})

test('print button is visible', async ({ page }) => {
  await page.goto('/homeschooling-app/app/worksheets/colouring-sheets/')
  await expect(page.locator('#btn-print')).toBeVisible()
})

test('animal list populates', async ({ page }) => {
  await page.goto('/homeschooling-app/app/worksheets/colouring-sheets/')
  const items = page.locator('.panel-item')
  await expect(items.first()).toBeVisible()
  expect(await items.count()).toBeGreaterThan(0)
})

test('ticking an animal adds it to the sheet', async ({ page }) => {
  await page.goto('/homeschooling-app/app/worksheets/colouring-sheets/')
  await page.locator('.panel-item input').first().check()
  await expect(page.locator('.worksheet-item')).toBeVisible()
  await expect(page.locator('#empty-msg')).toBeHidden()
})

test('unticking an animal removes it from the sheet', async ({ page }) => {
  await page.goto('/homeschooling-app/app/worksheets/colouring-sheets/')
  const cb = page.locator('.panel-item input').first()
  await cb.check()
  await expect(page.locator('.worksheet-item')).toBeVisible()
  await cb.uncheck()
  await expect(page.locator('.worksheet-item')).toHaveCount(0)
  await expect(page.locator('#empty-msg')).toBeVisible()
})

test('nav link points to worksheets index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/worksheets/colouring-sheets/')
  const href = await page.locator('#panel-header a').evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/worksheets/')
})
