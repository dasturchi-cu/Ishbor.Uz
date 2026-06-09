import type { ApiOrder, ApiProfile, ApiProject, ApiService, ApiUserReputation } from '@/infrastructure/api/types'

const KEY_PREFIX = 'ishbor:dashboard-summary:'
const MAX_AGE_MS = 10 * 60_000

export interface DashboardSummaryPayload {
  profile: ApiProfile
  wallet_balance: number
  orders: ApiOrder[]
  services: ApiService[]
  projects: ApiProject[]
  review_stats: { average: number; count: number }
  reputation: ApiUserReputation | null
  badges: { message_unread: number; notification_unread: number }
}

interface CachedEntry {
  userId: string
  role: 'freelancer' | 'client'
  fetchedAt: number
  data: DashboardSummaryPayload
}

function storageKey(role: 'freelancer' | 'client'): string {
  return `${KEY_PREFIX}${role}`
}

export function readDashboardSummaryCache(
  userId: string | null,
  role: 'freelancer' | 'client'
): DashboardSummaryPayload | undefined {
  if (typeof window === 'undefined' || !userId) return undefined
  try {
    const raw = sessionStorage.getItem(storageKey(role))
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as CachedEntry
    if (parsed.userId !== userId || parsed.role !== role) return undefined
    if (Date.now() - parsed.fetchedAt > MAX_AGE_MS) return undefined
    return parsed.data
  } catch {
    return undefined
  }
}

export function readDashboardSummaryCacheUpdatedAt(
  userId: string | null,
  role: 'freelancer' | 'client'
): number | undefined {
  if (typeof window === 'undefined' || !userId) return undefined
  try {
    const raw = sessionStorage.getItem(storageKey(role))
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as CachedEntry
    if (parsed.userId !== userId || parsed.role !== role) return undefined
    return parsed.fetchedAt
  } catch {
    return undefined
  }
}

export function writeDashboardSummaryCache(
  userId: string,
  role: 'freelancer' | 'client',
  data: DashboardSummaryPayload
): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CachedEntry = { userId, role, fetchedAt: Date.now(), data }
    sessionStorage.setItem(storageKey(role), JSON.stringify(entry))
  } catch {
    // quota / private mode
  }
}

export function clearDashboardSummaryCache(role?: 'freelancer' | 'client'): void {
  if (typeof window === 'undefined') return
  try {
    if (role) {
      sessionStorage.removeItem(storageKey(role))
      return
    }
    sessionStorage.removeItem(storageKey('freelancer'))
    sessionStorage.removeItem(storageKey('client'))
  } catch {
    // ignore
  }
}
