const { test, expect } = require('@playwright/test')

test('physical play index shows heading', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/')
  await expect(page.getByRole('heading', { name: 'Physical Play' })).toBeVisible()
})

test('physical play index shows both activities', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/')
  await expect(page.getByRole('link', { name: /Rope Rescue/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /The Long Way Round/ })).toBeVisible()
})

test('physical play index links back to home', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/')
  await expect(page.getByRole('link', { name: /Home/ })).toBeVisible()
})

test('rope rescue activity page renders', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/rope-rescue/')
  await expect(page.getByRole('heading', { name: 'Rope Rescue' })).toBeVisible()
})

test('rope rescue shows competencies', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/rope-rescue/')
  await expect(page.getByText('grip strength')).toBeVisible()
  await expect(page.getByText('bilateral integration')).toBeVisible()
})

test('rope rescue shows Steps and Prompts columns', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/rope-rescue/')
  await expect(page.getByText('Steps')).toBeVisible()
  await expect(page.getByText('Prompts')).toBeVisible()
})

test('rope rescue shows adult guidance headlines', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/rope-rescue/')
  await expect(page.getByText('Model grip once, then step back')).toBeVisible()
  await expect(page.getByText('Silence means planning')).toBeVisible()
})

test('rope rescue shows why this works', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/rope-rescue/')
  await expect(page.getByText('Why This Works')).toBeVisible()
})

test('the long way round activity page renders', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/the-long-way-round/')
  await expect(page.getByRole('heading', { name: 'The Long Way Round' })).toBeVisible()
})

test('secret passage activity page renders', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/secret-passage/')
  await expect(page.getByRole('heading', { name: 'Secret Passage' })).toBeVisible()
})

test('secret passage shows crawl competency', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/secret-passage/')
  await expect(page.getByText('core stability').first()).toBeVisible()
  await expect(page.getByText('spatial awareness').first()).toBeVisible()
})

test('switchback activity page renders', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/switchback/')
  await expect(page.getByRole('heading', { name: 'Switchback' })).toBeVisible()
})

test('switchback shows wall traverse competency', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/switchback/')
  await expect(page.getByText('upper limb strength')).toBeVisible()
  await expect(page.getByText('crossing midline')).toBeVisible()
})

test('activity back link returns to physical index', async ({ page }) => {
  await page.goto('/homeschooling-app/app/physical/activities/rope-rescue/')
  await page.getByRole('link', { name: '←' }).click()
  await expect(page).toHaveURL(/\/physical\/?$/)
})
