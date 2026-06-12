export interface ApiProfile {

  id: string

  role: 'freelancer' | 'client'

  full_name: string | null

  email: string | null

  phone: string | null

  phone_verified_at?: string | null

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

  is_suspended?: boolean

  suspended_until?: string | null

  suspension_reason?: string | null

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

  username?: string | null

  full_name: string | null

  bio: string | null

  region: string | null

  specialty: string | null

  avatar_url?: string | null

  avg_rating?: number

  review_count?: number

  trust_score?: number

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

  includes?: string[]

  faq?: ApiServiceFaqItem[]

  view_count?: number

  is_hidden?: boolean

  moderation_status?: 'pending' | 'approved' | 'rejected' | string

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

  project_id?: string | null

  contract_id?: string | null

  services?: { title?: string; category?: string }

  projects?: { title?: string }

  client_profile?: { full_name?: string; region?: string }

  freelancer_profile?: { full_name?: string; region?: string }

}

export interface ApiAutoReleasedOrder {
  id: string
  amount: number
  status: string
  payment_status?: string | null
  auto_released?: boolean
  auto_release_at?: string | null
  updated_at?: string
  service_id?: string | null
  project_id?: string | null
  services?: { title?: string }
  projects?: { title?: string }
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

  contract_id?: string | null

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

  order_id?: string | null

  conversation_id?: string | null

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

  active_orders?: number

  fraud_alerts?: number

}

export interface ApiAdminUser extends ApiProfile {
  trust_score?: number | null
  avg_rating?: number | null
  orders_count?: number
  revenue?: number
  last_active_at?: string | null
  verification_status?: 'verified' | 'unverified'
  account_status?: 'active' | 'suspended' | 'banned'
}

export interface ApiAdminUserDetail {
  profile: ApiAdminUser
  reputation: Record<string, unknown> | null
  orders: ApiOrder[]
  reviews: Record<string, unknown>[]
  wallet_balance: number
  escrow_held: number
  activities: Record<string, unknown>[]
  fraud_logs: Record<string, unknown>[]
  reports: Record<string, unknown>[]
  moderation_actions: Record<string, unknown>[]
  audit_logs: ApiAuditLog[]
  verifications: Record<string, unknown>[]
}

export interface ApiAdminActivityEvent {
  id: string
  type: 'registration' | 'order' | 'dispute' | 'fraud' | 'payment'
  title: string
  body?: string
  created_at?: string
  href?: string
}

export interface ApiAdminFraudCenter {
  summary: { unresolved: number; high_severity: number; compliance_flags: number }
  by_type: Record<string, Record<string, unknown>[]>
  recent: Record<string, unknown>[]
  compliance_flags: Record<string, unknown>[]
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
  contract_id?: string | null
  order_id?: string | null
  opened_by: string
  reason: string
  status: string
  admin_notes?: string | null
  resolution?: string | null
  resolved_at?: string | null
  created_at?: string
  contract?: ApiContract | null
  order?: ApiOrder | null
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

  checkout_available: boolean

  providers: ('sandbox' | 'click' | 'payme')[]

}

export interface ApiNotificationChannels {
  email: boolean
  sms: boolean
  telegram: boolean
  telegram_bot_username: string | null
  redis: boolean
}

export interface ApiTelegramLinkToken {
  token: string
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

export interface ApiPublicActivityEvent {
  id: string
  kind: 'new_service' | 'order_completed' | 'new_freelancer'
  title?: string | null
  created_at?: string | null
}

export interface ApiPublicStats {
  freelancers: number
  clients: number
  projects: number
  services: number
  completed_orders?: number
  avg_rating: number
  review_count: number
  category_counts: Record<string, number>
  top_services: ApiService[]
  recent_activity?: ApiPublicActivityEvent[]
  featured_freelancers: Array<{
    id: string
    full_name: string | null
    specialty: string | null
    region: string | null
    is_verified?: boolean
    trust_score?: number | null
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

  includes: string[]

  faq?: ApiServiceFaqItem[]

}

export interface ApiServiceFaqItem {
  q: string
  a: string
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

  includes?: string[]

