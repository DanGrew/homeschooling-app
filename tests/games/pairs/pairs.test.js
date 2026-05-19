const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/pairs/'

test('setup screen visible on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#pairs-setup')).toBeVisible()
})

test('game screen hidden on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#pairs-game')).toBeHidden()
})

test('start button disabled until avatars selected', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('pairs-start-btn')).toBeDisabled()
})

test('player count buttons visible', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('player-count-2')).toBeVisible()
  await expect(page.getByTestId('player-count-3')).toBeVisible()
})

test('grid size buttons visible', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('grid-size-16')).toBeVisible()
  await expect(page.getByTestId('grid-size-36')).toBeVisible()
  await expect(page.getByTestId('grid-size-64')).toBeVisible()
})

test('selecting 3 players shows third player panel', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('player-count-3').click()
  await expect(page.getByTestId('player-panel-2')).toBeVisible()
})

test('game starts after both avatars selected', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await expect(page.getByTestId('pairs-start-btn')).toBeEnabled()
  await page.getByTestId('pairs-start-btn').click()
  await expect(page.locator('#pairs-game')).toBeVisible()
})

test('card grid renders after game starts', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  await expect(page.getByTestId('pairs-grid')).toBeVisible()
})

test('4x4 grid has 16 cards', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('grid-size-16').click()
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  const cards = page.locator('[data-testid^="card-"]')
  expect(await cards.count()).toBe(16)
})

test('player trays visible during game', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  await expect(page.getByTestId('pairs-trays')).toBeVisible()
})

test('tapping a card reveals it', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  await page.getByTestId('card-0').click()
  await expect(page.getByTestId('card-0')).toHaveClass(/face-up/)
})

test('tapping same card twice does not change state', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  await page.getByTestId('card-0').click()
  await page.getByTestId('card-0').click()
  await expect(page.getByTestId('card-0')).toHaveClass(/face-up/)
})

test('nav bar present', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar')).toBeVisible()
})

test('summary screen shows after all pairs matched', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('grid-size-16').click()
  await page.getByTestId('pairs-start-btn').click()

  const cards = await page.locator('[data-testid^="card-"]').all()
  const contents = await Promise.all(cards.map(function(c) { return c.getAttribute('data-content'); }))

  var contentMap = {}
  contents.forEach(function(id, i) {
    if (!contentMap[id]) contentMap[id] = []
    contentMap[id].push(i)
  })

  for (var id in contentMap) {
    var pair = contentMap[id]
    await page.getByTestId('card-' + pair[0]).click()
    await page.getByTestId('card-' + pair[1]).click()
    await page.waitForTimeout(100)
  }

  await expect(page.locator('#pairs-summary')).toBeVisible({ timeout: 5000 })
})

test('passplay shows handover on game start', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('mode-passplay').click()
  await page.getByTestId('pairs-start-btn').click()
  await expect(page.getByTestId('pairs-handover')).toBeVisible()
})

test('passplay handover shows again after a match', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('grid-size-16').click()
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('mode-passplay').click()
  await page.getByTestId('pairs-start-btn').click()
  await page.getByTestId('pairs-handover-ready').click()

  const cards = await page.locator('[data-testid^="card-"]').all()
  const contents = await Promise.all(cards.map(function(c) { return c.getAttribute('data-content'); }))
  var contentMap = {}
  contents.forEach(function(id, i) {
    if (!contentMap[id]) contentMap[id] = []
    contentMap[id].push(i)
  })
  var firstPair = contentMap[Object.keys(contentMap)[0]]
  await page.getByTestId('card-' + firstPair[0]).click()
  await page.getByTestId('card-' + firstPair[1]).click()

  await expect(page.getByTestId('pairs-handover')).toBeVisible({ timeout: 3000 })
})

test('play again returns to setup', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('grid-size-16').click()
  await page.getByTestId('pairs-start-btn').click()

  const cards = await page.locator('[data-testid^="card-"]').all()
  const contents = await Promise.all(cards.map(function(c) { return c.getAttribute('data-content'); }))
  var contentMap = {}
  contents.forEach(function(id, i) {
    if (!contentMap[id]) contentMap[id] = []
    contentMap[id].push(i)
  })
  for (var id in contentMap) {
    var pair = contentMap[id]
    await page.getByTestId('card-' + pair[0]).click()
    await page.getByTestId('card-' + pair[1]).click()
    await page.waitForTimeout(100)
  }

  await page.getByTestId('pairs-play-again').click({ timeout: 5000 })
  await expect(page.locator('#pairs-setup')).toBeVisible()
})
