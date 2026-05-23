const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/domino/'

const ALL_EVENTS = [
  'game_start', 'turn_start', 'tile_selected', 'placement_preview',
  'placement_submitted', 'placement_success', 'placement_fail',
  'tile_drawn', 'tile_removed_from_tray', 'preview_cancelled', 'game_complete'
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(function(types) {
    window._dominoEvents = []
    types.forEach(function(t) {
      window.addEventListener('domino:' + t, function(e) {
        window._dominoEvents.push({ type: t, detail: e.detail })
      })
    })
  }, ALL_EVENTS)
})

async function setupGame(page) {
  await page.goto(URL)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('avatar-0-cat').click()
  await page.getByTestId('avatar-1-dog').click()
  await page.getByTestId('domino-start-btn').click()
}

async function startGame(page) {
  await setupGame(page)
  await page.getByTestId('domino-handover-ready').click()
}

function getEvents(page, type) {
  return page.evaluate(function(t) {
    return window._dominoEvents.filter(function(e) { return e.type === t })
  }, type)
}

test('game_start fires on game start', async ({ page }) => {
  await setupGame(page)
  const events = await getEvents(page, 'game_start')
  expect(events).toHaveLength(1)
  expect(events[0].detail.matchType).toBeTruthy()
})

test('game_start includes player ids', async ({ page }) => {
  await setupGame(page)
  const events = await getEvents(page, 'game_start')
  expect(events[0].detail.players).toContain('p0')
  expect(events[0].detail.players).toContain('p1')
})

test('turn_start fires after ready dismissed', async ({ page }) => {
  await startGame(page)
  const events = await getEvents(page, 'turn_start')
  expect(events).toHaveLength(1)
  expect(events[0].detail.player_id).toBe('p0')
})

test('tile_selected fires on tile tap', async ({ page }) => {
  await startGame(page)
  await page.getByTestId('domino-tray-tile').first().click()
  const events = await getEvents(page, 'tile_selected')
  expect(events).toHaveLength(1)
  expect(events[0].detail.tile_id).toBeTruthy()
})

test('preview_cancelled fires on tile deselect', async ({ page }) => {
  await startGame(page)
  const tile = page.getByTestId('domino-tray-tile').first()
  await tile.click()
  await tile.click()
  const events = await getEvents(page, 'preview_cancelled')
  expect(events).toHaveLength(1)
})

test('placement_preview fires on endpoint tap after selection', async ({ page }) => {
  await startGame(page)
  const placed = await page.evaluate(function() {
    var state = window.gameState
    var hand = state.hands[state.players[state.turnIndex].id]
    var endpoints = state.board.endpoints
    var rots = [0, 90, 180, 270, 45, 135, 225, 315]
    for (var t = 0; t < hand.length; t++) {
      for (var e = 0; e < endpoints.length; e++) {
        for (var ri = 0; ri < rots.length; ri++) {
          if (window.validatePlacement(hand[t], endpoints[e], rots[ri]).valid) {
            return { tileId: hand[t].id, endpointIndex: e }
          }
        }
      }
    }
    return null
  })
  if (!placed) return
  await page.locator('[data-tile-id="' + placed.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
  const events = await getEvents(page, 'placement_preview')
  expect(events.length).toBeGreaterThanOrEqual(1)
})

test('tile_drawn fires on draw', async ({ page }) => {
  await startGame(page)
  await page.getByTestId('domino-draw-btn').click()
  const events = await getEvents(page, 'tile_drawn')
  expect(events).toHaveLength(1)
  expect(events[0].detail.player_id).toBe('p0')
  expect(events[0].detail.tile_id).toBeTruthy()
})

test('placement_submitted and placement_success fire on valid placement', async ({ page }) => {
  await startGame(page)

  const placed = await page.evaluate(function() {
    var state = window.gameState
    var player = state.players[state.turnIndex]
    var hand = state.hands[player.id]
    var endpoints = state.board.endpoints
    for (var t = 0; t < hand.length; t++) {
      for (var e = 0; e < endpoints.length; e++) {
        if (window.validatePlacement(hand[t], endpoints[e].value).valid) {
          return { tileId: hand[t].id, endpointIndex: e }
        }
      }
    }
    return null
  })

  if (!placed) return

  await page.locator('[data-tile-id="' + placed.tileId + '"]').first().click()
  await page.getByTestId('domino-endpoint').nth(placed.endpointIndex).click()
  await page.getByTestId('domino-submit-btn').click()

  const submitted = await getEvents(page, 'placement_submitted')
  expect(submitted).toHaveLength(1)
  expect(submitted[0].detail.tile_id).toBe(placed.tileId)

  const success = await getEvents(page, 'placement_success')
  expect(success).toHaveLength(1)

  const removed = await getEvents(page, 'tile_removed_from_tray')
  expect(removed).toHaveLength(1)
  expect(removed[0].detail.tile_id).toBe(placed.tileId)
})