  faq?: ApiServiceFaqItem[]
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
  type: 'order' | 'message' | 'review' | 'broadcast'
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

export interface ApiActivityFeedItem {
  id: string
  kind: 'activity' | 'order' | 'message' | 'payment'
  title: string
  body?: string | null
  href?: string | null
  created_at: string
  order_status?: string | null
  amount?: number | null
  payment_type?: string | null
}

export interface ApiTrustBreakdown {
  reviews_points?: number
  completed_orders_points?: number
  success_rate_points?: number
  verification_points?: number
  response_time_points?: number
  dispute_penalty?: number
  avg_rating?: number
  review_count?: number
  completed_orders?: number
  success_rate?: number
  response_time_hours?: number | null
  dispute_count?: number
  dispute_lost_count?: number
  is_verified?: boolean
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
  trust_breakdown?: ApiTrustBreakdown
  dispute_count?: number
  dispute_lost_count?: number
  updated_at?: string
}

export interface ApiPublicDisputeStats {
  total_disputes: number
  resolved_disputes: number
  open_disputes: number
  sla_breached_count: number
  resolution_rate_percent: number
}

export interface ApiBuyerProtection {
  document?: {
    title: string
    content: string
    version: string
    doc_type: string
  } | null
  dispute_stats?: ApiPublicDisputeStats
}

export interface ApiBankAccount {
  id: string
  user_id: string
  bank_name: string
  account_holder: string
  account_number: string
  mfo?: string | null
  is_verified: boolean
  verified_at?: string | null
  created_at?: string
}

export interface ApiLedgerEntry {
  id: string
  transaction_group_id: string
  account_code: string
  entry_type: 'debit' | 'credit'
  amount: number
  description?: string | null
  created_at: string
}

export interface ApiPaymentReceipt {
  id: string
  order_id: string
  receipt_number: string
  amount: number
  provider: string
  pdf_storage_path?: string | null
  emailed_at?: string | null
  created_at?: string
}

export interface ApiServiceModerationItem {
  id: string
  title: string
  moderation_status: string
  freelancer_id: string
  profiles?: { full_name?: string; email?: string }
  created_at?: string
}

export interface ApiComplianceFlag {
  id: string
  message_id: string
  order_id?: string | null
  sender_id: string
  flag_type: string
  matched_pattern?: string | null
  content_snippet?: string | null
  resolved: boolean
  created_at?: string
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

export interface ApiAdminAnalyticsSeriesPoint {
  date: string
  value: number
}

export interface ApiAdminSearchTerm {
  query: string
  surface: string
  count: number
}

export interface ApiHealthReady {
  status: string
  database: string
  payments: {
    click: boolean
    payme: boolean
  }
  notifications: {
    email: boolean
    sms: boolean
    telegram: boolean
    redis: boolean
  }
}

export interface ApiAdminFunnelStage {
  id: string
  count: number
  rate_from_previous?: number | null
  breakdown?: Record<string, number>
}

export interface ApiAdminFunnelReport {
  period_days: number
  stages: ApiAdminFunnelStage[]
  summary: Record<string, number>
}

export interface ApiAdminAnalytics {
  period_days: number
  new_users: number
  orders_total: number
  orders_completed: number
  revenue_completed: number
  platform_revenue_completed?: number
  search_events: number
  register_events: number
  conversion_rate: number
  funnel_cta_clicks?: number
  funnel_register_views?: number
  funnel_signup_rate?: number
  activation_onboarding?: number
  activation_employer?: number
  activation_candidate?: number
  login_events?: number
  service_views?: number
  freelancer_views?: number
  project_views?: number
  checkout_started_events?: number
  payment_attempt_events?: number
  payment_succeeded_events?: number
  message_started_events?: number
  funnel_report?: ApiAdminFunnelReport
  users_series?: ApiAdminAnalyticsSeriesPoint[]
  revenue_series?: ApiAdminAnalyticsSeriesPoint[]
  commission_series?: ApiAdminAnalyticsSeriesPoint[]
  top_searches?: ApiAdminSearchTerm[]
}

export interface ApiAdminOverview {
  stats: ApiAdminStats
  analytics: ApiAdminAnalytics
  audit_logs: ApiAuditLog[]
  activity_feed?: ApiAdminActivityEvent[]
}

export interface ApiAdminDisputesOverview {
  order_disputes: ApiOrder[]
  order_total: number
  contract_disputes: ApiDispute[]
  contract_total: number
}

export interface ApiSecurityEvent {
  id: string
  event_type: string
  severity: string
  ip_address?: string | null
  metadata?: Record<string, unknown>
  created_at?: string
}

export interface ApiVacancy {
  id: string
  client_id: string
  title: string
  description?: string | null
  region?: string | null
  employment_type: string
  salary_min?: number | null
  salary_max?: number | null
  is_published: boolean
  created_at?: string
}

export interface ApiVacancyClientProfile {
  id: string
  full_name?: string | null
  specialty?: string | null
  region?: string | null
  avatar_url?: string | null
}

export interface ApiVacancyDetail extends ApiVacancy {
  client_profile?: ApiVacancyClientProfile | null
  application_count?: number
  my_application_status?: string | null
}

export interface ApiVacancyApplication {
  id: string
  vacancy_id: string
  freelancer_id: string
  cover_letter: string
  status: string
  created_at?: string
}

export interface ApiCompany {
  id: string
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  website?: string | null
  region?: string | null
  owner_id?: string | null
  employee_count?: number | null
  is_verified: boolean
  is_featured: boolean
  is_published: boolean
  stir?: string | null
  stir_document_url?: string | null
  stir_verified?: boolean
  created_at?: string
  updated_at?: string
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

export interface ApiBackupMetadata {
  id: string
  backup_type: string
  status: string
  storage_path?: string | null
  size_bytes?: number | null
  notes?: string | null
  created_at?: string
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


