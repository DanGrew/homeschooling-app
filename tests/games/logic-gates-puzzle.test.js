const { test, expect } = require('@playwright/test');

const URL = '/homeschooling-app/app/activities/logic-gates/puzzle.html';

async function waitForPuzzle(page) {
  await page.waitForSelector('#puzzle-area [data-switch]');
}

async function solvePuzzle(page) {
  const solution = await page.evaluate(() => {
    const config = window.PuzzleUI.getConfig();
    const inputs = config.inputs;
    const n = inputs.length;
    for (let mask = 0; mask < (1 << n); mask++) {
      const states = {};
      inputs.forEach((inp, i) => { states[inp.id] = !!(mask & (1 << i)); });
      const out = window.LogicEngine.evalGraph(config, states);
      if (config.goal.every(g => out[g.id] === g.value)) return states;
    }
    return null;
  });

  const current = await page.evaluate(() =>
    document.querySelector('#puzzle-area svg')._getInputStates()
  );

  for (const [id, needed] of Object.entries(solution)) {
    if (current[id] !== needed) {
      await page.locator(`[data-switch="${id}"]`).click();
    }
  }
}

test('page loads with goal text', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);
  await expect(page.locator('#goal-text')).not.toBeEmpty();
});

test('goal text starts with "Turn the"', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);
  await expect(page.locator('#goal-text')).toContainText('Turn the');
});

test('puzzle area contains an SVG station', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);
  await expect(page.locator('#puzzle-area svg')).toBeVisible();
});

test('switch elements are rendered in the puzzle', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);
  await expect(page.locator('#puzzle-area [data-switch]').first()).toBeVisible();
});

test('filter bar is visible with All, Linear, Parallel buttons', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#filter-bar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Linear' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Parallel' })).toBeVisible();
});

test('All filter button is active on load', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('.filter-btn[data-cat="all"]')).toHaveClass(/active/);
});

test('clicking Linear filter marks it active and deactivates All', async ({ page }) => {
  await page.goto(URL);
  await page.locator('.filter-btn[data-cat="linear"]').click();
  await expect(page.locator('.filter-btn[data-cat="linear"]')).toHaveClass(/active/);
  await expect(page.locator('.filter-btn[data-cat="all"]')).not.toHaveClass(/active/);
});

test('clicking Parallel filter marks it active', async ({ page }) => {
  await page.goto(URL);
  await page.locator('.filter-btn[data-cat="parallel"]').click();
  await expect(page.locator('.filter-btn[data-cat="parallel"]')).toHaveClass(/active/);
});

test('paginator bar is rendered', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);
  await expect(page.locator('#paginator-bar')).toBeVisible();
});

test('reset button is present', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#btn-reset')).toBeVisible();
});

test('toggling a switch does not throw', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL);
  await waitForPuzzle(page);
  await page.locator('[data-switch]').first().click();
  expect(errors).toHaveLength(0);
});

test('solving puzzle shows success banner', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);
  await solvePuzzle(page);
  await expect(page.getByTestId('success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 3000 });
});

test('reset button resets switch states and reloads puzzle', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);

  const goalBefore = await page.locator('#goal-text').textContent();
  await page.locator('[data-switch]').first().click();
  await page.locator('#btn-reset').click();

  await waitForPuzzle(page);
  const goalAfter = await page.locator('#goal-text').textContent();
  expect(goalAfter).toBe(goalBefore);
});

test('solving then advancing loads next puzzle', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);

  const goalBefore = await page.locator('#goal-text').textContent();
  await solvePuzzle(page);
  await expect(page.getByTestId('success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 3000 });

  await page.getByTestId('success-banner').locator('button').click();
  await waitForPuzzle(page);

  const goalAfter = await page.locator('#goal-text').textContent();
  expect(goalAfter).not.toBe(goalBefore);
});

test('wire colour updates after toggle', async ({ page }) => {
  await page.goto(URL);
  await waitForPuzzle(page);

  const before = await page.locator('[data-wire]').first().getAttribute('stroke');
  await page.locator('[data-switch]').first().click();
  const after = await page.locator('[data-wire]').first().getAttribute('stroke');

  expect(after).not.toBe(before);
});
