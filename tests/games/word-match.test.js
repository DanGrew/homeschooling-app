const { test, expect } = require('@playwright/test')

test('page loads with a word, say button, and 4 choices', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-word')).not.toBeEmpty({ timeout: 5000 })
  await expect(page.getByRole('button', { name: /Say it/ })).toBeVisible()
  await expect(page.locator('#wm-choices button')).toHaveCount(4)
})

test('each choice shows an image and a label', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })
  await expect(page.locator('#wm-choices button img').first()).toBeVisible()
  await expect(page.locator('#wm-choices button div').first()).not.toBeEmpty()
})

test('correct choice shows success banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetName = await page.evaluate(() => window.__wmTarget() && window.__wmTarget().name)
  await page.locator(`#wm-choices button`, { hasText: targetName }).click()

  await expect(page.locator(`#wm-choices button`, { hasText: targetName })).toHaveClass(/feedback-correct/)
  await expect(page.locator('#success-banner')).toBeVisible()
})

test('next on banner starts a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetName = await page.evaluate(() => window.__wmTarget().name)
  await page.locator('#wm-choices button', { hasText: targetName }).click()
  await page.locator('#success-next').click()

  await expect(page.locator('#wm-choices button')).toHaveCount(4)
  const bannerHidden = await page.evaluate(() => document.getElementById('success-banner').style.transform)
  expect(bannerHidden).toBe('translateY(100%)')
})

test('wrong choice shows red outline then clears', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetName = await page.evaluate(() => window.__wmTarget().name)
  const wrongBtn = page.locator('#wm-choices button').filter({ hasNotText: targetName }).first()

  await wrongBtn.click()
  await expect(wrongBtn).toHaveClass(/feedback-wrong/)
  await expect(wrongBtn).not.toHaveClass(/feedback-wrong/, { timeout: 1000 })
})

test('wrong choice does not trigger success', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetName = await page.evaluate(() => window.__wmTarget().name)
  await page.locator('#wm-choices button').filter({ hasNotText: targetName }).first().click()

  await expect(page.locator('#wm-choices button').filter({ hasText: targetName })).not.toHaveClass(/feedback-correct/)
  const bannerHidden = await page.evaluate(() => document.getElementById('success-banner').style.transform)
  expect(bannerHidden).toBe('translateY(100%)')
})

test('locked after correct — extra clicks ignored', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetName = await page.evaluate(() => window.__wmTarget().name)
  await page.locator('#wm-choices button', { hasText: targetName }).click()
  const wrongBtn = page.locator('#wm-choices button').filter({ hasNotText: targetName }).first()
  await wrongBtn.click()

  await expect(wrongBtn).not.toHaveClass(/feedback-wrong/)
})
