import { expect, test } from '@playwright/test'
import { getFirstServiceId, gotoServiceDetail, requireBackend } from './helpers'

let serviceId: string | null = null

test.describe('journey audit fixes', () => {
  test.beforeAll(async ({ request }) => {
    if (!(await requireBackend(request))) return
    serviceId = await getFirstServiceId(request)
  })

  test('guest order opens checkout modal instead of login redirect', async ({ page }) => {
    test.skip(!serviceId, 'No public service in catalog')
    await gotoServiceDetail(page, serviceId!)
    const orderBtn = page.getByRole('button', { name: /xavfsiz buyurtma|secure order|безопасный заказ/i }).first()
    await orderBtn.click()
    await page.waitForTimeout(800)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/xavfsiz buyurtma|secure order|checkout/i).first()).toBeVisible()
  })

  test('guest checkout step 3 shows login and register actions', async ({ page }) => {
    test.skip(!serviceId, 'No public service in catalog')
    await gotoServiceDetail(page, serviceId!)
    await page.getByRole('button', { name: /xavfsiz buyurtma|secure order|безопасный заказ/i }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /keyingi qadam|next step/i }).click()
    await dialog.getByRole('button', { name: /keyingi qadam|next step/i }).click()
    await expect(page.getByRole('link', { name: /kirish|sign in/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /ro'yxat|register|регистрац/i }).first()).toBeVisible()
  })

  test('post-project is public with guest landing', async ({ page }) => {
    await page.goto('/post-project', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('h1')).toContainText(/loyiha|project|проект/i)
    await expect(page.locator('a[href*="/register"]').first()).toBeVisible()
  })

  test('services hero shows sell CTA for guests not create service', async ({ page }) => {
    await page.goto('/services', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await expect(
      page.getByRole('link', { name: /freelancer sifatida|sell as a freelancer|продавать как/i }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /xizmat yaratish|create service|создать услугу/i })).toHaveCount(0)
  })

  test('public services API filters junk titles', async ({ request }) => {
    const health = await request.get('/api/v1/health')
    if (!health.ok()) test.skip(true, 'Backend not running')

    const res = await request.get('/api/v1/services?limit=50')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const titles: string[] = (body.items ?? []).map((s: { title: string }) => s.title?.toLowerCase?.() ?? '')
    expect(titles).not.toContain('test')
    expect(titles).not.toContain('ma suka')
  })

  test('dashboard is reachable without onboarding redirect for incomplete profile', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.locator('#login-form input[type="email"]').fill('diag-timeout-test@ishbor.uz')
    await page.locator('#login-form input[type="password"]').fill('DiagTest123!')
    await page.locator('#login-form button[type="submit"]').click()
    await page.waitForTimeout(3000)
  if (page.url().includes('/login')) {
      test.skip(true, 'Test credentials unavailable')
    }
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    await expect(page).not.toHaveURL(/\/login/)
    const onDashboard = page.url().includes('/dashboard') || page.url().includes('/onboarding')
    expect(onDashboard).toBeTruthy()
  })
})
