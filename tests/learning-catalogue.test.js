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

// A card's title is the only place its title is the WHOLE text — keywords and concepts on other
// cards can contain it as a substring ("bedtime" on Times of day vs the Bedtime moment card).
const exactly = text => new RegExp('^' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')
const cardByTitle = (page, title) =>
  page.locator('.lc-card').filter({ has: page.locator('.lc-title', { hasText: exactly(title) }) })

test('renders every card read from the area JSON files', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('[data-testid="lc-card"]')).toHaveCount(allLearnings.length)
  for (const learning of allLearnings) {
    await expect(cardByTitle(page, learning.title)).toBeVisible()
  }
})

test('groups cards by EYFS area in index order', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.lc-area')).toHaveText(groups.map(g => g.title))
})

test('tapping a card opens its detail view', async ({ page }) => {
  await page.goto(URL)
  await cardByTitle(page, sample.title).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await expect(page.locator('#lc-list')).toBeHidden()
  await expect(page.locator('.lc-focus')).toContainText(sample.focus)
})

test('a card with an explain field shows a Why section with its text', async ({ page }) => {
  const explained = allLearnings.find(l => l.explain)
  await page.goto(URL)
  await cardByTitle(page, explained.title).click()
  const why = page.locator('.lc-sec', { hasText: '💡 Why' })
  await expect(why).toBeVisible()
  await expect(why).toContainText('fire')
  await expect(why).toContainText('water')
  await expect(why).toContainText(explained.explain)
})

test('a card without an explain field renders no Why section', async ({ page }) => {
  const plain = allLearnings.find(l => !l.explain)
  await page.goto(URL)
  await cardByTitle(page, plain.title).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await expect(page.locator('.lc-sec', { hasText: '💡 Why' })).toHaveCount(0)
})

test('Where to practise launches each venue in free mode', async ({ page }) => {
  await page.goto(URL)
  await cardByTitle(page, sample.title).click()
  const venues = page.locator('[data-testid="lc-venue"]')
  await expect(venues).toHaveCount(sample.playgrounds.length)
  await expect(venues.first()).toHaveText(new RegExp(index.playgrounds[sampleVenue.id].name))
  await expect(venues.first()).toHaveAttribute('href', '../../activities/' + sampleVenue.id + '/')
})

test('back returns from detail to the list', async ({ page }) => {
  await page.goto(URL)
  await cardByTitle(page, sample.title).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await page.locator('[data-testid="lc-back"]').click()
  await expect(page.locator('#lc-list')).toBeVisible()
  await expect(page.locator('#lc-detail')).toBeHidden()
})

test('returning from a card keeps the list scroll position', async ({ page }) => {
  await page.goto(URL)
  const lastTitle = allLearnings[allLearnings.length - 1].title
  await cardByTitle(page, lastTitle).scrollIntoViewIfNeeded()
  const before = await page.locator('.lc-scroll').evaluate(el => el.scrollTop)
  expect(before).toBeGreaterThan(0)
  await cardByTitle(page, lastTitle).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await page.locator('[data-testid="lc-back"]').click()
  await expect(page.locator('#lc-list')).toBeVisible()
  const after = await page.locator('.lc-scroll').evaluate(el => el.scrollTop)
  expect(Math.abs(after - before)).toBeLessThan(5)
})

test('standard nav-bar with home link is present', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-bar')).toHaveCSS('width', '56px')
  await expect(page.locator('.nav-bar a').first()).toBeVisible()
  await expect(page.locator('.activity-title')).toContainText('Learning Catalogue')
})

const playgroundNames = [...new Set(allLearnings.flatMap(l => (l.playgrounds || []).map(v => index.playgrounds[v.id].name)))]

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
  await expect(cardByTitle(page, sample.title)).toBeVisible()
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
  const expected = allLearnings.filter(l => (l.playgrounds || []).some(v => index.playgrounds[v.id].name === name)).length
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
  await cardByTitle(page, sample.title).click()
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

