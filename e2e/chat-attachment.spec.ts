import { expect, test } from '@playwright/test'

test.describe('chat attachment storage API', () => {
  test('signed-url endpoint requires auth', async ({ request }) => {
    const health = await request.get('/api/v1/health')
    if (!health.ok()) {
      test.skip(true, 'Backend API not running — start backend on port 8002 for this test')
    }

    const response = await request.post('/api/v1/platform/storage/signed-url', {
      data: {
        bucket: 'project-attachments',
        path: 'user-id/chat/conversation-id/file.jpg',
      },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(401)
  })
})
