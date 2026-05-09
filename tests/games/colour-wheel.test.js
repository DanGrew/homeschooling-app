const { test, expect } = require('@playwright/test')

test('page loads with wheel and palette', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await expect(page.locator('#wheel-svg')).toBeVisible()
  await expect(page.locator('#lsn-palette')).toBeVisible()
})

test('palette swatches are speakable', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  for (const c of ['red', 'yellow', 'blue', 'orange', 'green', 'purple']) {
    await expect(page.locator(`#lsn-sw-${c}.speakable`)).toBeVisible()
  }
})

test('wheel segments are speakable', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await expect(page.locator('#wheel-svg path.speakable').first()).toBeVisible()
  const count = await page.locator('#wheel-svg path.speakable').count()
  expect(count).toBe(12)
})

test('selecting a swatch highlights it', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await page.locator('#lsn-sw-red').click()
  const outline = await page.locator('#lsn-sw-red').evaluate(el => el.style.outline)
  expect(outline).toContain('solid')
})

test('assigning colours to slots updates result', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-yellow').click()
  await page.locator('#lsn-slot-b').click()
  await expect(page.locator('#lsn-result-label')).toHaveText('Orange')
})
