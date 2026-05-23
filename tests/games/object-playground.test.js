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

test('objects have data-shape attribute', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const shapes = new Set();
  for (let i = 0; i < 10; i++) {
    const shape = await page.locator('[data-testid="object-obj-' + i + '"]').getAttribute('data-shape');
    expect(shape).toBeTruthy();
    shapes.add(shape);
  }
  expect(shapes.size).toBeGreaterThan(1);
});

test('toolbox hidden on load', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  await expect(page.locator('#obj-toolbox')).toBeHidden();
});

test('clicking an object shows the toolbox', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  await page.locator('[data-testid="object-obj-0"]').click();
  await expect(page.locator('#obj-toolbox')).toBeVisible();
  await expect(page.locator('[data-prop="shape"]')).toBeVisible();
  await expect(page.locator('[data-prop="colour"]')).toBeVisible();
  await expect(page.locator('[data-prop="size"]')).toBeVisible();
  await expect(page.locator('[data-prop="rotation"]')).toBeVisible();
});

test('clicking a toolbox row cycles the shape', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  await page.locator('[data-testid="object-obj-0"]').click();
  const before = await page.locator('[data-testid="object-obj-0"]').getAttribute('data-shape');
  await page.locator('[data-prop="shape"]').click();
  const after = await page.locator('[data-testid="object-obj-0"]').getAttribute('data-shape');
  expect(after).not.toBe(before);
});

test('clicking the same object again hides the toolbox', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  await page.locator('[data-testid="object-obj-0"]').click();
  await expect(page.locator('#obj-toolbox')).toBeVisible();
  await page.locator('[data-testid="object-obj-0"]').click();
  await expect(page.locator('#obj-toolbox')).toBeHidden();
});

test('refreshing produces a different layout', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const transform1 = await page.locator('[data-testid="object-obj-0"]').getAttribute('transform');
  await page.reload();
  const transform2 = await page.locator('[data-testid="object-obj-0"]').getAttribute('transform');
  expect(transform1).not.toBe(transform2);
});
