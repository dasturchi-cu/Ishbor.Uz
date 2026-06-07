'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronRight, Book, MessageCircle, Video, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  action: string
}

interface HelpArticle {
  id: string
  title: string
  category: string
  views: number
  helpful: number
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Complete Your Profile',
    description: 'Add a professional photo, bio, and portfolio to attract clients',
    icon: <FileText className="w-6 h-6" />,
    completed: true,
    action: 'View Profile',
  },
  {
    id: 2,
    title: 'Set Your Rates',
    description: 'Define your pricing for different service packages',
    icon: <AlertCircle className="w-6 h-6" />,
    completed: true,
    action: 'Set Rates',
  },
  {
    id: 3,
    title: 'Verify Your Email',
    description: 'Verify your email address for account security',
    icon: <MessageCircle className="w-6 h-6" />,
    completed: false,
    action: 'Verify',
  },
  {
    id: 4,
    title: 'Add Payment Method',
    description: 'Connect a bank account or payment method to receive earnings',
    icon: <FileText className="w-6 h-6" />,
    completed: false,
    action: 'Add Payment',
  },
  {
    id: 5,
    title: 'Take Your First Project',
    description: 'Complete your first project to build your reputation',
    icon: <CheckCircle2 className="w-6 h-6" />,
    completed: false,
    action: 'Browse Projects',
  },
]

const helpArticles: HelpArticle[] = [
  { id: '1', title: 'How to Create a Winning Profile', category: 'Getting Started', views: 1240, helpful: 98 },
  { id: '2', title: 'Understanding Pricing Strategies', category: 'Pricing', views: 892, helpful: 76 },
  { id: '3', title: 'Best Practices for Project Delivery', category: 'Projects', views: 1540, helpful: 124 },
  { id: '4', title: 'Managing Your Reputation & Reviews', category: 'Reviews', views: 654, helpful: 62 },
  { id: '5', title: 'How to Handle Difficult Clients', category: 'Communication', views: 431, helpful: 45 },
  { id: '6', title: 'Maximizing Your Earnings', category: 'Tips & Tricks', views: 1102, helpful: 89 },
]

export default function Onboarding() {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'help' | 'faq'>('onboarding')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const completedSteps = onboardingSteps.filter(s => s.completed).length
  const completionPercent = (completedSteps / onboardingSteps.length) * 100

  const faqs = [
    {
      id: 'faq-1',
      question: 'How long does it take to get approved?',
      answer: 'Typically, your profile is reviewed within 24-48 hours after you complete all verification steps.',
    },
    {
      id: 'faq-2',
      question: 'Can I change my rates later?',
      answer: 'Yes, you can update your rates anytime. Changes will apply to new projects only.',
    },
    {
      id: 'faq-3',
      question: 'How do I get my first project?',
      answer: 'Once your profile is approved, you can browse available projects and submit proposals.',
    },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome to IshBor.uz</h1>
          <p className="text-muted-foreground">Get started and learn everything you need to succeed</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-8">
          {['onboarding', 'help', 'faq'].map(tab => (
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

        {/* Onboarding Tab */}
        {activeTab === 'onboarding' && (
          <div>
            {/* Progress Overview */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Your Progress</h2>
                  <p className="text-sm text-muted-foreground">Complete all steps to optimize your profile</p>
                </div>
                <p className="text-4xl font-bold text-primary">{Math.round(completionPercent)}%</p>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{completedSteps} of {onboardingSteps.length} steps completed</p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {onboardingSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`rounded-lg p-6 border transition flex items-start justify-between ${
                    step.completed
                      ? 'bg-secondary/30 border-green-200'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.completed
                        ? 'bg-green-100 text-green-600'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {step.completed ? <CheckCircle2 className="w-6 h-6" /> : step.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{step.title}</h3>
                        {step.completed && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Done</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  <Button variant={step.completed ? 'outline' : 'default'} size="sm" className="font-bold ml-4 flex-shrink-0">
                    {step.action}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Tab */}
        {activeTab === 'help' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpArticles.map(article => (
              <div key={article.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition cursor-pointer">
                <div className="flex items-start gap-3 mb-4">
                  <Book className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{article.title}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{article.views} views</span>
                  <span>{article.helpful} found helpful</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="max-w-2xl">
            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition font-semibold text-foreground"
                  >
                    {faq.question}
                    <ChevronRight className={`w-5 h-5 transition ${expandedFaq === faq.id ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-6 py-4 bg-secondary/20 border-t border-border">
                      <p className="text-foreground">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
