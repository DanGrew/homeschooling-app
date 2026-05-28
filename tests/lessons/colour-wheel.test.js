const { test, expect } = require('@playwright/test')

const URL = '/homeschooling-app/app/activities/colour-wheel/'

test('nav home link points to lessons', async ({ page }) => {
  await page.goto(URL)
  const href = await page.locator('.nav-bar a').first().evaluate(el => new URL(el.href).pathname)
  expect(href).toBe('/homeschooling-app/app/lessons/')
})

test('games popout button shows gamepad icon', async ({ page }) => {
  await page.goto(URL)
  const gamesBtn = page.locator('.nav-bar button').filter({ hasText: '\uD83C\uDFAE' })
  await expect(gamesBtn).toBeVisible()
})

test('page loads with colour wheel and palette', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('#wheel-svg path')).toHaveCount(12)
  await expect(page.locator('#lsn-palette div')).toHaveCount(12)
})

test('clicking a swatch selects it', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await expect(page.locator('#lsn-sw-red')).toHaveCSS('border-color', 'rgb(51, 51, 51)')
})

test('assigning a colour to a slot fills it', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await expect(page.locator('#lsn-slot-a')).toHaveCSS('background-color', 'rgb(231, 76, 60)')
})

test('valid mix shows correct result colour', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-yellow').click()
  await page.locator('#lsn-slot-b').click()
  // red + yellow = orange (#E67E22)
  await expect(page.locator('#lsn-result')).toHaveCSS('background-color', 'rgb(230, 126, 34)')
})

test('non-wheel mix shows realistic paint colour', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-green').click()
  await page.locator('#lsn-slot-b').click()
  // red + green = brown (#6B5030)
  await expect(page.locator('#lsn-result')).toHaveCSS('background-color', 'rgb(107, 80, 48)')
})

test('same colour in both slots shows that colour', async ({ page }) => {
  await page.goto(URL)
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-a').click()
  await page.locator('#lsn-sw-red').click()
  await page.locator('#lsn-slot-b').click()
  // red + red = red (#E74C3C)
  await expect(page.locator('#lsn-result')).toHaveCSS('background-color', 'rgb(231, 76, 60)')
})

test('lesson 1 button is visible in nav', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-lesson-btn')).toBeVisible()
  await expect(page.locator('.nav-lesson-btn')).toContainText('\uD83D\uDCDA')
})

test('lesson button opens popout with lesson title', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.nav-lesson-btn').click()
  await expect(page.locator('.nav-lesson-popout')).toBeVisible()
  await expect(page.locator('.nav-lesson-item').first()).toContainText('Lesson 1: Make Orange')
})

test('lesson popout shows all 14 lessons', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.nav-lesson-btn').click()
  await expect(page.locator('.nav-lesson-item')).toHaveCount(14)
})

test('lesson 9 make vermillion starts with correct intro', async ({ page }) => {
  await page.goto(URL)
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item').nth(8).click()
  await expect(page.locator('#guidance-overlay')).toContainText('mix even further')
})

test('clicking outside closes popout', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.nav-lesson-btn').click()
  await expect(page.locator('.nav-lesson-popout')).toBeVisible()
  await page.locator('.game-area').click()
  await expect(page.locator('.nav-lesson-popout')).not.toBeVisible()
})

async function startLesson(page) {
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-lesson-btn').click()
  await page.locator('.nav-lesson-item').first().click()
}

test('clicking lesson item shows guidance overlay', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toBeVisible()
})

test('first step shows find-red instruction and no Next button', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toContainText('Tap red')
  await expect(page.locator('#guidance-overlay [data-action="next"]')).not.toBeVisible()
})

test('tapping red wheel segment advances to tap-yellow step', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await page.locator('#wheel-svg path[fill="#E74C3C"]').click()
  await expect(page.locator('#guidance-overlay')).toContainText('Tap yellow')
  await expect(page.locator('#guidance-overlay [data-action="next"]')).not.toBeVisible()
})

function fire(page, type) {
  return page.evaluate(t => window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: t } })), type)
}

