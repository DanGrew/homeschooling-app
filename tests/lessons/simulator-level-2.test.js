const { test, expect } = require('@playwright/test')

const SIM_URL = '/homeschooling-app/app/activities/simulator/?sim=grow-tomatoes-level-2'
const specJson = require('../../app/activities/simulator/sims/grow-tomatoes-level-2.json')

async function waitForEngine(page) {
  await page.waitForFunction(() => window.engine !== undefined, { timeout: 10000 })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((spec) => {
    const orig = window.fetch
    window.fetch = (url, opts) =>
      String(url).includes('grow-tomatoes-level-2.json')
        ? Promise.resolve(new Response(JSON.stringify(spec), { status: 200, headers: { 'Content-Type': 'application/json' } }))
        : orig(url, opts)
  }, specJson)
})

test('loads with the simulation title', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await expect(page.locator('#sim-title')).toHaveText('Grow Tomatoes [Level 2]')
})

test('toolbar shows the watering can and sun tools', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await expect(page.locator('#tool-tool_water')).toBeVisible()
  await expect(page.locator('#tool-tool_sun')).toBeVisible()
})

test('selecting the water tool and tapping the plant waters it', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await page.locator('#tool-tool_water').click()
  await page.locator('#obj-plant').click()
  const watered = await page.evaluate(() => engine.state.watered)
  expect(watered).toBe(1)
})

test('selecting the sun tool and tapping the plant gives it sunshine', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await page.locator('#tool-tool_sun').click()
  await page.locator('#obj-plant').click()
  const sunned = await page.evaluate(() => engine.state.sunned)
  expect(sunned).toBe(1)
})

test('three water-and-sun cycles wins the game', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  for (let i = 0; i < 3; i++) {
    await page.locator('#tool-tool_water').click()
    await page.locator('#obj-plant').click()
    await page.locator('#tool-tool_sun').click()
    await page.locator('#obj-plant').click()
  }
  await expect(page.locator('#obj-well_done_btn')).toBeVisible({ timeout: 5000 })
})
