import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/application/providers/app-provider'
import { QueryProvider } from '@/application/providers/query-provider'
import { PasswordRecoveryRedirect } from '@/presentation/components/auth/password-recovery-redirect'
import { JsonLdOrganization } from '@/presentation/components/seo/json-ld'
import { GoogleAnalytics } from '@/presentation/components/analytics/google-analytics'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ishbor.uz'

export const metadata: Metadata = {
  title: 'IshBor.uz - Freelance Marketplace',
  description: "O'zbekistondagi freelance platformasi. Xizmatlar, buyurtmalar va chat.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'IshBor.uz',
    description: "O'zbekistondagi freelance marketplace",
    url: SITE_URL,
    siteName: 'IshBor.uz',
    locale: 'uz_UZ',
    type: 'website',
    images: [{ url: `${SITE_URL}/icon.svg`, width: 512, height: 512, alt: 'IshBor.uz' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IshBor.uz',
    description: "O'zbekistondagi freelance marketplace",
    images: [`${SITE_URL}/icon.svg`],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      uz: SITE_URL,
      ru: SITE_URL,
      en: SITE_URL,
      'x-default': SITE_URL,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uz" className={`${inter.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p==='/auth/reset-password')return;var h=location.hash,s=location.search;if(h.indexOf('type=recovery')!==-1||s.indexOf('type=recovery')!==-1){location.replace('/auth/reset-password'+s+h);}}catch(e){}})();`,
          }}
        />
        <JsonLdOrganization />
      </head>
      <body className="font-sans antialiased">
        <AppProvider>
          <QueryProvider>
            <PasswordRecoveryRedirect />
            {children}
          </QueryProvider>
        </AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
