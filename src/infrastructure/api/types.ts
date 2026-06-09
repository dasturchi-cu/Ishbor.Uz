export interface ApiProfile {

  id: string

  role: 'freelancer' | 'client'

  full_name: string | null

  email: string | null

  phone: string | null

  bio: string | null

  region: string | null

  specialty: string | null

  avatar_url?: string | null

  is_admin?: boolean

  wallet_balance?: number

  profile_views?: number

  onboarding_completed?: boolean

  username?: string | null

  is_banned?: boolean

  is_verified?: boolean

  portfolio_urls?: string[]

  skills?: string[]

  hourly_rate?: number | null

  experience_level?: string | null

  languages?: { lang: string; level: string }[]

  telegram_chat_id?: string | null

  ui_preferences?: {
    theme?: 'light' | 'dark'
    language?: 'uz' | 'ru' | 'en'
    timezone?: string
  }

  created_at?: string

}



export interface ApiProfilePublic {

  id: string

  role: 'freelancer' | 'client'

  full_name: string | null

  bio: string | null

  region: string | null

  specialty: string | null

  avatar_url?: string | null

  avg_rating?: number

  review_count?: number

  completed_orders?: number

  profile_views?: number

  is_verified?: boolean

  portfolio_urls?: string[]

  skills?: string[]

  hourly_rate?: number | null

  experience_level?: string | null

  languages?: { lang: string; level: string }[]

  created_at?: string

}



export interface ApiServicePackage {
  id: string
  label_key: string
  price: number
  delivery_days: number
}

export interface ApiService {

  id: string

  freelancer_id: string

  title: string

  description: string

  price: number

  category: string

  region: string

  image_urls?: string[]

  delivery_days?: number

  packages?: ApiServicePackage[]

  view_count?: number

  is_hidden?: boolean

  created_at?: string

  profiles?: {

    full_name?: string

    specialty?: string

    region?: string

    bio?: string

    avg_rating?: number

    review_count?: number

    is_verified?: boolean

  }

}

export interface ApiServiceList {
  items: ApiService[]
  total: number
}



export interface ApiOrder {

  id: string

  service_id: string | null

  client_id: string

  freelancer_id: string

  amount: number

  platform_fee?: number

  status: string

  payment_status?: 'unpaid' | 'held' | 'released' | 'refunded' | string | null

  notes: string | null

  delivery_notes?: string | null

  dispute_reason?: string | null

  package_id?: string | null

  created_at?: string

  updated_at?: string

  services?: { title?: string; category?: string }

  client_profile?: { full_name?: string; region?: string }

  freelancer_profile?: { full_name?: string; region?: string }

}

export interface ApiPaymentIntent {
  id: string
  order_id: string
  provider: string
  amount: number
  status: string
  redirect_url?: string | null
}

export interface ApiCheckoutResponse {
  order: ApiOrder
  payment_intent?: ApiPaymentIntent | null
  redirect_url?: string | null
}

export interface ApiProject {

  id: string

  client_id: string

  title: string

  description: string

  category: string

  skills: string[]

  budget: number

  budget_type: string

  deadline: string | null

  level: string

  region: string

  status: string

  is_public?: boolean

  application_count?: number

  attachment_urls?: string[]

  created_at?: string

  profiles?: { full_name?: string; region?: string }

}

export interface ApiProjectApplication {
  id: string
  project_id: string
  freelancer_id: string
  cover_letter: string
  proposed_budget: number
  proposed_days: number
  status: 'submitted' | 'shortlisted' | 'rejected' | 'hired'
  created_at?: string
  updated_at?: string
  freelancer_profile?: {
    id: string
    full_name?: string
    specialty?: string
    region?: string
    avatar_url?: string
  }
  project?: {
    id: string
    title: string
    client_id: string
    status: string
    budget: number
  }
}



export interface ApiMessage {

  id: string

  order_id: string

  sender_id: string

  receiver_id: string

  content: string

  read_at: string | null

  created_at?: string

}



export interface ApiConversation {

  order_id: string

  other_user_id: string

  other_user_name: string

  order_title: string

  order_status: string

  last_message: string | null

  last_message_at: string | null

