'use client'

import React, { useState, useEffect } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { ArrowDown, CheckCircle2, Shield, Zap, Send, MapPin, Star, Play } from 'lucide-react'

export function LandingPagePremium() {
  const { t, setCurrentPage, language } = useApp()
  const [counters, setCounters] = useState({ freelancers: 0, clients: 0, projects: 0, rating: 0 })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCounters(prev => ({
        freelancers: Math.min(prev.freelancers + 300, 12000),
        clients: Math.min(prev.clients + 250, 8500),
        projects: Math.min(prev.projects + 1300, 45000),
        rating: Math.min(prev.rating + 0.15, 4.9)
      }))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const categories = [
    { icon: '💻', name: t('categories_web_dev'), count: 1240 },
    { icon: '📱', name: t('categories_mobile'), count: 980 },
    { icon: '🎨', name: t('categories_design'), count: 2150 },
    { icon: '✍️', name: t('categories_writing'), count: 1840 },
    { icon: '📢', name: t('categories_marketing'), count: 1520 },
    { icon: '🌐', name: t('categories_translation'), count: 890 },
    { icon: '🎵', name: t('categories_music'), count: 640 },
    { icon: '🎬', name: t('categories_video'), count: 1200 }
  ]

  const trustItems = [
    { icon: CheckCircle2, text: '0% Komissiya', gradient: 'from-green-500 to-emerald-600' },
    { icon: Shield, text: 'Escrow Himoya', gradient: 'from-blue-500 to-cyan-600' },
    { icon: Zap, text: '24h Yechim', gradient: 'from-amber-500 to-orange-600' },
    { icon: Send, text: 'Click & Payme', gradient: 'from-red-500 to-pink-600' }
  ]

  const comparisonFeatures = [
    { feature: 'Komissiya', ishbor: '0%', kwork: '20%' },
    { feature: 'To\'lov tizimi', ishbor: 'Click/Payme', kwork: 'Xorijiy karta' },
    { feature: 'Til', ishbor: 'O\'zbek', kwork: 'Yo\'q' },
    { feature: 'Pul yechish', ishbor: '24 soat', kwork: 'Sekin' },
    { feature: 'Escrow', ishbor: 'Bor', kwork: 'Yo\'q' },
  ]

  const featuredFreelancers = [
    { name: 'Alisher Umarov', specialty: 'Web Developer', city: 'Toshkent', rating: 4.9, reviews: 245, price: 150000 },
    { name: 'Gulnara Mirova', specialty: 'Graphic Designer', city: 'Samarqand', rating: 4.8, reviews: 198, price: 120000 },
    { name: 'Sardor Karimov', specialty: 'UI/UX Designer', city: 'Toshkent', rating: 4.95, reviews: 312, price: 180000 },
    { name: 'Zara Ismoilova', specialty: 'Content Writer', city: 'Buxoro', rating: 4.7, reviews: 156, price: 80000 }
  ]

  const testimonials = [
    { quote: 'IshBor o\'zim uchun eng yaxshi platform. Xavfsiz va tez!', author: 'Anvar A.', role: 'Web Developer' },
    { quote: 'Buyurtmalarim juda tez bajarildi. Mutaxassislar sifatli.', author: 'Gulnora K.', role: 'Client' },
    { quote: 'Komissiya yo\'q, bu juda yaxshi! Tavsiya qilaman.', author: 'Javlon M.', role: 'Graphic Designer' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-[90vh] gradient-hero overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-bounce-gentle" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative container-responsive min-h-[90vh] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
            {/* Left content */}
            <div className="space-y-8 animate-fadeInUp">
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight text-balance">
                {t('hero_title')}
              </h1>
              <p className="text-xl text-white/90 text-pretty">
                {t('hero_sub')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setCurrentPage('services-catalog')}
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-white/90 font-semibold text-lg px-8 hover-scale"
                >
                  {t('btn_find_work')}
                </Button>
                <Button
                  onClick={() => setCurrentPage('post-project')}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 font-semibold text-lg px-8 hover-scale"
                >
                  {t('btn_give_work')}
                </Button>
              </div>

              {/* Trust badges */}
              <div className="pt-8 space-y-3">
                <p className="text-sm text-white font-bold">Ishonch bilan birga:</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { icon: '✓', text: '0% Komissiya' },
                    { icon: '🔒', text: 'Escrow Himoya' },
                    { icon: '⚡', text: '24h Yechim' }
                  ].map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                      <span>{badge.icon}</span>
                      <span className="text-sm text-white">{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - Animated mockup */}
            <div className="hidden lg:flex justify-center animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-50" />
                <div className="relative bg-white rounded-3xl p-2 shadow-2xl transform hover-lift">
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="text-5xl">📱</div>
                      <p className="text-indigo-600 font-bold">IshBor.uz</p>
                      <p className="text-sm text-gray-600">Freelance Marketplace</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-b from-background to-secondary/50">
        <div className="container-responsive">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: t('stats_freelancers'), value: counters.freelancers, suffix: '+' },
              { label: t('stats_clients'), value: counters.clients, suffix: '+' },
              { label: t('stats_projects'), value: counters.projects, suffix: '+' },
              { label: t('stats_rating'), value: counters.rating.toFixed(1), suffix: '★' }
            ].map((stat, idx) => (
              <div key={idx} className="glass rounded-2xl p-8 text-center animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                <p className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                  {stat.value}{stat.suffix}
                </p>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-20 bg-background">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance text-foreground">
            {t('categories_title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="group glass rounded-2xl p-8 text-center hover-lift cursor-pointer animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="text-5xl mb-4">{cat.icon}</div>
                <h3 className="font-semibold mb-2 text-foreground">{cat.name}</h3>
                <p className="text-sm text-muted-foreground group-hover:text-primary transition">
                  {cat.count} xizmat
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-secondary/30">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance text-foreground">
            {t('how_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent" />

            {[
              { step: '1', title: t('step1'), desc: 'Profil yarating va ma\'lumotlaringizni kiriting' },
              { step: '2', title: t('step2'), desc: 'O\'z xizmatlarini e\'lon qiling yoki loyiha joylashtiring' },
              { step: '3', title: t('step3'), desc: 'Buyurtmalarni oling va pul topingiz' }
            ].map((item, idx) => (
              <div key={idx} className="relative animate-fadeInUp" style={{ animationDelay: `${idx * 0.15}s` }}>
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-2xl relative z-10">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Freelancers */}
      <div className="py-20 bg-background">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold mb-16 text-balance text-foreground">
            Asosiy Freelancerlar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredFreelancers.map((freelancer, idx) => (
              <div
                key={idx}
                className="glass rounded-2xl overflow-hidden hover-lift cursor-pointer group animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => setCurrentPage('freelancer-profile')}
              >
                {/* Avatar placeholder */}
                <div className="h-40 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                  {freelancer.name[0]}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg">{freelancer.name}</h3>
                    <p className="text-sm text-muted-foreground">{freelancer.specialty}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{freelancer.city}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-muted-foreground ml-auto">({freelancer.reviews})</span>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">dan</p>
                    <p className="text-2xl font-bold text-accent">{freelancer.price.toLocaleString()} so'm</p>
                  </div>

                  <Button className="w-full" variant="outline">
                    Ko'rish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why IshBor vs Kwork */}
      <div className="py-20 bg-secondary/30">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance text-foreground">
            Nima uchun IshBor?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr className="border-b-2 border-primary/20">
                  <th className="px-6 py-4 text-left font-bold">Xususiyat</th>
                  <th className="px-6 py-4 font-bold text-indigo-600">IshBor.uz</th>
                  <th className="px-6 py-4 font-bold text-gray-500">Kwork</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feat, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-secondary/50 transition">
                    <td className="px-6 py-4 text-left font-medium">{feat.feature}</td>
                    <td className="px-6 py-4 text-green-600 font-semibold">{feat.ishbor}</td>
                    <td className="px-6 py-4 text-gray-500">{feat.kwork}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-background">
        <div className="container-responsive">
          <h2 className="text-4xl font-bold text-center mb-16 text-balance text-foreground">
            Foydalanuvchilar nima deyadi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="glass rounded-2xl p-8 space-y-4 hover-lift animate-fadeInUp"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="italic text-foreground">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Telegram Bot Banner */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container-responsive">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white space-y-2">
              <h3 className="text-3xl font-bold">Telegram Bot</h3>
              <p className="text-white/90">Buyurtmalaringizni @IshBorBot dan kuzating</p>
            </div>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
              Ulang
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container-responsive">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h4 className="font-bold">IshBor.uz</h4>
              <p className="text-sm text-muted-foreground">
                O'zbekistonning eng yaxshi freelance platformasi
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Havolalar</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Bosh sahifa</a></li>
                <li><a href="#" className="hover:text-primary transition">Xizmatlar</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Kategoriyalar</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Web Dizayn</a></li>
                <li><a href="#" className="hover:text-primary transition">Grafik Dizayn</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm">Aloqa</h4>
              <p className="text-sm text-muted-foreground">support@ishbor.uz</p>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">
              &copy; 2024 IshBor.uz - {t('footer_rights')}
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span className="text-sm">Click</span>
              <span className="text-sm">Payme</span>
              <span className="text-sm">Visa</span>
              <span className="text-sm">Mastercard</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
