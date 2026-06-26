const { test, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const URL = '/homeschooling-app/app/resources/learning-catalogue/'
const CAT_DIR = path.join(__dirname, '..', 'content', 'learning-catalogue')

const index = JSON.parse(fs.readFileSync(path.join(CAT_DIR, 'index.json'), 'utf8'))
const groups = index.areas
  .slice()
  .sort((a, b) => a.order - b.order)
  .map(area => ({
    title: area.title,
    learnings: JSON.parse(fs.readFileSync(path.join(CAT_DIR, area.file), 'utf8')).learnings
  }))
const allLearnings = groups.flatMap(g => g.learnings)
const sample = groups[0].learnings[0]
const sampleVenue = sample.playgrounds[0]

test('renders every card read from the area JSON files', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="lc-card"]')).toHaveCount(allLearnings.length)
  for (const learning of allLearnings) {
    await expect(page.locator('.lc-card', { hasText: learning.title })).toBeVisible()
  }
})

test('groups cards by EYFS area in index order', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.lc-area')).toHaveText(groups.map(g => g.title))
})

test('tapping a card opens its detail view', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.lc-card', { hasText: sample.title }).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await expect(page.locator('#lc-list')).toBeHidden()
  await expect(page.locator('.lc-focus')).toContainText(sample.focus)
})

test('Where to practise launches each venue in free mode', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.lc-card', { hasText: sample.title }).click()
  const venues = page.locator('[data-testid="lc-venue"]')
  await expect(venues).toHaveCount(sample.playgrounds.length)
  await expect(venues.first()).toHaveText(new RegExp(index.playgrounds[sampleVenue.id].name))
  await expect(venues.first()).toHaveAttribute('href', '../../activities/' + sampleVenue.id + '/')
})

test('back returns from detail to the list', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.lc-card', { hasText: sample.title }).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await page.locator('[data-testid="lc-back"]').click()
  await expect(page.locator('#lc-list')).toBeVisible()
  await expect(page.locator('#lc-detail')).toBeHidden()
})

test('standard nav-bar with home link is present', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar')).toHaveCSS('width', '56px')
  await expect(page.locator('.nav-bar a').first()).toBeVisible()
  await expect(page.locator('.activity-title')).toContainText('Learning Catalogue')
})
