import { expect, test } from '@playwright/test'

test.describe('verification workflow API', () => {
  test('user can request verification only when authenticated', async ({ request }) => {
    const health = await request.get('/api/v1/health')
    if (!health.ok()) {
      test.skip(true, 'Backend not running')
    }

    const create = await request.post('/api/v1/platform/verifications', {
      data: { verification_type: 'freelancer', notes: 'E2E test' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(create.status()).toBe(401)

    const mine = await request.get('/api/v1/platform/verifications/mine')
    expect(mine.status()).toBe(401)

    const written = await request.get('/api/v1/reviews/reviewer/me')
    expect(written.status()).toBe(401)
  })
})
