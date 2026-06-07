'use client'

import dynamic from 'next/dynamic'

const PageContent = dynamic(
  () => import('@/components/pages/_page-content').then(mod => ({ default: mod.PageContent })),
  { 
    loading: () => <div className="h-screen bg-background" />,
    ssr: false 
  }
)

export default function Home() {
  return <PageContent />
}
