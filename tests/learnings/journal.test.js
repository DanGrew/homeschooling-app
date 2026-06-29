const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/learnings/'

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
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'domino',
    activity_id: 'domino'
  })
  await page.reload()
  await expect(page.locator('.entry')).toBeVisible()
})

test('entry resolves learning title from activity JSON', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-2',
    version: 1,
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'domino',
    activity_id: 'domino'
  })
  await page.reload()
  await expect(page.locator('.entry-title')).toContainText('Domino Match')
})

test('entry shows activity source', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-3',
    version: 1,
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'domino',
    activity_id: 'domino'
  })
  await page.reload()
  await expect(page.locator('.entry-source')).toContainText('Domino')
})

test('entry shows EYFS criteria tags', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-4',
    version: 1,
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'domino',
    activity_id: 'domino'
  })
  await page.reload()
  await expect(page.locator('.entry-criteria .tag').first()).toBeVisible()
})

test('entry renders all display fields for a learning_completed event', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'journal-render-test-1',
    version: 1,
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'colouring-free',
    activity_id: 'colouring-free'
  })
  await page.reload()
  await expect(page.locator('.entry-title')).toHaveText('Free Colouring')
  await expect(page.locator('.entry-source')).toContainText('Colouring Playground')
  await expect(page.locator('.entry-criteria .tag')).toHaveCount(2)
  await expect(page.locator('.entry-criteria .tag').nth(0)).toHaveText('Expressive Arts — colour mixing')
  await expect(page.locator('.entry-criteria .tag').nth(1)).toHaveText('Expressive Arts — colour recognition')
})

test('recent event visible under default filter', async ({ page }) => {
  await page.goto(URL)
  await seedEvent(page, {
    id: 'test-5',
    version: 1,
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'domino',
    activity_id: 'domino'
  })
  await page.reload()
  await expect(page.locator('.entry')).toBeVisible()
})
