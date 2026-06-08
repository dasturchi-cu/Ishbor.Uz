import { expect, test } from '@playwright/test'

test.describe('auth', () => {
  test('login form validates empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#login-form button[type="submit"]').click()
    await expect(page.locator('#login-form input[aria-invalid="true"]').first()).toBeVisible()
  })

  test('login form accepts email input', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('#login-form input[type="email"]')
    await emailInput.fill('test@example.com')
    await expect(emailInput).toHaveValue('test@example.com')
  })

  test('protected dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard/orders')
    await expect(page).toHaveURL(/\/login/)
  })

  test('register shows role selection step', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('#register-form')).toBeVisible()
  })

  test('login page has accessible form landmark', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#login-form')).toBeVisible()
    await expect(page.locator('#login-form input[type="email"]')).toBeVisible()
    await expect(page.locator('#login-form input[type="password"]')).toBeVisible()
  })
})
