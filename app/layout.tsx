import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/components/providers/app-provider'
import { organizationSchema } from './schema'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e1e' },
  ],
}

const plusJakartaSans = Plus_Jakarta_Sans({ 
  variable: '--font-plus-jakarta-sans', 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({ 
  variable: '--font-inter', 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'IshBor.uz - Freelance Marketplace | Hire Talent in Central Asia',
  description: 'The leading freelance marketplace in Central Asia. Connect with top talent, post projects, and grow your business. 50K+ freelancers ready to help.',
  keywords: ['freelance', 'marketplace', 'hire', 'jobs', 'Central Asia', 'Uzbekistan', 'freelancer', 'projects'],
  generator: 'v0.app',
  openGraph: {
    title: 'IshBor.uz - Freelance Marketplace for Central Asia',
    description: '50K+ top-rated freelancers. Secure payments. Instant matching. Start your next project today.',
    url: 'https://ishbor.uz',
    siteName: 'IshBor.uz',
    images: [
      {
        url: 'https://ishbor.uz/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IshBor.uz Freelance Marketplace',
      },
    ],
    locale: 'en_UZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IshBor.uz - Freelance Marketplace',
    description: '50K+ freelancers. Secure payments. Start hiring today.',
    images: ['https://ishbor.uz/twitter-image.png'],
    creator: '@ishboruz',
  },
  alternates: {
    canonical: 'https://ishbor.uz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AppProvider>
          {children}
        </AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
