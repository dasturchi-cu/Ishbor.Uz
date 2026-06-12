import { expect, test } from '@playwright/test'

const CLIENT_EMAIL = 'e2e-client-20260612@ishbor.test'
const CLIENT_PASSWORD = 'TestPass123!'
const FREELANCER_EMAIL = 'e2e-freelancer-20260612@ishbor.test'
const FREELANCER_PASSWORD = 'TestPass123!'

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  if (!page.url().includes('/login')) return
  await page.locator('#login-form input[type="email"]').fill(email)
  await page.locator('#login-form input[type="password"]').fill(password)
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/auth/v1/token') && res.status() === 200,
      { timeout: 90000 },
    ),
    page.locator('#login-form button[type="submit"]').click(),
  ])
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 90000, waitUntil: 'domcontentloaded' })
}

async function acceptTermsIfVisible(page: import('@playwright/test').Page) {
  const accept = page.getByRole('button', { name: /qabul qilaman/i })
  if (await accept.isVisible().catch(() => false)) {
    await accept.click()
    await page.waitForTimeout(500)
  }
}

test.describe('P0 application flow', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  let projectId = ''
  const projectTitle = `P0 Flow ${Date.now()}`

  test('projects catalog has no hydration error', async ({ page }) => {
    const hydrationErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /hydration/i.test(msg.text())) {
        hydrationErrors.push(msg.text())
      }
    })
    await page.goto('/projects', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main h1')).toBeVisible({ timeout: 15000 })
    await page.waitForTimeout(3000)
    expect(hydrationErrors, 'hydration errors on /projects').toEqual([])
  })

  test('client creates project', async ({ page }) => {
    await login(page, CLIENT_EMAIL, CLIENT_PASSWORD)
    await acceptTermsIfVisible(page)
    await page.goto('/post-project', { waitUntil: 'domcontentloaded' })
    const titleInput = page.getByRole('textbox', { name: /loyiha nomi/i })
    await expect(titleInput).toBeVisible({ timeout: 60000 })
    await titleInput.fill(projectTitle)
    await page.getByRole('textbox', { name: /loyihangiz|tavsif/i }).fill('P0 verification project for application flow.')
    await page.getByLabel('Kategoriya', { exact: true }).selectOption('Dasturlash')
    await page.getByRole('button', { name: /davom etish/i }).click()
    await page.getByRole('textbox', { name: /byudjet/i }).fill('3000000')
    await page.getByRole('button', { name: /2 hafta/i }).click()
    const [createRes] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/api/v1/projects') &&
          res.request().method() === 'POST' &&
          res.status() >= 200 &&
          res.status() < 300,
        { timeout: 90000 },
      ),
      page.getByRole('button', { name: /loyihani joylashtirish/i }).click(),
    ])
    const body = await createRes.json()
    projectId = body.id as string
    expect(projectId).toBeTruthy()
  })

  test('freelancer applies to project', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await login(page, FREELANCER_EMAIL, FREELANCER_PASSWORD)
    await acceptTermsIfVisible(page)
    await page.goto(`/projects/${projectId}`, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1')).toContainText(/P0 Flow/i, { timeout: 60000 })
    await expect(page.locator('#project-apply')).toBeVisible({ timeout: 60000 })
    await page.locator('#project-apply textarea').fill('P0 Playwright proposal — ready to deliver in 2 weeks.')
    await page.getByLabel(/taklif narxi/i).fill('2800000')
    await page.locator('#project-apply input[type="number"]').fill('14')
    const applyResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/applications') &&
        res.request().method() === 'POST' &&
        res.status() === 201,
      { timeout: 45000 },
    )
    await page.locator('#project-apply').getByRole('button', { name: /ariza yuborish/i }).click()
    await applyResponse
    await context.close()
  })

  test('client reviews and accepts application', async ({ page }) => {
    await login(page, CLIENT_EMAIL, CLIENT_PASSWORD)
    await acceptTermsIfVisible(page)
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/v1/applications/project/${projectId}`) && res.status() === 200,
        { timeout: 90000 },
      ),
      page.goto(`/projects/${projectId}`, { waitUntil: 'domcontentloaded' }),
    ])
    await expect(page.getByText(/P0 Playwright proposal/i)).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /^tanlash$/i }).click()
    await expect(page.getByText(/tanlangan/i)).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: /ishga olish/i }).click()
    await expect(page.getByText(/ishga olingan/i)).toBeVisible({ timeout: 15000 })
  })
})
