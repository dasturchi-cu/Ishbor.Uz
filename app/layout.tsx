import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/components/providers/app-provider'

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
  title: 'IshBor.uz - Freelance Marketplace',
  description: 'The leading freelance marketplace in Central Asia. Connect with top talent and grow your business.',
  generator: 'v0.app',
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
      <body className="font-sans antialiased">
        <AppProvider>
          {children}
        </AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
