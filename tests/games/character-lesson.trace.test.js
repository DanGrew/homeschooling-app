const { test, expect } = require('@playwright/test')

async function waitForEngine(page) {
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
}

async function getStrokeStartScreenPos(page) {
  return page.evaluate(() => {
    const svg = document.getElementById('svg')
    const ctm = svg.getScreenCTM()
    const pt = engine.strokes[engine.currentStrokeIdx].mp.getPointAtLength(0)
    return { x: ctm.a * pt.x + ctm.e, y: ctm.d * pt.y + ctm.f }
  })
}

test('single-stroke complete emits strokeStart, strokeComplete, done', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=l&filter=lower&mode=trace')
  await waitForEngine(page)
  await page.evaluate(() => { window.__trace = [] })

  const pos = await getStrokeStartScreenPos(page)
  await page.mouse.move(pos.x, pos.y)
  await page.mouse.down()
  await page.evaluate(() => engine._completeStroke())
  await page.mouse.up()

  const traceData = await page.evaluate(() => window.__trace)
  expect(JSON.stringify(traceData, null, 2)).toMatchSnapshot()
})

test('abandoned stroke emits strokeStart then strokeReset', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=l&filter=lower&mode=trace')
  await waitForEngine(page)
  await page.evaluate(() => { window.__trace = [] })

  const pos = await getStrokeStartScreenPos(page)
  await page.mouse.move(pos.x, pos.y)
  await page.mouse.down()
  await page.evaluate(() => engine._resetCurrentStroke())
  await page.mouse.up()

  const traceData = await page.evaluate(() => window.__trace)
  expect(JSON.stringify(traceData, null, 2)).toMatchSnapshot()
})

test('restart after complete emits restart event', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=l&filter=lower&mode=trace')
  await waitForEngine(page)

  const pos = await getStrokeStartScreenPos(page)
  await page.mouse.move(pos.x, pos.y)
  await page.mouse.down()
  await page.evaluate(() => engine._completeStroke())
  await page.mouse.up()

  await page.evaluate(() => { window.__trace = [] })
  await page.evaluate(() => engine.restart())

  const traceData = await page.evaluate(() => window.__trace)
  expect(JSON.stringify(traceData, null, 2)).toMatchSnapshot()
})
