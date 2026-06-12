import { test, expect } from '@playwright/test'

test.describe('Search discovery', () => {
  test('services search shows discovery hints when no results', async ({ page }) => {
    const servicesLoaded = page.waitForResponse(
      (res) => res.url().includes('/api/v1/services') && res.status() === 200,
      { timeout: 30000 },
    )
    await page.goto('/services?q=zzzznonexistent123', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#services-catalog')).toBeVisible({ timeout: 15000 })
    await servicesLoaded
    await expect(page.locator('#services-catalog .search-discovery-hints')).toBeVisible({
      timeout: 15000,
    })
  })

  test('catalog search autocomplete offers projects link', async ({ page }) => {
    await page.goto('/services')
    const input = page.locator('#services-catalog input[type="text"]').first()
    await input.click()
    await input.fill('telegram bot')
    const panel = page.locator('.search-autocomplete-panel')
    await expect(panel).toBeVisible({ timeout: 10000 })
    await expect(panel.getByRole('button', { name: /loyihalarni|projects|проект/i }).first()).toBeVisible()
  })

  test('freelancers catalog reads q from URL', async ({ page }) => {
    await page.goto('/freelancers?q=web')
    const searchInput = page.locator('#freelancers-catalog .ishbor-search-input')
    await expect(searchInput).toHaveValue('web', { timeout: 10000 })
  })
})
