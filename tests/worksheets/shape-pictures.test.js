const { test, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const URL = '/homeschooling-app/app/worksheets/shape-pictures/'
const CONTENT = path.join(__dirname, '../../content/shape-pictures/shape-pictures.json')
const OWNER_PICTURES = ['Bike', 'Broom', 'Bunny Rabbit', 'Castle', 'Cat', 'Dinosaur', 'Dog', 'Helicopter', 'House', 'Plane', 'Robot', 'Rocket', 'Train']

async function open(page) {
  await page.goto(URL)
  await expect(page.locator('.panel-item')).toHaveCount(OWNER_PICTURES.length)
}

const tick = (page, id) => page.locator(`.panel-item input[data-picture="${id}"]`).check()
const pdfPages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length

test('worksheets hub shows a Shape Pictures tile next to the other worksheets', async ({ page }) => {
  await page.goto('/homeschooling-app/app/worksheets/')
  const tiles = page.locator('.tile span')
  await expect(tiles).toHaveText(['Letter Worksheet', 'Colouring Sheets', 'Shape Pictures'])
  await page.locator('.tile', { hasText: 'Shape Pictures' }).click()
  await expect(page).toHaveURL(/\/worksheets\/shape-pictures\/$/)
})

test('panel lists the owner pictures by name with difficulty dots, and no draft examples', async ({ page }) => {
  await open(page)
  await expect(page.locator('.panel-item label')).toHaveText(OWNER_PICTURES)
  await expect(page.locator('.panel-item .sp-dots').first()).toHaveText(/^[●○]{3}$/)
  await expect(page.locator('.panel-item', { hasText: 'Broom' }).locator('.sp-dots')).toHaveText('●○○')
  await expect(page.locator('.panel-item', { hasText: 'Train' }).locator('.sp-dots')).toHaveText('●●●')
  for (const draft of ['Garden Visitor', 'Under the Sea', 'Robot Friend', 'Sailing Day', 'Sweet Shop', 'Snail in the Park']) {
    await expect(page.locator('.panel-item', { hasText: draft })).toHaveCount(0)
  }
})

test('ticking a picture adds a coloured card with its piece list; unticking removes it', async ({ page }) => {
  await open(page)
  await expect(page.locator('#empty-msg')).toBeVisible()
  await tick(page, 'rocket')
  const card = page.locator('.worksheet-item[data-picture="rocket"]')
  await expect(card).toBeVisible()
  await expect(page.locator('#empty-msg')).toBeHidden()
  await expect(card.locator('.sp-pic g > *')).toHaveCount(7)
  await expect(card.locator('.sp-pieces li', { hasText: 'Yellow half-circle ×2' })).toBeVisible()
  await expect(card.locator('.sp-pieces li svg').first()).toBeVisible()
  const fills = await card.locator('.sp-pic g > *').evaluateAll(els => new Set(els.map(e => getComputedStyle(e).fill)).size)
  expect(fills).toBeGreaterThan(1)
  await page.locator('.panel-item input[data-picture="rocket"]').uncheck()
  await expect(page.locator('.worksheet-item')).toHaveCount(0)
  await expect(page.locator('#empty-msg')).toBeVisible()
})

test('cards keep list order whatever order they are ticked in', async ({ page }) => {
  await open(page)
  await tick(page, 'train')
  await tick(page, 'bike')
  await tick(page, 'house')
  await expect(page.locator('.worksheet-item h3')).toHaveText(['Bike', 'House', 'Train'])
})

test('shadow turns every picture one solid dark silhouette, keeps piece lists, and reverts', async ({ page }) => {
  await open(page)
  await tick(page, 'castle')
  const shapes = page.locator('.worksheet-item .sp-pic g > *')
  const paint = () => shapes.evaluateAll(els => [...new Set(els.flatMap(e => [getComputedStyle(e).fill, getComputedStyle(e).stroke]))])
  const colour = await paint()
  await page.locator('#shadow-toggle').check()
  expect(await paint()).toEqual(['rgb(59, 74, 87)'])
  await expect(page.locator('.worksheet-item .sp-pieces li')).toHaveCount(13)
  const chipFills = await page.locator('.sp-pieces li svg > *').evaluateAll(els => new Set(els.map(e => getComputedStyle(e).fill)).size)
  expect(chipFills).toBeGreaterThan(1)
  await page.locator('#shadow-toggle').uncheck()
  expect(await paint()).toEqual(colour)
})

test('print shows only the ticked pictures, two per A4 page, without the panel', async ({ page }) => {
  await open(page)
  for (const id of ['bike', 'castle', 'robot']) await tick(page, id)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('#panel')).toBeHidden()
  await expect(page.locator('.worksheet-item')).toHaveCount(3)
  const three = await page.pdf({ format: 'A4', preferCSSPageSize: true })
  expect(pdfPages(three)).toBe(2)
  await page.emulateMedia({ media: 'screen' })
  await tick(page, 'train')
  await page.emulateMedia({ media: 'print' })
  const four = await page.pdf({ format: 'A4', preferCSSPageSize: true })
  expect(pdfPages(four)).toBe(2)
})

test('print button opens the print dialog', async ({ page }) => {
  await open(page)
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++ } })
  await page.locator('#btn-print').click()
  expect(await page.evaluate(() => window.__printed)).toBe(1)
})

test('a picture added to the content file shows up with no code change', async ({ page }) => {
  const data = JSON.parse(fs.readFileSync(CONTENT, 'utf8'))
  data.pictures.push({ name: 'Aardvark', level: 1, parts: [{ piece: 'Qb', x: 0, y: 0 }] })
  await page.route('**/content/shape-pictures/shape-pictures.json', route => route.fulfill({ json: data }))
  await page.goto(URL)
  await expect(page.locator('.panel-item label').first()).toHaveText('Aardvark')
  await tick(page, 'aardvark')
  await expect(page.locator('.worksheet-item[data-picture="aardvark"] .sp-pieces li')).toHaveText(['Small blue square ×1'])
})

test('shows a load error if the content cannot be fetched', async ({ page }) => {
  await page.route('**/content/shape-pictures/shape-pictures.json', route => route.abort())
  await page.goto(URL)
  await expect(page.locator('#panel-list')).toHaveText(/Failed to load/)
})

test('on a phone-width screen each picture shows whole and readable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 })
  await open(page)
  await tick(page, 'dinosaur')
  const card = page.locator('.worksheet-item')
  await card.scrollIntoViewIfNeeded()
  const pic = await card.locator('.sp-pic').boundingBox()
  expect(pic.x).toBeGreaterThanOrEqual(0)
  expect(pic.x + pic.width).toBeLessThanOrEqual(375)
  expect(pic.width).toBeGreaterThan(250)
  expect(pic.height).toBeGreaterThan(120)
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollW).toBeLessThanOrEqual(375)
})

test('nav link points to worksheets index', async ({ page }) => {
  await page.goto(URL)
  const href = await page.locator('#panel-header a').evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/worksheets/')
})
