'use client'

import React, { useState, useMemo } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Filter, Search, MapPin } from 'lucide-react'

export function ServicesCatalogPremium() {
  const { t, setCurrentPage } = useApp()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('popular')

  const categories = ['All', 'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design', 'Content Writing', 'Video Editing', 'SEO']

  const services = [
    { id: 1, title: 'Professional Website Development', category: 'Web Development', freelancer: 'Ali Karim', price: 2500, rating: 4.9, reviews: 156, location: 'Tashkent', badge: 'Top Rated' },
    { id: 2, title: 'React & NextJS Web App', category: 'Web Development', freelancer: 'Zainab Mohamed', price: 3000, rating: 4.8, reviews: 134, location: 'Samarkand', badge: 'Recommended' },
    { id: 3, title: 'Mobile App UI/UX Design', category: 'UI/UX Design', freelancer: 'Hassan Ali', price: 1500, rating: 4.7, reviews: 98, location: 'Tashkent', badge: '' },
    { id: 4, title: 'Logo & Brand Identity', category: 'Graphic Design', freelancer: 'Fatima Khan', price: 800, rating: 4.6, reviews: 72, location: 'Bukhara', badge: '' },
    { id: 5, title: 'iOS App Development', category: 'Mobile Development', freelancer: 'Ahmed Hassan', price: 4000, rating: 4.9, reviews: 102, location: 'Tashkent', badge: 'Top Rated' },
    { id: 6, title: 'WordPress Website Setup', category: 'Web Development', freelancer: 'Sophia Green', price: 1200, rating: 4.5, reviews: 87, location: 'Khiva', badge: '' },
    { id: 7, title: 'Content Writing & Copywriting', category: 'Content Writing', freelancer: 'Omar Ibrahim', price: 600, rating: 4.7, reviews: 156, location: 'Tashkent', badge: 'Recommended' },
    { id: 8, title: 'Professional Video Editing', category: 'Video Editing', freelancer: 'Luna Park', price: 2000, rating: 4.8, reviews: 112, location: 'Samarkand', badge: '' },
    { id: 9, title: 'SEO Optimization & Strategy', category: 'SEO', freelancer: 'Mark Johnson', price: 1800, rating: 4.6, reviews: 93, location: 'Tashkent', badge: '' },
  ]

  const filteredServices = useMemo(() => {
    let filtered = services.filter(service => {
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory
      const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPrice = service.price >= priceRange[0] && service.price <= priceRange[1]
      return matchesCategory && matchesSearch && matchesPrice
    })

    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating)
    }

    return filtered
  }, [selectedCategory, searchTerm, priceRange, sortBy])

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeInDown">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse Services</h1>
          <p className="text-muted-foreground">Find the perfect freelancer for your project</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="animate-fadeInLeft">
            <Card className="p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5" />
                <h2 className="text-lg font-bold text-foreground">Filters</h2>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="w-4 h-4 rounded border-primary"
                      />
                      <span className="text-sm text-foreground">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">${priceRange[0]}</span>
                    <span className="text-foreground">${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Rating</h3>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-primary" />
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm text-foreground">{rating}+</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServices.map((service, idx) => (
                <Card
                  key={service.id}
                  className={`overflow-hidden hover-lift animate-fadeInUp animate-stagger-${(idx % 3) + 1} cursor-pointer`}
                  onClick={() => setCurrentPage('freelancer-profile')}
                >
                  {/* Badge */}
                  {service.badge && (
                    <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                      {service.badge}
                    </div>
                  )}

                  <div className="aspect-video bg-gradient-to-br from-primary to-accent relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold opacity-20">
                      {service.title.charAt(0)}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-2">{service.title}</h3>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                        {service.freelancer.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{service.freelancer}</p>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{service.location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-sm text-foreground">{service.rating}</span>
                        <span className="text-xs text-muted-foreground">({service.reviews})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Starting at</p>
                        <p className="text-2xl font-bold text-primary">${service.price}</p>
                      </div>
                      <Button className="bg-primary hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); setCurrentPage('freelancer-profile'); }}>
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No services found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
