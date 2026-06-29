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

test('coverage table loads catalogue + physical rows', async ({ page }) => {
  await page.goto(URL)
  const rows = page.locator('.coverage tbody tr')
  await expect(rows).toHaveCount(32)
})

test('Mix colours card has Colour mixing in EAD column', async ({ page }) => {
  await page.goto(URL)
  const row = page.locator('.coverage tbody tr').filter({ hasText: 'Mix colours' }).first()
  const eadCell = row.locator('td').nth(2)
  await expect(eadCell).toContainText('Colour mixing')
})

test('Mix colours card shows its venue in the Activity column', async ({ page }) => {
  await page.goto(URL)
  const row = page.locator('.coverage tbody tr').filter({ hasText: 'Mix colours' }).first()
  await expect(row.locator('.col-activity')).toContainText('Colour Wheel')
})

test('Emotion words card has Emotion vocabulary in PSED column', async ({ page }) => {
  await page.goto(URL)
  const row = page.locator('.coverage tbody tr').filter({ hasText: 'Emotion words' }).first()
  const psedCell = row.locator('td').nth(6)
  await expect(psedCell).toContainText('Emotion vocabulary')
})

test('clicking Lesson header sorts rows by title ascending', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.coverage thead th').nth(0).click()
  const titles = await page.locator('.coverage tbody .col-lesson').allTextContents()
  const sorted = [...titles].sort((a, b) => a.localeCompare(b))
  expect(titles).toEqual(sorted)
})

test('clicking Lesson header twice sorts rows by title descending', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.coverage thead th').nth(0).click()
  await page.locator('.coverage thead th').nth(0).click()
  const titles = await page.locator('.coverage tbody .col-lesson').allTextContents()
  const sorted = [...titles].sort((a, b) => b.localeCompare(a))
  expect(titles).toEqual(sorted)
})

test('sorted column shows direction indicator', async ({ page }) => {
  await page.goto(URL)
  const lessonTh = page.locator('.coverage thead th').nth(0)
  await lessonTh.click()
  await expect(lessonTh).toHaveClass(/sort-asc/)
  await lessonTh.click()
  await expect(lessonTh).toHaveClass(/sort-desc/)
})

test('physical activity rows appear in coverage table', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.coverage tbody tr').filter({ hasText: 'Rope Rescue' })).toBeVisible()
  await expect(page.locator('.coverage tbody tr').filter({ hasText: 'Switchback' })).toBeVisible()
})

test('physical activity rows show Physical Play in activity column', async ({ page }) => {
  await page.goto(URL)
  const row = page.locator('.coverage tbody tr').filter({ hasText: 'Rope Rescue' })
  await expect(row.locator('.col-activity')).toHaveText('Physical Play')
})

test('Rope Rescue row has Climbing apparatus in PD column', async ({ page }) => {
  await page.goto(URL)
  const row = page.locator('.coverage tbody tr').filter({ hasText: 'Rope Rescue' })
  const pdCell = row.locator('td').nth(8)
  await expect(pdCell).toContainText('Climbing apparatus')
})

test('no Exercises section', async ({ page }) => {
  await page.goto(URL)
  await expect(page.getByRole('heading', { name: 'Exercises' })).toHaveCount(0)
  await expect(page.locator('.exercises-coverage')).toHaveCount(0)
})
