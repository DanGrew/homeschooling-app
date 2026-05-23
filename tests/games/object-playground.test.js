const { test, expect } = require('@playwright/test');

test('page loads and shows 10 objects', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const objects = page.locator('[data-obj]');
  await expect(objects).toHaveCount(10);
});

test('objects are visible on canvas', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  await expect(page.locator('[data-testid="object-obj-0"]')).toBeVisible();
  await expect(page.locator('[data-testid="object-obj-9"]')).toBeVisible();
});

test('objects have varied shapes', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const shapes = new Set();
  for (let i = 0; i < 10; i++) {
    const g = page.locator('[data-testid="object-obj-' + i + '"]');
    const html = await g.innerHTML();
    if (html.includes('<circle')) shapes.add('circle');
    if (html.includes('<rect')) shapes.add('square');
    if (html.includes('<polygon')) shapes.add('triangle');
  }
  expect(shapes.size).toBeGreaterThan(1);
});

test('refreshing produces a different layout', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const transform1 = await page.locator('[data-testid="object-obj-0"]').getAttribute('transform');
  await page.reload();
  const transform2 = await page.locator('[data-testid="object-obj-0"]').getAttribute('transform');
  expect(transform1).not.toBe(transform2);
});
