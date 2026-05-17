const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '../..');
const APP_DIR = path.join(ROOT, 'app');

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findHtmlFiles(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

function toPagePath(absPath) {
  return '/homeschooling-app/' + path.relative(ROOT, absPath).replace(/\\/g, '/');
}

// Loads opt-outs from content/contracts/ mirroring the app/ path.
// Returns empty object if no profile exists.
function loadProfile(absPath) {
  const rel = path.relative(APP_DIR, absPath).replace(/\\/g, '/').replace(/\.html$/, '.json');
  const profilePath = path.join(ROOT, 'content/contracts', rel);
  if (!fs.existsSync(profilePath)) return {};
  return JSON.parse(fs.readFileSync(profilePath, 'utf8'))['opt-outs'] || {};
}

const PAGES = findHtmlFiles(APP_DIR)
  .map(absPath => ({ absPath, pagePath: toPagePath(absPath), profile: loadProfile(absPath) }))
  .filter(({ profile }) => !profile.speakable);

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
      if (el.closest('[data-speakable-container]')) continue;
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

// SVG elements that haven't been made speakable (directly or via ancestor).
// excludedIds: parent element IDs declared in the page's opt-out profile.
function findUnwiredSvgs(page, excludedIds) {
  return page.evaluate((excluded) => {
    const results = [];
    for (const svg of document.querySelectorAll('svg')) {
      if (getComputedStyle(svg).display === 'none') continue;
      if (getComputedStyle(svg).visibility === 'hidden') continue;
      if (svg.closest('.speakable')) continue;
      if (svg.closest('[data-speakable-container]')) continue;
      const parent = svg.parentElement;
      if (parent?.id && excluded.includes(parent.id)) continue;
      results.push(parent?.id || parent?.className || '(unknown)');
    }
    return results;
  }, excludedIds);
}

for (const { pagePath, profile } of PAGES) {
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

  test(`${pagePath} — all svgs speakable`, async ({ page }) => {
    if (profile['speakable-svg'] === true) return;

    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');

    const speakableSvgProfile = profile['speakable-svg'];
    const excludedSvgIds = Array.isArray(speakableSvgProfile) ? speakableSvgProfile : [];
    const unwired = await findUnwiredSvgs(page, excludedSvgIds);

    expect(unwired, `Unwired SVGs in ${pagePath}`).toEqual([]);
  });
}
