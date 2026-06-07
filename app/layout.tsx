import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/application/providers/app-provider'

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
  description: 'O\'zbekistonning yetakchi freelance platformasi. Iqtidorli mutaxassislar bilan bog\'laning va biznesingizni rivojlantiring.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uz" className={`bg-background ${plusJakartaSans.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <AppProvider>
          {children}
        </AppProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
