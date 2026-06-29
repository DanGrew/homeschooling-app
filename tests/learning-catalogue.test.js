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

const playgroundNames = [...new Set(allLearnings.flatMap(l => l.playgrounds.map(v => index.playgrounds[v.id].name)))]

test('renders an All chip plus one chip per area and per playground present', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="lc-chip"]')).toHaveCount(1 + groups.length + playgroundNames.length)
  await expect(page.locator('[data-testid="lc-chip"]').first()).toHaveAttribute('aria-label', 'All')
  await expect(page.locator('[data-testid="lc-chip"][data-chip="all"]')).toHaveClass(/lc-chip-on/)
})

test('typing in search narrows the list to matching cards', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lc-search').fill(sample.title)
  await expect(page.locator('[data-testid="lc-card"]')).toHaveCount(1)
  await expect(page.locator('.lc-card', { hasText: sample.title })).toBeVisible()
})

test('clearing the search restores the full grouped list', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lc-search').fill(sample.title)
  await expect(page.locator('[data-testid="lc-card"]')).toHaveCount(1)
  await page.locator('#lc-search').fill('')
  await expect(page.locator('[data-testid="lc-card"]')).toHaveCount(allLearnings.length)
  await expect(page.locator('.lc-area')).toHaveText(groups.map(g => g.title))
})

test('tapping an area chip shows only that area, preserving its header', async ({ page }) => {
  await page.goto(URL)
  const area = groups[0]
  await page.locator('[data-testid="lc-chip"][aria-label="' + area.title + '"]').click()
  await expect(page.locator('.lc-area')).toHaveText([area.title])
  await expect(page.locator('[data-testid="lc-card"]')).toHaveCount(area.learnings.length)
})

test('tapping a playground chip shows only learnings that practise there', async ({ page }) => {
  await page.goto(URL)
  const name = playgroundNames[0]
  const expected = allLearnings.filter(l => l.playgrounds.some(v => index.playgrounds[v.id].name === name)).length
  await page.locator('[data-testid="lc-chip"][aria-label="' + name + '"]').click()
  await expect(page.locator('[data-testid="lc-chip"][aria-label="' + name + '"]')).toHaveClass(/lc-chip-on/)
  await expect(page.locator('[data-testid="lc-card"]')).toHaveCount(expected)
})

test('playground chips carry the playground class to distinguish them from areas', async ({ page }) => {
  await page.goto(URL)
  const name = playgroundNames[0]
  await expect(page.locator('[data-testid="lc-chip"][aria-label="' + name + '"]')).toHaveClass(/lc-chip-playground/)
  await expect(page.locator('[data-testid="lc-chip"][aria-label="' + groups[0].title + '"]')).toHaveClass(/lc-chip-area/)
})

test('the current-filter label shows the selected filter name on screen', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="lc-current"]')).toContainText('All')
  const name = playgroundNames[0]
  await page.locator('[data-testid="lc-chip"][aria-label="' + name + '"]').click()
  await expect(page.locator('[data-testid="lc-current"]')).toContainText(name)
})

test('opening a card hides the filter bar; back restores it', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.lc-card', { hasText: sample.title }).click()
  await expect(page.locator('#lc-filter')).toBeHidden()
  await page.locator('[data-testid="lc-back"]').click()
  await expect(page.locator('#lc-filter')).toBeVisible()
})

const talk = index.talkPrompts

test('Talk prompts button opens a popup with both static lists', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="lc-talk-btn"]')).toBeVisible()
  await expect(page.locator('[data-testid="lc-talk-pop"]')).toBeHidden()
  await page.locator('[data-testid="lc-talk-btn"]').click()
  await expect(page.locator('[data-testid="lc-talk-pop"]')).toBeVisible()
  const items = page.locator('[data-testid="lc-talk-cols"] li')
  await expect(items).toHaveCount(talk.actions.length + talk.topics.length)
  for (const action of talk.actions) {
    await expect(page.locator('[data-testid="lc-talk-cols"] li', { hasText: action })).toBeVisible()
  }
  for (const topic of talk.topics) {
    await expect(page.locator('[data-testid="lc-talk-cols"] li', { hasText: topic })).toBeVisible()
  }
})

test('Talk prompts popup closes via the close button', async ({ page }) => {
  await page.goto(URL)
  await page.locator('[data-testid="lc-talk-btn"]').click()
  await expect(page.locator('[data-testid="lc-talk-pop"]')).toBeVisible()
  await page.locator('[data-testid="lc-talk-close"]').click()
  await expect(page.locator('[data-testid="lc-talk-pop"]')).toBeHidden()
})

test('Talk prompts button is available on the detail view too', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.lc-card', { hasText: sample.title }).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await expect(page.locator('[data-testid="lc-talk-btn"]')).toBeVisible()
  await page.locator('[data-testid="lc-talk-btn"]').click()
  await expect(page.locator('[data-testid="lc-talk-pop"]')).toBeVisible()
})
