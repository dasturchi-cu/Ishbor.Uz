import { expect, test } from '@playwright/test'
import { API_FETCH_TIMEOUT, apiDirectUrl } from './helpers'

const FAKE_UUID = '00000000-0000-4000-8000-000000000099'

test.describe('marketplace escrow flow (API)', () => {
  test.describe.configure({ mode: 'serial' })

  test('project → contract → escrow → milestone → dispute requires auth', async ({ request }) => {
    const health = await request.get(apiDirectUrl('/api/v1/health'), { timeout: API_FETCH_TIMEOUT })
    if (!health.ok()) {
      test.skip(true, 'Backend API not running — start backend on port 8002 for this test')
    }

    const steps: Array<{ method: string; path: string; body?: Record<string, unknown> }> = [
      { method: 'POST', path: '/api/v1/projects', body: { title: 'E2E loyiha', description: 'Test flow' } },
      { method: 'POST', path: `/api/v1/projects/${FAKE_UUID}/publish` },
      { method: 'GET', path: `/api/v1/contracts/${FAKE_UUID}` },
      { method: 'POST', path: `/api/v1/contracts/${FAKE_UUID}/fund`, body: { provider: 'sandbox' } },
      {
        method: 'POST',
        path: `/api/v1/milestones/contract/${FAKE_UUID}`,
        body: { title: 'Bosqich 1', amount: 100000 },
      },
      {
        method: 'POST',
        path: `/api/v1/disputes/contract/${FAKE_UUID}`,
        body: { reason: 'E2E nizo sababi test uchun' },
      },
      { method: 'GET', path: '/api/v1/admin/contract-disputes' },
      {
        method: 'PATCH',
        path: `/api/v1/admin/disputes/${FAKE_UUID}/resolve`,
        body: { resolution: 'resolved_client', admin_notes: 'E2E test' },
      },
    ]

    for (const step of steps) {
      const response = await request.fetch(apiDirectUrl(step.path), {
        method: step.method,
        data: step.body,
        headers: step.body ? { 'Content-Type': 'application/json' } : undefined,
        timeout: API_FETCH_TIMEOUT,
      })
      expect(response.status(), `${step.method} ${step.path}`).toBe(401)
    }
  })

  test('unified conversations endpoint requires auth', async ({ request }) => {
    const health = await request.get(apiDirectUrl('/api/v1/health'), { timeout: API_FETCH_TIMEOUT })
    if (!health.ok()) {
      test.skip(true, 'Backend API not running — start backend on port 8002 for this test')
    }

    const response = await request.get(apiDirectUrl('/api/v1/conversations'), { timeout: API_FETCH_TIMEOUT })
    expect(response.status()).toBe(401)
  })
})
