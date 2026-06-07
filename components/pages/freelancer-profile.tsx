'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Star, MapPin, Globe, Video, Award, Heart, MessageSquare, Briefcase, Clock, Share2 } from 'lucide-react'

export function FreelancerProfile() {
  const { setCurrentPage } = useApp()
  const [activeTab, setActiveTab] = useState('services')
  const [saved, setSaved] = useState(false)

  // Mock freelancer profile
  const freelancer = {
    id: 'f1',
    name: 'Alisher Umarov',
    title: 'UI/UX Designer',
    city: 'Toshkent',
    country: 'Uzbekistan',
    rating: 4.9,
    reviews: 156,
    verified: true,
    online: true,
    responseTime: '< 1 hour',
    experience: '5+ years',
    bio: 'Creative UI/UX designer with 5+ years of experience. Specialized in mobile apps and web design. I help startups and established businesses create beautiful, user-centered digital products.',
    hourlyRate: 50,
    languages: ['Uzbek', 'Russian', 'English'],
    portfolio: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    ],
    videos: [
      { title: 'My Design Process', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ],
    skills: ['UI Design', 'UX Research', 'Figma', 'Prototyping'],
    testsPassed: [{ name: 'UI Design Fundamentals', score: 98, date: '2024-01-15' }],
  }

  return (
    <div className="w-full bg-foreground dark:bg-background">
      {/* Cover & Header */}
      <div className="relative h-64 bg-gradient-to-r from-primary/20 to-accent/20" />

      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        {/* Profile Card */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Left: Avatar & Basic Info */}
          <div className="flex flex-col items-center md:items-start md:w-64 flex-shrink-0">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full border-4 border-card -mt-20 mb-4" />

            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <h1 className="text-2xl font-bold text-card dark:text-foreground">{freelancer.name}</h1>
                {freelancer.verified && <span className="text-lg">✓</span>}
              </div>
              <p className="text-lg text-card/80 dark:text-muted-foreground mb-3">{freelancer.title}</p>

              <div className="space-y-2 text-sm text-card/70 dark:text-muted-foreground mb-6">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {freelancer.city}, {freelancer.country}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Clock className="h-4 w-4" />
                  <span>Response time: {freelancer.responseTime}</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Globe className="h-4 w-4" />
                  <span>{freelancer.languages.join(', ')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  className="gap-2 w-full"
                  onClick={() => setCurrentPage('messages')}
                >
                  <MessageSquare className="h-4 w-4" /> Message
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 w-full"
                >
                  <Video className="h-4 w-4" /> Video Call
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-full"
                    onClick={() => setSaved(!saved)}
                  >
                    <Heart className={`h-4 w-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="w-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Completed Orders', value: '485', icon: Briefcase },
              { label: 'Rating', value: '4.9★', icon: Star },
              { label: 'Reviews', value: '156', icon: Star },
              { label: 'Avg. Response', value: '< 1 hour', icon: Clock },
              { label: 'Success Rate', value: '99.7%', icon: Award },
              { label: 'Experience', value: '5+ years', icon: Briefcase },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <Card key={idx} className="p-4 text-center">
                  <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-8">
          <div className="flex gap-8">
            {['services', 'portfolio', 'reviews', 'info', 'video'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-semibold capitalize transition ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              {
                title: 'Professional UI/UX Design for Mobile Apps',
                price: '2.5M',
                delivery: '5 days',
                rating: 4.9,
                reviews: 156,
              },
              {
                title: 'Website UI/UX Design & Prototyping',
                price: '3M',
                delivery: '7 days',
                rating: 4.9,
                reviews: 156,
              },
            ].map((service, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition">
                <h3 className="font-bold text-foreground mb-2">{service.title}</h3>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">({service.reviews})</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Starting at</p>
                    <p className="font-bold text-lg text-foreground">{service.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Delivery</p>
                    <p className="font-semibold text-foreground">{service.delivery}</p>
                  </div>
                </div>
                <Button className="w-full mt-4">Order Now</Button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {freelancer.portfolio.map((img, idx) => (
              <img key={idx} src={img} alt={`Portfolio ${idx}`} className="w-full h-48 object-cover rounded-lg" />
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4 mb-12">
            {[
              {
                name: 'Startup Hub UZ',
                rating: 5,
                title: 'Exceptional Design Work',
                text: 'Alisher delivered outstanding UI/UX designs. Professional, creative, and exactly what we needed.',
                date: '2024-05-28',
              },
              {
                name: 'Digital Agency Pro',
                rating: 5,
                title: 'Excellent Designer',
                text: 'Great attention to detail and perfect communication throughout the project.',
                date: '2024-05-15',
              },
            ].map((review, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{review.name}</p>
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <h4 className="font-bold text-foreground mb-1">{review.title}</h4>
                <p className="text-muted-foreground">{review.text}</p>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="font-bold text-foreground mb-4">About</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{freelancer.bio}</p>

              <h3 className="font-bold text-foreground mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {freelancer.skills.map((skill) => (
                  <span key={skill} className="bg-secondary text-muted-foreground px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-foreground mb-4">Certifications</h3>
              <div className="space-y-3">
                {freelancer.testsPassed.map((test) => (
                  <div key={test.name} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                    <Award className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{test.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Score: {test.score}% • {test.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="mb-12">
            {freelancer.videos.map((video, idx) => (
              <div key={idx} className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={video.url}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
