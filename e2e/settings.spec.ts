import { expect, test } from '@playwright/test'

test.describe('settings', () => {
  test('dashboard settings redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/login/)
  })

  test('legacy settings path redirects to dashboard', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/dashboard\/settings|\/login/)
  })
})
