const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/shopping-game/'

test('setup screen visible on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#shopping-setup')).toBeVisible()
})

test('game screen hidden on load', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#shopping-game')).toBeHidden()
})

test('start button disabled until avatars selected', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('pairs-start-btn')).toBeDisabled()
})

test('player count buttons visible', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('player-count-1')).toBeVisible()
  await expect(page.getByTestId('player-count-2')).toBeVisible()
  await expect(page.getByTestId('player-count-3')).toBeVisible()
})

test('grid size buttons visible', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('grid-size-16')).toBeVisible()
  await expect(page.getByTestId('grid-size-25')).toBeVisible()
  await expect(page.getByTestId('grid-size-64')).toBeVisible()
})

test('content tag buttons visible', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('tag-fruit')).toBeVisible()
  await expect(page.getByTestId('tag-animals')).toBeVisible()
})

test('game starts after avatars selected', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await expect(page.getByTestId('pairs-start-btn')).toBeEnabled()
  await page.getByTestId('pairs-start-btn').click()
  await expect(page.locator('#shopping-game')).toBeVisible()
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

test('5x5 grid has 25 cards', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('grid-size-25').click()
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  const cards = page.locator('[data-testid^="card-"]')
  expect(await cards.count()).toBe(25)
})

test('tapping a card reveals it', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  await page.getByTestId('card-0').click()
  await expect(page.getByTestId('card-0')).toHaveClass(/face-up|found/)
})

test('player trays visible during game', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  await expect(page.getByTestId('pairs-trays')).toBeVisible()
})

test('shopping list items visible in tray', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('pairs-start-btn').click()
  const listItems = page.locator('[data-testid^="list-item-p0-"]')
  await expect(listItems.first()).toBeVisible()
})

test('1 player game starts and renders', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('player-count-1').click()
  await page.getByTestId('avatar-0-cat').click()
  await expect(page.getByTestId('pairs-start-btn')).toBeEnabled()
  await page.getByTestId('pairs-start-btn').click()
  await expect(page.locator('#shopping-game')).toBeVisible()
  await expect(page.getByTestId('pairs-grid')).toBeVisible()
})

test('passplay shows handover on start', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('mode-passplay').click()
  await page.getByTestId('pairs-start-btn').click()
  await expect(page.getByTestId('pairs-handover')).toBeVisible()
})

test('deselecting all tags disables start', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  const tagBtns = page.locator('[data-testid^="tag-"]')
  const count = await tagBtns.count()
  for (let i = 0; i < count; i++) {
    await tagBtns.nth(i).click()
  }
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await expect(page.getByTestId('pairs-start-btn')).toBeDisabled()
})

test('nav bar present', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar')).toBeVisible()
})

test('summary screen shows after all lists found', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('player-count-1').click()
  await page.getByTestId('grid-size-16').click()
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('pairs-start-btn').click()

  const cards = await page.locator('[data-testid^="card-"]').all()
  const listItems = page.locator('[data-testid^="list-item-p0-"]')
  const listCount = await listItems.count()
  const listIds = []
  for (let i = 0; i < listCount; i++) {
    const testId = await listItems.nth(i).getAttribute('data-testid')
    listIds.push(testId.replace('list-item-p0-', ''))
  }

  const contents = await Promise.all(cards.map(function(c) { return c.getAttribute('data-content'); }))
  for (const id of listIds) {
    const idx = contents.findIndex(function(c) { return c === id; })
    if (idx !== -1) {
      await page.getByTestId('card-' + idx).click()
      await page.waitForSelector('[data-testid="card-' + idx + '"].found')
    }
  }

  await expect(page.locator('#shopping-summary')).toBeVisible({ timeout: 5000 })
})

test('play again returns to setup', async ({ page }) => {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('player-count-1').click()
  await page.getByTestId('grid-size-16').click()
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('pairs-start-btn').click()

  const cards = await page.locator('[data-testid^="card-"]').all()
  const listItems = page.locator('[data-testid^="list-item-p0-"]')
  const listCount = await listItems.count()
  const listIds = []
  for (let i = 0; i < listCount; i++) {
    const testId = await listItems.nth(i).getAttribute('data-testid')
    listIds.push(testId.replace('list-item-p0-', ''))
  }

  const contents = await Promise.all(cards.map(function(c) { return c.getAttribute('data-content'); }))
  for (const id of listIds) {
    const idx = contents.findIndex(function(c) { return c === id; })
    if (idx !== -1) {
      await page.getByTestId('card-' + idx).click()
      await page.waitForSelector('[data-testid="card-' + idx + '"].found')
    }
  }

  await page.getByTestId('shopping-play-again').click({ timeout: 5000 })
  await expect(page.locator('#shopping-setup')).toBeVisible()
})
