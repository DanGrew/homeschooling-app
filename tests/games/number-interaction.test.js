const { test, expect } = require('@playwright/test')

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
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-b-plus').click()
  await expect(page.locator('#num-a')).toHaveText('2')
  await expect(page.locator('#num-b')).toHaveText('1')
  await expect(page.locator('#num-total')).toHaveText('3')
})

test('total area shows combined fruits from A and B', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-b-plus').click()
  await expect(page.locator('#objects-total img')).toHaveCount(3)
})

test('− button does not go below 0', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-minus').click()
  await page.locator('#btn-a-minus').click()
  await expect(page.locator('#num-a')).toHaveText('0')
})

test('− button decrements count and removes fruit', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-a-plus').click()
  await page.locator('#btn-a-minus').click()
  await expect(page.locator('#num-a')).toHaveText('1')
  await expect(page.locator('#objects-a img')).toHaveCount(1)
})

test('A cannot exceed 10', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  for (let i = 0; i < 12; i++) {
    await page.locator('#btn-a-plus').click()
  }
  await expect(page.locator('#num-a')).toHaveText('10')
  await expect(page.locator('#objects-a img')).toHaveCount(10)
})

test('B cannot exceed 10', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await ready(page)
  for (let i = 0; i < 12; i++) {
    await page.locator('#btn-b-plus').click()
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
  await expect(page.locator('#lbl-a.speakable')).toBeVisible()
  await expect(page.locator('#lbl-b.speakable')).toBeVisible()
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
