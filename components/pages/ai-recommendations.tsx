'use client'

import { useState } from 'react'
import { Sparkles, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RecommendedFreelancer {
  id: string
  name: string
  title: string
  rating: number
  reviews: number
  price: number
  matchScore: number
  reason: string
}

interface RecommendedProject {
  id: string
  title: string
  budget: number
  category: string
  description: string
  matchScore: number
  reason: string
}

const recommendedFreelancers: RecommendedFreelancer[] = [
  { id: '1', name: 'Alex Pro', title: 'React Developer', rating: 4.9, reviews: 156, price: 150, matchScore: 95, reason: 'Perfect match: React + Node.js skills' },
  { id: '2', name: 'Sarah Designer', title: 'UI/UX Designer', rating: 4.8, reviews: 89, price: 120, matchScore: 92, reason: 'Excellent for web design projects' },
  { id: '3', name: 'Mike Expert', title: 'Full Stack Dev', rating: 4.7, reviews: 124, price: 180, matchScore: 88, reason: 'Similar project history' },
]

const recommendedProjects: RecommendedProject[] = [
  { id: '1', title: 'E-commerce Website', budget: 2500, category: 'Web Development', description: 'Build a modern e-commerce platform', matchScore: 96, reason: 'Your React & Node.js expertise matches perfectly' },
  { id: '2', title: 'Mobile App Design', budget: 1800, category: 'UI/UX Design', description: 'Design a fitness tracking app', matchScore: 91, reason: 'Similar to past projects' },
  { id: '3', title: 'API Integration', budget: 1200, category: 'Backend', description: 'Integrate 3rd party APIs', matchScore: 87, reason: 'Matches your skill level' },
]

export default function AIRecommendations() {
  const [activeTab, setActiveTab] = useState<'freelancers' | 'projects'>('freelancers')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">AI-Powered Recommendations</h1>
          </div>
          <p className="text-muted-foreground">Personalized suggestions based on your skills and preferences</p>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8 flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground mb-1">How It Works</h3>
            <p className="text-sm text-foreground">Our AI analyzes your profile, completed projects, skills, and ratings to recommend the best opportunities for you. The more projects you complete, the better our recommendations become.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-muted-foreground">Match Accuracy</p>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">92%</p>
            <p className="text-xs text-muted-foreground mt-1">Based on your profile</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-muted-foreground">Recommended This Week</p>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">24</p>
            <p className="text-xs text-muted-foreground mt-1">Opportunities</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-muted-foreground">Est. Earnings Potential</p>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">$4,200</p>
            <p className="text-xs text-muted-foreground mt-1">From recommendations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-6">
          {['freelancers', 'projects'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Recommended {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Freelancers */}
        {activeTab === 'freelancers' && (
          <div className="space-y-4">
            {recommendedFreelancers.map(freelancer => (
              <div
                key={freelancer.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{freelancer.name}</h3>
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                        {freelancer.matchScore}% Match
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{freelancer.title}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="text-amber-400">★</span>
                        <span className="font-semibold text-foreground">{freelancer.rating}</span>
                        <span className="text-muted-foreground">({freelancer.reviews} reviews)</span>
                      </span>
                      <span className="text-muted-foreground">Starting at ${freelancer.price}/hr</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Why matched: {freelancer.reason}</p>
                  </div>
                  <Button className="font-bold gap-2">
                    Hire
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {recommendedProjects.map(project => (
              <div
                key={project.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                        {project.matchScore}% Match
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="bg-secondary text-foreground px-3 py-1 rounded font-medium">
                        {project.category}
                      </span>
                      <span className="font-bold text-primary">${project.budget}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Why recommended: {project.reason}</p>
                  </div>
                  <Button className="font-bold gap-2">
                    Apply
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-8 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Want better recommendations?</h2>
          <p className="text-muted-foreground mb-6">Complete more projects, update your skills, and keep your profile fresh to get more accurate AI-powered suggestions.</p>
          <Button size="lg" className="font-bold">
            Improve My Profile
          </Button>
        </div>
      </div>
    </div>
  )
}
