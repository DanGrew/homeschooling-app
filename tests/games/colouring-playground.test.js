const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/colouring-playground/'

async function waitForPicture(page) {
  await expect(page.locator('#pic-title')).not.toBeEmpty({ timeout: 5000 })
}

async function selectBaseColour(page, swatchIndex, shade = '#sh-base') {
  await page.locator('#base-palette .swatch').nth(swatchIndex).click()
  await page.locator(shade).click()
}

// ── Page load ──────────────────────────────────────────────────────────────

test('page loads with mode buttons and a picture title', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await expect(page.locator('.mode-btn[data-mode="magic"]')).toBeVisible()
  await expect(page.locator('.mode-btn[data-mode="guided"]')).toBeVisible()
  await expect(page.locator('.mode-btn[data-mode="free"]')).toBeVisible()
})

test('magic is default mode — sidebar panels hidden', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await expect(page.locator('#ref-panel')).not.toBeVisible()
  await expect(page.locator('#palette-panel')).not.toBeVisible()
})

test('paginator shows prev and next buttons', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await expect(page.locator('#paginator-bar button', { hasText: 'Next' })).toBeVisible()
  await expect(page.locator('#paginator-bar button', { hasText: 'Prev' })).toBeVisible()
})

test('next paginator button changes picture', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  const titleBefore = await page.locator('#pic-title').textContent()
  await page.locator('#paginator-bar button', { hasText: 'Next' }).click()
  await expect(page.locator('#pic-title')).not.toHaveText(titleBefore)
})

test('nav home link points to lessons', async ({ page }) => {
  await page.goto(URL)
  const href = await page.locator('.nav-bar a').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/lessons/')
})

// ── Magic mode ─────────────────────────────────────────────────────────────

test('magic: clicking a shape colours it', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  const shape = page.locator('#svg [style*="cursor"]').first()
  const fillBefore = await shape.getAttribute('fill')
  await shape.click()
  await expect(shape).not.toHaveAttribute('fill', fillBefore)
})

test('magic: colouring all shapes shows success banner', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  const shapes = page.locator('#svg [style*="cursor"]')
  const count = await shapes.count()
  for (let i = 0; i < count; i++) await shapes.nth(i).click()
  await expect(page.getByTestId('success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 2000 })
})

test('magic: next button on banner advances picture', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  const titleBefore = await page.locator('#pic-title').textContent()
  const shapes = page.locator('#svg [style*="cursor"]')
  const count = await shapes.count()
  for (let i = 0; i < count; i++) await shapes.nth(i).click()
  await page.getByTestId('success-banner').getByRole('button', { name: /Next/ }).click()
  await expect(page.locator('#pic-title')).not.toHaveText(titleBefore, { timeout: 2000 })
})

// ── Guided mode ────────────────────────────────────────────────────────────

test('guided: shows ref panel and palette panel', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="guided"]').click()
  await expect(page.locator('#ref-panel')).toBeVisible()
  await expect(page.locator('#palette-panel')).toBeVisible()
})

test('guided: palette swatches come from picture colours', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="guided"]').click()
  await expect(page.locator('#guided-pal .swatch').first()).toBeVisible()
})

test('guided: clicking a swatch marks it selected', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="guided"]').click()
  const swatch = page.locator('#guided-pal .swatch').first()
  await swatch.click()
  await expect(swatch).toHaveClass(/sel/)
})

test('guided: selected colour fills cur-colour bar', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="guided"]').click()
  const swatch = page.locator('#guided-pal .swatch').first()
  const swatchBg = await swatch.evaluate(el => window.getComputedStyle(el).backgroundColor)
  await swatch.click()
  const curBg = await page.locator('#cur-colour').evaluate(el => window.getComputedStyle(el).backgroundColor)
  expect(curBg).toBe(swatchBg)
})

test('guided: shape click with no colour selected does nothing', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="guided"]').click()
  const shape = page.locator('#svg [style*="cursor"]').first()
  const fillBefore = await shape.getAttribute('fill')
  await shape.click()
  expect(await shape.getAttribute('fill')).toBe(fillBefore)
})

test('guided: selected colour applies to shape on click', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="guided"]').click()
  const swatch = page.locator('#guided-pal .swatch').first()
  const colour = await swatch.evaluate(el => el.dataset.colour)
  await swatch.click()
  await page.locator('#svg [style*="cursor"]').first().click()
  await expect(page.locator('#svg [style*="cursor"]').first()).toHaveAttribute('fill', colour)
})

