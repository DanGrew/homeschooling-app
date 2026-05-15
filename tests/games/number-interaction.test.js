const { test, expect } = require('@playwright/test')
const { clickInteractive } = require('../helpers.js')

const ready = page => page.locator('body[data-ready="true"]').waitFor()

test('page loads with A, B and Total areas', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await expect(page.locator('#area-a')).toBeVisible()
  await expect(page.locator('#area-b')).toBeVisible()
  await expect(page.locator('#area-total')).toBeVisible()
  await expect(page.locator('#area-total').getByText('Total')).toBeVisible()
})

test('initial counts are all zero', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await expect(page.locator('#num-a')).toHaveText('0')
  await expect(page.locator('#num-b')).toHaveText('0')
  await expect(page.locator('#num-total')).toHaveText('0')
})

test('+ button on A adds a fruit and increments count', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-plus').click()
  await expect(page.locator('#num-a')).toHaveText('1')
  await expect(page.locator('#objects-a img')).toHaveCount(1)
})

test('+ button on B adds a fruit and increments count', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-b-plus').click()
  await expect(page.locator('#num-b')).toHaveText('1')
  await expect(page.locator('#objects-b img')).toHaveCount(1)
})

test('total reflects sum of A and B', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await clickInteractive(page, '#btn-a-plus')
  await clickInteractive(page, '#btn-a-plus')
  await page.locator('#btn-b-plus').click()
  await expect(page.locator('#num-a')).toHaveText('2')
  await expect(page.locator('#num-b')).toHaveText('1')
  await expect(page.locator('#num-total')).toHaveText('3')
})

test('total area shows combined fruits from A and B', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await clickInteractive(page, '#btn-a-plus')
  await clickInteractive(page, '#btn-a-plus')
  await page.locator('#btn-b-plus').click()
  await expect(page.locator('#objects-total img')).toHaveCount(3)
})

test('− button does not go below 0', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await clickInteractive(page, '#btn-a-minus')
  await clickInteractive(page, '#btn-a-minus')
  await expect(page.locator('#num-a')).toHaveText('0')
})

test('− button decrements count and removes fruit', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await clickInteractive(page, '#btn-a-plus')
  await clickInteractive(page, '#btn-a-plus')
  await page.locator('#btn-a-minus').click()
  await expect(page.locator('#num-a')).toHaveText('1')
  await expect(page.locator('#objects-a img')).toHaveCount(1)
})

test('A cannot exceed 10', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  for (let i = 0; i < 12; i++) {
    await page.locator('#btn-a-plus').click()
    await page.waitForTimeout(120)
  }
  await expect(page.locator('#num-a')).toHaveText('10')
  await expect(page.locator('#objects-a img')).toHaveCount(10)
})

test('B cannot exceed 10', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  for (let i = 0; i < 12; i++) {
    await page.locator('#btn-b-plus').click()
    await page.waitForTimeout(120)
  }
  await expect(page.locator('#num-b')).toHaveText('10')
})

test('A and B show different fruit images', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-b-plus').click()
  const aSrc = await page.locator('#objects-a img').getAttribute('src')
  const bSrc = await page.locator('#objects-b img').getAttribute('src')
  expect(aSrc).not.toBe(bSrc)
})

test('number displays are speakable', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await expect(page.locator('#num-a.speakable')).toBeVisible()
  await expect(page.locator('#num-b.speakable')).toBeVisible()
  await expect(page.locator('#num-total.speakable')).toBeVisible()
})

test('fruit images are speakable after adding', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-plus').click()
  await expect(page.locator('#objects-a img.speakable')).toHaveCount(1)
})

test('labels and instruction are speakable', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await expect(page.locator('#lbl-a')).toHaveClass(/speakable/)
  await expect(page.locator('#lbl-b')).toHaveClass(/speakable/)
  await expect(page.locator('#lbl-total.speakable')).toBeVisible()
  await expect(page.locator('#ni-instruction.speakable')).toBeVisible()
})

test('plus and minus buttons are speakable', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await expect(page.locator('#btn-a-plus.speakable')).toBeVisible()
  await expect(page.locator('#btn-a-minus.speakable')).toBeVisible()
  await expect(page.locator('#btn-b-plus.speakable')).toBeVisible()
  await expect(page.locator('#btn-b-minus.speakable')).toBeVisible()
})

test('total fruit images are speakable after adding', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-b-plus').click()
  await expect(page.locator('#objects-total img.speakable')).toHaveCount(2)
})

test('home nav link points to lessons', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  const homeLink = page.locator('.nav-bar a[href*="lessons"]')
  await expect(homeLink).toBeVisible()
})

test('title is first child of game-area with purple glow', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  const titleEl = page.locator('.game-area .activity-title')
  await expect(titleEl).toHaveText(/Numbers/)
  const filter = await titleEl.evaluate(el => getComputedStyle(el).filter)
  expect(filter).toMatch(/drop-shadow/)
})

test('instruction rendered below title with speakable class', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await expect(page.locator('#ni-instruction.speakable')).toBeVisible()
  await expect(page.locator('#ni-instruction')).toContainText('Use + and −')
})

// --- dynamic labels ---

test('labels empty when both counts are zero', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await expect(page.locator('#lbl-a')).toHaveText('')
  await expect(page.locator('#lbl-b')).toHaveText('')
})

test('labels show same when counts are equal and non-zero', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-b-plus').click()
  await expect(page.locator('#lbl-a')).toHaveText('same')
  await expect(page.locator('#lbl-b')).toHaveText('same')
})


test('labels flip when B becomes bigger', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-b-plus').click()
  await page.locator('#btn-b-plus').click()
  await expect(page.locator('#lbl-a')).toHaveText('smaller')
  await expect(page.locator('#lbl-b')).toHaveText('bigger')
})

// --- out-of-bounds audio suppression ---

test('change returns changed:false when already at zero', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  const result = await page.evaluate(() => window.change('a', -1))
  expect(result.changed).toBe(false)
})

test('change returns changed:false when already at max', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  for (let i = 0; i < 10; i++) await page.evaluate(() => window.change('a', 1))
  const result = await page.evaluate(() => window.change('a', 1))
  expect(result.changed).toBe(false)
})

// --- bigger boxes ---

test('object boxes are at least 280px tall on desktop', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  const h = await page.locator('#objects-a').evaluate(el => el.getBoundingClientRect().height)
  expect(h).toBeGreaterThanOrEqual(280)
})
