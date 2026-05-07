const { test, expect } = require('@playwright/test')

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
  await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  await expect(page.locator('#num-a')).toHaveText('1')
  await expect(page.locator('#objects-a img')).toHaveCount(1)
})

test('+ button on B adds a fruit and increments count', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await page.locator('#area-b').getByRole('button', { name: '+' }).click()
  await expect(page.locator('#num-b')).toHaveText('1')
  await expect(page.locator('#objects-b img')).toHaveCount(1)
})

test('total reflects sum of A and B', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  await page.locator('#area-b').getByRole('button', { name: '+' }).click()
  await expect(page.locator('#num-a')).toHaveText('2')
  await expect(page.locator('#num-b')).toHaveText('1')
  await expect(page.locator('#num-total')).toHaveText('3')
})

test('total area shows combined fruits from A and B', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  await page.locator('#area-b').getByRole('button', { name: '+' }).click()
  await expect(page.locator('#objects-total img')).toHaveCount(3)
})

test('− button does not go below 0', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await page.locator('#area-a').getByRole('button', { name: '−' }).click()
  await page.locator('#area-a').getByRole('button', { name: '−' }).click()
  await expect(page.locator('#num-a')).toHaveText('0')
})

test('− button decrements count and removes fruit', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  await page.locator('#area-a').getByRole('button', { name: '−' }).click()
  await expect(page.locator('#num-a')).toHaveText('1')
  await expect(page.locator('#objects-a img')).toHaveCount(1)
})

test('A cannot exceed 10', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  for (let i = 0; i < 12; i++) {
    await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  }
  await expect(page.locator('#num-a')).toHaveText('10')
  await expect(page.locator('#objects-a img')).toHaveCount(10)
})

test('B cannot exceed 10', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  for (let i = 0; i < 12; i++) {
    await page.locator('#area-b').getByRole('button', { name: '+' }).click()
  }
  await expect(page.locator('#num-b')).toHaveText('10')
})

test('A and B show different fruit images', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await page.locator('body[data-ready="true"]').waitFor()
  await page.locator('#area-a').getByRole('button', { name: '+' }).click()
  await page.locator('#area-b').getByRole('button', { name: '+' }).click()
  const aSrc = await page.locator('#objects-a img').getAttribute('src')
  const bSrc = await page.locator('#objects-b img').getAttribute('src')
  expect(aSrc).not.toBe(bSrc)
})

test('Say it button is present in A and B areas', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await expect(page.locator('#area-a').getByRole('button', { name: 'Say it' })).toBeVisible()
  await expect(page.locator('#area-b').getByRole('button', { name: 'Say it' })).toBeVisible()
})

test('Count button is present in total area', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  await expect(page.locator('#area-total').getByRole('button', { name: 'Count' })).toBeVisible()
})

test('home nav link points to lessons', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/number-interaction/')
  const homeLink = page.locator('.nav-bar a[href*="lessons"]')
  await expect(homeLink).toBeVisible()
})
