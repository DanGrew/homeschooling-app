const { test, expect } = require('@playwright/test');

const ACTIVITIES = [
  '/homeschooling-app/app/activities/secondary-colours/',
  '/homeschooling-app/app/activities/simulator/',
  '/homeschooling-app/app/activities/story-time/',
  '/homeschooling-app/app/activities/say-words/',
  '/homeschooling-app/app/activities/word-lesson/',
  '/homeschooling-app/app/activities/word-match/',
  '/homeschooling-app/app/activities/count-shapes/',
  '/homeschooling-app/app/activities/match-colour/',
  '/homeschooling-app/app/activities/match-shape/',
  '/homeschooling-app/app/activities/match-colour-shape/',
  '/homeschooling-app/app/activities/number-interaction/',
  '/homeschooling-app/app/activities/piano/lesson.html',
  '/homeschooling-app/app/activities/piano/game.html',
  '/homeschooling-app/app/activities/connect-the-dots/',
  '/homeschooling-app/app/activities/shopping-scan/',
  '/homeschooling-app/app/activities/move-blocks/',
  '/homeschooling-app/app/activities/puzzle/',
  '/homeschooling-app/app/activities/character-lesson/',
];

for (const url of ACTIVITIES) {
  test(`adult prompt button visible — ${url}`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('[data-testid="adult-prompts-btn"]')).toBeVisible({ timeout: 5000 });
  });
}
