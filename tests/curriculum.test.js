const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/curriculum/'

test('page shows Curriculum Coverage heading', async ({ page }) => {
  await page.goto(URL)
  await expect(page.getByRole('heading', { name: 'Curriculum Coverage' })).toBeVisible()
})

test('back link navigates to home', async ({ page }) => {
  await page.goto(URL)
  const href = await page.locator('a.back').evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/')
})

test('glossary table shows all seven EYFS areas', async ({ page }) => {
  await page.goto(URL)
  const rows = page.locator('.glossary tbody tr')
  await expect(rows).toHaveCount(7)
})

test('glossary table has correct column headings', async ({ page }) => {
  await page.goto(URL)
  const ths = page.locator('.glossary thead th')
  await expect(ths.nth(0)).toHaveText('Full Name')
  await expect(ths.nth(1)).toHaveText('Abbrev')
  await expect(ths.nth(2)).toHaveText('Covers')
  await expect(ths.nth(3)).toHaveText('Criteria')
})

test('glossary criteria column lists criteria for each area', async ({ page }) => {
  await page.goto(URL)
  const rows = page.locator('.glossary tbody tr')
  const eadRow = rows.filter({ hasText: 'Expressive Arts & Design' })
  await expect(eadRow.locator('td').nth(3)).toContainText('Colour mixing')
  const mathsRow = rows.filter({ hasText: 'Mathematics' })
  await expect(mathsRow.locator('td').nth(3)).toContainText('Counting within 5')
})

test('glossary contains EAD and PSED rows', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.glossary tbody')).toContainText('Expressive Arts & Design')
  await expect(page.locator('.glossary tbody')).toContainText('Personal, Social & Emotional')
})

test('coverage table header has Lesson and Activity columns', async ({ page }) => {
  await page.goto(URL)
  const ths = page.locator('.coverage thead th')
  await expect(ths.nth(0)).toHaveText('Lesson')
  await expect(ths.nth(1)).toHaveText('Activity')
})

test('coverage table header has all seven area abbreviations', async ({ page }) => {
  await page.goto(URL)
  const ths = page.locator('.coverage thead th')
  await expect(ths).toContainText(['EAD', 'Maths', 'C&L', 'UW', 'PSED', 'Literacy', 'PD'])
})

test('coverage table loads lesson rows', async ({ page }) => {
  await page.goto(URL)
  const rows = page.locator('.coverage tbody tr')
  await expect(rows).toHaveCount(24)
})

test('rows are sorted by activity then lesson title', async ({ page }) => {
  await page.goto(URL)
  const firstActivity = page.locator('.coverage tbody .col-activity').first()
  const firstLesson = page.locator('.coverage tbody .col-lesson').first()
  await expect(firstActivity).toHaveText('Colour Wheel')
  await expect(firstLesson).toHaveText('Cool Colours')
})

test('Make Orange row has Colour mixing in EAD column', async ({ page }) => {
  await page.goto(URL)
  const row = page.locator('.coverage tbody tr').filter({ hasText: 'Make Orange' })
  const eadCell = row.locator('td').nth(2)
  await expect(eadCell).toContainText('Colour mixing')
})

test('How Are You Feeling row has Emotion vocabulary in PSED column', async ({ page }) => {
  await page.goto(URL)
  const row = page.locator('.coverage tbody tr').filter({ hasText: 'How Are You Feeling?' }).first()
  const psedCell = row.locator('td').nth(6)
  await expect(psedCell).toContainText('Emotion vocabulary')
})

test('clicking Lesson header sorts rows ascending', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.coverage thead th').nth(0).click()
  const firstLesson = page.locator('.coverage tbody .col-lesson').first()
  await expect(firstLesson).toHaveText('Cool Colours')
})

test('clicking Lesson header twice sorts rows descending', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.coverage thead th').nth(0).click()
  await page.locator('.coverage thead th').nth(0).click()
  const firstLesson = page.locator('.coverage tbody .col-lesson').first()
  await expect(firstLesson).toHaveText('Warm Colours')
})

test('sorted column shows direction indicator', async ({ page }) => {
  await page.goto(URL)
  const lessonTh = page.locator('.coverage thead th').nth(0)
  await lessonTh.click()
  await expect(lessonTh).toHaveClass(/sort-asc/)
  await lessonTh.click()
  await expect(lessonTh).toHaveClass(/sort-desc/)
})
