'use client'

import { DashboardActivityFeed } from '@/presentation/components/dashboard/dashboard-activity-feed'

/** @deprecated DashboardActivityFeed ishlating — buyurtma, xabar va to'lovlarni birlashtiradi */
export function ActivityTimeline({ className }: { className?: string }) {
  return <DashboardActivityFeed className={className} />
}