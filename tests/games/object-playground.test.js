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

test('canvas has a layer group with initial translate(0,0)', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const transform = await page.locator('[data-layer]').getAttribute('transform');
  expect(transform).toBe('translate(0,0)');
});

test('dragging from margin area pans the canvas', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const box = await page.locator('#obj-viewport').boundingBox();
  // margin ~62px so (55,55) is guaranteed object-free; drag up-left 50px → pans right+down
  await page.mouse.move(box.x + 55, box.y + 55);
  await page.mouse.down();
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.up();
  const transform = await page.locator('[data-layer]').getAttribute('transform');
  expect(transform).not.toBe('translate(0,0)');
});

test('dragging starting on an object does not pan', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const obj = page.locator('[data-testid="object-obj-0"]');
  const objBox = await obj.boundingBox();
  await page.mouse.move(objBox.x + objBox.width / 2, objBox.y + objBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(objBox.x + objBox.width / 2 - 60, objBox.y + objBox.height / 2 - 60);
  await page.mouse.up();
  const transform = await page.locator('[data-layer]').getAttribute('transform');
  expect(transform).toBe('translate(0,0)');
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

test('dragging a selected object moves it', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const obj = page.locator('[data-testid="object-obj-0"]');
  await obj.click();
  const before = await obj.getAttribute('transform');
  const box = await obj.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 80);
  await page.mouse.up();
  const after = await obj.getAttribute('transform');
  expect(after).not.toBe(before);
});

test('dragging an unselected object does not move it', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const obj = page.locator('[data-testid="object-obj-0"]');
  const before = await obj.getAttribute('transform');
  const box = await obj.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 80);
  await page.mouse.up();
  const after = await obj.getAttribute('transform');
  expect(after).toBe(before);
});

test('toolbox shows as dragging during object drag', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  await page.locator('[data-testid="object-obj-0"]').click();
  const obj = page.locator('[data-testid="object-obj-0"]');
  const box = await obj.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
  const dragging = await page.locator('#obj-toolbox').getAttribute('data-dragging');
  await page.mouse.up();
  expect(dragging).not.toBeNull();
});

test('refreshing produces a different layout', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/object-playground/');
  const transform1 = await page.locator('[data-testid="object-obj-0"]').getAttribute('transform');
  await page.reload();
  const transform2 = await page.locator('[data-testid="object-obj-0"]').getAttribute('transform');
  expect(transform1).not.toBe(transform2);
});
