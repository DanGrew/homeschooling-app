const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/object-playground/'

async function tap(page, locator) {
  const box = await locator.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.up()
}

async function startMeetTheObjects(page) {
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item').first().click()
  await expect(page.locator('#guidance-overlay')).toBeVisible()
  await page.waitForFunction(() => document.querySelectorAll('[data-obj]').length === 5)
}

function lessonObjectIds(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('[data-obj]')).map(e => e.getAttribute('data-obj')))
}

// Regression: BUG-OBJ-MEET-STEP-SKIP. A stale lastSelectedId left over from a
// pre-lesson selection made the first lesson tap fire both OBJECT_SELECTED and
// DIFFERENT_OBJECT_SELECTED, cascading step 1 -> step 3 in one tap.
test('first tap advances to step 2, not step 3, after a prior selection', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.querySelectorAll('[data-obj]').length > 0)
  // free-play selection sets a stale lastSelectedId
  await tap(page, page.locator('[data-obj]').first())
  await startMeetTheObjects(page)

  const ids = await lessonObjectIds(page)
  await tap(page, page.locator(`[data-obj="${ids[0]}"]`))

  await expect(page.locator('#guidance-overlay')).toContainText('Now tap a different object')
  await expect(page.locator('#guidance-overlay')).not.toContainText('One more')
  await expect(page.locator('#guidance-overlay')).toContainText('2 / 3')
})

// Regression: BUG-OBJ-MEET-NO-SPEAK. Selecting an object must speak its colour
// and shape. The guidance event used to fire in the same tick as the speech, so
// the step-1 feedback's interrupt() cancelled the colour+shape utterance before
// it played. The fire is now deferred until the utterance ends.
test('selecting an object speaks its colour and shape', async ({ page }) => {
  await page.goto(URL)
  await page.evaluate(() => {
    window.__speechLog = []
    window.__speakInterrupt = function(t, onEnd) { window.__speechLog.push(t); [onEnd].filter(Boolean).forEach(fn => fn()) }
  })
  await startMeetTheObjects(page)
  const ids = await lessonObjectIds(page)
  const shape = await page.locator(`[data-testid="object-${ids[0]}"]`).getAttribute('data-shape')
  await tap(page, page.locator(`[data-obj="${ids[0]}"]`))
  await expect(page.locator('#guidance-overlay')).toContainText('2 / 3')
  const spoken = await page.evaluate(() => window.__speechLog[0])
  expect(spoken).toMatch(new RegExp('^\\w+ ' + shape + '$'))
})

// Spin It Round step 3 ("the other way") must require the anticlockwise
// control — re-tapping the clockwise Spin button should not satisfy it.
test('spin it round step 3 only advances on anticlockwise rotation', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item', { hasText: 'Spin It Round' }).click()
  await expect(page.locator('#guidance-overlay')).toBeVisible()

  const cw = page.locator('[data-prop="rotation"][data-rot-dir="cw"]')
  const acw = page.locator('[data-prop="rotation"][data-rot-dir="acw"]')
  await expect(cw).toBeVisible()

  await cw.click()
  await expect(page.locator('#guidance-overlay')).toContainText('2 / 3')
  await cw.click()
  await expect(page.locator('#guidance-overlay')).toContainText('3 / 3')

  // wrong direction must not advance step 3
  await cw.click()
  await expect(page.locator('#guidance-overlay')).toContainText('3 / 3')
  await expect(page.locator('#guidance-overlay')).not.toContainText('The other way')

  // correct direction completes the lesson
  await acw.click()
  await expect(page.locator('#guidance-overlay')).toContainText('The other way')
})

// Regression: BUG-OBJ-STEP-CHECKBOXES. Big and Small steps carried maxFailures
// on string-expect steps, where the failure path is unreachable, so the overlay
// painted 3 grey fail-dot boxes upfront that never did anything — looking like a
// stray checklist. The step only wants the single largest-size outcome.
test('big and small step 1 shows no stray checkbox dots', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item', { hasText: 'Big and Small' }).click()
  await expect(page.locator('#guidance-overlay')).toBeVisible()
  await expect(page.locator('#guidance-overlay')).toContainText('HUGE')

  const boxes = await page.evaluate(() => Array.from(
    document.querySelectorAll('#guidance-overlay span')
  ).filter(s => s.style.width === '18px' && s.offsetParent !== null).length)
  expect(boxes).toBe(0)
})

// Regression: BUG-OBJ-PATTERN-LAYOUT. Added objects cycled through a scatter
// position array, so Pattern Maker's red/blue/red/blue sequence landed spread
// across the canvas instead of a readable row. Spawn is now a predictable
// left-to-right grid fill.
test('pattern maker spawns objects in a left-to-right row', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item', { hasText: 'Pattern Maker' }).click()
  await expect(page.locator('#guidance-overlay')).toBeVisible()
  await page.waitForFunction(() => document.querySelectorAll('[data-obj]').length === 0)

  const addBtn = page.locator('#obj-add-btn')
  for (let i = 0; i < 3; i++) await addBtn.click()
  await page.waitForFunction(() => document.querySelectorAll('[data-obj]').length === 3)

  const pts = await page.evaluate(() => Array.from(document.querySelectorAll('[data-obj]')).map(el => {
    const m = el.getAttribute('transform').match(/translate\(([-\d.]+),([-\d.]+)\)/)
    return { x: parseFloat(m[1]), y: parseFloat(m[2]) }
  }))
  // strictly increasing x at a constant y => one left-to-right row
  expect(pts[1].x).toBeGreaterThan(pts[0].x)
  expect(pts[2].x).toBeGreaterThan(pts[1].x)
  expect(pts[0].y).toBe(pts[1].y)
  expect(pts[1].y).toBe(pts[2].y)
})

test('each of the three steps needs its own distinct tap', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => document.querySelectorAll('[data-obj]').length > 0)
  await tap(page, page.locator('[data-obj]').first())
  await startMeetTheObjects(page)

  const ids = await lessonObjectIds(page)
  await tap(page, page.locator(`[data-obj="${ids[0]}"]`))
  await expect(page.locator('#guidance-overlay')).toContainText('2 / 3')
  await tap(page, page.locator(`[data-obj="${ids[1]}"]`))
  await expect(page.locator('#guidance-overlay')).toContainText('3 / 3')
  await tap(page, page.locator(`[data-obj="${ids[2]}"]`))
  await expect(page.locator('#guidance-overlay')).toContainText('Well done')
})
