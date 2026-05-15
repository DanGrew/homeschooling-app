const { test, expect } = require('@playwright/test')

test('speed buttons change the audio playback rate', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/story-time/?story=david-and-goliath')
  await expect(page.locator('#words span').first()).toBeVisible({ timeout: 5000 })
  await page.locator('.speed-btn[data-speed="0.5"]').click()
  const rate = await page.evaluate(() => document.getElementById('aud').playbackRate)
  expect(rate).toBe(0.5)
})

test('Play and Stop buttons are visible', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/story-time/?story=david-and-goliath')
  await expect(page.locator('#playbtn')).toBeVisible()
  await expect(page.locator('#stopbtn')).toBeVisible()
})

test('nav link points to stories hub', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/story-time/?story=david-and-goliath')
  const href = await page.locator('.nav-bar a.nav-btn').evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/stories/')
})

const STORIES = [
  { id: 'adam-and-eve',           title: 'Adam and Eve' },
  { id: 'cain-and-abel',          title: 'Cain and Abel' },
  { id: 'jacob-and-esau',         title: 'Jacob and Esau' },
  { id: 'joseph',                 title: 'Joseph' },
  { id: 'samson-and-delilah',     title: 'Samson and Delilah' },
  { id: 'david-and-goliath',      title: 'David and Goliath' },
  { id: 'jonah-and-the-big-fish', title: 'Jonah and the Big Fish' },
]

for (const story of STORIES) {
  test(`${story.title}: shows title`, async ({ page }) => {
    await page.goto(`/homeschooling-app/app/activities/story-time/?story=${story.id}`)
    await expect(page.locator('.activity-title')).toHaveText(story.title)
  })

  test(`${story.title}: loads words`, async ({ page }) => {
    await page.goto(`/homeschooling-app/app/activities/story-time/?story=${story.id}`)
    await expect(page.locator('#words span').first()).toBeVisible({ timeout: 5000 })
  })
}
