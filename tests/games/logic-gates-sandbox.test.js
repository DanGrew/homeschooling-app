const { test, expect } = require('@playwright/test');

const URL = '/homeschooling-app/app/activities/logic-gates/sandbox.html';

async function waitForStation(page) {
  await page.waitForSelector('[data-switch]', { state: 'attached' });
}

test('page loads with puzzle area', async ({ page }) => {
  await page.goto(URL);
  await waitForStation(page);
  await expect(page.locator('#puzzle-area')).toBeVisible();
});

test('SVG station is rendered in puzzle area', async ({ page }) => {
  await page.goto(URL);
  await waitForStation(page);
  await expect(page.locator('#puzzle-area svg')).toBeVisible();
});

test('switch elements are rendered', async ({ page }) => {
  await page.goto(URL);
  await waitForStation(page);
  expect(await page.locator('[data-switch]').count()).toBeGreaterThan(0);
});

test('paginator bar is rendered', async ({ page }) => {
  await page.goto(URL);
  await waitForStation(page);
  await expect(page.locator('#paginator-bar')).toBeVisible();
});

test('filter bar has Primitives, Linear, Converging buttons', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#nav-filter-slot button[data-value="primitive"]')).toBeVisible();
  await expect(page.locator('#nav-filter-slot button[data-value="linear"]')).toBeVisible();
  await expect(page.locator('#nav-filter-slot button[data-value="converging"]')).toBeVisible();
});

test('All filter button active on load', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#nav-filter-slot button[data-value="all"]')).toHaveCSS('background-color', 'rgb(52, 152, 219)');
});

test('clicking Primitives filter marks it active', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#nav-filter-slot button[data-value="primitive"]').click();
  await expect(page.locator('#nav-filter-slot button[data-value="primitive"]')).toHaveCSS('background-color', 'rgb(52, 152, 219)');
  await expect(page.locator('#nav-filter-slot button[data-value="all"]')).not.toHaveCSS('background-color', 'rgb(52, 152, 219)');
});

test('clicking a switch does not throw', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
  await waitForStation(page);
  await page.locator('[data-switch]').first().click();
  expect(errors).toHaveLength(0);
});

test('clicking a switch updates wire colour', async ({ page }) => {
  await page.goto(URL);
  await waitForStation(page);
  const before = await page.locator('[data-wire]').first().getAttribute('stroke');
  await page.locator('[data-switch]').first().click();
  const after = await page.locator('[data-wire]').first().getAttribute('stroke');
  expect(after).not.toBe(before);
});

test('clicking switch twice returns wire to inactive colour', async ({ page }) => {
  await page.goto(URL);
  await waitForStation(page);
  await page.locator('[data-switch]').first().click();
  await page.locator('[data-switch]').first().click();
  const colour = await page.locator('[data-wire]').first().getAttribute('stroke');
  expect(colour).toBe('#ccc');
});

test('Lessons button is present in nav', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('.nav-lesson-btn')).toBeVisible();
});

test('Exercises button is present in nav', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('.nav-exercise-btn')).toBeVisible();
});

test('Lessons popout lists 5 lessons', async ({ page }) => {
  await page.goto(URL);
  await page.locator('.nav-lesson-btn').click();
  const items = page.locator('.nav-lesson-item');
  await expect(items).toHaveCount(5);
});

test('Exercises popout lists 1 exercise', async ({ page }) => {
  await page.goto(URL);
  await page.locator('.nav-exercise-btn').click();
  const items = page.locator('.nav-exercise-item');
  await expect(items).toHaveCount(1);
});

test('switching to Converging filter shows puzzle with switches', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#nav-filter-slot button[data-value="converging"]').click();
  await waitForStation(page);
  expect(await page.locator('[data-switch]').count()).toBeGreaterThan(0);
});

test('paginator next advances to next item', async ({ page }) => {
  await page.goto(URL);
  await waitForStation(page);
  const indicator = page.locator('#paginator-bar span');
  const before = await indicator.textContent();
  await page.locator('#paginator-bar button').last().click();
  await waitForStation(page);
  const after = await indicator.textContent();
  expect(after).not.toBe(before);
});
