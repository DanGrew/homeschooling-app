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
