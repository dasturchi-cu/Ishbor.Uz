import { expect, test } from '@playwright/test'

test.describe('wallet top-up API', () => {
  test('POST /payments/wallet/topup requires auth', async ({ request }) => {
    const health = await request.get('/api/v1/health')
    if (!health.ok()) {
      test.skip(true, 'Backend not running')
    }

    const res = await request.post('/api/v1/payments/wallet/topup', {
      data: { amount: 100000, provider: 'sandbox' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /payments/wallet/topup/{id} requires auth', async ({ request }) => {
    const health = await request.get('/api/v1/health')
    if (!health.ok()) {
      test.skip(true, 'Backend not running')
    }

    const res = await request.get('/api/v1/payments/wallet/topup/00000000-0000-4000-8000-000000000099')
    expect(res.status()).toBe(401)
  })
})
