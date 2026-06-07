'use client'

import React from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, TrendingUp, Users, CheckCircle, MessageSquare, Zap } from 'lucide-react'
import { mockProjects } from '@/lib/mock-data'

const spendingData = [
  { month: 'Jan', spent: 3200000 },
  { month: 'Feb', spent: 2100000 },
  { month: 'Mar', spent: 4200000 },
  { month: 'Apr', spent: 3800000 },
  { month: 'May', spent: 4900000 },
  { month: 'Jun', spent: 5100000 },
]

export function ClientDashboard() {
  const { setCurrentPage } = useApp()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your projects and find top talent</p>
        </div>
        <Button
          onClick={() => setCurrentPage('post-project')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Post Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Spent',
            value: '23.4M',
            unit: 'som',
            icon: TrendingUp,
            color: 'from-primary to-blue-500',
          },
          {
            label: 'Active Projects',
            value: '2',
            unit: 'ongoing',
            icon: Zap,
            color: 'from-green-500 to-emerald-500',
          },
          {
            label: 'Completed',
            value: '24',
            unit: 'projects',
            icon: CheckCircle,
            color: 'from-purple-500 to-pink-500',
          },
          {
            label: 'Freelancers Hired',
            value: '18',
            unit: 'professionals',
            icon: Users,
            color: 'from-accent to-orange-500',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6 border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-semibold">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.unit}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Spending Chart */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">6-Month Spending</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Bar dataKey="spent" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* AI Assistant */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
          <h3 className="font-bold text-foreground mb-3">AI Project Assistant</h3>
          <p className="text-sm text-muted-foreground mb-4">Get help writing project descriptions and finding the right freelancers</p>
          <Button className="w-full gap-2" variant="outline">
            <Zap className="h-4 w-4" /> Try AI
          </Button>
        </Card>
      </div>

      {/* Projects & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Active Projects</h2>
            <div className="space-y-4">
              {mockProjects.map((project) => (
                <div key={project.id} className="flex items-start justify-between p-4 bg-secondary rounded-lg hover:shadow-md transition">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{project.description.substring(0, 100)}...</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-foreground">{(project.budget / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-muted-foreground mt-1">{project.bids} bids</p>
                    <span className="text-xs bg-blue-500/20 text-blue-700 px-2 py-1 rounded inline-block mt-2">
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recommended Freelancers */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recommended</h2>
          <div className="space-y-3">
            {[
              { name: 'Alisher Umarov', title: 'UI/UX Designer', rating: 4.9 },
              { name: 'Dilshoda Azimova', title: 'Web Developer', rating: 4.8 },
              { name: 'Gulnoza Xalilova', title: 'Graphic Designer', rating: 4.6 },
            ].map((freelancer) => (
              <div
                key={freelancer.name}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer hover:shadow-md transition"
                onClick={() => setCurrentPage('freelancer-profile')}
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{freelancer.name}</p>
                  <p className="text-xs text-muted-foreground">{freelancer.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">⭐ {freelancer.rating}</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={() => setCurrentPage('services-catalog')}
          >
            <Users className="h-4 w-4" /> Browse Talent
          </Button>
        </Card>
      </div>
    </div>
  )
}
