const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/number-interaction/'

test('nav home link points to lessons', async ({ page }) => {
  await page.goto(URL)
  const href = await page.locator('.nav-bar a').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/lessons/')
})

test('lesson nav button is visible', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-lesson-btn')).toBeVisible()
  await expect(page.locator('.nav-lesson-btn')).toHaveText('\uD83D\uDCDA')
})

test('lesson popout shows all 5 lessons', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.nav-lesson-btn').click()
  await expect(page.locator('.nav-lesson-popout')).toBeVisible()
  await expect(page.locator('.nav-lesson-item')).toHaveCount(5)
  await expect(page.locator('.nav-lesson-item').first()).toContainText('Lesson 1: Make Three')
  await expect(page.locator('.nav-lesson-item').last()).toContainText('Lesson 5: More and Fewer')
})

async function startLesson(page) {
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item').first().click()
}

test('clicking lesson item shows guidance overlay', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toBeVisible()
})

test('first step shows make-three intro and Next button', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toContainText("Let's make the number three!")
  await expect(page.locator('#guidance-overlay [data-action="next"]')).toBeVisible()
})

test('Next on intro advances to expect step with no Next', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await expect(page.locator('#guidance-overlay')).toContainText('Keep pressing +')
  await expect(page.locator('#guidance-overlay [data-action="next"]')).not.toBeVisible()
})

function fireGuidanceEvent(page, type) {
  return page.evaluate(t => window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: t } })), type)
}

test('TOTAL_3 event shows feedback and Next button', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await fireGuidanceEvent(page, 'TOTAL_3')
  await expect(page.locator('#guidance-overlay')).toContainText('Three!')
  await expect(page.locator('#guidance-overlay [data-action="next"]')).toBeVisible()
})

test('Next after TOTAL_3 advances to COUNT_ALL step', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await fireGuidanceEvent(page, 'TOTAL_3')
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await expect(page.locator('#guidance-overlay')).toContainText('Tap the big number')
  await expect(page.locator('#guidance-overlay [data-action="next"]')).not.toBeVisible()
})

test('COUNT_ALL event shows feedback', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await fireGuidanceEvent(page, 'TOTAL_3')
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await fireGuidanceEvent(page, 'COUNT_ALL')
  await expect(page.locator('#guidance-overlay')).toContainText('three altogether')
  await expect(page.locator('#guidance-overlay [data-action="next"]')).toBeVisible()
})

test('success step has green background', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await fireGuidanceEvent(page, 'TOTAL_3')
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await fireGuidanceEvent(page, 'COUNT_ALL')
  await page.locator('#guidance-overlay [data-action="next"]').click()
  const bg = await page.locator('#guidance-overlay').evaluate(el => el.querySelector('div').style.background)
  expect(bg).toBe('rgb(46, 204, 113)')
})

test('close button stops lesson and hides overlay', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toBeVisible()
  await page.locator('#guidance-overlay button[title="Stop lesson"]').click({ delay: 700 })
  await expect(page.locator('#guidance-overlay')).not.toBeVisible()
})
