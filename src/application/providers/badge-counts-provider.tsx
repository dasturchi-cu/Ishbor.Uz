'use client'

import { createContext, useContext } from 'react'
import { useDashboardBadges } from '@/shared/lib/use-dashboard-badges'

interface BadgeCounts {
  messageUnread: number
  notificationUnread: number
}

const BadgeCountsContext = createContext<BadgeCounts>({
  messageUnread: 0,
  notificationUnread: 0,
})

export function BadgeCountsProvider({ children }: { children: React.ReactNode }) {
  const badges = useDashboardBadges(true)
  return (
    <BadgeCountsContext.Provider value={badges}>{children}</BadgeCountsContext.Provider>
  )
}

export function useBadgeCounts() {
  return useContext(BadgeCountsContext)
}
