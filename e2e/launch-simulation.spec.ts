import { expect, test } from '@playwright/test'
import {
  API_FETCH_TIMEOUT,
  apiDirectUrl,
  getFirstServiceId,
  gotoServiceDetail,
  loginTestClient,
  requireBackend,
} from './helpers'

/**
 * End-to-end launch simulation across guest/client, freelancer, and admin personas.
 * Uses public pages + API auth gates; authenticated flows use diag-timeout-test account.
 */
test.describe('Launch simulation', () => {
  test.describe.configure({ mode: 'serial' })

  let serviceId: string | null = null
  let backendUp = false

  test.beforeAll(async ({ request }) => {
    backendUp = await requireBackend(request)
    if (backendUp) {
      serviceId = await getFirstServiceId(request)
    }
  })

  test.describe('Guest / Client persona', () => {
    test('landing → services → pricing funnel', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveTitle(/IshBor/i)

      await page.goto('/services', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#services-catalog')).toBeVisible({ timeout: 15000 })
      await expect(
        page.getByRole('link', { name: /freelancer sifatida|sell as a freelancer|продавать как/i }),
      ).toBeVisible()

      await page.goto('/pricing', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
    })

    test('service detail opens secure checkout modal (guest)', async ({ page }) => {
      test.skip(!serviceId, 'No public service in catalog')
      await gotoServiceDetail(page, serviceId!)
      const orderBtn = page.getByRole('button', { name: /xavfsiz buyurtma|secure order|безопасный заказ/i }).first()
      await orderBtn.click()
      await expect(page).not.toHaveURL(/\/login/)
      await expect(page.getByRole('dialog')).toBeVisible()
    })

    test('post-project is public', async ({ page }) => {
      await page.goto('/post-project', { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/login/)
      await expect(page.locator('h1')).toContainText(/loyiha|project|проект/i)
    })

    test('protected dashboard redirects guest to login', async ({ page }) => {
      await page.goto('/dashboard/orders', { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(/\/login/)
    })

    test('search with no results shows discovery hints', async ({ page }) => {
      const servicesLoaded = page.waitForResponse(
        (res) => res.url().includes('/api/v1/services') && res.status() === 200,
        { timeout: 30000 },
      )
      await page.goto('/services?q=zzzzlaunchsim999', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#services-catalog')).toBeVisible({ timeout: 15000 })
      await servicesLoaded
      await expect(page.locator('#services-catalog .search-discovery-hints')).toBeVisible({
        timeout: 15000,
      })
    })
  })

  test.describe('Freelancer persona', () => {
    test('freelancers catalog and sell CTA', async ({ page }) => {
      await page.goto('/freelancers', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#freelancers-catalog')).toBeVisible({ timeout: 15000 })
      await page.goto('/services', { waitUntil: 'domcontentloaded' })
      await expect(
        page.getByRole('link', { name: /freelancer sifatida|sell as a freelancer|продавать как/i }),
      ).toBeVisible()
    })

    test('projects catalog loads for bidding discovery', async ({ page }) => {
      await page.goto('/projects', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
    })

    test('freelancer API routes require auth', async ({ request }) => {
      test.skip(!backendUp, 'Backend not running')
      const createService = await request.post(apiDirectUrl('/api/v1/services'), {
        data: { title: 'Launch sim', description: 'Test', price: 100000, category: 'web' },
        headers: { 'Content-Type': 'application/json' },
        timeout: API_FETCH_TIMEOUT,
      })
      expect(createService.status()).toBe(401)
    })
  })

  test.describe('Authenticated client', () => {
    test('login and reach dashboard area', async ({ page }) => {
      const loggedIn = await loginTestClient(page)
      test.skip(!loggedIn, 'Test client credentials unavailable')

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/login/)
      const onDashboard = page.url().includes('/dashboard') || page.url().includes('/onboarding')
      expect(onDashboard).toBeTruthy()
    })

    test('wallet and messages pages load when authenticated', async ({ page }) => {
      const loggedIn = await loginTestClient(page)
      test.skip(!loggedIn, 'Test client credentials unavailable')

      await page.goto('/dashboard/wallet', { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/login/)

      await page.goto('/dashboard/messages', { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/login/)
    })

    test('payments config available', async ({ request }) => {
      test.skip(!backendUp, 'Backend not running')
      const res = await request.get(apiDirectUrl('/api/v1/payments/config'), { timeout: API_FETCH_TIMEOUT })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(typeof body.checkout_available).toBe('boolean')
    })
  })

  test.describe('Admin persona', () => {
    test('admin moderation UI redirects unauthenticated users', async ({ page }) => {
      await page.goto('/admin/moderation', { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(/\/(login|admin)/)
    })

    test('admin API endpoints require auth', async ({ request }) => {
      test.skip(!backendUp, 'Backend not running')

      const endpoints: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [
        { method: 'GET', path: '/api/v1/admin/verifications?status=pending' },
        { method: 'GET', path: '/api/v1/admin/contract-disputes' },
        {
          method: 'PATCH',
          path: '/api/v1/admin/disputes/00000000-0000-4000-8000-000000000099/resolve',
          body: { resolution: 'resolved_client', admin_notes: 'launch sim' },
        },
        { method: 'GET', path: '/api/v1/admin/analytics' },
      ]

      for (const ep of endpoints) {
        const res = await request.fetch(apiDirectUrl(ep.path), {
          method: ep.method,
          data: ep.body,
          headers: ep.body ? { 'Content-Type': 'application/json' } : undefined,
          timeout: API_FETCH_TIMEOUT,
        })
        expect(res.status(), `${ep.method} ${ep.path}`).toBe(401)
      }
    })
  })

  test.describe('Platform health', () => {
    test('health and public stats', async ({ request }) => {
      test.skip(!backendUp, 'Backend not running')
      const health = await request.get(apiDirectUrl('/api/v1/health'), { timeout: API_FETCH_TIMEOUT })
      expect(health.ok()).toBeTruthy()
      const stats = await request.get(apiDirectUrl('/api/v1/stats/public'), { timeout: API_FETCH_TIMEOUT })
      expect(stats.ok()).toBeTruthy()
    })

    test('notification channels public metadata', async ({ request }) => {
      test.skip(!backendUp, 'Backend not running')
      const res = await request.get(apiDirectUrl('/api/v1/notifications/channels'), { timeout: API_FETCH_TIMEOUT })
      expect(res.ok()).toBeTruthy()
      const body = await res.json()
      expect(typeof body.email).toBe('boolean')
      expect(typeof body.telegram).toBe('boolean')
    })
  })
})