async function completeLesson(page) {
  await page.locator('#guidance-overlay').waitFor({ state: 'visible' })
  await fire(page, 'RED_TAPPED')
  await fire(page, 'YELLOW_TAPPED')
  await fire(page, 'BLUE_TAPPED')
  await page.locator('[data-word-bubble]').waitFor({ state: 'visible' })
  await fire(page, 'BADGE_TAPPED')
  await fire(page, 'ORANGE_TAPPED')
  await fire(page, 'RED_LOADED_A')
  await fire(page, 'YELLOW_LOADED_B')
  await page.locator('[data-word-bubble]').waitFor({ state: 'visible' })
  await fire(page, 'BADGE_TAPPED')
  await fire(page, 'ORANGE_TAPPED')
}

test('success step has green background', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await completeLesson(page)
  const bg = await page.locator('#guidance-overlay').evaluate(el => {
    const bubble = el.querySelector('div')
    return bubble ? bubble.style.background : ''
  })
  expect(bg).toBe('rgb(46, 204, 113)')
})

test('success step shows star prefix', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await completeLesson(page)
  await expect(page.locator('#guidance-overlay')).toContainText('\u2B50')
})

test('close button stops lesson and hides overlay', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await expect(page.locator('#guidance-overlay')).toBeVisible()
  await page.locator('#guidance-overlay button[title="Stop lesson"]').click({ delay: 700 })
  await expect(page.locator('#guidance-overlay')).not.toBeVisible()
})

async function startExercise(page, idx) {
  await page.waitForFunction(() => window.guidanceService)
  await page.locator('.nav-exercise-btn').click()
  await page.locator('.nav-exercise-item').nth(idx || 0).click()
}

test('exercise button is visible in nav', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator('.nav-exercise-btn')).toBeVisible()
})

test('exercise popout shows 5 exercises', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.nav-exercise-btn').click()
  await expect(page.locator('.nav-exercise-item')).toHaveCount(5)
})

test('exercise popout shows correct titles', async ({ page }) => {
  await page.goto(URL)
  await page.locator('.nav-exercise-btn').click()
  await expect(page.locator('.nav-exercise-item').nth(0)).toContainText('Find Primary Colours')
  await expect(page.locator('.nav-exercise-item').nth(4)).toContainText('Find Cool Colours')
})

test('starting exercise hides colour wheel', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await expect(page.locator('#wheel-svg')).not.toBeVisible()
})

test('starting exercise hides mixer', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await expect(page.locator('#lsn-mixer')).not.toBeVisible()
})

test('starting exercise shows guidance overlay with task text', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await expect(page.locator('#guidance-overlay')).toContainText('Find all the primary colours')
})

test('palette swatch tap fires guidance event', async ({ page }) => {
  await page.goto(URL)
  await page.evaluate(() => { window.__lastGuidanceEvent = null; window.addEventListener('guidance:event', function(e) { window.__lastGuidanceEvent = e.detail.type; }); })
  await page.locator('#lsn-sw-red').click()
  const type = await page.evaluate(() => window.__lastGuidanceEvent)
  expect(type).toBe('RED_TAPPED')
})

test('tertiary swatch tap fires correct guidance event', async ({ page }) => {
  await page.goto(URL)
  await page.evaluate(() => { window.__lastGuidanceEvent = null; window.addEventListener('guidance:event', function(e) { window.__lastGuidanceEvent = e.detail.type; }); })
  await page.locator('#lsn-sw-red-orange').click()
  const type = await page.evaluate(() => window.__lastGuidanceEvent)
  expect(type).toBe('RED_ORANGE_TAPPED')
})

test('completing primary exercise shows completion feedback', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay').waitFor({ state: 'visible' })
  await fire(page, 'RED_TAPPED')
  await fire(page, 'YELLOW_TAPPED')
  await fire(page, 'BLUE_TAPPED')
  await expect(page.locator('#guidance-overlay')).toContainText('found all the primary colours')
})

test('starting exercise shuffles palette but all swatches remain', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await expect(page.locator('#lsn-palette div')).toHaveCount(12)
  await expect(page.locator('#lsn-sw-red')).toBeAttached()
  await expect(page.locator('#lsn-sw-red-orange')).toBeAttached()
})

