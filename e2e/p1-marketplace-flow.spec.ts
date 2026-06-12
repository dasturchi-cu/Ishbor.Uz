import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const CLIENT_EMAIL = 'e2e-client-20260612@ishbor.test'
const CLIENT_PASSWORD = 'TestPass123!'

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  if (!page.url().includes('/login')) return
  await page.getByRole('textbox', { name: /email/i }).fill(email)
  await page.getByRole('textbox', { name: /parol/i }).fill(password)
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/auth/v1/token') && res.status() === 200,
      { timeout: 90_000 },
    ),
    page.locator('#login-form button[type="submit"]').click(),
  ])
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 90_000,
    waitUntil: 'domcontentloaded',
  })
}

async function acceptTermsIfVisible(page: import('@playwright/test').Page) {
  const accept = page.getByRole('button', { name: /qabul qilaman/i })
  if (await accept.isVisible().catch(() => false)) {
    await accept.click()
    await page.waitForTimeout(500)
  }
}

test.describe('P1 marketplace flow fixes', () => {
  test('BUG-004: /projects/new redirects to post-project', async ({ page }) => {
    await page.goto(`${BASE}/projects/new`, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/post-project/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
  })

  test('BUG-006: /services loads reliably for guest (3 visits)', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto(`${BASE}/services`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#services-catalog')).toBeVisible({ timeout: 20_000 })
      await expect(page.getByText(/Backend javob bermadi|Backend ulanmadi/i)).toHaveCount(0, {
        timeout: 25_000,
      })
      await expect(page.locator('#services-catalog .catalog-grid')).toBeVisible({ timeout: 25_000 })
    }
  })
})

test.describe('P1 authenticated flow', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  const projectTitle = `P1 Flow ${Date.now()}`
  let projectId = ''

  test('BUG-005: single submit creates exactly one project', async ({ page }) => {
    await login(page, CLIENT_EMAIL, CLIENT_PASSWORD)
    await acceptTermsIfVisible(page)
    await page.goto(`${BASE}/post-project`, { waitUntil: 'domcontentloaded' })

    await page.getByRole('textbox', { name: /loyiha nomi/i }).fill(projectTitle)
    await page.getByRole('textbox', { name: /loyihangiz|tavsif/i }).fill('P1 duplicate-submit guard verification project.')
    await page.getByLabel('Kategoriya', { exact: true }).selectOption('Dasturlash')
    await page.getByRole('button', { name: /davom etish/i }).click()
    await page.getByRole('textbox', { name: /byudjet/i }).fill('2500000')
    await page.getByRole('button', { name: /2 hafta/i }).click()

    const postResponses: import('@playwright/test').Response[] = []
    page.on('response', (res) => {
      if (res.url().includes('/api/v1/projects') && res.request().method() === 'POST') {
        postResponses.push(res)
      }
    })

    const [createRes] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/api/v1/projects') &&
          res.request().method() === 'POST' &&
          res.status() >= 200 &&
          res.status() < 300,
        { timeout: 90_000 },
      ),
      page.getByRole('button', { name: /loyihani joylashtirish/i }).click(),
    ])
    await page.waitForTimeout(1500)
    expect(postResponses.filter((r) => r.status() >= 200 && r.status() < 300)).toHaveLength(1)

    const body = await createRes.json()
    projectId = body.id as string
    expect(projectId).toBeTruthy()
  })

  test('BUG-008: project visible on dashboard after create', async ({ page }) => {
    await login(page, CLIENT_EMAIL, CLIENT_PASSWORD)
    await acceptTermsIfVisible(page)

    await page.goto(`${BASE}/dashboard/client`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(projectTitle)).toBeVisible({ timeout: 30_000 })

    await page.goto(`${BASE}/dashboard/projects`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(projectTitle)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/hozircha loyihalar yo'q/i)).toHaveCount(0)
  })

  test('project visible in marketplace catalog', async ({ page }) => {
    await page.goto(`${BASE}/projects`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(projectTitle)).toBeVisible({ timeout: 30_000 })
  })
})
