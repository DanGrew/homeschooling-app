const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const ACTIVITY_PAGES = [
  '/homeschooling-app/app/activities/character-lesson/',
  '/homeschooling-app/app/activities/clock/game-mc.html',
  '/homeschooling-app/app/activities/clock/',
  '/homeschooling-app/app/activities/colour-wheel/',
  '/homeschooling-app/app/activities/colouring-palette/',
  '/homeschooling-app/app/activities/colouring/',
  '/homeschooling-app/app/activities/connect-the-dots/',
  '/homeschooling-app/app/activities/count-shapes/',
  '/homeschooling-app/app/activities/logic-gates/puzzle.html',
  '/homeschooling-app/app/activities/logic-gates/sandbox.html',
  '/homeschooling-app/app/activities/match-colour-shape/',
  '/homeschooling-app/app/activities/match-colour/',
  '/homeschooling-app/app/activities/match-shape/',
  '/homeschooling-app/app/activities/move-blocks/',
  '/homeschooling-app/app/activities/number-interaction/',
  '/homeschooling-app/app/activities/piano/game.html',
  '/homeschooling-app/app/activities/piano/lesson.html',
  '/homeschooling-app/app/activities/primary-colours/',
  '/homeschooling-app/app/activities/puzzle/',
  '/homeschooling-app/app/activities/puzzle/play.html',
  '/homeschooling-app/app/activities/say-words/',
  '/homeschooling-app/app/activities/secondary-colours/',
  '/homeschooling-app/app/activities/shopping-play/',
  '/homeschooling-app/app/activities/shopping-scan/',
  '/homeschooling-app/app/activities/word-lesson/',
  '/homeschooling-app/app/activities/word-match/',
  // Worksheets are adult-facing tools — speakable contract does not apply
];

const WORKSHEET_PAGES = [
  '/homeschooling-app/app/worksheets/character-worksheet/',
  '/homeschooling-app/app/worksheets/colouring-sheets/',
];

// Loads opt-outs from content/contracts/ mirroring the app/ path.
// Returns empty opt-outs if no profile exists.
// Throws if a profile exists but cannot be parsed.
function loadProfile(pagePath) {
  let rel = pagePath.replace('/homeschooling-app/', '');
  if (rel.endsWith('/')) rel += 'index.html';
  rel = rel.replace(/^app\//, '').replace(/\.html$/, '.json');
  const profilePath = path.join(ROOT, 'content/contracts', rel);
  if (!fs.existsSync(profilePath)) return {};
  return JSON.parse(fs.readFileSync(profilePath, 'utf8'))['opt-outs'] || {};
}

const UNWIRED_BUTTONS_SELECTOR = 'button:not(.speakable)';

// Text elements with direct text node children that haven't been made speakable.
// Uses page.evaluate to filter by direct text nodes (not just descendant text) to
// avoid flagging wrapper containers and double-counting nested elements.
// excludedIds: element IDs declared in the page's opt-out profile.
function findUnwiredText(page, excludedIds) {
  return page.evaluate((excluded) => {
    const candidates = document.querySelectorAll(
      'p, span, h1, h2, h3, h4, label, li, td, div'
    );
    const results = [];
    for (const el of candidates) {
      if (el.classList.contains('speakable')) continue;
      if (el.closest('.speakable')) continue;
      if (getComputedStyle(el).display === 'none') continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      if (el.id && excluded.includes(el.id)) continue;
      const hasDirectText = Array.from(el.childNodes).some(
        n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
      );
      if (hasDirectText) results.push(el.textContent.trim().slice(0, 60));
    }
    return results;
  }, excludedIds);
}

for (const pagePath of ACTIVITY_PAGES) {
  const profile = loadProfile(pagePath);
  const excludedIds = profile['speakable-text'] || [];

  test(`${pagePath} — all buttons speakable`, async ({ page }) => {
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');

    const unwired = await page.$$eval(
      UNWIRED_BUTTONS_SELECTOR,
      els => els.map(el => el.textContent?.trim() || '(no text)')
    );

    expect(unwired, `Unwired buttons in ${pagePath}`).toEqual([]);
  });

  test(`${pagePath} — all text speakable`, async ({ page }) => {
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');

    const unwired = await findUnwiredText(page, excludedIds);

    expect(unwired, `Unwired text in ${pagePath}`).toEqual([]);
  });
}
