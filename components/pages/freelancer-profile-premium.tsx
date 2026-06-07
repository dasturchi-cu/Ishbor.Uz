'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, MapPin, Clock, CheckCircle, MessageSquare, Award } from 'lucide-react'

export function FreelancerProfilePremium() {
  const [activeTab, setActiveTab] = useState('overview')

  const freelancer = {
    name: 'Ali Karim',
    title: 'Senior Full-Stack Developer',
    location: 'Tashkent, Uzbekistan',
    rating: 4.9,
    reviews: 156,
    completedProjects: 250,
    responseTime: '2 hours',
    description: 'Experienced full-stack developer with 8+ years of expertise in web development, mobile apps, and cloud solutions.',
    hourlyRate: '$35',
    skills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL'],
    languages: ['Uzbek', 'Russian', 'English'],
    verified: true,
    topRated: true,
  }

  const portfolio = [
    { title: 'E-commerce Platform', client: 'TechCorp', price: '$5,000' },
    { title: 'SaaS Dashboard', client: 'StartupXYZ', price: '$8,500' },
    { title: 'Mobile App', client: 'Fashion Co', price: '$6,000' },
  ]

  const reviews = [
    { reviewer: 'John Smith', rating: 5, comment: 'Excellent work! Professional and timely delivery.', date: '2 months ago' },
    { reviewer: 'Sarah Johnson', rating: 5, comment: 'Great communication and quality code.', date: '3 months ago' },
    { reviewer: 'Mike Davis', rating: 4.5, comment: 'Good project, minor revisions needed.', date: '4 months ago' },
  ]

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2">
            <Card className="p-8 animate-fadeInDown">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {freelancer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-foreground">{freelancer.name}</h1>
                    {freelancer.verified && <CheckCircle className="w-6 h-6 text-green-500" />}
                    {freelancer.topRated && <Award className="w-6 h-6 text-amber-500" />}
                  </div>
                  <p className="text-lg text-primary mb-3">{freelancer.title}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {freelancer.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {freelancer.rating} ({freelancer.reviews} reviews)
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {freelancer.responseTime} response
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-foreground mb-6">{freelancer.description}</p>
              <div className="grid grid-cols-3 gap-4 p-4 bg-card rounded-lg">
                <div>
                  <p className="text-2xl font-bold text-primary">{freelancer.completedProjects}</p>
                  <p className="text-xs text-muted-foreground">Projects Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{freelancer.hourlyRate}</p>
                  <p className="text-xs text-muted-foreground">Hourly Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{freelancer.rating}★</p>
                  <p className="text-xs text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <div className="mt-8 animate-fadeInUp animate-stagger-1">
              <div className="flex gap-4 mb-6 border-b border-border">
                {['overview', 'portfolio', 'reviews'].map((tab) => (
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

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <Card className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">Languages</h3>
                    <div className="flex gap-4">
                      {freelancer.languages.map((lang) => (
                        <span key={lang} className="text-foreground">{lang}</span>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'portfolio' && (
                <div className="space-y-4">
                  {portfolio.map((project, idx) => (
                    <Card key={idx} className="p-6 flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <p className="font-bold text-primary">{project.price}</p>
                    </Card>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {reviews.map((review, idx) => (
                    <Card key={idx} className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-foreground">{review.reviewer}</h4>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-foreground mb-2">{review.comment}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="animate-fadeInRight">
            <Card className="p-6 sticky top-8 space-y-4">
              <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-base">
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Me
              </Button>
              <Button variant="outline" className="w-full h-12">
                <Star className="w-5 h-5 mr-2" />
                Save Profile
              </Button>
              <div className="pt-4 border-t border-border space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium text-foreground">Jan 2020</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Rate:</span>
                  <span className="font-medium text-foreground">100%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">On Time:</span>
                  <span className="font-medium text-green-500">99%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
