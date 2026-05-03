const { test, expect } = require('@playwright/test')

async function waitForEngine(page) {
  await page.waitForFunction(() => window.engine && engine.strokes && engine.strokes.length > 0)
}

async function resetTrace(page) {
  await page.evaluate(() => { window.__trace = [] })
}

async function getTrace(page) {
  return page.evaluate(() => window.__trace)
}

test('single-stroke complete emits strokeStart, strokeComplete, done', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=l&filter=lower&mode=trace')
  await waitForEngine(page)
  await resetTrace(page)

  await page.evaluate(() => {
    engine._activateStroke()
    engine._completeStroke()
  })

  expect(JSON.stringify(await getTrace(page), null, 2)).toMatchSnapshot()
})

test('abandoned stroke emits strokeStart then strokeReset', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=l&filter=lower&mode=trace')
  await waitForEngine(page)
  await resetTrace(page)

  await page.evaluate(() => {
    engine._activateStroke()
    engine._resetCurrentStroke()
  })

  expect(JSON.stringify(await getTrace(page), null, 2)).toMatchSnapshot()
})

test('multi-stroke complete emits full stroke sequence', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=t&filter=lower&mode=trace')
  await waitForEngine(page)
  await resetTrace(page)

  await page.evaluate(() => {
    engine._activateStroke()
    engine._completeStroke()  // stroke 0 done, advances to stroke 1
    engine._activateStroke()
    engine._completeStroke()  // stroke 1 done, all complete
  })

  expect(JSON.stringify(await getTrace(page), null, 2)).toMatchSnapshot()
})

test('restart after complete emits restart event', async ({ page }) => {
  await page.goto('/homeschooling-app/app/activities/character-lesson/?char=l&filter=lower&mode=trace')
  await waitForEngine(page)

  await page.evaluate(() => {
    engine._activateStroke()
    engine._completeStroke()
  })

  await resetTrace(page)
  await page.evaluate(() => engine.restart())

  expect(JSON.stringify(await getTrace(page), null, 2)).toMatchSnapshot()
})
