import { test, expect } from '@playwright/test'

test.describe('Trust signals (guest)', () => {
  test('services catalog shows escrow and platform trust metrics', async ({ page }) => {
    await page.goto('/services')
    await expect(page.getByText(/escrow himoyasi|escrow protected|защита escrow/i).first()).toBeVisible()
    await expect(page.locator('.marketplace-trust-metrics')).toBeVisible()
    await expect(
      page.locator('.marketplace-trust-metrics__link').filter({ hasText: /xaridor himoyasi|buyer protection|защита покупателя/i })
    ).toBeVisible()
  })

  test('freelancers catalog shows protection strip and trust metrics', async ({ page }) => {
    await page.goto('/freelancers')
    await expect(page.locator('.ishbor-protection-strip')).toBeVisible()
    await expect(page.locator('.marketplace-trust-metrics')).toBeVisible()
  })

  test('buyer protection page loads', async ({ page }) => {
    await page.goto('/buyer-protection')
    await expect(page.getByRole('heading', { name: /xaridor himoyasi|buyer protection|защита покупателя/i })).toBeVisible()
  })
})
