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
  await expect(rows).toHaveCount(66)
})

test('rows are sorted by activity then lesson title', async ({ page }) => {
  await page.goto(URL)
  const firstActivity = page.locator('.coverage tbody .col-activity').first()
  const firstLesson = page.locator('.coverage tbody .col-lesson').first()
  await expect(firstActivity).toHaveText('Clock')
  await expect(firstLesson).toHaveText('01. Count the Clock')
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
  await expect(firstLesson).toHaveText('01. AND Gate')
})

test('clicking Lesson header twice sorts rows descending', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.coverage thead th').nth(0).click()
  await page.locator('.coverage thead th').nth(0).click()
  const firstLesson = page.locator('.coverage tbody .col-lesson').first()
  await expect(firstLesson).toHaveText('The Long Way Round')
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

test('exercise table header has Exercise and Activity columns', async ({ page }) => {
  await page.goto(URL)
  const ths = page.locator('.exercises-coverage thead th')
  await expect(ths.nth(0)).toHaveText('Exercise')
  await expect(ths.nth(1)).toHaveText('Activity')
})

test('exercise table loads correct row count', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.exercises-coverage tbody tr')).toHaveCount(17)
})

test('exercise table default sort shows Clock first', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.exercises-coverage tbody .col-activity').first()).toHaveText('Clock')
  await expect(page.locator('.exercises-coverage tbody .col-lesson').first()).toHaveText('01. What Comes After?')
})

test('exercise table clicking Exercise header shows sort indicator', async ({ page }) => {
  await page.goto(URL)
  const exerciseTh = page.locator('.exercises-coverage thead th').nth(0)
  await exerciseTh.click()
  await expect(exerciseTh).toHaveClass(/sort-asc/)
  await exerciseTh.click()
  await expect(exerciseTh).toHaveClass(/sort-desc/)
})
