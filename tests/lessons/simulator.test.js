const { test, expect } = require('@playwright/test')

const SIM_URL = '/homeschooling-app/app/activities/simulator/?sim=grow-tomatoes-level-1'
const specJson = require('../../app/lessons/simulator/sims/grow-tomatoes-level-1.json')

async function waitForEngine(page) {
  await page.waitForFunction(() => window.engine !== undefined, { timeout: 10000 })
}

test.beforeEach(async ({ page }) => {
  // Stub fetch so the sim spec loads from memory — no server needed for this file
  await page.addInitScript((spec) => {
    const orig = window.fetch
    window.fetch = (url, opts) =>
      String(url).includes('grow-tomatoes-level-1.json')
        ? Promise.resolve(new Response(JSON.stringify(spec), { status: 200, headers: { 'Content-Type': 'application/json' } }))
        : orig(url, opts)
  }, specJson)
})

test('loads with the simulation title and scene', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await expect(page.locator('#sim-title')).toHaveText('Grow Tomatoes [Level 1]')
  await expect(page.locator('#obj-plant')).toBeVisible()
})

test('clicking the watering can increases the watered count', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await page.locator('#obj-watering_can').click()
  const watered = await page.evaluate(() => engine.state.watered)
  expect(watered).toBe(1)
})

test('clicking the sun increases the sunned count', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await page.locator('#obj-sun').click()
  const sunned = await page.evaluate(() => engine.state.sunned)
  expect(sunned).toBe(1)
})

test('watering and giving sunshine grows the plant', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await page.locator('#obj-watering_can').click()
  await page.locator('#obj-sun').click()
  const growth = await page.evaluate(() => engine.state.growth)
  expect(growth).toBe(1)
})

test('three growth cycles wins the game', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  for (let i = 0; i < 3; i++) {
    await page.locator('#obj-watering_can').click()
    await page.locator('#obj-sun').click()
  }
  // Win response shows the Well done button after a short delay
  await expect(page.locator('#obj-well_done_btn')).toBeVisible({ timeout: 5000 })
})
