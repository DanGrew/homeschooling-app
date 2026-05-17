const { test, expect } = require('@playwright/test');

const URL = '/homeschooling-app/app/activities/logic-gates/sandbox.html';

test('page loads with station container', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#stations-container')).toBeVisible();
});

test('at least one gate heading is rendered', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('#stations-container h2');
  await expect(page.locator('#stations-container h2').first()).toBeVisible();
});

test('AND gate heading is present', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('#stations-container h2');
  await expect(page.locator('#stations-container h2').first()).toContainText('gate');
});

test('SVG station is rendered inside container', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('#stations-container svg');
  await expect(page.locator('#stations-container svg').first()).toBeVisible();
});

test('switch elements are rendered', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('[data-switch]');
  const switches = page.locator('[data-switch]');
  await expect(switches.first()).toBeVisible();
});

test('multiple gate stations are rendered', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('#stations-container svg');
  const stations = page.locator('#stations-container svg');
  await expect(stations).toHaveCount(await stations.count());
  expect(await stations.count()).toBeGreaterThan(1);
});

test('separators appear between stations', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('#stations-container hr');
  await expect(page.locator('#stations-container hr').first()).toBeVisible();
});

test('clicking a switch does not throw', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
  await page.waitForSelector('[data-switch]');
  await page.locator('[data-switch]').first().click();
  expect(errors).toHaveLength(0);
});

test('clicking a switch updates wire colour', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('[data-wire]');

  const wireBefore = await page.locator('[data-wire]').first().getAttribute('stroke');

  await page.locator('[data-switch]').first().click();

  const wireAfter = await page.locator('[data-wire]').first().getAttribute('stroke');
  expect(wireAfter).not.toBe('#ccc');
  expect(wireAfter).not.toBe(wireBefore);
});

test('gate pills are clickable and do not throw', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
  await page.waitForSelector('[data-gate-pill]');
  await page.locator('[data-gate-pill]').first().click();
  expect(errors).toHaveLength(0);
});

test('clicking switch twice returns wire to inactive colour', async ({ page }) => {
  await page.goto(URL);
  await page.waitForSelector('[data-wire]');

  await page.locator('[data-switch]').first().click();
  await page.locator('[data-switch]').first().click();

  const wireColour = await page.locator('[data-wire]').first().getAttribute('stroke');
  expect(wireColour).toBe('#ccc');
});