const picCard = allLearnings.find(l => l.makePictures)

test('a card with makePictures shows a Pictures to make section with one tile per picture', async ({ page }) => {
  await page.goto(URL)
  await cardByTitle(page, picCard.title).click()
  const section = page.locator('.lc-sec', { hasText: '🖼️ Pictures to make' })
  await expect(section).toBeVisible()
  await expect(page.locator('[data-testid="lc-pic"]')).toHaveCount(picCard.makePictures.length)
  for (const pic of picCard.makePictures) {
    await expect(page.locator('.lc-pic', { hasText: pic.title })).toBeVisible()
  }
  await expect(page.locator('[data-testid="lc-pic"] svg').first()).toBeVisible()
})

test('tapping a picture tile opens the enlarge popup with its title', async ({ page }) => {
  await page.goto(URL)
  await cardByTitle(page, picCard.title).click()
  await expect(page.locator('[data-testid="lc-picpop"]')).toBeHidden()
  await page.locator('[data-testid="lc-pic"]').first().click()
  await expect(page.locator('[data-testid="lc-picpop"]')).toBeVisible()
  await expect(page.locator('[data-testid="lc-picpop-title"]')).toHaveText(picCard.makePictures[0].title)
  await expect(page.locator('#lc-picpop-svg svg')).toBeVisible()
})

test('the enlarge popup closes via the close button and the backdrop', async ({ page }) => {
  await page.goto(URL)
  await cardByTitle(page, picCard.title).click()
  await page.locator('[data-testid="lc-pic"]').first().click()
  await expect(page.locator('[data-testid="lc-picpop"]')).toBeVisible()
  await page.locator('[data-testid="lc-picpop-close"]').click()
  await expect(page.locator('[data-testid="lc-picpop"]')).toBeHidden()
  await page.locator('[data-testid="lc-pic"]').nth(1).click()
  await expect(page.locator('[data-testid="lc-picpop"]')).toBeVisible()
  await page.locator('#lc-picpop-backdrop').click({ position: { x: 8, y: 8 } })
  await expect(page.locator('[data-testid="lc-picpop"]')).toBeHidden()
})

test('a card without makePictures renders no Pictures to make section', async ({ page }) => {
  const plain = allLearnings.find(l => !l.makePictures)
  await page.goto(URL)
  await cardByTitle(page, plain.title).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await expect(page.locator('.lc-sec', { hasText: '🖼️ Pictures to make' })).toHaveCount(0)
})

test('Talk prompts button is available on the detail view too', async ({ page }) => {
  await page.goto(URL)
  await cardByTitle(page, sample.title).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await expect(page.locator('[data-testid="lc-talk-btn"]')).toBeVisible()
  await page.locator('[data-testid="lc-talk-btn"]').click()
  await expect(page.locator('[data-testid="lc-talk-pop"]')).toBeVisible()
})

const moment = allLearnings.find(l => l.type === 'life-moment')

test('a life-moment card opens a detail view listing its themes, with no curriculum or venue sections', async ({ page }) => {
  await page.goto(URL)
  await cardByTitle(page, moment.title).click()
  await expect(page.locator('#lc-detail')).toBeVisible()
  await expect(page.locator('.lc-focus')).toContainText(moment.focus)
  for (const theme of moment.themes) {
    await expect(page.locator('.lc-theme-title', { hasText: theme.title })).toBeVisible()
  }
  await expect(page.locator('.lc-sec', { hasText: '📚 Curriculum' })).toHaveCount(0)
  await expect(page.locator('.lc-sec', { hasText: '▶ Where to practise' })).toHaveCount(0)
})

test('searching a life-moment theme surfaces its card', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lc-search').fill(moment.themes[0].title.split(' ')[0])
  await expect(cardByTitle(page, moment.title)).toBeVisible()
})