test('stopping exercise restores palette to original order', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay button[title="Stop lesson"]').click({ delay: 700 })
  const firstSwatchId = await page.locator('#lsn-palette div').first().getAttribute('id')
  expect(firstSwatchId).toBe('lsn-sw-red')
})

test('exercise shows 3 empty cross boxes on start', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay').waitFor({ state: 'visible' })
  const crosses = await page.locator('#guidance-overlay span').evaluateAll(spans =>
    spans.filter(s => s.style.borderColor.includes('187') || s.textContent === '').length
  )
  expect(crosses).toBeGreaterThanOrEqual(3)
})

test('1 wrong tap fills first cross box red', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay').waitFor({ state: 'visible' })
  await fire(page, 'WRONG_ONE')
  const filledCross = await page.locator('#guidance-overlay span').evaluateAll(spans =>
    spans.filter(s => s.textContent === '\u2717').length
  )
  expect(filledCross).toBe(1)
})

test('3 wrong taps trigger failure overlay with amber background', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay').waitFor({ state: 'visible' })
  await fire(page, 'WRONG_COLOUR_ONE')
  await fire(page, 'WRONG_COLOUR_TWO')
  await fire(page, 'WRONG_COLOUR_THREE')
  const bg = await page.locator('#guidance-overlay').evaluate(el => {
    const bubble = el.querySelector('div')
    return bubble ? bubble.style.background : ''
  })
  expect(bg).toBe('rgb(250, 215, 160)')
})

test('failure overlay shows try again text', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay').waitFor({ state: 'visible' })
  await fire(page, 'WRONG_COLOUR_ONE')
  await fire(page, 'WRONG_COLOUR_TWO')
  await fire(page, 'WRONG_COLOUR_THREE')
  await expect(page.locator('#guidance-overlay')).toContainText('try again')
})

test('2 wrong taps do not trigger failure', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay').waitFor({ state: 'visible' })
  await fire(page, 'WRONG_COLOUR_ONE')
  await fire(page, 'WRONG_COLOUR_TWO')
  await expect(page.locator('#guidance-overlay')).toContainText('primary colours')
})

test('failure overlay next button closes overlay and resets page', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay').waitFor({ state: 'visible' })
  await fire(page, 'X1')
  await fire(page, 'X2')
  await fire(page, 'X3')
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await expect(page.locator('#guidance-overlay')).not.toBeVisible()
  await expect(page.locator('#wheel-svg')).toBeVisible()
})

test('stopping exercise restores wheel and mixer', async ({ page }) => {
  await page.goto(URL)
  await startExercise(page)
  await page.locator('#guidance-overlay button[title="Stop lesson"]').click({ delay: 700 })
  await expect(page.locator('#wheel-svg')).toBeVisible()
  await expect(page.locator('#lsn-mixer')).toBeVisible()
})

test('completing a lesson records a learning event in IndexedDB', async ({ page }) => {
  await page.goto(URL)
  await startLesson(page)
  await completeLesson(page)
  await page.locator('#guidance-overlay [data-action="next"]').click()
  await page.waitForTimeout(300)
  const events = await page.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('learning-records', 1)
    req.onsuccess = (e) => {
      try {
        const db = e.target.result
        if (!db.objectStoreNames.contains('events')) { resolve([]); return; }
        const tx = db.transaction('events', 'readonly')
        const all = tx.objectStore('events').getAll()
        all.onsuccess = (e) => resolve(e.target.result)
        all.onerror = () => resolve([])
      } catch(err) { resolve([]); }
    }
    req.onerror = () => resolve([])
    req.onupgradeneeded = () => resolve([])
  }))
  const evt = events.find(e => e.learning_id === 'colour-wheel-lesson-make_orange')
  expect(evt).toBeTruthy()
  expect(evt.type).toBe('learning_completed')
  expect(evt.activity_id).toBe('colour-wheel')
  expect(evt.version).toBe(1)
})
