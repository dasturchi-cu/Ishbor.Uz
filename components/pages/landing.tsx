'use client'

import React from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Star, CheckCircle, Users, TrendingUp, ArrowRight, Play } from 'lucide-react'

export function LandingPage() {
  const { setCurrentPage, setIsLoggedIn, currentUserRole, setCurrentUserRole } = useApp()

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-6">
            <span className="text-xs font-semibold text-primary">NEW</span>
            <span className="text-sm text-foreground">Telegram bot integration is now live</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
            Find Top Talent for Your Next Project
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto">
            Connect with skilled freelancers across Central Asia. Get your work done faster and more affordable than ever before.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => {
                setCurrentUserRole('client')
                setCurrentPage('register')
              }}
              className="gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentPage('services-catalog')}
            >
              Browse Services
            </Button>
          </div>

          {/* Trust Bar */}
          <div className="pt-8 border-t border-border flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold">50K+ Freelancers</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold">$10M+ Transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold">99% Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Popular Categories</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Web Development', icon: '💻', count: '8.5K services' },
              { name: 'Design & Creative', icon: '🎨', count: '12K services' },
              { name: 'Mobile Development', icon: '📱', count: '5.2K services' },
              { name: 'Content Writing', icon: '✍️', count: '7.1K services' },
            ].map((cat) => (
              <Card
                key={cat.name}
                className="p-6 text-center cursor-pointer hover:shadow-lg transition"
                onClick={() => setCurrentPage('services-catalog')}
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-foreground mb-1">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.count}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Post Your Project', desc: 'Describe what you need done. Set your budget and timeline.' },
              { num: '2', title: 'Get Proposals', desc: 'Receive bids from qualified freelancers within hours.' },
              { num: '3', title: 'Work & Pay Safely', desc: 'Collaborate with your chosen freelancer using escrow protection.' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Featured Freelancers</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Alisher Umarov', title: 'UI/UX Designer', rating: 4.9, reviews: 156 },
              { name: 'Dilshoda Azimova', title: 'Web Developer', rating: 4.8, reviews: 203 },
              { name: 'Gulnoza Xalilova', title: 'Graphic Designer', rating: 4.6, reviews: 234 },
              { name: 'Shaxzod Rasulev', title: 'Mobile Developer', rating: 4.7, reviews: 89 },
            ].map((freelancer) => (
              <Card
                key={freelancer.name}
                className="p-6 text-center hover:shadow-lg transition cursor-pointer"
                onClick={() => setCurrentPage('freelancer-profile')}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-1">{freelancer.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{freelancer.title}</p>
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold text-sm">{freelancer.rating}</span>
                  <span className="text-xs text-muted-foreground">({freelancer.reviews})</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-accent rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">Join thousands of clients getting work done on IshBor.uz</p>
          <Button
            size="lg"
            className="bg-white text-foreground hover:bg-secondary"
            onClick={() => {
              setCurrentUserRole('client')
              setCurrentPage('register')
            }}
          >
            Post Your First Project
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2024 IshBor.uz - Central Asia&apos;s Leading Freelance Marketplace</p>
          <div className="mt-4 flex justify-center gap-6 text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
