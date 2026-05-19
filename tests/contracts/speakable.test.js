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
  const patternSources = excludedIds.map(id => '^' + id.replace(/\*/g, '.*') + '$');
  return page.evaluate(({ excluded, patternSources }) => {
    const patterns = patternSources.map(s => new RegExp(s));
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
      if (el.id && (excluded.includes(el.id) || patterns.some(p => p.test(el.id)))) continue;
      const hasDirectText = Array.from(el.childNodes).some(
        n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
      );
      if (hasDirectText) results.push(el.textContent.trim().slice(0, 60));
    }
    return results;
  }, { excluded: excludedIds, patternSources });
}

// SVG elements that haven't been made speakable (directly or via ancestor).
// Returns flat array of parent id/class strings (one entry per unwired SVG).
function findUnwiredSvgs(page) {
  return page.evaluate(() => {
    const results = [];
    for (const svg of document.querySelectorAll('svg')) {
      if (getComputedStyle(svg).display === 'none') continue;
      if (getComputedStyle(svg).visibility === 'hidden') continue;
      if (svg.closest('.speakable')) continue;
      if (svg.closest('[data-speakable-container]')) continue;
      if (svg.querySelector('#speakable-glow')) continue;
      const parent = svg.parentElement;
      results.push(parent?.id || parent?.className || '(unknown)');
    }
    return results;
  });
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
    await page.goto(pagePath);
    await page.waitForLoadState('networkidle');

    const allUnwired = await findUnwiredSvgs(page);
    const exclusions = profile['speakable-svg'] || {};
    const patternRe = Object.fromEntries(
      Object.keys(exclusions).map(k => [k, new RegExp('^' + k.replace(/\*/g, '.*') + '$')])
    );
    function matchKey(id) {
      return Object.keys(patternRe).find(k => patternRe[k].test(id));
    }

    const errors = [];
    const actualCounts = {};
    for (const parentId of allUnwired) {
      const key = matchKey(parentId);
      if (key) {
        actualCounts[parentId] = (actualCounts[parentId] || 0) + 1;
      } else {
        errors.push(`unwired: ${parentId}`);
      }
    }
    for (const [pattern, declared] of Object.entries(exclusions)) {
      const re = patternRe[pattern];
      if (!pattern.includes('*')) {
        const actual = actualCounts[pattern] || 0;
        if (actual !== declared) errors.push(`${pattern}: declared ${declared}, found ${actual}`);
      } else {
        const matched = Object.entries(actualCounts).filter(([id]) => re.test(id));
        for (const [id, actual] of matched) {
          if (actual !== declared) errors.push(`${id}: declared ${declared}, found ${actual}`);
        }
      }
    }

    expect(errors, `SVG violations in ${pagePath}`).toEqual([]);
  });
}
