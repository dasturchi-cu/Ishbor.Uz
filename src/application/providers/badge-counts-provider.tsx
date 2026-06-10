'use client'

import { createContext, useContext, useMemo } from 'react'
import { useApp } from '@/application/providers/app-provider'
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
  const { isLoggedIn } = useApp()
  const { messageUnread, notificationUnread } = useDashboardBadges(isLoggedIn)
  const value = useMemo(
    () => ({ messageUnread, notificationUnread }),
    [messageUnread, notificationUnread]
  )
  return <BadgeCountsContext.Provider value={value}>{children}</BadgeCountsContext.Provider>
}

export function useBadgeCounts() {
  return useContext(BadgeCountsContext)
}
