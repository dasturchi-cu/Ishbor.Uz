'use client'

import { useState } from 'react'
import { Star, ThumbsUp, MessageCircle, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Review {
  id: string
  author: string
  rating: number
  text: string
  date: string
  helpful: number
  verified: boolean
}

const mockReviews: Review[] = [
  { id: '1', author: 'John Doe', rating: 5, text: 'Excellent work! Very professional and responsive.', date: '2 weeks ago', helpful: 45, verified: true },
  { id: '2', author: 'Sarah Smith', rating: 4, text: 'Good service, delivered on time. Minor revisions needed.', date: '1 month ago', helpful: 28, verified: true },
  { id: '3', author: 'Mike Johnson', rating: 5, text: 'Outstanding quality! Will hire again.', date: '2 months ago', helpful: 62, verified: true },
]

export default function ReviewsAndCommunity() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews)
  const [newReview, setNewReview] = useState('')
  const [rating, setRating] = useState(5)
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent')

  const handleSubmitReview = () => {
    if (!newReview.trim()) return

    const review: Review = {
      id: Date.now().toString(),
      author: 'You',
      rating,
      text: newReview,
      date: 'Just now',
      helpful: 0,
      verified: true,
    }

    setReviews([review, ...reviews])
    setNewReview('')
    setRating(5)
  }

  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Reviews & Ratings</h1>
          <p className="text-muted-foreground">Community feedback for this seller</p>
        </div>

        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Average Rating</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-4xl font-bold text-foreground">{avgRating}</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Based on {reviews.length} reviews</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-4">Rating Distribution</p>
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-foreground w-8">{rating}★</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${rating === 5 ? 60 : rating === 4 ? 30 : 10}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{rating === 5 ? 9 : rating === 4 ? 2 : 1}</span>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verified Purchases</span>
                <span className="font-semibold text-foreground">{reviews.filter(r => r.verified).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">On-Time Delivery</span>
                <span className="font-semibold text-foreground">98%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repeat Customers</span>
                <span className="font-semibold text-foreground">87%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Write Review */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Write a Review</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className="transition"
                  >
                    <Star className={`w-8 h-8 ${r <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Your Review</label>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none h-24"
              />
            </div>
            <Button onClick={handleSubmitReview} className="font-bold">
              Submit Review
            </Button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">All Reviews</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>

          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{review.author}</p>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Verified Purchase</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.date}</p>
                </div>
                <p className="text-sm text-foreground mb-4">{review.text}</p>
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition">
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpful})
                  </button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition">
                    <MessageCircle className="w-4 h-4" />
                    Reply
                  </button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
