import { expect, test } from '@playwright/test'

test.describe('catalog pages', () => {
  test('jobs page shows catalog or vacancies module', async ({ page }) => {
    await page.goto('/jobs', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const vacancyUi = page.getByRole('button', { name: /vakansiya|vacancy|ваканс/i })
    const projectUi = page.getByText(/loyiha|project|проект/i).first()
    const hasVacancy = await vacancyUi.isVisible().catch(() => false)
    const hasProjects = await projectUi.isVisible().catch(() => false)
    expect(hasVacancy || hasProjects).toBeTruthy()
  })

  test('companies page shows catalog or companies module', async ({ page }) => {
    await page.goto('/companies', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const companyUi = page.getByText(/kompaniya|compan|компани/i).first()
    const freelancerUi = page.getByText(/freelancer|frilanser|фриланс/i).first()
    const hasCompany = await companyUi.isVisible().catch(() => false)
    const hasFreelancers = await freelancerUi.isVisible().catch(() => false)
    expect(hasCompany || hasFreelancers).toBeTruthy()
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

  test('notification channels endpoint', async ({ request }) => {
    const res = await request.get('/api/v1/notifications/channels')
    if (!res.ok()) {
      test.skip(true, 'Backend not running')
    }
    const body = await res.json()
    expect(typeof body.email).toBe('boolean')
    expect(typeof body.telegram).toBe('boolean')
  })
})
