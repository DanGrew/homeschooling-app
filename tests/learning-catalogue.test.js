const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/resources/learning-catalogue/'

test('renders the two seed cards read from JSON', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="lc-card"]')).toHaveCount(2)
  await expect(page.locator('.lc-card', { hasText: 'Name objects' })).toBeVisible()
  await expect(page.locator('.lc-card', { hasText: 'Count to 5' })).toBeVisible()
})

test('groups cards by EYFS area', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.lc-area')).toHaveText(['Communication & Language', 'Mathematics'])
})

test('tapping a card opens its detail view', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.lc-card', { hasText: 'Count to 5' }).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await expect(page.locator('#lc-list')).toBeHidden()
  await expect(page.locator('.lc-focus')).toContainText('Count a small group of objects up to five.')
})

test('Where to practise launches Object Playground in free mode', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.lc-card', { hasText: 'Count to 5' }).click()
  const venue = page.locator('[data-testid="lc-venue"]')
  await expect(venue).toHaveCount(1)
  await expect(venue).toHaveText(/Object Playground/)
  await expect(venue).toHaveAttribute('href', '../../activities/object-playground/')
})

test('back returns from detail to the list', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.lc-card', { hasText: 'Name objects' }).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await page.locator('[data-testid="lc-back"]').click()
  await expect(page.locator('#lc-list')).toBeVisible()
  await expect(page.locator('#lc-detail')).toBeHidden()
})

test('standard nav-bar with home link is present', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar')).toHaveCSS('width', '56px')
  await expect(page.locator('.nav-bar a').first()).toBeVisible()
  await expect(page.locator('.activity-title')).toContainText('Learning Catalogue')
})
