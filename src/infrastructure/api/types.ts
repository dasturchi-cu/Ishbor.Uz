export interface ApiProfile {

  id: string

  role: 'freelancer' | 'client'

  full_name: string | null

  email: string | null

  phone: string | null

  bio: string | null

  region: string | null

  specialty: string | null

  is_admin?: boolean

  created_at?: string

}



export interface ApiProfilePublic {

  id: string

  role: 'freelancer' | 'client'

  full_name: string | null

  bio: string | null

  region: string | null

  specialty: string | null

  avg_rating?: number

  review_count?: number

  created_at?: string

}



export interface ApiService {

  id: string

  freelancer_id: string

  title: string

  description: string

  price: number

  category: string

  region: string

  created_at?: string

  profiles?: {

    full_name?: string

    specialty?: string

    region?: string

    bio?: string

  }

}



export interface ApiOrder {

  id: string

  service_id: string | null

  client_id: string

  freelancer_id: string

  amount: number

  status: string

  notes: string | null

  created_at?: string

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

  attachment_urls?: string[]

  created_at?: string

  profiles?: { full_name?: string; region?: string }

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

}


