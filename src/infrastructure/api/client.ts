import { getCachedAccessToken } from '@/infrastructure/auth/session-cache'
import type { NotificationPrefs } from '@/shared/lib/notification-prefs'
import type {
  ApiAdminStats,
  ApiConversation,
  ApiMessage,
  ApiOrder,
  ApiProfile,
  ApiProfilePublic,
  ApiProject,
  ApiProjectApplication,
  ApiNotification,
  ApiPublicReview,
  ApiPublicStats,
  ApiReferralStats,
  ApiReview,
  ApiService,
  ProjectCreateInput,
  ServiceCreateInput,
  ServiceUpdateInput,
  ApiWithdrawalRequest,
  ApiTransaction,
} from './types'

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8001'
const FETCH_TIMEOUT_MS = 20_000

/** Brauzerda Next.js proxy (/api/v1 → backend) — CORS yo'q */
function resolveApiUrl(): string {
  if (typeof window !== 'undefined') return ''
  return DEFAULT_API_URL
}

export function getApiBaseUrl(): string {
  return resolveApiUrl() || DEFAULT_API_URL
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getCachedAccessToken()
  if (token) return { Authorization: `Bearer ${token}` }
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
  recordProfileView: (profileId: string) =>
    apiFetch<void>(`/api/v1/profiles/${profileId}/view`, { method: 'POST' }),
  listFreelancers: (params?: { q?: string; region?: string; specialty?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.q) q.set('q', params.q)
    if (params?.region) q.set('region', params.region)
    if (params?.specialty) q.set('specialty', params.specialty)
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiProfilePublic[]>(`/api/v1/profiles/freelancers${qs ? `?${qs}` : ''}`)
  },
  applyReferral: (referrerId: string) =>
    apiFetch<void>('/api/v1/profiles/me/referral', {
      method: 'POST',
      body: JSON.stringify({ referrer_id: referrerId }),
    }),
  getReferralStats: () => apiFetch<ApiReferralStats>('/api/v1/profiles/me/referral-stats'),
  checkUsername: (username: string) =>
    apiFetch<{ available: boolean }>(
      `/api/v1/profiles/check-username?username=${encodeURIComponent(username)}`
    ),
  getNotificationPrefs: () => apiFetch<NotificationPrefs>('/api/v1/profiles/me/notification-prefs'),
  updateNotificationPrefs: (prefs: Partial<NotificationPrefs>) =>
    apiFetch<NotificationPrefs>('/api/v1/profiles/me/notification-prefs', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    }),

  listServices: (params?: {
    category?: string
    region?: string
    search?: string
    limit?: number
    offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.category) q.set('category', params.category)
    if (params?.region) q.set('region', params.region)
    if (params?.search) q.set('search', params.search)
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiService[]>(`/api/v1/services${qs ? `?${qs}` : ''}`)
  },
  getService: (id: string) => apiFetch<ApiService>(`/api/v1/services/${id}`),
  recordServiceView: (serviceId: string) =>
    apiFetch<void>(`/api/v1/services/${serviceId}/view`, { method: 'POST' }),
  listMyServices: () => apiFetch<ApiService[]>('/api/v1/services/mine'),
  listFreelancerServices: (id: string) => apiFetch<ApiService[]>(`/api/v1/services/freelancer/${id}`),
  createService: (data: ServiceCreateInput) =>
    apiFetch<ApiService>('/api/v1/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateService: (id: string, data: ServiceUpdateInput) =>
    apiFetch<ApiService>(`/api/v1/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteService: (id: string) =>
    apiFetch<void>(`/api/v1/services/${id}`, { method: 'DELETE' }),

  createOrder: (serviceId: string, notes?: string, packageId?: string) =>
    apiFetch<ApiOrder>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify({
        service_id: serviceId,
        notes,
        package_id: packageId,
      }),
    }),
  listOrders: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiOrder[]>(`/api/v1/orders${qs ? `?${qs}` : ''}`)
  },
  listOrderTransactions: (orderId: string) =>
    apiFetch<ApiTransaction[]>(`/api/v1/payments/orders/${orderId}/transactions`),
  getOrder: (orderId: string) => apiFetch<ApiOrder>(`/api/v1/orders/${orderId}`),
  updateOrderStatus: (
    orderId: string,
    status: string,
    options?: { deliveryNotes?: string; disputeReason?: string }
  ) =>
    apiFetch<ApiOrder>(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(options?.deliveryNotes !== undefined ? { delivery_notes: options.deliveryNotes } : {}),
        ...(options?.disputeReason ? { dispute_reason: options.disputeReason } : {}),
      }),
    }),
  deleteAccount: () => apiFetch<void>('/api/v1/profiles/me', { method: 'DELETE' }),
  checkoutOrder: (orderId: string, provider: 'sandbox' | 'click' | 'payme' = 'sandbox') =>
    apiFetch<ApiOrder>(`/api/v1/payments/orders/${orderId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }),
  requestWithdrawal: (amount: number, note?: string) =>
    apiFetch<{ id: string; status: string }>('/api/v1/payments/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ amount, note }),
    }),
  listWithdrawals: () => apiFetch<ApiWithdrawalRequest[]>('/api/v1/payments/withdrawals'),

  listProjects: (params?: {
    status?: string
    client_id?: string
    q?: string
    region?: string
    category?: string
    limit?: number
    offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.client_id) q.set('client_id', params.client_id)
    if (params?.q) q.set('q', params.q)
    if (params?.region) q.set('region', params.region)
    if (params?.category) q.set('category', params.category)
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiProject[]>(`/api/v1/projects${qs ? `?${qs}` : ''}`)
  },
  getProject: (id: string) => apiFetch<ApiProject>(`/api/v1/projects/${id}`),
  createProject: (data: ProjectCreateInput) =>
    apiFetch<ApiProject>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProjectStatus: (id: string, status: string) =>
    apiFetch<ApiProject>(`/api/v1/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  createApplication: (data: {
    project_id: string
    cover_letter: string
    proposed_budget: number
    proposed_days: number
  }) =>
    apiFetch<ApiProjectApplication>('/api/v1/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listMyApplications: () =>
    apiFetch<ApiProjectApplication[]>('/api/v1/applications/mine'),
  listProjectApplications: (projectId: string) =>
    apiFetch<ApiProjectApplication[]>(`/api/v1/applications/project/${projectId}`),
  updateApplicationStatus: (applicationId: string, status: string) =>
    apiFetch<ApiProjectApplication>(
      `/api/v1/applications/${applicationId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) }
    ),

  listNotifications: () => apiFetch<ApiNotification[]>('/api/v1/notifications'),
  markNotificationsRead: (ids: string[]) =>
    apiFetch<void>('/api/v1/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  markAllNotificationsRead: () =>
    apiFetch<void>('/api/v1/notifications/mark-all-read', { method: 'POST' }),
  listSavedServices: () => apiFetch<{ service_ids: string[] }>('/api/v1/saved-items'),
  saveService: (serviceId: string) =>
    apiFetch<void>(`/api/v1/saved-items/${serviceId}`, { method: 'POST' }),
  unsaveService: (serviceId: string) =>
    apiFetch<void>(`/api/v1/saved-items/${serviceId}`, { method: 'DELETE' }),
  listSavedFreelancers: () => apiFetch<{ freelancer_ids: string[] }>('/api/v1/saved-items/freelancers'),
  saveFreelancer: (freelancerId: string) =>
    apiFetch<void>(`/api/v1/saved-items/freelancers/${freelancerId}`, { method: 'POST' }),
  unsaveFreelancer: (freelancerId: string) =>
    apiFetch<void>(`/api/v1/saved-items/freelancers/${freelancerId}`, { method: 'DELETE' }),
  listSavedProjects: () =>
    apiFetch<Array<{ project_id: string; projects: ApiProject | null }>>('/api/v1/saved-items/projects'),
  saveProject: (projectId: string) =>
    apiFetch<void>(`/api/v1/saved-items/projects/${projectId}`, { method: 'POST' }),
  unsaveProject: (projectId: string) =>
    apiFetch<void>(`/api/v1/saved-items/projects/${projectId}`, { method: 'DELETE' }),
  joinWaitlist: (email: string, source = 'general') =>
    apiFetch<void>('/api/v1/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    }),
  listServiceReviews: (serviceId: string) =>
    apiFetch<ApiReview[]>(`/api/v1/reviews/service/${serviceId}`),
  listTransactions: () => apiFetch<ApiTransaction[]>('/api/v1/payments/transactions'),
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
  replyToReview: (reviewId: string, reply: string) =>
    apiFetch<ApiReview>(`/api/v1/reviews/${reviewId}/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ reply }),
    }),

  adminStats: () => apiFetch<ApiAdminStats>('/api/v1/admin/stats'),
  adminUsers: () => apiFetch<ApiProfile[]>('/api/v1/admin/users'),
  adminOrders: () => apiFetch<ApiOrder[]>('/api/v1/admin/orders'),
  adminWithdrawals: () => apiFetch<ApiWithdrawalRequest[]>('/api/v1/admin/withdrawals'),
  adminUpdateWithdrawal: (requestId: string, status: 'approved' | 'rejected') =>
    apiFetch<ApiWithdrawalRequest>(`/api/v1/admin/withdrawals/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  adminResolveOrder: (orderId: string, status: 'completed' | 'cancelled' | 'active') =>
    apiFetch<ApiOrder>(`/api/v1/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  adminListServices: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiService[]>(`/api/v1/admin/services${qs ? `?${qs}` : ''}`)
  },
  adminUpdateUser: (
    userId: string,
    data: { role?: 'freelancer' | 'client'; is_banned?: boolean; is_verified?: boolean }
  ) =>
    apiFetch<ApiProfile>(`/api/v1/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  adminUpdateService: (serviceId: string, data: { is_hidden?: boolean }) =>
    apiFetch<ApiService>(`/api/v1/admin/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  adminDeleteService: (serviceId: string) =>
    apiFetch<void>(`/api/v1/admin/services/${serviceId}`, { method: 'DELETE' }),

  publicStats: () => apiFetch<ApiPublicStats>('/api/v1/stats/public'),
}
