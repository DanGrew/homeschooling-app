const { test, expect } = require('@playwright/test')

const SIM_URL = '/homeschooling-app/app/activities/simulator/?sim=grow-tomatoes-level-3'
const specJson = require('../../app/lessons/simulator/sims/grow-tomatoes-level-3.json')

async function waitForEngine(page) {
  await page.waitForFunction(() => window.engine !== undefined, { timeout: 10000 })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((spec) => {
    const orig = window.fetch
    window.fetch = (url, opts) =>
      String(url).includes('grow-tomatoes-level-3.json')
        ? Promise.resolve(new Response(JSON.stringify(spec), { status: 200, headers: { 'Content-Type': 'application/json' } }))
        : orig(url, opts)
  }, specJson)
})

test('loads with the simulation title and shows the table scene', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await expect(page.locator('#sim-title')).toHaveText('Grow Tomatoes [Level 3]')
  await expect(page.locator('#obj-bg_table')).toBeVisible()
})

test('placing the pot on the table advances to stage 1', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  await page.locator('#tool-tool_pot').click()
  await page.locator('#obj-bg_table').click()
  const stage = await page.evaluate(() => engine.state.stage)
  expect(stage).toBe(1)
  await expect(page.locator('#obj-the_pot')).toBeVisible()
})

test('setting up the pot through to seeds planted reaches stage 3', async ({ page }) => {
  await page.goto(SIM_URL)
  await waitForEngine(page)
  // Place pot on table (stage 0 → 1)
  await page.locator('#tool-tool_pot').click()
  await page.locator('#obj-bg_table').click()
  // Add dirt to pot (stage 1 → 2)
  await page.locator('#tool-tool_dirt').click()
  await page.locator('#obj-the_pot').click()
  // Plant seeds (stage 2 → 3)
  await page.locator('#tool-tool_seeds').click()
  await page.locator('#obj-the_pot').click()
  const stage = await page.evaluate(() => engine.state.stage)
  expect(stage).toBe(3)
})
