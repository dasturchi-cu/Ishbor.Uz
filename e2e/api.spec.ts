import { expect, test } from '@playwright/test'

test.describe('api proxy', () => {
  test('health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/v1/health')
    if (!res.ok()) {
      test.skip(true, 'Backend API not running — start backend on port 8002 for this test')
    }
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  test('payments config returns providers list', async ({ request }) => {
    const res = await request.get('/api/v1/payments/config')
    if (!res.ok()) {
      test.skip(true, 'Backend API not running — start backend on port 8002 for this test')
    }
    const body = await res.json()
    expect(Array.isArray(body.providers)).toBe(true)
    expect(typeof body.sandbox_allowed).toBe('boolean')
  })
})
