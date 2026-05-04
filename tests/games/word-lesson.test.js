const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/word-lesson/'

// --- page load ---

test('page loads and shows word label', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#word-label')).not.toBeEmpty({ timeout: 5000 })
})

test('filter bar renders with at least All and Custom buttons', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.querySelectorAll('#filter-bar .filter-btn').length > 0)
  await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Custom', exact: true })).toBeVisible()
})

test('Watch and Say It buttons visible on load', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#btn-watch')).toBeVisible()
  await expect(page.locator('#btn-sayit')).toBeVisible()
})

test('Try It enabled on load', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#btn-tryit')).not.toBeDisabled({ timeout: 5000 })
})

test('Reset hidden on load', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#btn-stop')).not.toBeVisible()
})

test('success banner hidden on load', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#success-banner')).not.toHaveClass(/visible/)
})

// --- navigation ---

test('next button changes word', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.getElementById('word-label').textContent.length > 0)
  const first = await page.locator('#word-label').textContent()
  await page.locator('#btn-next').click()
  await page.waitForFunction(
    w => document.getElementById('word-label').textContent !== w, first
  )
  const second = await page.locator('#word-label').textContent()
  expect(second).not.toBe(first)
})

test('prev button changes word', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.getElementById('word-label').textContent.length > 0)
  await page.locator('#btn-next').click()
  await page.waitForTimeout(200)
  const second = await page.locator('#word-label').textContent()
  await page.locator('#btn-prev').click()
  await page.waitForTimeout(200)
  const first = await page.locator('#word-label').textContent()
  expect(first).not.toBe(second)
})

// --- watch mode ---

test('Watch shows Reset and disables Watch during animation', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.getElementById('word-label').textContent.length > 0)
  await page.waitForTimeout(500)
  await page.locator('#btn-watch').click()
  await expect(page.locator('#btn-stop')).toBeVisible()
  await expect(page.locator('#btn-watch')).toBeDisabled()
})

test('Reset stops Watch animation and hides Reset', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.getElementById('word-label').textContent.length > 0)
  await page.waitForTimeout(500)
  await page.locator('#btn-watch').click()
  await expect(page.locator('#btn-stop')).toBeVisible()
  await page.locator('#btn-stop').click()
  await expect(page.locator('#btn-stop')).not.toBeVisible()
  await expect(page.locator('#btn-watch')).not.toBeDisabled()
  await expect(page.locator('#btn-tryit')).not.toBeDisabled()
})

test('Watch animation completes and hides Reset', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.querySelectorAll('#filter-bar .filter-btn').length > 0)
  await page.getByRole('button', { name: 'Custom', exact: true }).click()
  await page.locator('#custom-word-input').fill('ab')
  await page.locator('#btn-generate').click()
  await page.waitForFunction(() =>
    document.getElementById('word-container').querySelectorAll('svg').length === 2
  )
  await page.locator('#btn-watch').click()
  await expect(page.locator('#btn-stop')).not.toBeVisible({ timeout: 10000 })
  await expect(page.locator('#btn-watch')).not.toBeDisabled()
})

// --- try it mode ---

test('Try It hides Try It button and hides Reset', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.getElementById('word-label').textContent.length > 0)
  await page.waitForTimeout(500)
  await page.locator('#btn-tryit').click()
  await expect(page.locator('#btn-tryit')).not.toBeVisible()
  await expect(page.locator('#btn-stop')).not.toBeVisible()
})

test('SVGs rendered equal to word length', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => {
    const label = document.getElementById('word-label').textContent
    const svgs = document.getElementById('word-container').querySelectorAll('svg').length
    return label.length > 0 && svgs === label.length
  }, { timeout: 5000 })
  const { wordLen, svgCount } = await page.evaluate(() => ({
    wordLen: document.getElementById('word-label').textContent.length,
    svgCount: document.getElementById('word-container').querySelectorAll('svg').length
  }))
  expect(svgCount).toBe(wordLen)
})

// --- custom word ---

test('Custom filter shows text input', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.querySelectorAll('#filter-bar .filter-btn').length > 0)
  await page.getByRole('button', { name: 'Custom', exact: true }).click()
  await expect(page.locator('#custom-word-input')).toBeVisible()
})

test('custom word loads correct number of SVGs', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.querySelectorAll('#filter-bar .filter-btn').length > 0)
  await page.getByRole('button', { name: 'Custom', exact: true }).click()
  await page.locator('#custom-word-input').fill('dog')
  await page.locator('#btn-generate').click()
  await page.waitForFunction(() =>
    document.getElementById('word-container').querySelectorAll('svg').length === 3
  )
  const count = await page.evaluate(() =>
    document.getElementById('word-container').querySelectorAll('svg').length
  )
  expect(count).toBe(3)
})

test('invalid custom word flashes input border red', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.querySelectorAll('#filter-bar .filter-btn').length > 0)
  await page.getByRole('button', { name: 'Custom', exact: true }).click()
  await page.locator('#custom-word-input').fill('bad word!')
  await page.locator('#btn-generate').click()
  const borderColor = await page.locator('#custom-word-input').evaluate(el =>
    getComputedStyle(el).borderColor
  )
  expect(borderColor).toContain('231')
})

// --- banner ---

test('banner Again button hides banner', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.getElementById('word-label').textContent.length > 0)
  await page.evaluate(() => {
    document.getElementById('success-banner').classList.add('visible')
  })
  await expect(page.locator('#success-banner')).toHaveClass(/visible/)
  await page.locator('#btn-banner-again').click()
  await expect(page.locator('#success-banner')).not.toHaveClass(/visible/)
})

test('banner Next button advances word', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.getElementById('word-label').textContent.length > 0)
  const first = await page.locator('#word-label').textContent()
  await page.evaluate(() => document.getElementById('success-banner').classList.add('visible'))
  await page.locator('#btn-banner-next').click()
  await page.waitForFunction(
    w => document.getElementById('word-label').textContent !== w, first
  )
  const second = await page.locator('#word-label').textContent()
  expect(second).not.toBe(first)
})

// --- home nav ---

test('home nav button points to lessons index', async ({ page }) => {
  await page.goto(URL)
  const href = await page.locator('.nav-btn').first().getAttribute('href')
  expect(href).toBe('/homeschooling-app/app/lessons/')
})
