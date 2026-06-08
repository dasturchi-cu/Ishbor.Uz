import { LandingPage } from '@/presentation/features/landing/landing-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/',
  'IshBor.uz — Freelance Marketplace',
  "O'zbekistondagi freelance platformasi. Xizmatlar, buyurtmalar va xavfsiz to'lovlar."
)

export default function HomePage() {
  return <LandingPage />
}
