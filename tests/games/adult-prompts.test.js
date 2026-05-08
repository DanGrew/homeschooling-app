const { test, expect } = require('@playwright/test');

const URL = '/homeschooling-app/app/activities/colour-wheel/';

async function longPress(page, locator) {
  const box = await locator.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
}

test('prompt button visible after page load', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('[data-testid="adult-prompts-btn"]')).toBeVisible({ timeout: 3000 });
});

test('card hidden on short tap', async ({ page }) => {
  await page.goto(URL);
  await page.locator('[data-testid="adult-prompts-btn"]').click();
  await expect(page.locator('[data-testid="adult-prompts-card"]')).toBeHidden();
});

test('long press opens card', async ({ page }) => {
  await page.goto(URL);
  const btn = page.locator('[data-testid="adult-prompts-btn"]');
  await btn.waitFor({ state: 'visible', timeout: 3000 });
  await longPress(page, btn);
  await expect(page.locator('[data-testid="adult-prompts-card"]')).toBeVisible();
});

test('card shows FOR YOU header', async ({ page }) => {
  await page.goto(URL);
  await longPress(page, page.locator('[data-testid="adult-prompts-btn"]'));
  await expect(page.locator('[data-testid="adult-prompts-card"]')).toContainText('FOR YOU');
});

test('card shows prompt text', async ({ page }) => {
  await page.goto(URL);
  await longPress(page, page.locator('[data-testid="adult-prompts-btn"]'));
  const text = await page.locator('[data-testid="adult-prompts-text"]').textContent();
  expect(text.trim().length).toBeGreaterThan(0);
});

test('card shows type badge', async ({ page }) => {
  await page.goto(URL);
  await longPress(page, page.locator('[data-testid="adult-prompts-btn"]'));
  const type = await page.locator('[data-testid="adult-prompts-type"]').textContent();
  expect(['ASK', 'SAY', 'WORD']).toContain(type.trim());
});

test('next button advances prompt and updates count', async ({ page }) => {
  await page.goto(URL);
  await longPress(page, page.locator('[data-testid="adult-prompts-btn"]'));
  await expect(page.locator('[data-testid="adult-prompts-count"]')).toContainText('1');
  await page.locator('[data-testid="adult-prompts-next"]').click();
  await expect(page.locator('[data-testid="adult-prompts-count"]')).toContainText('2');
});

test('prev button wraps from first to last prompt', async ({ page }) => {
  await page.goto(URL);
  await longPress(page, page.locator('[data-testid="adult-prompts-btn"]'));
  const countText = await page.locator('[data-testid="adult-prompts-count"]').textContent();
  const total = parseInt(countText.split('/')[1].trim());
  await page.locator('[data-testid="adult-prompts-prev"]').click();
  await expect(page.locator('[data-testid="adult-prompts-count"]')).toContainText(String(total));
});

test('close button hides card', async ({ page }) => {
  await page.goto(URL);
  await longPress(page, page.locator('[data-testid="adult-prompts-btn"]'));
  await page.locator('[data-testid="adult-prompts-close"]').click();
  await expect(page.locator('[data-testid="adult-prompts-card"]')).toBeHidden();
});

test('prompt button absent on page without activity set', async ({ page }) => {
  await page.goto('/homeschooling-app/app/games/');
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="adult-prompts-btn"]')).toHaveCount(0);
});
