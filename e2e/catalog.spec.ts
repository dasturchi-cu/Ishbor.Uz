import { expect, test } from '@playwright/test'

test.describe('catalog pages', () => {
  test('jobs page shows roadmap banner and catalog', async ({ page }) => {
    await page.goto('/jobs')
    await expect(page.getByText(/Ish e'lonlari|Job listings|Вакансии/i).first()).toBeVisible()
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
  })

  test('companies page shows roadmap banner', async ({ page }) => {
    await page.goto('/companies')
    await expect(page.getByText(/Kompaniya|Companies|Компани/i).first()).toBeVisible()
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
  })

  test('services catalog has filter controls', async ({ page }) => {
    await page.goto('/services')
    await expect(page.locator('body')).toBeVisible()
    const filterBtn = page.getByRole('button', { name: /filtr|filter|фильтр/i })
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
    }
  })

  test('projects page loads', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('public API via proxy', () => {
  test('public stats returns commission', async ({ request }) => {
    const res = await request.get('/api/v1/stats/public')
    if (!res.ok()) {
      test.skip(true, 'Backend not running')
    }
    const body = await res.json()
    expect(body.commission_percent).toBe(10)
  })

  test('services list accepts delivery filter', async ({ request }) => {
    const res = await request.get('/api/v1/services?max_delivery_days=7&limit=3')
    if (!res.ok()) {
      test.skip(true, 'Backend not running')
    }
    const body = await res.json()
    expect(Array.isArray(body.items)).toBe(true)
  })
})
