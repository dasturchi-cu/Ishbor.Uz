'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Briefcase, Users, DollarSign, CheckCircle, AlertCircle, Star } from 'lucide-react'

export function ClientDashboardPremium() {
  const { t, setCurrentPage } = useApp()
  const [activeTab, setActiveTab] = useState('active')

  const projectsData = [
    { name: 'Jan', projects: 3, completed: 2, budget: 8000 },
    { name: 'Feb', projects: 5, completed: 4, budget: 12000 },
    { name: 'Mar', projects: 4, completed: 3, budget: 10000 },
    { name: 'Apr', projects: 6, completed: 5, budget: 15000 },
    { name: 'May', projects: 7, completed: 6, budget: 18000 },
    { name: 'Jun', projects: 5, completed: 5, budget: 14000 },
  ]

  const myProjects = [
    { id: 1, title: 'E-commerce Platform', freelancer: 'Ali Karim', budget: 5000, status: 'In Progress', completion: 70 },
    { id: 2, title: 'Mobile App Design', freelancer: 'Zainab Mohamed', budget: 3000, status: 'Completed', completion: 100 },
    { id: 3, title: 'Brand Strategy', freelancer: 'Hassan Ali', budget: 2000, status: 'In Review', completion: 95 },
  ]

  const recommendedFreelancers = [
    { id: 1, name: 'Ali Karim', skills: 'Web Dev', rating: 4.9, projects: 250, price: '$25/hr' },
    { id: 2, name: 'Zainab Mohamed', skills: 'UI/UX', rating: 4.8, projects: 180, price: '$20/hr' },
    { id: 3, name: 'Hassan Ali', skills: 'Strategy', rating: 4.7, projects: 120, price: '$30/hr' },
  ]

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeInDown">
          <h1 className="text-4xl font-bold text-foreground mb-2">Client Dashboard</h1>
          <p className="text-muted-foreground">Manage your projects and collaborate with freelancers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Briefcase, label: 'Active Projects', value: '5', change: '+2 this month' },
            { icon: Users, label: 'Collaborators', value: '12', change: 'Team members' },
            { icon: DollarSign, label: 'Total Spent', value: '$48,500', change: '+$5,200 this month' },
            { icon: CheckCircle, label: 'Completed', value: '28', change: 'Projects' },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className={`p-6 hover-lift animate-fadeInUp animate-stagger-${idx + 1}`}>
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

        {/* Projects Chart */}
        <Card className="p-6 mb-8 animate-fadeInUp animate-stagger-1">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Project Activity</h2>
            <p className="text-sm text-muted-foreground">Last 6 months overview</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
              <XAxis stroke="rgba(99, 102, 241, 0.5)" />
              <YAxis stroke="rgba(99, 102, 241, 0.5)" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend />
              <Bar dataKey="projects" fill="#6366f1" />
              <Bar dataKey="completed" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Projects Section */}
        <Card className="p-6 mb-8 animate-fadeInUp animate-stagger-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">My Projects</h2>
            <Button onClick={() => setCurrentPage('post-project')} className="bg-primary hover:bg-primary/90">
              Post New Project
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-border">
            {['active', 'completed', 'pending'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {myProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Freelancer: {project.freelancer}</p>
                  <div className="w-full max-w-xs bg-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                      style={{ width: `${project.completion}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-6">
                  <p className="text-lg font-bold text-foreground">${project.budget}</p>
                  <p className={`text-xs font-medium ${project.status === 'Completed' ? 'text-green-500' : 'text-primary'}`}>
                    {project.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommended Freelancers */}
        <Card className="p-6 animate-fadeInUp animate-stagger-3">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Recommended Freelancers</h2>
            <p className="text-sm text-muted-foreground">Top performers for your next project</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedFreelancers.map((freelancer) => (
              <Card key={freelancer.id} className="p-4 border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                    {freelancer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{freelancer.name}</h3>
                    <p className="text-xs text-muted-foreground">{freelancer.skills}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-sm text-foreground">{freelancer.rating}</span>
                  <span className="text-xs text-muted-foreground">({freelancer.projects} projects)</span>
                </div>

                <p className="text-lg font-bold text-primary mb-4">{freelancer.price}</p>
                <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                  Hire Now
                </Button>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
