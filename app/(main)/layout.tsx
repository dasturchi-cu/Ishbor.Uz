import { SiteLayout } from '@/presentation/components/layout/site-layout'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>
}
