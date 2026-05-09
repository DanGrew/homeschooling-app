const { test, expect } = require('@playwright/test')

test('page loads with title, instruction, word, and 4 choices', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.getByText('Word Match')).toBeVisible()
  await expect(page.getByText('Find the picture!')).toBeVisible()
  await expect(page.locator('#wm-word')).not.toBeEmpty({ timeout: 5000 })
  await expect(page.locator('#wm-choices button')).toHaveCount(4)
})

test('word element is speakable', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-word')).not.toBeEmpty({ timeout: 5000 })
  await expect(page.locator('#wm-word.speakable')).toBeVisible()
  await expect(page.locator('#wm-word')).toHaveCSS('cursor', 'pointer')
})

test('each choice shows an image', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })
  await expect(page.locator('#wm-choices button img').first()).toBeVisible()
})

test('correct choice shows success banner', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetId = await page.evaluate(() => window.__wmTarget().id)
  await page.locator(`#wm-choices button[data-id="${targetId}"]`).click()

  await expect(page.locator(`#wm-choices button[data-id="${targetId}"]`)).toHaveClass(/feedback-correct/)
  await expect(page.locator('#success-banner')).toBeVisible()
})

test('next on banner starts a new round', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetId = await page.evaluate(() => window.__wmTarget().id)
  await page.locator(`#wm-choices button[data-id="${targetId}"]`).click()
  await page.locator('#success-next').click()

  await expect(page.locator('#wm-choices button')).toHaveCount(4)
  const bannerHidden = await page.evaluate(() => document.getElementById('success-banner').style.transform)
  expect(bannerHidden).toBe('translateY(100%)')
})

test('wrong choice shows red outline then clears', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetId = await page.evaluate(() => window.__wmTarget().id)
  const wrongBtn = page.locator(`#wm-choices button:not([data-id="${targetId}"])`).first()

  await wrongBtn.click()
  await expect(wrongBtn).toHaveClass(/feedback-wrong/)
  await expect(wrongBtn).not.toHaveClass(/feedback-wrong/, { timeout: 2000 })
})

test('wrong choice does not trigger success', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetId = await page.evaluate(() => window.__wmTarget().id)
  await page.locator(`#wm-choices button:not([data-id="${targetId}"])`).first().click()

  await expect(page.locator(`#wm-choices button[data-id="${targetId}"]`)).not.toHaveClass(/feedback-correct/)
  const bannerHidden = await page.evaluate(() => document.getElementById('success-banner').style.transform)
  expect(bannerHidden).toBe('translateY(100%)')
})

test('locked after correct — extra clicks ignored', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  await expect(page.locator('#wm-choices button').first()).toBeVisible({ timeout: 5000 })

  const targetId = await page.evaluate(() => window.__wmTarget().id)
  await page.locator(`#wm-choices button[data-id="${targetId}"]`).click()
  const wrongBtn = page.locator(`#wm-choices button:not([data-id="${targetId}"])`).first()
  await wrongBtn.click()

  await expect(wrongBtn).not.toHaveClass(/feedback-wrong/)
})

test('nav bar has link to say-words', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/word-match/')
  const href = await page.locator('.nav-link').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/activities/say-words/')
})