  unread_count: number

}



export interface ApiReview {

  id: string

  order_id: string

  reviewer_id: string

  freelancer_id: string

  rating: number

  comment: string | null

  reply?: string | null

  replied_at?: string | null

  created_at?: string

  profiles?: { full_name?: string }

}



export interface ApiAdminStats {

  users: number

  orders: number

  services: number

  projects: number

  vacancies?: number

  disputed_orders?: number

  contracts?: number

  disputed_contracts?: number

  open_disputes?: number

  pending_disputes?: number

  escrow_held?: number

  escrow_balance?: number

  pending_withdrawals?: number

  banned_users?: number

  new_users_today?: number

  employers?: number

  freelancers?: number

  active_users_7d?: number

  revenue_30d?: number

  conversion_rate?: number

  new_users_30d?: number

}

export interface ApiContract {
  id: string
  project_id: string
  proposal_id: string
  order_id?: string | null
  client_id: string
  freelancer_id: string
  title: string
  amount: number
  deadline?: string | null
  status: string
  payment_status: string
  delivery_notes?: string | null
  revision_count?: number
  created_at?: string
  updated_at?: string
  project?: { id: string; title: string; status: string } | null
  client_profile?: { id: string; full_name?: string | null; avatar_url?: string | null; region?: string | null } | null
  freelancer_profile?: { id: string; full_name?: string | null; avatar_url?: string | null; specialty?: string | null; region?: string | null } | null
}

export interface ApiEscrowTransaction {
  id: string
  source_type: string
  source_id: string
  client_id: string
  freelancer_id: string
  amount: number
  action: string
  provider: string
  status: string
  metadata?: Record<string, unknown>
  created_at?: string
}

export interface ApiMilestone {
  id: string
  contract_id: string
  title: string
  description?: string | null
  amount: number
  due_date?: string | null
  sort_order: number
  status: string
  payment_status: string
  created_at?: string
}

export interface ApiDispute {
  id: string
  contract_id: string
  opened_by: string
  reason: string
  status: string
  admin_notes?: string | null
  resolution?: string | null
  resolved_at?: string | null
  created_at?: string
  contract?: ApiContract | null
}

export interface ApiDisputeMessage {
  id: string
  dispute_id: string
  sender_id: string
  content: string
  attachments?: unknown[]
  created_at?: string
}

export interface ApiConversationThread {
  id: string
  type: string
  order_id?: string | null
  contract_id?: string | null
  project_id?: string | null
  participant_ids: string[]
  other_user_id?: string | null
  other_user_name?: string | null
  title?: string | null
  last_message?: string | null
  last_message_at?: string | null
  unread_count: number
  created_at?: string
}

export interface ApiCallSession {
  id: string
  conversation_id?: string | null
  contract_id?: string | null
  initiator_id: string
  callee_id: string
  call_type: string
  status: string
  media_state?: { camera?: boolean; mic?: boolean; screen?: boolean }
  signaling?: Record<string, unknown>
  started_at?: string | null
  ended_at?: string | null
  created_at?: string
}

export interface ApiProjectReview {
  id: string
  contract_id: string
  reviewer_id: string
  reviewee_id: string
  direction: string
  rating: number
  comment?: string | null
  created_at?: string
}



export interface ApiPaginated<T> {

  items: T[]

  total: number

  limit: number

  offset: number

}



export interface ApiPaymentsConfig {

  sandbox_allowed: boolean

  click_enabled: boolean

  payme_enabled: boolean

  live_available: boolean

  providers: ('sandbox' | 'click' | 'payme')[]

}

export interface ApiNotificationChannels {
  email: boolean
  sms: boolean
  telegram: boolean
  telegram_bot_username: string | null
  redis: boolean
}



export interface ApiWaitlistEntry {

  id: string

  email: string

  source: string

  created_at?: string

}



export interface ApiPublicReview {
  id: string
  rating: number
  comment: string
  created_at?: string
  author_name: string
  author_role?: string | null
  freelancer_id: string
  freelancer_name?: string | null
  freelancer_specialty?: string | null
}

