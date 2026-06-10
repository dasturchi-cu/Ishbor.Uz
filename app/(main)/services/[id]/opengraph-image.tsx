import { ImageResponse } from 'next/og'
import { fetchServiceForMeta } from '@/infrastructure/api/server-fetch'

export const runtime = 'edge'
export const alt = 'IshBor.uz xizmat'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ id: string }> }

export default async function OgImage({ params }: Props) {
  const { id } = await params
  const service = await fetchServiceForMeta(id)
  const title = service?.title ?? 'Freelance xizmat'
  const price =
    service?.price != null
      ? `${new Intl.NumberFormat('uz-UZ').format(service.price)} so'm`
      : 'IshBor.uz'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#fff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            IB
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, opacity: 0.95 }}>IshBor.uz</span>
        </div>
        <div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 1000,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 600, opacity: 0.9 }}>{price}</div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.85 }}>Escrow himoyasi · O&apos;zbekiston marketplace</div>
      </div>
    ),
    { ...size },
  )
}
