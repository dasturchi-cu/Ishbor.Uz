import { ServicesLandingPage } from '@/presentation/features/catalog/services-landing-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Xizmatlar katalogi — IshBor.uz',
  description: 'Freelancer xizmatlarini toping va buyurtma bering',
  openGraph: {
    title: 'Xizmatlar — IshBor.uz',
    description: 'O\'zbekiston freelance xizmatlar katalogi',
  },
}

export default function ServicesRoute() {
  return <ServicesLandingPage />
}