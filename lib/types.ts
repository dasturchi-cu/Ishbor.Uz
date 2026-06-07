// Core User Types
export interface Freelancer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  title: string; // e.g., "UI/UX Designer"
  verified: boolean;
  onlineStatus: 'online' | 'offline' | 'away';
  rating: number; // 0-5
  totalReviews: number;
  responseTime: string; // e.g., "< 1 hour"
  orderCount: number;
  completedCount: number;
  skills: Skill[];
  city: string;
  country: string;
  languages: string[];
  experince: string; // e.g., "2-5 years"
  portfolioImages: string[];
  videos: Video[];
  testsPassed: SkillTest[];
  socialLinks: {
    telegram?: string;
    instagram?: string;
    portfolio?: string;
  };
}

export interface Client {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  company?: string;
  verified: boolean;
  totalSpent: number; // in som
  activeProjects: number;
  completedProjects: number;
  rating: number;
  totalReviews: number;
  city: string;
}

export interface Skill {
  id: string;
  name: string;
  verified: boolean;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface SkillTest {
  id: string;
  name: string;
  score: number;
  date: string;
  certificate?: string;
}

export interface Video {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
}

// Service/Product Types
export interface Service {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  verified: boolean;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  thumbnail: string;
  images: string[];
  video?: Video;
  price: number; // in som
  deliveryDays: number;
  rating: number;
  totalReviews: number;
  orderCount: number;
  tags: string[];
  hasVideoPortfolio: boolean;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: number; // in som
  budgetType: 'fixed' | 'hourly';
  deadline?: string;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  level: 'beginner' | 'intermediate' | 'advanced';
  city: string;
  bids?: number;
  createdAt: string;
}

// Order/Contract Types
export interface Order {
  id: string;
  serviceId: string;
  freelancerId: string;
  clientId: string;
  title: string;
  price: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  deadline: string;
  escrowAmount: number;
  freelancerName: string;
  clientName: string;
  freelancerAvatar: string;
  clientAvatar: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  activeOrder?: Order;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Review/Rating Types
export interface Review {
  id: string;
  serviceId?: string;
  orderId?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  category?: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'withdraw' | 'topup';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  orderId?: string;
}

// Wallet Types
export interface Wallet {
  userId: string;
  balance: number;
  escrowBalance: number;
  totalEarnings: number;
  lastUpdated: string;
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethod {
  id: string;
  type: 'click' | 'payme' | 'card';
  name: string;
  lastFourDigits?: string;
  isDefault: boolean;
}

// Notification Types
export interface NotificationPreference {
  userId: string;
  email: {
    orders: boolean;
    messages: boolean;
    reviews: boolean;
    promotions: boolean;
  };
  push: {
    orders: boolean;
    messages: boolean;
    reviews: boolean;
    promotions: boolean;
  };
  sms: {
    urgent: boolean;
    orders: boolean;
  };
  telegram: {
    orders: boolean;
    messages: boolean;
  };
}

// App State Types
export interface AppUser {
  id: string;
  role: 'freelancer' | 'client';
  data: Freelancer | Client;
}

export interface AppState {
  currentUser: AppUser | null;
  theme: 'light' | 'dark';
  language: 'uz' | 'ru' | 'en';
  currentPage: string;
}
