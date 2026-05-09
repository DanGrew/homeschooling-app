// clickInteractive: clicks a makeInteractive element and waits past the 100ms debounce.
// Use when clicking the same element multiple times in succession.
async function clickInteractive(page, selector) {
  await page.locator(selector).click();
  await page.waitForTimeout(120);
}

module.exports = { clickInteractive };
