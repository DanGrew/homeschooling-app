const { test, expect } = require('@playwright/test')

test('page loads with ball and first character label', async ({ page }) => {
  await page.goto('/app/games/character-lesson')
  await expect(page.locator('#ball')).toBeVisible()
  await expect(page.locator('#char-label')).not.toBeEmpty()
})

test('filter buttons switch character set', async ({ page }) => {
  await page.goto('/app/games/character-lesson')
  await page.getByRole('button', { name: 'A–Z', exact: true }).click()
  const label = await page.locator('#char-label').textContent()
  expect(label).toMatch(/[A-Z]/)

  await page.getByRole('button', { name: '0–9', exact: true }).click()
  const label2 = await page.locator('#char-label').textContent()
  expect(label2).toMatch(/[0-9]/)
})

test('next button advances character', async ({ page }) => {
  await page.goto('/app/games/character-lesson?char=a&filter=lower')
  const first = await page.locator('#char-label').textContent()
  await page.locator('#btn-next').click()
  const second = await page.locator('#char-label').textContent()
  expect(second).not.toBe(first)
})

test('prev button goes back', async ({ page }) => {
  await page.goto('/app/games/character-lesson?char=b&filter=lower')
  await expect(page.locator('#char-label')).toHaveText('b')
  await page.locator('#btn-prev').click()
  await expect(page.locator('#char-label')).toHaveText('a')
})

test('URL params set initial character and filter', async ({ page }) => {
  await page.goto('/app/games/character-lesson?char=m&filter=lower')
  await expect(page.locator('#char-label')).toHaveText('m')
  await expect(page.getByRole('button', { name: 'a–z', exact: true })).toHaveClass(/active/)
})

test('trace button is enabled on load', async ({ page }) => {
  await page.goto('/app/games/character-lesson?char=a&filter=lower')
  await expect(page.locator('#btn-trace')).not.toBeDisabled()
})

test('trace button disables during animation', async ({ page }) => {
  await page.goto('/app/games/character-lesson?char=a&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-trace').click()
  await expect(page.locator('#btn-trace')).toBeDisabled()
})

test('trace button re-enables after animation completes', async ({ page }) => {
  await page.goto('/app/games/character-lesson?char=l&filter=lower')
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
  await page.locator('#btn-trace').click()
  await expect(page.locator('#btn-trace')).not.toBeDisabled({ timeout: 5000 })
})

test('speak button is visible', async ({ page }) => {
  await page.goto('/app/games/character-lesson')
  await expect(page.locator('#btn-speak')).toBeVisible()
})

test('try-it link points to game page for same char', async ({ page }) => {
  await page.goto('/app/games/character-lesson?char=m&filter=lower')
  await expect(page.locator('#char-label')).toHaveText('m')
  const href = await page.locator('#btn-tryit').getAttribute('href')
  expect(href).toContain('character-trace.html')
  expect(href).toContain('char=m')
  expect(href).toContain('filter=lower')
})
