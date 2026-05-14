const { test, expect } = require('@playwright/test');

const ACTIVITY_PAGES = [
  '/homeschooling-app/app/activities/character-lesson/',
  '/homeschooling-app/app/activities/clock/game-mc.html',
  '/homeschooling-app/app/activities/clock/',
  '/homeschooling-app/app/activities/colour-wheel/',
  '/homeschooling-app/app/activities/colouring-palette/',
  '/homeschooling-app/app/activities/colouring/',
  '/homeschooling-app/app/activities/connect-the-dots/',
  '/homeschooling-app/app/activities/count-shapes/',
  '/homeschooling-app/app/activities/drawing-dots/',
  '/homeschooling-app/app/activities/logic-gates/puzzle.html',
  '/homeschooling-app/app/activities/logic-gates/sandbox.html',
  '/homeschooling-app/app/activities/match-colour-shape/',
  '/homeschooling-app/app/activities/match-colour/',
  '/homeschooling-app/app/activities/match-shape/',
  '/homeschooling-app/app/activities/move-blocks/',
  '/homeschooling-app/app/activities/number-interaction/',
  '/homeschooling-app/app/activities/piano/game.html',
  '/homeschooling-app/app/activities/piano/lesson.html',
  '/homeschooling-app/app/activities/piano/songs.html',
  '/homeschooling-app/app/activities/primary-colours/',
  '/homeschooling-app/app/activities/puzzle/',
  '/homeschooling-app/app/activities/puzzle/play.html',
  '/homeschooling-app/app/activities/say-words/',
  '/homeschooling-app/app/activities/secondary-colours/',
  '/homeschooling-app/app/activities/shopping-play/',
  '/homeschooling-app/app/activities/shopping-scan/',
  '/homeschooling-app/app/activities/word-lesson/',
  '/homeschooling-app/app/activities/word-match/',
  '/homeschooling-app/app/worksheets/character-worksheet/',
  '/homeschooling-app/app/worksheets/colouring-sheets/',
];

// Selector: all buttons except nav-bar navigation buttons
const UNWIRED_SELECTOR = '.game-area button:not(.speakable):not([data-no-speak])';

for (const pagePath of ACTIVITY_PAGES) {
  test(`${pagePath} — all buttons speakable`, async ({ page }) => {
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');

    const unwired = await page.$$eval(
      UNWIRED_SELECTOR,
      els => els.map(el => el.textContent?.trim() || '(no text)')
    );

    expect(unwired, `Unwired buttons in ${pagePath}`).toEqual([]);
  });
}