export interface ApiPublicStats {
  freelancers: number
  clients: number
  projects: number
  services: number
  avg_rating: number
  review_count: number
  category_counts: Record<string, number>
  top_services: ApiService[]
  featured_freelancers: Array<{
    id: string
    full_name: string | null
    specialty: string | null
    region: string | null
    avg_rating?: number
    review_count?: number
    min_price?: number
  }>
}



export interface ServiceCreateInput {

  title: string

  description: string

  price: number

  category: string

  region: string

  image_urls?: string[]

  delivery_days?: number

  packages?: ApiServicePackage[]

}

export interface ServiceUpdateInput {
  title?: string
  description?: string
  price?: number
  category?: string
  region?: string
  image_urls?: string[]
  delivery_days?: number
  packages?: ApiServicePackage[]
}

export interface ApiTransaction {
  id: string
  user_id: string
  type: string
  amount: number
  provider?: string | null
  status?: string | null
  order_id?: string | null
  created_at?: string
}

export interface ApiWithdrawalRequest {
  id: string
  freelancer_id: string
  amount: number
  status: string
  note?: string | null
  created_at?: string
  profiles?: { full_name?: string | null; email?: string | null }
}

export interface ApiNotification {
  id: string
  type: 'order' | 'message' | 'review'
  title: string
  body: string
  created_at: string
  href?: string | null
  unread: boolean
}

export interface ApiReferralStats {
  count: number
  bonus_earned?: number
}

export interface ApiAiSuggestResponse {
  text: string
  kind: 'project_description' | 'service_description' | 'service_title' | 'profile_bio' | 'cover_letter'
}

export interface ApiAnalytics {
  period: string
  completed_revenue: number
  order_count: number
  profile_views: number
  service_views: number
  chart_data: { date: string; amount: number }[]
  pie_data: { name: string; value: number; color: string }[]
  regions: { region: string; pct: number }[]
}



export interface ApiUserActivity {
  id: string
  user_id: string
  activity_type: string
  title: string
  body?: string | null
  href?: string | null
  created_at: string
}

export interface ApiUserReputation {
  user_id: string
  avg_rating: number
  review_count: number
  completed_projects: number
  completed_orders: number
  success_rate: number
  response_time_hours?: number | null
  total_earnings: number
  trust_score: number
  updated_at?: string
}

export interface ApiVerification {
  id: string
  user_id: string
  verification_type: string
  status: string
  document_urls: string[]
  notes?: string | null
  admin_notes?: string | null
  created_at?: string
}

export interface ApiReport {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  category: string
  description: string
  status: string
  created_at?: string
}

export interface ApiAuditLog {
  id: string
  actor_id?: string | null
  action: string
  entity_type?: string | null
  entity_id?: string | null
  metadata?: Record<string, unknown>
  created_at?: string
}

export interface ApiAdminEscrowSummary {
  contract_held: number
  milestone_held: number
  total_held: number
  contracts_count: number
  milestones_count: number
}

export interface ApiAdminMilestone {
  id: string
  contract_id: string
  title: string
  description?: string | null
  amount: number
  due_date?: string | null
  sort_order: number
  status: string
  payment_status: string
  created_at?: string
  contracts?: {
    id: string
    title?: string
    client_id?: string
    freelancer_id?: string
    project_id?: string
  } | null
}

export interface ApiAdminAnalytics {
  period_days: number
  new_users: number
  orders_total: number
  orders_completed: number
  revenue_completed: number
  search_events: number
  register_events: number
  conversion_rate: number
}

export interface ApiFraudLog {
  id: string
  user_id?: string | null
  fraud_type: string
  severity: string
  details?: Record<string, unknown>
  resolved: boolean
  created_at?: string
}

export interface ApiFeatureFlag {
  key: string
  enabled: boolean
  description?: string | null
  rollout_percent: number
}

export interface ApiDraft {
  id: string
  draft_key: string
  payload: Record<string, unknown>
  updated_at?: string
}

export interface ProjectCreateInput {

  title: string

  description: string

  category: string

  skills: string[]

  budget: number

  budget_type: string

  deadline?: string | null

  level: string

  region: string

  attachment_urls?: string[]

  is_public?: boolean

}


