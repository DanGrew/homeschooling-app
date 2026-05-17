const { test, expect } = require('@playwright/test');

const NAV_BAR_PAGES = [
  '/homeschooling-app/app/activities/colouring-palette/',
  '/homeschooling-app/app/activities/logic-gates/puzzle.html',
  '/homeschooling-app/app/activities/number-interaction/',
  '/homeschooling-app/app/activities/piano/lesson.html',
  '/homeschooling-app/app/activities/say-words/',
  '/homeschooling-app/app/activities/colour-wheel/',
  '/homeschooling-app/app/activities/shopping-play/',
  '/homeschooling-app/app/activities/word-match/',
];

for (const pagePath of NAV_BAR_PAGES) {
  test(`${pagePath} — nav-bar width is 56px collapsed`, async ({ page }) => {
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');
    const width = await page.locator('.nav-bar').evaluate(el => el.getBoundingClientRect().width);
    expect(width).toBe(56);
  });
}