test('guided: selected colour persists across picture navigation', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="guided"]').click()
  await page.locator('#guided-pal .swatch').first().click()
  const colourBefore = await page.locator('#cur-colour').evaluate(el => window.getComputedStyle(el).backgroundColor)
  await page.locator('#paginator-bar button', { hasText: 'Next' }).click()
  await waitForPicture(page)
  const colourAfter = await page.locator('#cur-colour').evaluate(el => window.getComputedStyle(el).backgroundColor)
  expect(colourAfter).toBe(colourBefore)
})

// ── Free mode ──────────────────────────────────────────────────────────────

test('free: shows 10 base palette swatches', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await expect(page.locator('#base-palette .swatch')).toHaveCount(10)
})

test('free: clicking a base swatch opens shade popout', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await page.locator('#base-palette .swatch').first().click()
  await expect(page.locator('#shade-pop')).toHaveClass(/open/)
})

test('free: shade popout has three options', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await page.locator('#base-palette .swatch').first().click()
  await expect(page.locator('.shade-sw')).toHaveCount(3)
})

test('free: selecting a shade closes popout and sets cur-colour', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await selectBaseColour(page, 0)
  await expect(page.locator('#shade-pop')).not.toHaveClass(/open/)
  const bg = await page.locator('#cur-colour').evaluate(el => el.style.background)
  expect(bg).not.toBe('rgb(224, 224, 224)')
})

test('free: base swatch shows family-selected outline after shade picked', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  const swatch = page.locator('#base-palette .swatch').first()
  await swatch.click()
  await page.locator('#sh-base').click()
  await expect(swatch).toHaveClass(/sel/)
})

test('free: shape click with colour active fills it', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await selectBaseColour(page, 0)
  const shape = page.locator('#svg [style*="cursor"]').first()
  const fillBefore = await shape.getAttribute('fill')
  await shape.click()
  await expect(shape).not.toHaveAttribute('fill', fillBefore)
})

test('free: mix-a slot fills with active colour on click', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await selectBaseColour(page, 0)
  await page.locator('#mix-a').click()
  const bg = await page.locator('#mix-a').evaluate(el => el.style.background)
  expect(bg).not.toBe('rgb(245, 245, 245)')
})

test('free: mix-b slot fills with active colour on click', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await selectBaseColour(page, 1)
  await page.locator('#mix-b').click()
  const bg = await page.locator('#mix-b').evaluate(el => el.style.background)
  expect(bg).not.toBe('rgb(245, 245, 245)')
})

test('free: mix result shows blended colour when both slots filled', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await selectBaseColour(page, 0)
  await page.locator('#mix-a').click()
  await selectBaseColour(page, 1)
  await page.locator('#mix-b').click()
  const bg = await page.locator('#mix-result').evaluate(el => el.style.background)
  expect(bg).not.toBe('rgb(245, 245, 245)')
  expect(bg).not.toBe('')
})

test('free: clicking mix result sets it as active colour', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await selectBaseColour(page, 0)
  await page.locator('#mix-a').click()
  await selectBaseColour(page, 1)
  await page.locator('#mix-b').click()
  const mixBg = await page.locator('#mix-result').evaluate(el => el.style.background)
  await page.locator('#mix-result').click()
  const curBg = await page.locator('#cur-colour').evaluate(el => el.style.background)
  expect(curBg).toBe(mixBg)
})

test('free: ref toggle hides and restores reference SVG', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await expect(page.locator('#ref-svg')).toBeVisible()
  await page.locator('#ref-toggle').click()
  await expect(page.locator('#ref-svg')).not.toBeVisible()
  await page.locator('#ref-toggle').click()
  await expect(page.locator('#ref-svg')).toBeVisible()
})

test('free: selected colour persists across picture navigation', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await selectBaseColour(page, 0)
  const colourBefore = await page.locator('#cur-colour').evaluate(el => el.style.background)
  await page.locator('#paginator-bar button', { hasText: 'Next' }).click()
  await waitForPicture(page)
  const colourAfter = await page.locator('#cur-colour').evaluate(el => el.style.background)
  expect(colourAfter).toBe(colourBefore)
})

test('free: clicking outside popout closes it', async ({ page }) => {
  await page.goto(URL)
  await waitForPicture(page)
  await page.locator('.mode-btn[data-mode="free"]').click()
  await page.locator('#base-palette .swatch').first().click()
  await expect(page.locator('#shade-pop')).toHaveClass(/open/)
  await page.locator('#canvas-wrap').click()
  await expect(page.locator('#shade-pop')).not.toHaveClass(/open/)
})
