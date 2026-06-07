'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Briefcase, Users, Clock, DollarSign, Star, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  totalEarnings: number
  thisMonthEarnings: number
  activeProjects: number
  completedProjects: number
  rating: number
  reviews: number
  avgResponseTime: number
  successRate: number
}

const freelancerStats: DashboardStats = {
  totalEarnings: 12450,
  thisMonthEarnings: 3200,
  activeProjects: 5,
  completedProjects: 47,
  rating: 4.9,
  reviews: 156,
  avgResponseTime: 2,
  successRate: 98,
}

const clientStats: DashboardStats = {
  totalEarnings: -8700,
  thisMonthEarnings: -2100,
  activeProjects: 3,
  completedProjects: 12,
  rating: 4.8,
  reviews: 28,
  avgResponseTime: 4,
  successRate: 100,
}

interface StatCard {
  label: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, change, icon, color }: StatCard) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {change !== undefined && (
          <p className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}%
          </p>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ userType = 'freelancer' }: { userType?: 'freelancer' | 'client' }) {
  const stats = userType === 'freelancer' ? freelancerStats : clientStats
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'analytics'>('overview')

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {userType === 'freelancer' ? 'Freelancer Dashboard' : 'Client Dashboard'}
              </h1>
              <p className="text-muted-foreground">Welcome back! Here's your performance overview.</p>
            </div>
            <Button className="font-bold">
              {userType === 'freelancer' ? 'View Profile' : 'Post Project'}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-border">
            {['overview', 'projects', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 font-semibold border-b-2 transition ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label={userType === 'freelancer' ? 'Total Earnings' : 'Total Spent'}
                value={`$${Math.abs(stats.totalEarnings)}`}
                change={12}
                icon={<DollarSign className="w-5 h-5 text-amber-600" />}
                color="bg-amber-100"
              />
              <StatCard
                label="Active Projects"
                value={stats.activeProjects}
                change={0}
                icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                color="bg-blue-100"
              />
              <StatCard
                label="Rating"
                value={`${stats.rating}★`}
                icon={<Star className="w-5 h-5 text-yellow-600" />}
                color="bg-yellow-100"
              />
              <StatCard
                label="Success Rate"
                value={`${stats.successRate}%`}
                change={5}
                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                color="bg-green-100"
              />
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Revenue Trend</h2>
                <div className="h-64 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-muted-foreground">Completed Projects</p>
                    <Award className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.completedProjects}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-muted-foreground">Customer Reviews</p>
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.reviews}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-muted-foreground">Avg Response Time</p>
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgResponseTime}h</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Projects</h2>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">Project {i + 1}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <Button variant="outline" className="font-bold" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-40 bg-secondary/20 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Profile Views Chart</p>
              </div>
              <div className="h-40 bg-secondary/20 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Earnings Chart</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
