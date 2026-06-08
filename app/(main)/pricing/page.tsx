import { PricingPage } from '@/presentation/features/pricing/pricing-page'
import type { Metadata } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ishbor.uz'

export const metadata: Metadata = {
  title: 'Narxlar — IshBor.uz',
  description: 'IshBor.uz tarif rejalar — bepul boshlang, Pro tez orada',
  openGraph: {
    title: 'Narxlar — IshBor.uz',
    description: 'Freelancer va mijozlar uchun mos tariflar',
    url: `${SITE}/pricing`,
    siteName: 'IshBor.uz',
    locale: 'uz_UZ',
    type: 'website',
  },
}

export default function PricingRoute() {
  return <PricingPage />
}
