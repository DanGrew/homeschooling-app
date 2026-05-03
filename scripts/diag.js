const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push('FAILED: ' + r.url()));
  await page.goto('http://localhost:3000/app/lessons/simulator/simulator.html?sim=grow-tomatoes-level-1');
  await page.waitForTimeout(3000);
  const engine = await page.evaluate(() => typeof window.engine);
  console.log('window.engine type:', engine);
  console.log('LOGS:', JSON.stringify(logs));
  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
