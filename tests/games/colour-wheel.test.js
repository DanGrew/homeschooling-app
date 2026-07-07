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
  await expect(page.locator('#wheel-svg path[filter]').first()).toBeVisible()
  const count = await page.locator('#wheel-svg path[filter]').count()
  expect(count).toBe(12)
})

test('selecting a swatch highlights it', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await page.locator('#lsn-sw-red').click()
  const border = await page.locator('#lsn-sw-red').evaluate(el => el.style.borderColor)
  expect(border).toBeTruthy()
})

test('assigning colours to slots updates result', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-yellow').click()
  await page.locator('#lsn-slot-b').click()
  await expect(page.locator('#lsn-result-label')).toHaveText('Orange')
})

test('neutrals strip renders five tap-to-name swatches', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await expect(page.locator('#lsn-neutrals')).toBeVisible()
  await expect(page.locator('#lsn-neutrals .speakable')).toHaveCount(5)
  for (const id of ['black', 'brown', 'pink', 'white', 'grey']) {
    await expect(page.locator(`#lsn-sw-${id}.speakable`)).toBeVisible()
  }
})

test('tapping a neutral speaks its label', async ({ page }) => {
  await page.addInitScript(() => {
    window.__utterances = []
    window.SpeechSynthesisUtterance = function (text) { this.text = text; window.__utterances.push(text) }
    const stub = { speak: () => {}, cancel: () => {}, resume: () => {}, getVoices: () => [], addEventListener: () => {} }
    try { Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: stub }) } catch (e) {}
  })
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await page.locator('#lsn-sw-grey').click()
  await expect.poll(() => page.evaluate(() => window.__utterances)).toContain('Grey')
})

test('tapping a neutral does not fill a slot or change the result', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  const before = await page.locator('#lsn-slot-a').evaluate(el => el.style.background)
  await page.locator('#lsn-sw-brown').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-slot-b').click()
  const slotA = await page.locator('#lsn-slot-a').evaluate(el => el.style.background)
  const slotB = await page.locator('#lsn-slot-b').evaluate(el => el.style.background)
  expect(slotA).toBe(before)
  expect(slotB).toBe(before)
  await expect(page.locator('#lsn-result-label')).toHaveText('Result')
})

test('tapping the result label speaks the mixed colour, not "Result"', async ({ page }) => {
  await page.addInitScript(() => {
    window.__utterances = []
    window.SpeechSynthesisUtterance = function (text) { this.text = text; window.__utterances.push(text) }
    const stub = { speak: () => {}, cancel: () => {}, resume: () => {}, getVoices: () => [], addEventListener: () => {} }
    try { Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: stub }) } catch (e) {}
  })
  await page.goto('/homeschooling-app/app/activities/colour-wheel/')
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-blue').click()
  await page.locator('#lsn-slot-b').click()
  await expect(page.locator('#lsn-result-label')).toHaveText('Purple')
  await page.evaluate(() => { window.__utterances = [] })
  await page.locator('#lsn-result-label').click()
  await expect.poll(() => page.evaluate(() => window.__utterances)).toContain('Purple')
  expect(await page.evaluate(() => window.__utterances)).not.toContain('Result')
})
