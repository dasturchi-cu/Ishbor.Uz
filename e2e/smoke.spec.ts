import { expect, test } from '@playwright/test'

test.describe('smoke', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/IshBor/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('services catalog loads', async ({ page }) => {
    await page.goto('/services')
    await expect(page.locator('body')).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('body')).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('body')).toBeVisible()
  })

  test('help page loads', async ({ page }) => {
    await page.goto('/help')
    await expect(page.locator('body')).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('body')).toBeVisible()
  })

  test('robots.txt is reachable', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBeTruthy()
  })

  test('jobs page loads catalog', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.locator('body')).toBeVisible()
  })

  test('cv builder page loads', async ({ page }) => {
    await page.goto('/cv-builder')
    await expect(page.locator('#main-content')).toBeVisible()
  })
})
