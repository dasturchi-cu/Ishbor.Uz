'use client'

import React from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, DollarSign, Clock, Star, CheckCircle } from 'lucide-react'

export function FreelancerDashboardPremium() {
  const { t } = useApp()

  // Mock data for charts
  const earningsData = [
    { month: 'Jan', earnings: 1200, projects: 4 },
    { month: 'Feb', earnings: 1900, projects: 3 },
    { month: 'Mar', earnings: 2400, projects: 5 },
    { month: 'Apr', earnings: 2210, projects: 4 },
    { month: 'May', earnings: 2290, projects: 6 },
    { month: 'Jun', earnings: 3200, projects: 7 },
  ]

  const skillsData = [
    { name: 'Web Development', value: 35 },
    { name: 'UI/UX Design', value: 25 },
    { name: 'Mobile Development', value: 20 },
    { name: 'Other', value: 20 },
  ]

  const colors = ['#6366f1', '#f59e0b', '#ec4899', '#3b82f6']

  const activeProjects = [
    { id: 1, title: 'E-commerce Website Redesign', client: 'TechCorp', budget: 2500, progress: 65, deadline: '2024-06-20' },
    { id: 2, title: 'Mobile App Development', client: 'StartupXYZ', budget: 5000, progress: 40, deadline: '2024-07-15' },
    { id: 3, title: 'Brand Identity Design', client: 'Fashion Co', budget: 1500, progress: 85, deadline: '2024-06-10' },
  ]

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeInDown">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard Freelancer</h1>
          <p className="text-muted-foreground">Welcome back! Here's your performance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: DollarSign, label: 'Total Earnings', value: '$12,450', change: '+12.5%', delay: 'animate-stagger-1' },
            { icon: Users, label: 'Active Projects', value: '3', change: '+2 this month', delay: 'animate-stagger-2' },
            { icon: Star, label: 'Rating', value: '4.9', change: 'From 24 reviews', delay: 'animate-stagger-3' },
            { icon: Clock, label: 'Response Time', value: '2h', change: 'avg response', delay: 'animate-stagger-4' },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className={`p-6 hover-lift animate-fadeInUp ${stat.delay}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    <p className="text-xs text-primary mt-2">{stat.change}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Earnings Chart */}
          <Card className="lg:col-span-2 p-6 animate-fadeInUp animate-stagger-1">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Earnings Overview</h2>
              <p className="text-sm text-muted-foreground">Last 6 months</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis stroke="rgba(99, 102, 241, 0.5)" />
                <YAxis stroke="rgba(99, 102, 241, 0.5)" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                <Legend />
                <Line type="monotone" dataKey="earnings" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                <Line type="monotone" dataKey="projects" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Skills Distribution */}
          <Card className="p-6 animate-fadeInUp animate-stagger-2">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Skills Distribution</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {skillsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Active Projects */}
        <Card className="p-6 animate-fadeInUp animate-stagger-3">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Active Projects</h2>
              <p className="text-sm text-muted-foreground">Your ongoing work</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">New Project</Button>
          </div>

          <div className="space-y-4">
            {activeProjects.map((project, idx) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{project.client}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">{project.progress}%</span>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="text-lg font-bold text-foreground">${project.budget}</p>
                  <p className="text-xs text-muted-foreground">Due {project.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[
            { title: 'Browse Jobs', desc: 'Find new opportunities', color: 'from-primary to-purple-600' },
            { title: 'Edit Profile', desc: 'Update your portfolio', color: 'from-accent to-orange-600' },
            { title: 'View Messages', desc: 'Chat with clients', color: 'from-pink-500 to-rose-600' },
          ].map((action, idx) => (
            <Card
              key={idx}
              className={`p-6 bg-gradient-to-br ${action.color} text-white cursor-pointer hover-lift animate-fadeInUp ${['animate-stagger-1', 'animate-stagger-2', 'animate-stagger-3'][idx]}`}
            >
              <h3 className="text-lg font-bold mb-1">{action.title}</h3>
              <p className="text-sm opacity-90">{action.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
