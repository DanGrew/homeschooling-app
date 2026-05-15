const { test, expect } = require('@playwright/test')

// Pages that implement the standard nav: left sidebar, 56px wide, title above filter
const PAGES = [
  { url: '/homeschooling-app/app/activities/say-words/',      title: 'Say Words'     },
  { url: '/homeschooling-app/app/activities/word-match/',     title: 'Word Match'    },
  { url: '/homeschooling-app/app/activities/character-lesson/', title: 'Trace Letters' },
  { url: '/homeschooling-app/app/activities/word-lesson/',    title: 'Trace Words'   },
  { url: '/homeschooling-app/app/activities/colour-wheel/',   title: 'Colour Wheel'  },
]

for (const { url, title } of PAGES) {
  test(`${title}: nav-bar is 56px wide`, async ({ page }) => {
    await page.goto(url)
    await expect(page.locator('.nav-bar')).toHaveCSS('width', '56px')
  })

  test(`${title}: home button present in nav-bar`, async ({ page }) => {
    await page.goto(url)
    await expect(page.locator('.nav-bar a').first()).toBeVisible()
  })

  test(`${title}: activity title visible with correct text`, async ({ page }) => {
    await page.goto(url)
    await expect(page.locator('.activity-title')).toContainText(title)
  })

  test(`${title}: activity title has purple glow`, async ({ page }) => {
    await page.goto(url)
    const filter = await page.locator('.activity-title').evaluate(el => getComputedStyle(el).filter)
    expect(filter).toMatch(/drop-shadow/)
  })

  test(`${title}: activity header is first child of game-area`, async ({ page }) => {
    await page.goto(url)
    const firstChildClass = await page.locator('.game-area > *').first().getAttribute('class')
    expect(firstChildClass).toMatch(/activity-header/)
  })
}
