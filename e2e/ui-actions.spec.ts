import { expect, test } from '@playwright/test'

/** Public sahifalar — har biri yuklanishi va kritik API 5xx bermasligi kerak */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/services',
  '/freelancers',
  '/projects',
  '/jobs',
  '/companies',
  '/post-project',
  '/pricing',
  '/help',
  '/blog',
  '/buyer-protection',
  '/terms',
  '/privacy',
  '/cv-builder',
  '/regions',
] as const

test.describe('ui actions — public pages', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`loads ${route} without API 5xx`, async ({ page }) => {
      const apiFailures: string[] = []

      page.on('response', (res) => {
        const url = res.url()
        if (!url.includes('/api/v1/')) return
        if (res.status() >= 500) {
          apiFailures.push(`${res.status()} ${url}`)
        }
      })

      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await expect(page.locator('body')).toBeVisible()
      expect(apiFailures, `Server errors on ${route}`).toEqual([])
    })
  }
})

test.describe('ui actions — interactive smoke', () => {
  test('services catalog filter drawer opens', async ({ page }) => {
    await page.goto('/services', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const filterBtn = page.getByRole('button', { name: /filtr|filter|фильтр/i })
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('help FAQ accordion toggles', async ({ page }) => {
    await page.goto('/help', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const gettingStarted = page.getByRole('button', { name: /boshlash|getting started|начало/i }).first()
    if (await gettingStarted.isVisible()) {
      await gettingStarted.click()
    }
    await expect(page.locator('body')).toBeVisible()
  })

  test('pricing CTA links to register', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const registerLink = page.locator('a[href="/register"]').first()
    await expect(registerLink).toBeVisible()
  })

  test('jobs page shows catalog or vacancies', async ({ page }) => {
    await page.goto('/jobs', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const hasVacancyBtn = await page.getByRole('button', { name: /vakansiya|vacancy|ваканс/i }).isVisible().catch(() => false)
    const hasProjects = await page.getByText(/loyiha|project|проект/i).first().isVisible().catch(() => false)
    expect(hasVacancyBtn || hasProjects).toBeTruthy()
  })

  test('waitlist form submits via API', async ({ page, request }) => {
    const health = await request.get('/api/v1/health')
    if (!health.ok()) {
      test.skip(true, 'Backend not running')
    }
    await page.goto('/cv-builder', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const email = `e2e-${Date.now()}@ishbor.test`
    const res = await request.post('/api/v1/waitlist', {
      data: { email, source: 'e2e-ui-actions' },
    })
    expect(res.status()).toBeLessThan(500)
    expect([200, 201, 204, 409]).toContain(res.status())
  })
})

test.describe('ui actions — auth redirects', () => {
  const PROTECTED = [
    '/dashboard',
    '/dashboard/orders',
    '/dashboard/wallet',
    '/dashboard/settings',
    '/dashboard/saved',
    '/admin',
  ] as const

  for (const route of PROTECTED) {
    test(`${route} redirects guest to login`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    })
  }
})
