import { getCachedAccessToken, refreshCachedSession } from '@/infrastructure/auth/session-cache'
import type { NotificationPrefs } from '@/shared/lib/notification-prefs'
import type {
  ApiAdminStats,
  ApiPaginated,
  ApiPaymentsConfig,
  ApiNotificationChannels,
  ApiCheckoutResponse,
  ApiConversation,
  ApiMessage,
  ApiOrder,
  ApiPaymentIntent,
  ApiProfile,
  ApiProfilePublic,
  ApiProject,
  ApiProjectApplication,
  ApiNotification,
  ApiPublicReview,
  ApiPublicStats,
  ApiReferralStats,
  ApiAiSuggestResponse,
  ApiAnalytics,
  ApiReview,
  ApiService,
  ApiServiceList,
  ProjectCreateInput,
  ServiceCreateInput,
  ServiceUpdateInput,
  ApiWaitlistEntry,
  ApiWithdrawalRequest,
  ApiTransaction,
  ApiContract,
  ApiEscrowTransaction,
  ApiMilestone,
  ApiDispute,
  ApiDisputeMessage,
  ApiConversationThread,
  ApiCallSession,
  ApiProjectReview,
} from './types'

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8002'
const FETCH_TIMEOUT_MS = 20_000

/** Brauzerda Next.js proxy (/api/v1 → backend) — CORS yo'q */
function resolveApiUrl(): string {
  if (typeof window !== 'undefined') return ''
  return DEFAULT_API_URL
}

export function getApiBaseUrl(): string {
  return resolveApiUrl() || DEFAULT_API_URL
}

async function getAuthHeader(forceRefresh = false): Promise<Record<string, string>> {
  const token = forceRefresh
    ? (await refreshCachedSession())?.accessToken ?? null
    : await getCachedAccessToken()
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

function paymentIdempotencyHeaders(): Record<string, string> {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return { 'Idempotency-Key': crypto.randomUUID() }
  }
  return {}
}

const RETRYABLE_GET_STATUSES = new Set([0, 408, 429, 503])
const MAX_GET_ATTEMPTS = 3

async function parseApiError(res: Response): Promise<ApiError> {
  let detail = res.statusText
  try {
    const body = await res.json()
    detail = body.detail ?? body.message ?? detail
  } catch {
    // ignore
  }
  if (detail === 'Internal Server Error' && res.status >= 500) {
    detail = "Server xatosi. Sahifani yangilab qayta urinib ko'ring."
  }
  return new ApiError(typeof detail === 'string' ? detail : JSON.stringify(detail), res.status)
}

