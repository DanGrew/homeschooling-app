const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/learnings/'
const COLOUR_WHEEL_URL = '/homeschooling-app/app/activities/colour-wheel/'

async function seedEvent(page, event) {
  await page.evaluate((evt) => new Promise((resolve) => {
    const req = indexedDB.open('learning-records', 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('events', { keyPath: 'id' })
    }
    req.onsuccess = (e) => {
      const tx = e.target.result.transaction('events', 'readwrite')
      tx.objectStore('events').add(evt)
      tx.oncomplete = () => resolve()
    }
  }), event)
}

test('shows empty state when no events recorded', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.empty')).toBeVisible()
  await expect(page.locator('.empty')).toContainText('No learnings recorded yet')
})

test('shows entry after seeding an event', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-1',
    version: 1,
    type: 'lesson_completed',
    timestamp: Date.now(),
    lessonId: 'make_orange',
    activityId: 'colour-wheel'
  })
  await page.reload()
  await expect(page.locator('.entry')).toBeVisible()
})

test('entry resolves lesson title from activity JSON', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-2',
    version: 1,
    type: 'lesson_completed',
    timestamp: Date.now(),
    lessonId: 'make_orange',
    activityId: 'colour-wheel'
  })
  await page.reload()
  await expect(page.locator('.entry-title')).toContainText('Make Orange')
})

test('entry shows activity source and lesson number', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-3',
    version: 1,
    type: 'lesson_completed',
    timestamp: Date.now(),
    lessonId: 'make_orange',
    activityId: 'colour-wheel'
  })
  await page.reload()
  await expect(page.locator('.entry-source')).toContainText('Colour Wheel')
  await expect(page.locator('.entry-source')).toContainText('Lesson 1')
})

test('entry shows EYFS criteria tags', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-4',
    version: 1,
    type: 'lesson_completed',
    timestamp: Date.now(),
    lessonId: 'make_orange',
    activityId: 'colour-wheel'
  })
  await page.reload()
  await expect(page.locator('.entry-criteria .tag').first()).toBeVisible()
})

test('today group header shown for recent event', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-5',
    version: 1,
    type: 'lesson_completed',
    timestamp: Date.now(),
    lessonId: 'make_orange',
    activityId: 'colour-wheel'
  })
  await page.reload()
  await expect(page.locator('.group-label').first()).toContainText('Today')
})

test('completing a lesson via colour-wheel then visiting journal shows entry', async ({ page }) => {
  await page.goto(COLOUR_WHEEL_URL)
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item').first().click()
  await page.locator('#wheel-svg path[fill="#E74C3C"]').click()
  await page.locator('#wheel-svg path[fill="#F1C40F"]').click()
  await page.locator('#wheel-svg path[fill="#E67E22"]').dispatchEvent('click')
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await page.waitForTimeout(300)
  await page.goto(URL)
  await expect(page.locator('.entry-title')).toContainText('Make Orange')
})
