import { expect, test } from '@playwright/test'

test.describe('admin moderation', () => {
  test('admin moderation page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/moderation')
    await expect(page).toHaveURL(/\/(login|admin)/)
  })

  test('admin verification endpoints require auth', async ({ request }) => {
    const health = await request.get('/api/v1/health')
    if (!health.ok()) {
      test.skip(true, 'Backend not running')
    }

    const list = await request.get('/api/v1/admin/verifications?status=pending')
    expect(list.status()).toBe(401)

    const patch = await request.patch('/api/v1/admin/verifications/00000000-0000-4000-8000-000000000099', {
      data: { status: 'approved' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(patch.status()).toBe(401)
  })
})
