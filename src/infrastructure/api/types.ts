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


