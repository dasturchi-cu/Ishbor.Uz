'use client'

import { useMemo } from 'react'
import { formatPrice } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'

export interface PriceRangeSliderProps {
  min: number
  max: number
  values: [number, number]
  onChange: (values: [number, number]) => void
  /** 0–1 normalized histogram heights */
  histogram?: number[]
  fromLabel?: string
  toLabel?: string
  className?: string
}

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value))
}

export function buildPriceHistogram(
  prices: number[],
  min: number,
  max: number,
  bins = 20
): number[] {
  if (max <= min || prices.length === 0) return Array(bins).fill(0)
  const bucketSize = (max - min) / bins
  const counts = Array(bins).fill(0)
  for (const price of prices) {
    if (price < min || price > max) continue
    const idx = Math.min(bins - 1, Math.floor((price - min) / bucketSize))
    counts[idx] += 1
  }
  const peak = Math.max(...counts, 1)
  return counts.map((c) => c / peak)
}

export function PriceRangeSlider({
  min,
  max,
  values,
  onChange,
  histogram,
  fromLabel,
  toLabel,
  className,
}: PriceRangeSliderProps) {
  const [low, high] = values
  const range = max - min || 1
  const lowPct = ((low - min) / range) * 100
  const highPct = ((high - min) / range) * 100

  const bars = useMemo(() => histogram ?? Array(20).fill(0), [histogram])
  const hasData = bars.some((h) => h > 0)
  const binSize = range / bars.length

  const handleLow = (next: number) => {
    onChange([clamp(next, min, high), high])
  }

  const handleHigh = (next: number) => {
    onChange([low, clamp(next, low, max)])
  }

  const step = Math.max(Math.floor(range / 50), 10_000)

  return (
    <div className={cn('price-range-slider', className)}>
      <div className="price-range-histogram" aria-hidden>
        {bars.map((height, i) => {
          const binStart = min + i * binSize
          const binEnd = binStart + binSize
          const inRange = binEnd >= low && binStart <= high
          const displayHeight = hasData
            ? height > 0
              ? Math.max(height * 100, 22)
              : 10
            : 14

          return (
            <div
              key={i}
              className={cn(
                'price-range-histogram-bar',
                height > 0 && 'price-range-histogram-bar--data',
                inRange && 'price-range-histogram-bar--active'
              )}
              style={{ height: `${displayHeight}%` }}
            />
          )
        })}
      </div>

      <div className="price-range-track">
        <div className="price-range-rail" />
        <div
          className="price-range-fill"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => handleLow(parseInt(e.target.value, 10))}
          className="price-range-input price-range-input--low"
          aria-label={fromLabel ?? 'Min price'}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => handleHigh(parseInt(e.target.value, 10))}
          className="price-range-input price-range-input--high"
          aria-label={toLabel ?? 'Max price'}
        />
      </div>

      <div className="price-range-values">
        <div className="price-range-value">
          {fromLabel && <span className="price-range-value-label">{fromLabel}</span>}
          <span className="price-range-value-amount">{formatPrice(low)}</span>
        </div>
        <span className="price-range-value-sep" aria-hidden />
        <div className="price-range-value">
          {toLabel && <span className="price-range-value-label">{toLabel}</span>}
          <span className="price-range-value-amount">{formatPrice(high)}</span>
        </div>
      </div>
    </div>
  )
}
