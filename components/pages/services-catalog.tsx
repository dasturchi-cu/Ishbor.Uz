'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Star, Heart, Play, Filter, ChevronDown } from 'lucide-react'
import { mockServices, mockFreelancers } from '@/lib/mock-data'

export function ServicesCatalog() {
  const { setCurrentPage } = useApp()
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: [0, 10000000],
    minRating: 0,
    verified: false,
  })
  const [sortBy, setSortBy] = useState('relevant')
  const [saved, setSaved] = useState<string[]>([])

  const filteredServices = mockServices.filter((service) => {
    if (filters.category !== 'all' && service.category !== filters.category) return false
    if (service.price < filters.priceRange[0] || service.price > filters.priceRange[1]) return false
    if (service.rating < filters.minRating) return false
    if (filters.verified && !service.verified) return false
    return true
  })

  const toggleSave = (serviceId: string) => {
    if (saved.includes(serviceId)) {
      setSaved(saved.filter((id) => id !== serviceId))
    } else {
      setSaved([...saved, serviceId])
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Browse Services</h1>
        <p className="text-muted-foreground">Find and hire top freelancers from our marketplace</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-20">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </h3>

            {/* Category */}
            <div className="mb-6 pb-6 border-b border-border">
              <label className="text-sm font-semibold text-foreground block mb-3">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              >
                <option value="all">All Categories</option>
                <option value="Design">Design</option>
                <option value="Programming">Programming</option>
                <option value="Writing">Writing</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6 pb-6 border-b border-border">
              <label className="text-sm font-semibold text-foreground block mb-3">Price Range</label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="500000"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      priceRange: [filters.priceRange[0], Number(e.target.value)],
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{(filters.priceRange[1] / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="mb-6 pb-6 border-b border-border">
              <label className="text-sm font-semibold text-foreground block mb-3">Min Rating</label>
              <div className="space-y-2">
                {[0, 4.0, 4.5, 4.8].map((rating) => (
                  <label key={rating} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.minRating === rating}
                      onChange={() => setFilters({ ...filters, minRating: rating })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">
                      {rating === 0 ? 'Any' : `${rating}+ stars`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Verified Only */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Verified sellers only</span>
            </label>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Sort Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <p className="text-sm text-muted-foreground">{filteredServices.length} services found</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              >
                <option value="relevant">Most Relevant</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="overflow-hidden hover:shadow-lg transition cursor-pointer group"
                onClick={() => setCurrentPage('freelancer-profile')}
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                  <img
                    src={service.thumbnail}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  {service.hasVideoPortfolio && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <Play className="h-12 w-12 text-white fill-white" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSave(service.id)
                    }}
                    className="absolute top-3 right-3 p-2 bg-card rounded-full shadow hover:bg-accent transition"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        saved.includes(service.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Freelancer Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{service.freelancerName}</p>
                      {service.verified && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-200">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-foreground mb-2 line-clamp-2">{service.title}</h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(service.rating)
                              ? 'fill-accent text-accent'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{service.rating}</span>
                    <span className="text-xs text-muted-foreground">({service.totalReviews})</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Starting at</p>
                      <p className="font-bold text-lg text-foreground">{(service.price / 1000000).toFixed(1)}M</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        alert('Order placed!')
                      }}
                    >
                      Order
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3].map((page) => (
              <Button
                key={page}
                variant={page === 1 ? 'default' : 'outline'}
                size="sm"
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
