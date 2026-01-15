'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WatchScore } from '@/types/watch-log'

interface StarRatingProps {
  value: WatchScore | null | undefined
  onChange?: (value: WatchScore | undefined) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showEmpty?: boolean
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showEmpty = true,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5] as const

  const handleClick = (star: WatchScore) => {
    if (readonly || !onChange) return
    // 同じ値をクリックしたら解除
    onChange(value === star ? undefined : star)
  }

  if (!showEmpty && !value) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-0.5', !readonly && 'cursor-pointer')}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => handleClick(star)}
          className={cn(
            'p-0 border-0 bg-transparent transition-colors',
            !readonly && 'hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm',
            readonly && 'cursor-default'
          )}
          aria-label={`${star}点`}
        >
          <Star
            className={cn(
              sizeClasses[size],
              'transition-colors',
              value && star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-slate-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
