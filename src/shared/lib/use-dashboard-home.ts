'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/infrastructure/api/client'
import type { ApiOrder, ApiProject, ApiService, ApiUserReputation } from '@/infrastructure/api/types'

export interface DashboardHomeData {
  orders: ApiOrder[]
  services: ApiService[]
  projects: ApiProject[]
  reviewStats: { average: number; count: number }
  reputation: ApiUserReputation | null
}

const CACHE_TTL_MS = 45_000
const cache = new Map<string, { data: DashboardHomeData; at: number }>()

function cacheKey(userId: string, role: 'freelancer' | 'client') {
  return `${role}:${userId}`
}

export function useDashboardHome(
  userId: string | null,
  role: 'freelancer' | 'client'
) {
  const [data, setData] = useState<DashboardHomeData>({
    orders: [],
    services: [],
    projects: [],
    reviewStats: { average: 0, count: 0 },
    reputation: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const mounted = useRef(true)

  const load = useCallback(
    async (opts?: { silent?: boolean; force?: boolean }) => {
      if (!userId) {
        setLoading(false)
        return
      }

      const key = cacheKey(userId, role)
      const hit = cache.get(key)
      if (!opts?.force && hit && Date.now() - hit.at < CACHE_TTL_MS) {
        setData(hit.data)
        setLoading(false)
        setError(false)
        return
      }

      if (!opts?.silent) setLoading(true)
      setError(false)

      const [ordersRes, servicesRes, projectsRes, statsRes, repRes] = await Promise.all([
        api.listOrders().catch(() => null),
        role === 'freelancer' ? api.listMyServices().catch(() => null) : Promise.resolve([] as ApiService[]),
        role === 'client' && userId
          ? api.listProjects({ client_id: userId, status: 'all' }).catch(() => null)
          : Promise.resolve([] as ApiProject[]),
        role === 'freelancer'
          ? api.getFreelancerReviewStats(userId).catch(() => ({ average: 0, count: 0 }))
          : Promise.resolve({ average: 0, count: 0 }),
        api.getMyReputation().catch(() => null),
      ])

      if (!mounted.current) return

      const next: DashboardHomeData = {
        orders: ordersRes ?? [],
        services: servicesRes ?? [],
        projects: projectsRes ?? [],
        reviewStats: statsRes,
        reputation: repRes,
      }

      if (ordersRes === null) setError(true)
      cache.set(key, { data: next, at: Date.now() })
      setData(next)
      setLoading(false)
    },
    [userId, role]
  )

  useEffect(() => {
    mounted.current = true
    void load()
    const onFocus = () => void load({ silent: true })
    window.addEventListener('focus', onFocus)
    return () => {
      mounted.current = false
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  const invalidate = useCallback(() => {
    if (userId) cache.delete(cacheKey(userId, role))
    void load({ force: true })
  }, [userId, role, load])

  return { ...data, loading, error, reload: invalidate, refresh: () => load({ silent: true, force: true }) }
}

export function clearDashboardHomeCache(userId?: string) {
  if (!userId) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.endsWith(`:${userId}`)) cache.delete(key)
  }
}
