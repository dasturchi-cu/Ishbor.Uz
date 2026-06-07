'use client'

import { useState, useCallback } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchFilters {
  query: string
  category: string
  priceMin: number
  priceMax: number
  ratingMin: number
  deliveryTime: string
  sortBy: 'relevance' | 'price-low' | 'price-high' | 'rating' | 'newest'
}

interface SearchResult {
  id: string
  title: string
  seller: string
  price: number
  rating: number
  reviews: number
  category: string
  deliveryDays: number
  badge?: string
}

const mockResults: SearchResult[] = [
  { id: '1', title: 'Professional Web Design', seller: 'designpro', price: 250, rating: 4.9, reviews: 156, category: 'design', deliveryDays: 5, badge: 'Top Rated' },
  { id: '2', title: 'React Development', seller: 'devmaster', price: 150, rating: 4.8, reviews: 289, category: 'development', deliveryDays: 3 },
  { id: '3', title: 'Logo Design Service', seller: 'logodesign', price: 99, rating: 4.7, reviews: 412, category: 'design', deliveryDays: 2 },
]

export default function SearchAndDiscovery() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    priceMin: 0,
    priceMax: 5000,
    ratingMin: 0,
    deliveryTime: 'any',
    sortBy: 'relevance',
  })

  const [results, setResults] = useState<SearchResult[]>(mockResults)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = useCallback(() => {
    console.log('[v0] Searching with filters:', filters)
    setResults(mockResults.filter(r => r.title.toLowerCase().includes(filters.query.toLowerCase())))
  }, [filters])

  const handleCategoryChange = (cat: string) => {
    setFilters(prev => ({ ...prev, category: cat }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'all',
      priceMin: 0,
      priceMax: 5000,
      ratingMin: 0,
      deliveryTime: 'any',
      sortBy: 'relevance',
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Find Services</h1>
          <p className="text-muted-foreground">Search from 50K+ services</p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search by skill, service, or keyword..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button onClick={handleSearch} size="lg" className="px-6 font-bold">
            Search
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className="flex gap-2 font-bold"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Category Quick Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'design', 'development', 'writing', 'marketing'].map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filters.category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Advanced Filters Sidebar */}
          {showFilters && (
            <div className="w-64 bg-card rounded-lg p-6 border border-border h-fit sticky top-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                  Clear all
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-3">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={filters.priceMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMin: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-border rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={filters.priceMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMax: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-border rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-3">Minimum Rating</label>
                <select
                  value={filters.ratingMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, ratingMin: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                >
                  <option value="0">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
              </div>

              {/* Delivery Time */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-3">Delivery Time</label>
                <select
                  value={filters.deliveryTime}
                  onChange={(e) => setFilters(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                >
                  <option value="any">Any Time</option>
                  <option value="express">Express (1-2 days)</option>
                  <option value="standard">Standard (3-5 days)</option>
                  <option value="regular">Regular (6-10 days)</option>
                </select>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-foreground mb-3">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              <Button onClick={handleSearch} className="w-full font-bold">
                Apply Filters
              </Button>
            </div>
          )}

          {/* Search Results */}
          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground font-medium">
                Showing {results.length} results for "{filters.query || 'all services'}"
              </p>
            </div>

            <div className="space-y-4">
              {results.length > 0 ? (
                results.map(result => (
                  <div
                    key={result.id}
                    className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground hover:text-primary transition">
                          {result.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">by {result.seller}</p>
                      </div>
                      {result.badge && (
                        <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold">
                          {result.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400">★</span>
                        <span className="font-bold text-foreground">{result.rating}</span>
                        <span className="text-xs text-muted-foreground">({result.reviews} reviews)</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Delivery: {result.deliveryDays} days</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-secondary text-foreground px-2 py-1 rounded font-medium">
                        {result.category}
                      </span>
                      <span className="text-2xl font-bold text-primary">${result.price}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No results found. Try adjusting your filters.</p>
                  <Button variant="outline" onClick={clearFilters} className="font-bold">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
