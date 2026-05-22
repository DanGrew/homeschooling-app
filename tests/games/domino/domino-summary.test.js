const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/domino/'

async function reachSummary(page) {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('domino-start-btn').click()
  await page.getByTestId('domino-handover-ready').click()

  await page.evaluate(async () => {
    window.gameState.phase = 'complete'
    window.gameState.stats['p0'].tilesPlaced = 3
    window.gameState.stats['p1'].tilesPlaced = 2
    window.gameState.hands['p0'] = window.gameState.hands['p0'].slice(0, 1)
    window.gameState.hands['p1'] = window.gameState.hands['p1'].slice(0, 2)
  })

  await page.evaluate(() => {
    const tray = document.getElementById('domino-tray')
    window.renderDominoSummary(
      document.getElementById('domino-summary'),
      window.gameState,
      function() { window.showScreen('setup'); }
    )
    document.getElementById('domino-setup').className = 'pairs-screen'
    document.getElementById('domino-game').className = 'pairs-screen'
    document.getElementById('domino-summary').className = 'pairs-screen active'
  })
}

test('summary screen shows player rows', async ({ page }) => {
  await reachSummary(page)
  await expect(page.getByTestId('domino-summary-row-p0')).toBeVisible()
  await expect(page.getByTestId('domino-summary-row-p1')).toBeVisible()
})

test('summary shows tiles placed for each player', async ({ page }) => {
  await reachSummary(page)
  const p0Text = await page.getByTestId('domino-summary-stats-p0').textContent()
  expect(p0Text).toContain('placed 3')
  const p1Text = await page.getByTestId('domino-summary-stats-p1').textContent()
  expect(p1Text).toContain('placed 2')
})

test('summary shows tiles remaining for each player', async ({ page }) => {
  await reachSummary(page)
  const p0Text = await page.getByTestId('domino-summary-stats-p0').textContent()
  expect(p0Text).toContain('1 left')
  const p1Text = await page.getByTestId('domino-summary-stats-p1').textContent()
  expect(p1Text).toContain('2 left')
})

test('play again returns to setup screen', async ({ page }) => {
  await reachSummary(page)
  await page.getByTestId('domino-play-again').click()
  await expect(page.locator('#domino-setup')).toHaveClass(/active/)
})
