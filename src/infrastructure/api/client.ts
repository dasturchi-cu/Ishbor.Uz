import { getSupabase } from '@/infrastructure/supabase/client'
import type {
  ApiAdminStats,
  ApiConversation,
  ApiMessage,
  ApiOrder,
  ApiProfile,
  ApiProfilePublic,
  ApiProject,
  ApiPublicReview,
  ApiPublicStats,
  ApiReview,
  ApiService,
  ProjectCreateInput,
  ServiceCreateInput,
} from './types'

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'
const FETCH_TIMEOUT_MS = 20_000
const REFRESH_TIMEOUT_MS = 8_000

/** Brauzerda Next.js proxy (/api/v1 → backend) — CORS yo'q */
function resolveApiUrl(): string {
  if (typeof window !== 'undefined') return ''
  return DEFAULT_API_URL
}

export function getApiBaseUrl(): string {
  return resolveApiUrl() || DEFAULT_API_URL
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    }),
  ])
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabase()
    // getSession — refreshSession emas; deadlock xavfini kamaytiradi
    const { data: sessionData } = await supabase.auth.getSession()
    let session = sessionData.session

    if (session?.access_token) {
      const expiresAt = session.expires_at ?? 0
      const now = Math.floor(Date.now() / 1000)
      const needsRefresh = expiresAt > 0 && expiresAt - now < 60

      if (needsRefresh) {
        try {
          const { data: refreshData } = await withTimeout(
            supabase.auth.refreshSession(),
            REFRESH_TIMEOUT_MS,
            'Session refresh'
          )
          session = refreshData.session ?? session
        } catch {
          // Mavjud token bilan davom etamiz
        }
      }

      if (session?.access_token) {
        return { Authorization: `Bearer ${session.access_token}` }
      }
    }
  } catch {
    // Supabase sozlanmagan yoki sessiya olinmadi
  }
  return {}
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isApiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_URL)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeader = await getAuthHeader()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...(options.headers ?? {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`${resolveApiUrl()}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      let detail = res.statusText
      try {
        const body = await res.json()
        detail = body.detail ?? body.message ?? detail
      } catch {
        // ignore
      }
      throw new ApiError(typeof detail === 'string' ? detail : JSON.stringify(detail), res.status)
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('Server javob bermadi. Qayta urinib ko\'ring.', 408)
    }
    if (e instanceof TypeError && e.message.toLowerCase().includes('fetch')) {
      throw new ApiError(
        'Backend ishlamayapti. Terminalda backend ni ishga tushiring: cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8001',
        0
      )
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  health: () => apiFetch<{ status: string }>('/api/v1/health'),

  getProfile: () => apiFetch<ApiProfile>('/api/v1/profiles/me'),
  updateProfile: (data: Partial<ApiProfile>) =>
    apiFetch<ApiProfile>('/api/v1/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getProfileById: (id: string) => apiFetch<ApiProfilePublic>(`/api/v1/profiles/${id}`),
  listFreelancers: () => apiFetch<ApiProfilePublic[]>('/api/v1/profiles/freelancers'),

  listServices: (params?: { category?: string; region?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.category) q.set('category', params.category)
    if (params?.region) q.set('region', params.region)
    if (params?.search) q.set('search', params.search)
    const qs = q.toString()
    return apiFetch<ApiService[]>(`/api/v1/services${qs ? `?${qs}` : ''}`)
  },
  getService: (id: string) => apiFetch<ApiService>(`/api/v1/services/${id}`),
  listMyServices: () => apiFetch<ApiService[]>('/api/v1/services/mine'),
  listFreelancerServices: (id: string) => apiFetch<ApiService[]>(`/api/v1/services/freelancer/${id}`),
  createService: (data: ServiceCreateInput) =>
    apiFetch<ApiService>('/api/v1/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createOrder: (serviceId: string, notes?: string) =>
    apiFetch<ApiOrder>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({ service_id: serviceId, notes }),
    }),
  listOrders: () => apiFetch<ApiOrder[]>('/api/v1/orders'),
  updateOrderStatus: (orderId: string, status: string) =>
    apiFetch<ApiOrder>(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  listProjects: (params?: { status?: string; client_id?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.client_id) q.set('client_id', params.client_id)
    const qs = q.toString()
    return apiFetch<ApiProject[]>(`/api/v1/projects${qs ? `?${qs}` : ''}`)
  },
  createProject: (data: ProjectCreateInput) =>
    apiFetch<ApiProject>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listConversations: () => apiFetch<ApiConversation[]>('/api/v1/messages/conversations'),
  listMessages: (orderId: string) =>
    apiFetch<ApiMessage[]>(`/api/v1/messages?order_id=${encodeURIComponent(orderId)}`),
  sendMessage: (orderId: string, content: string) =>
    apiFetch<ApiMessage>('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, content }),
    }),

  listFreelancerReviews: (freelancerId: string) =>
    apiFetch<ApiReview[]>(`/api/v1/reviews/freelancer/${freelancerId}`),
  getFreelancerReviewStats: (freelancerId: string) =>
    apiFetch<{ average: number; count: number }>(`/api/v1/reviews/freelancer/${freelancerId}/stats`),
  listPublicReviews: (limit = 6) =>
    apiFetch<ApiPublicReview[]>(`/api/v1/reviews/recent?limit=${limit}`),
  createReview: (orderId: string, rating: number, comment?: string) =>
    apiFetch<ApiReview>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, rating, comment }),
    }),

  adminStats: () => apiFetch<ApiAdminStats>('/api/v1/admin/stats'),
  adminUsers: () => apiFetch<ApiProfile[]>('/api/v1/admin/users'),
  adminOrders: () => apiFetch<ApiOrder[]>('/api/v1/admin/orders'),

  publicStats: () => apiFetch<ApiPublicStats>('/api/v1/stats/public'),
}
