import type { APIRequestContext, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const TEST_CLIENT_EMAIL = 'diag-timeout-test@ishbor.uz'
export const TEST_CLIENT_PASSWORD = 'DiagTest123!'

export const API_FETCH_TIMEOUT = 30_000

/** Bypass Next.js proxy for API-only tests — avoids contention under parallel Playwright workers. */
export const API_DIRECT_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:8002'

export function apiDirectUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_DIRECT_BASE}${normalized}`
}

export async function requireBackend(request: APIRequestContext): Promise<boolean> {
  const health = await request.get(apiDirectUrl('/api/v1/health'), { timeout: API_FETCH_TIMEOUT })
  return health.ok()
}

export async function getFirstServiceId(request: APIRequestContext): Promise<string | null> {
  const res = await request.get(apiDirectUrl('/api/v1/services?limit=10'), { timeout: API_FETCH_TIMEOUT })
  if (!res.ok()) return null
  const body = await res.json()
  const items: Array<{ id?: string; title?: string }> = body.items ?? []
  const preferred = items.find((s) => s.id && s.title && !/^sddsads$/i.test(s.title))
  return preferred?.id ?? items[0]?.id ?? null
}

export async function gotoServiceDetail(page: Page, serviceId: string): Promise<void> {
  const detailLoaded = page.waitForResponse(
    (res) => res.url().includes(`/api/v1/services/${serviceId}`) && res.status() === 200,
    { timeout: 45000 },
  )
  await page.goto(`/services/${serviceId}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await detailLoaded
  await expect(
    page.getByRole('button', { name: /xavfsiz buyurtma|secure order|безопасный заказ/i }).first(),
  ).toBeVisible({ timeout: 15000 })
}

export async function loginTestClient(page: Page): Promise<boolean> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.locator('#login-form input[type="email"]').fill(TEST_CLIENT_EMAIL)
  await page.locator('#login-form input[type="password"]').fill(TEST_CLIENT_PASSWORD)
  await page.locator('#login-form button[type="submit"]').click()
  await page.waitForTimeout(3000)
  return !page.url().includes('/login')
}
