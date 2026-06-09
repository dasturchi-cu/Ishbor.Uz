import { expect, test } from '@playwright/test'

const FAKE_UUID = '00000000-0000-4000-8000-000000000099'

test.describe('milestone escrow API', () => {
  test('milestone CRUD and status transitions require auth', async ({ request }) => {
    const health = await request.get('/api/v1/health')
    if (!health.ok()) {
      test.skip(true, 'Backend not running')
    }

    const steps = [
      {
        method: 'GET',
        path: `/api/v1/milestones/contract/${FAKE_UUID}`,
      },
      {
        method: 'POST',
        path: `/api/v1/milestones/contract/${FAKE_UUID}`,
        body: { title: 'E2E bosqich', amount: 500000, sort_order: 0 },
      },
      {
        method: 'PATCH',
        path: `/api/v1/milestones/${FAKE_UUID}/status`,
        body: { status: 'funded' },
      },
    ] as const

    for (const step of steps) {
      const res = await request.fetch(step.path, {
        method: step.method,
        data: 'body' in step ? step.body : undefined,
        headers: 'body' in step ? { 'Content-Type': 'application/json' } : undefined,
      })
      expect(res.status(), `${step.method} ${step.path}`).toBe(401)
    }
  })
})