async function retryGet<T>(
  path: string,
  options: RequestInit,
  attempt: number,
  refreshAuth: boolean
): Promise<T> {
  return apiFetch<T>(path, options, attempt, refreshAuth)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  attempt = 0,
  refreshAuth = false
): Promise<T> {
  const authHeader = await getAuthHeader(refreshAuth)
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...(options.headers ?? {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const method = (options.method ?? 'GET').toUpperCase()
  const isGet = method === 'GET'
  const canRetry = isGet && attempt < MAX_GET_ATTEMPTS - 1

  try {
    const res = await fetch(`${resolveApiUrl()}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      const err = await parseApiError(res)
      if (canRetry) {
        if (err.status === 401 && !refreshAuth) {
          await refreshCachedSession()
          await new Promise((r) => setTimeout(r, 200))
          return retryGet<T>(path, options, attempt + 1, true)
        }
        if (RETRYABLE_GET_STATUSES.has(err.status)) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)))
          return retryGet<T>(path, options, attempt + 1, refreshAuth)
        }
      }
      throw err
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  } catch (e) {
    if (e instanceof ApiError) throw e
    if (e instanceof DOMException && e.name === 'AbortError') {
      const err = new ApiError("Server javob bermadi. Qayta urinib ko'ring.", 408)
      if (canRetry) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)))
        return retryGet<T>(path, options, attempt + 1, refreshAuth)
      }
      throw err
    }
    if (e instanceof TypeError && e.message.toLowerCase().includes('fetch')) {
      const err = new ApiError('Backend ishlamayapti. Terminalda: pnpm dev:api (port 8002)', 0)
      if (canRetry) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)))
        return retryGet<T>(path, options, attempt + 1, refreshAuth)
      }
      throw err
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
  updateProfileRole: (role: 'freelancer' | 'client') =>
    apiFetch<ApiProfile>('/api/v1/profiles/me/role', {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  getUiPreferences: () =>
    apiFetch<{ theme?: string; language?: string; timezone?: string }>('/api/v1/profiles/me/ui-preferences'),
  updateUiPreferences: (data: { theme?: 'light' | 'dark'; language?: 'uz' | 'ru' | 'en'; timezone?: string }) =>
    apiFetch<Record<string, string>>('/api/v1/profiles/me/ui-preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getProfileById: (id: string) => apiFetch<ApiProfilePublic>(`/api/v1/profiles/${id}`),
  recordProfileView: (profileId: string) =>
    apiFetch<void>(`/api/v1/profiles/${profileId}/view`, { method: 'POST' }),
  listFreelancers: (params?: { q?: string; region?: string; specialty?: string; sort?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.q) q.set('q', params.q)
    if (params?.region) q.set('region', params.region)
    if (params?.specialty) q.set('specialty', params.specialty)
    if (params?.sort) q.set('sort', params.sort)
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
  notificationChannels: () => apiFetch<ApiNotificationChannels>('/api/v1/notifications/channels'),

  listServices: (params?: {
    category?: string
    region?: string
    search?: string
    sort?: string
    min_price?: number
    max_price?: number
    max_delivery_days?: number
    limit?: number
    offset?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.category) q.set('category', params.category)
    if (params?.region) q.set('region', params.region)
    if (params?.search) q.set('search', params.search)
    if (params?.sort) q.set('sort', params.sort)
    if (params?.min_price != null) q.set('min_price', String(params.min_price))
    if (params?.max_price != null) q.set('max_price', String(params.max_price))
    if (params?.max_delivery_days != null) q.set('max_delivery_days', String(params.max_delivery_days))
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiServiceList>(`/api/v1/services${qs ? `?${qs}` : ''}`)
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
  getOrderPaymentIntent: (orderId: string) =>
    apiFetch<ApiPaymentIntent>(`/api/v1/payments/orders/${orderId}/payment-intent`),
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
  paymentsConfig: () => apiFetch<ApiPaymentsConfig>('/api/v1/payments/config'),
  checkoutOrder: (orderId: string, provider: 'sandbox' | 'click' | 'payme' = 'sandbox') =>
    apiFetch<ApiCheckoutResponse>(`/api/v1/payments/orders/${orderId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ provider }),
      headers: paymentIdempotencyHeaders(),
    }),
  payOrderFromWallet: (orderId: string) =>
    apiFetch<ApiCheckoutResponse>(`/api/v1/payments/orders/${orderId}/pay-wallet`, {
      method: 'POST',
      headers: paymentIdempotencyHeaders(),
    }),
  requestWithdrawal: (amount: number, note?: string) =>
    apiFetch<{ id: string; status: string }>('/api/v1/payments/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ amount, note }),
      headers: paymentIdempotencyHeaders(),
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
  updateProject: (id: string, data: Partial<ProjectCreateInput>) =>
    apiFetch<ApiProject>(`/api/v1/projects/${id}`, {
      method: 'PATCH',
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
  withdrawApplication: (applicationId: string) =>
    apiFetch<void>(`/api/v1/applications/${applicationId}`, { method: 'DELETE' }),

  listNotifications: () => apiFetch<ApiNotification[]>('/api/v1/notifications'),
  markNotificationsRead: (ids: string[]) =>
    apiFetch<void>('/api/v1/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  markAllNotificationsRead: () =>
    apiFetch<void>('/api/v1/notifications/mark-all-read', { method: 'POST' }),
  dismissNotifications: (ids: string[]) =>
    apiFetch<void>('/api/v1/notifications/dismiss', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  listSavedServices: () => apiFetch<{ service_ids: string[] }>('/api/v1/saved-items'),
  listSavedServicesEnriched: () => apiFetch<ApiService[]>('/api/v1/saved-items/services/enriched'),
  listSavedFreelancersEnriched: () =>
    apiFetch<ApiProfilePublic[]>('/api/v1/saved-items/freelancers/enriched'),
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
  listMessages: (orderId: string, limit = 200) =>
    apiFetch<ApiMessage[]>(
      `/api/v1/messages?order_id=${encodeURIComponent(orderId)}&limit=${limit}`
    ),
  sendMessage: (orderId: string, content: string) =>
    apiFetch<ApiMessage>('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, content }),
    }),

  listFreelancerReviews: (freelancerId: string) =>
    apiFetch<ApiReview[]>(`/api/v1/reviews/freelancer/${freelancerId}`),
  listMyWrittenReviews: () => apiFetch<ApiReview[]>('/api/v1/reviews/reviewer/me'),
  getMyWrittenReviewStats: () =>
    apiFetch<{ average: number; count: number }>('/api/v1/reviews/reviewer/me/stats'),
  getFreelancerReviewStats: (freelancerId: string) =>
    apiFetch<{ average: number; count: number }>(`/api/v1/reviews/freelancer/${freelancerId}/stats`),
  listPublicReviews: (limit = 6) =>
    apiFetch<ApiPublicReview[]>(`/api/v1/reviews/recent?limit=${limit}`),
  getReviewForOrder: (orderId: string) =>
    apiFetch<ApiReview | null>(`/api/v1/reviews/order/${orderId}`),
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
  updateReview: (reviewId: string, data: { rating?: number; comment?: string }) =>
    apiFetch<ApiReview>(`/api/v1/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteReview: (reviewId: string) =>
    apiFetch<void>(`/api/v1/reviews/${reviewId}`, { method: 'DELETE' }),

  adminStats: () => apiFetch<ApiAdminStats>('/api/v1/admin/stats'),
  adminOverview: () => apiFetch<import('./types').ApiAdminOverview>('/api/v1/admin/overview'),
  adminDisputes: (params?: {
    limit?: number
    offset?: number
    scope?: 'open' | 'resolved' | 'all'
  }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    if (params?.scope) q.set('scope', params.scope)
    const qs = q.toString()
    return apiFetch<ApiPaginated<ApiOrder>>(`/api/v1/admin/disputes${qs ? `?${qs}` : ''}`)
  },
  adminWaitlist: (params?: { limit?: number; offset?: number; source?: string }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    if (params?.source) q.set('source', params.source)
    const qs = q.toString()
    return apiFetch<ApiPaginated<ApiWaitlistEntry>>(`/api/v1/admin/waitlist${qs ? `?${qs}` : ''}`)
  },
  adminUsers: (params?: {
    limit?: number
    offset?: number
    search?: string
    role?: 'freelancer' | 'client'
    is_banned?: boolean
  }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    if (params?.search?.trim()) q.set('search', params.search.trim())
    if (params?.role) q.set('role', params.role)
    if (params?.is_banned != null) q.set('is_banned', String(params.is_banned))
    const qs = q.toString()
    return apiFetch<ApiPaginated<ApiProfile>>(`/api/v1/admin/users${qs ? `?${qs}` : ''}`)
  },
  adminBulkUsers: (data: {
    user_ids: string[]
    action: 'ban' | 'unban' | 'verify' | 'unverify'
  }) =>
    apiFetch<{ updated: number; user_ids: string[] }>('/api/v1/admin/users/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminOrders: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiPaginated<ApiOrder>>(`/api/v1/admin/orders${qs ? `?${qs}` : ''}`)
  },
  adminWithdrawals: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiPaginated<ApiWithdrawalRequest>>(`/api/v1/admin/withdrawals${qs ? `?${qs}` : ''}`)
  },
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

  aiSuggest: (body: {
    kind: 'project_description' | 'service_description' | 'service_title' | 'profile_bio' | 'cover_letter'
    title?: string
    category?: string
    skills?: string[]
    region?: string
    project_description?: string
    specialty?: string
    language?: 'uz' | 'ru' | 'en'
  }) =>
    apiFetch<ApiAiSuggestResponse>('/api/v1/ai/suggest', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAnalytics: (period: '7d' | '30d' | '3m' | '1y' = '30d') =>
    apiFetch<ApiAnalytics>(`/api/v1/profiles/me/analytics?period=${period}`),

  listContracts: (params?: { role?: 'client' | 'freelancer'; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.role) q.set('role', params.role)
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return apiFetch<ApiContract[]>(`/api/v1/contracts${qs ? `?${qs}` : ''}`)
  },
  getContract: (id: string) => apiFetch<ApiContract>(`/api/v1/contracts/${id}`),
  updateContractStatus: (id: string, status: string, delivery_notes?: string) =>
    apiFetch<ApiContract>(`/api/v1/contracts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, delivery_notes }),
    }),
  fundContract: (id: string, provider = 'sandbox') =>
    apiFetch<ApiContract>(`/api/v1/contracts/${id}/fund`, {
      method: 'POST',
      body: JSON.stringify({ provider }),
      headers: paymentIdempotencyHeaders(),
    }),
  listContractEscrow: (id: string) =>
    apiFetch<ApiEscrowTransaction[]>(`/api/v1/contracts/${id}/escrow`),
  listContractMilestones: (contractId: string) =>
    apiFetch<ApiMilestone[]>(`/api/v1/milestones/contract/${contractId}`),
  createMilestone: (
    contractId: string,
    data: { title: string; amount: number; description?: string; due_date?: string; sort_order?: number }
  ) =>
    apiFetch<ApiMilestone>(`/api/v1/milestones/contract/${contractId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMilestoneStatus: (milestoneId: string, status: string) =>
    apiFetch<ApiMilestone>(`/api/v1/milestones/${milestoneId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  walletTopup: (amount: number, provider: 'sandbox' | 'click' | 'payme' = 'sandbox') =>
    apiFetch<{ id: string; amount: number; provider: string; status: string; redirect_url?: string | null }>(
      '/api/v1/payments/wallet/topup',
      {
        method: 'POST',
        body: JSON.stringify({ amount, provider }),
        headers: paymentIdempotencyHeaders(),
      }
    ),
  getWalletTopup: (intentId: string) =>
    apiFetch<{ id: string; amount: number; provider: string; status: string; redirect_url?: string | null }>(
      `/api/v1/payments/wallet/topup/${intentId}`
    ),
  openDispute: (contractId: string, reason: string) =>
    apiFetch<ApiDispute>(`/api/v1/disputes/contract/${contractId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getDispute: (id: string) => apiFetch<ApiDispute>(`/api/v1/disputes/${id}`),
  listDisputeMessages: (id: string) =>
    apiFetch<ApiDisputeMessage[]>(`/api/v1/disputes/${id}/messages`),
  postDisputeMessage: (id: string, content: string) =>
    apiFetch<ApiDisputeMessage>(`/api/v1/disputes/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  publishProject: (id: string) =>
    apiFetch<ApiProject>(`/api/v1/projects/${id}/publish`, { method: 'POST' }),
  listConversationThreads: () =>
    apiFetch<ApiConversationThread[]>('/api/v1/conversations'),
  listConversationMessages: (conversationId: string) =>
    apiFetch<ApiMessage[]>(`/api/v1/conversations/${conversationId}/messages`),
  sendConversationMessage: (
    conversationId: string,
    content: string,
    message_type: 'text' | 'image' | 'file' | 'document' = 'text',
    attachments: unknown[] = []
  ) =>
    apiFetch<ApiMessage>(`/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, message_type, attachments }),
    }),
  markConversationRead: (conversationId: string) =>
    apiFetch<{ ok: boolean }>(`/api/v1/conversations/${conversationId}/read`, { method: 'POST' }),
  startCall: (data: { callee_id: string; contract_id?: string; conversation_id?: string; call_type?: string }) =>
    apiFetch<ApiCallSession>('/api/v1/calls', { method: 'POST', body: JSON.stringify(data) }),
  getCall: (id: string) => apiFetch<ApiCallSession>(`/api/v1/calls/${id}`),
  updateCall: (id: string, data: { status?: string; media_state?: Record<string, unknown>; signaling?: Record<string, unknown> }) =>
    apiFetch<ApiCallSession>(`/api/v1/calls/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createProjectReview: (contractId: string, rating: number, comment?: string) =>
    apiFetch<ApiProjectReview>(`/api/v1/contracts/${contractId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
  adminEscrow: (params?: {
    limit?: number
    offset?: number
    action?: string
    source_type?: string
    status?: string
  }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    if (params?.action) q.set('action', params.action)
    if (params?.source_type) q.set('source_type', params.source_type)
    if (params?.status) q.set('status', params.status)
    const qs = q.toString()
    return apiFetch<ApiPaginated<ApiEscrowTransaction>>(`/api/v1/admin/escrow${qs ? `?${qs}` : ''}`)
  },
  adminEscrowSummary: () =>
    apiFetch<import('./types').ApiAdminEscrowSummary>('/api/v1/admin/escrow/summary'),
  adminMilestones: (params?: {
    limit?: number
    offset?: number
    status?: string
    payment_status?: string
  }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    if (params?.status) q.set('status', params.status)
    if (params?.payment_status) q.set('payment_status', params.payment_status)
    const qs = q.toString()
    return apiFetch<ApiPaginated<import('./types').ApiAdminMilestone>>(
      `/api/v1/admin/milestones${qs ? `?${qs}` : ''}`,
    )
  },
  adminDisputesOverview: (params?: {
    limit?: number
    offset?: number
    scope?: 'open' | 'resolved' | 'all'
  }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    if (params?.scope) q.set('scope', params.scope)
    const qs = q.toString()
    return apiFetch<import('./types').ApiAdminDisputesOverview>(
      `/api/v1/admin/disputes-overview${qs ? `?${qs}` : ''}`,
    )
  },
  adminContractDisputes: (params?: {
    limit?: number
    offset?: number
    scope?: 'open' | 'resolved' | 'all'
  }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    if (params?.scope) q.set('scope', params.scope)
    const qs = q.toString()
    return apiFetch<ApiPaginated<ApiDispute>>(`/api/v1/admin/contract-disputes${qs ? `?${qs}` : ''}`)
  },
  adminResolveDispute: (disputeId: string, resolution: string, admin_notes?: string) =>
    apiFetch<ApiDispute>(`/api/v1/admin/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution, admin_notes }),
    }),

  listActivities: (limit = 30) =>
    apiFetch<import('./types').ApiUserActivity[]>(`/api/v1/platform/activities?limit=${limit}`),
  getMyReputation: () => apiFetch<import('./types').ApiUserReputation>('/api/v1/platform/reputation/me'),
  getUserReputation: (userId: string) =>
    apiFetch<import('./types').ApiUserReputation>(`/api/v1/platform/reputation/${userId}`),
  requestVerification: (data: {
    verification_type: 'identity' | 'freelancer' | 'employer' | 'company'
    document_urls?: string[]
    notes?: string
  }) =>
    apiFetch<import('./types').ApiVerification>('/api/v1/platform/verifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listMyVerifications: () =>
    apiFetch<import('./types').ApiVerification[]>('/api/v1/platform/verifications/mine'),
  createReport: (data: {
    target_type: 'user' | 'service' | 'project' | 'review' | 'message'
    target_id: string
    category: 'scam' | 'spam' | 'fake_account' | 'abuse'
    description: string
  }) =>
    apiFetch<import('./types').ApiReport>('/api/v1/platform/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDraft: (draftKey: string) =>
    apiFetch<import('./types').ApiDraft | null>(`/api/v1/platform/drafts/${encodeURIComponent(draftKey)}`),
  saveDraft: (draftKey: string, payload: Record<string, unknown>) =>
    apiFetch<import('./types').ApiDraft>('/api/v1/platform/drafts', {
      method: 'PUT',
      body: JSON.stringify({ draft_key: draftKey, payload }),
    }),
  deleteDraft: (draftKey: string) =>
    apiFetch<void>(`/api/v1/platform/drafts/${encodeURIComponent(draftKey)}`, { method: 'DELETE' }),
  trackAnalytics: (event_name: string, properties?: Record<string, unknown>, session_id?: string) =>
    apiFetch<void>('/api/v1/platform/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event_name, properties, session_id }),
    }).catch(() => undefined),
  listFeatureFlags: () => apiFetch<import('./types').ApiFeatureFlag[]>('/api/v1/platform/feature-flags'),
  auditLogin: () => apiFetch<void>('/api/v1/platform/audit/login', { method: 'POST' }),
  auditRegister: () => apiFetch<void>('/api/v1/platform/audit/register', { method: 'POST' }),

  getBuyerProtection: () => apiFetch<import('./types').ApiBuyerProtection>('/api/v1/trust/buyer-protection'),
  getPublicDisputeStats: () =>
    apiFetch<import('./types').ApiPublicDisputeStats>('/api/v1/trust/dispute-stats/public'),
  getCurrentTerms: (docType: 'terms' | 'privacy' | 'buyer_protection') =>
    apiFetch<{ version: string; title: string; content: string }>(
      `/api/v1/trust/terms/current?doc_type=${docType}`,
    ),
  acceptTermsConsent: (doc_type: 'terms' | 'privacy' | 'buyer_protection', version: string) =>
    apiFetch<void>('/api/v1/trust/terms/consent', {
      method: 'POST',
      body: JSON.stringify({ doc_type, version }),
    }),
  getTermsConsentStatus: () =>
    apiFetch<{ accepted: Record<string, string>; pending: string[]; requires_consent: boolean }>(
      '/api/v1/trust/terms/consent/status',
    ),
  getMyTrustBreakdown: () =>
    apiFetch<import('./types').ApiUserReputation>('/api/v1/trust/reputation/me/breakdown'),
  getTrustBreakdown: (userId: string) =>
    apiFetch<import('./types').ApiUserReputation>(`/api/v1/trust/reputation/${userId}/breakdown`),
  listLedgerEntries: (limit = 50) =>
    apiFetch<{ items: import('./types').ApiLedgerEntry[] }>(`/api/v1/trust/ledger/me?limit=${limit}`),
  listBankAccounts: () => apiFetch<import('./types').ApiBankAccount[]>('/api/v1/trust/bank-accounts/mine'),
  createBankAccount: (data: {
    bank_name: string
    account_holder: string
    account_number: string
    mfo?: string
  }) =>
    apiFetch<import('./types').ApiBankAccount>('/api/v1/trust/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOrderReceipt: (orderId: string) =>
    apiFetch<import('./types').ApiPaymentReceipt>(`/api/v1/trust/receipts/order/${orderId}`),
  downloadOrderReceiptPdf: async (orderId: string) => {
    const authHeader = await getAuthHeader()
    const res = await fetch(`${resolveApiUrl()}/api/v1/trust/receipts/order/${orderId}/pdf`, {
      headers: { ...authHeader },
    })
    if (!res.ok) throw await parseApiError(res)
    return res.blob()
  },
  adminServiceModerationQueue: () =>
    apiFetch<import('./types').ApiServiceModerationItem[]>('/api/v1/admin/services/moderation-queue'),
  adminModerateService: (serviceId: string, status: 'approved' | 'rejected', notes?: string) =>
    apiFetch<ApiService>(`/api/v1/admin/services/${serviceId}/moderation`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),
  adminComplianceFlags: (resolved = false) =>
    apiFetch<import('./types').ApiComplianceFlag[]>(
      `/api/v1/admin/compliance-flags?resolved=${resolved}`,
    ),
  adminVerifyBankAccount: (accountId: string) =>
    apiFetch<import('./types').ApiBankAccount>(`/api/v1/admin/bank-accounts/${accountId}/verify`, {
      method: 'PATCH',
    }),
  adminRunTrustJobs: () =>
    apiFetch<Record<string, unknown>>('/api/v1/admin/trust-jobs/run', { method: 'POST' }),

  adminAuditLogs: (params?: { limit?: number; action?: string }) => {
    const q = new URLSearchParams()
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.action) q.set('action', params.action)
    const qs = q.toString()
    return apiFetch<import('./types').ApiAuditLog[]>(`/api/v1/admin/audit-logs${qs ? `?${qs}` : ''}`)
  },
  adminAnalytics: (days = 30) =>
    apiFetch<import('./types').ApiAdminAnalytics>(`/api/v1/admin/analytics?days=${days}`),
  adminReports: (params?: { status?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiPaginated<import('./types').ApiReport>>(`/api/v1/admin/reports${qs ? `?${qs}` : ''}`)
  },
  adminUpdateReportStatus: (reportId: string, status: string) =>
    apiFetch<import('./types').ApiReport>(`/api/v1/admin/reports/${reportId}/status?status=${status}`, {
      method: 'PATCH',
    }),
  adminVerifications: (status = 'pending') =>
    apiFetch<import('./types').ApiVerification[]>(`/api/v1/admin/verifications?status=${status}`),
  adminReviewVerification: (id: string, status: 'approved' | 'rejected', admin_notes?: string) =>
    apiFetch<import('./types').ApiVerification>(`/api/v1/admin/verifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_notes }),
    }),
  adminFraudLogs: (resolved?: boolean) => {
    const q = resolved === undefined ? '' : `?resolved=${resolved}`
    return apiFetch<import('./types').ApiFraudLog[]>(`/api/v1/admin/fraud-logs${q}`)
  },
  adminResolveFraud: (logId: string) =>
    apiFetch<import('./types').ApiFraudLog>(`/api/v1/admin/fraud-logs/${logId}/resolve`, { method: 'PATCH' }),
  adminSuspendUser: (userId: string, suspended: boolean, reason?: string) =>
    apiFetch<ApiProfile>(`/api/v1/admin/users/${userId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ suspended, reason }),
    }),
  adminBroadcastNotification: (data: {
    title: string
    body: string
    href?: string
    target?: 'all' | 'freelancers' | 'clients'
  }) =>
    apiFetch<{ sent: number }>('/api/v1/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminCompanies: (params?: { search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.search?.trim()) q.set('search', params.search.trim())
    if (params?.limit != null) q.set('limit', String(params.limit))
    if (params?.offset != null) q.set('offset', String(params.offset))
    const qs = q.toString()
    return apiFetch<ApiPaginated<import('./types').ApiCompany>>(`/api/v1/admin/companies${qs ? `?${qs}` : ''}`)
  },
  listCompanies: (params?: { region?: string; featured?: boolean; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.region) q.set('region', params.region)
    if (params?.featured) q.set('featured', 'true')
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return apiFetch<import('./types').ApiCompany[]>(`/api/v1/companies${qs ? `?${qs}` : ''}`)
  },
  adminCreateCompany: (data: {
    name: string
    slug: string
    description?: string
    logo_url?: string
    website?: string
    region?: string
    owner_id?: string
    employee_count?: number
    is_verified?: boolean
    is_featured?: boolean
    is_published?: boolean
  }) =>
    apiFetch<import('./types').ApiCompany>('/api/v1/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminUpdateCompany: (
    companyId: string,
    data: Partial<{
      name: string
      slug: string
      description: string
      logo_url: string
      website: string
      region: string
      owner_id: string
      employee_count: number
      is_verified: boolean
      is_featured: boolean
      is_published: boolean
    }>
  ) =>
    apiFetch<import('./types').ApiCompany>(`/api/v1/admin/companies/${companyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  adminDeleteCompany: (companyId: string) =>
    apiFetch<{ ok: boolean }>(`/api/v1/admin/companies/${companyId}`, { method: 'DELETE' }),
  adminFeatureFlags: () => apiFetch<import('./types').ApiFeatureFlag[]>('/api/v1/admin/feature-flags'),
  adminUpdateFeatureFlag: (
    key: string,
    data: { enabled?: boolean; rollout_percent?: number; description?: string }
  ) =>
    apiFetch<import('./types').ApiFeatureFlag>(`/api/v1/admin/feature-flags/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  adminBulkOrders: (data: { order_ids: string[]; status: 'completed' | 'cancelled' | 'active' }) =>
    apiFetch<{ updated: number; order_ids: string[] }>('/api/v1/admin/orders/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listVacancies: (params?: { region?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.region) q.set('region', params.region)
    if (params?.limit != null) q.set('limit', String(params.limit))
    const qs = q.toString()
    return apiFetch<import('./types').ApiVacancy[]>(`/api/v1/vacancies${qs ? `?${qs}` : ''}`)
  },
}
