import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '../../utils/helpers'

interface RatingStarsProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClassName: Record<NonNullable<RatingStarsProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const clampRating = (value: number) => Math.max(0, Math.min(5, Math.round(value)))

const RatingStars = ({ value, onChange, readOnly = true, className, size = 'md' }: RatingStarsProps) => {
  const resolvedValue = clampRating(value)
  const [hoveredValue, setHoveredValue] = useState(0)

  if (readOnly) {
    return (
      <div aria-label={`Puan: ${resolvedValue} / 5`} className={cn('flex items-center gap-1', className)} role="img">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1
          const isActive = starValue <= resolvedValue

          return (
            <Star
              className={cn(sizeClassName[size], isActive ? 'fill-[#f4b63d] text-[#f4b63d]' : 'text-[color:var(--text-subtle)]')}
              key={starValue}
            />
          )
        })}
      </div>
    )
  }

  const activeValue = hoveredValue > 0 ? hoveredValue : resolvedValue

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={() => setHoveredValue(0)}
      role="radiogroup"
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1
        const isActive = starValue <= activeValue

        return (
          <button
            aria-label={`${starValue} yildiz`}
            aria-checked={starValue === resolvedValue}
            className="rounded-[var(--radius-navigation)] p-1 transition hover:bg-[color:var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
            key={starValue}
            onClick={() => onChange?.(starValue)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault()
                onChange?.(Math.min(5, resolvedValue + 1))
              }

              if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault()
                onChange?.(Math.max(1, resolvedValue - 1))
              }
            }}
            onMouseEnter={() => setHoveredValue(starValue)}
            role="radio"
            type="button"
          >
            <Star className={cn(sizeClassName[size], isActive ? 'fill-[#f4b63d] text-[#f4b63d]' : 'text-[color:var(--text-subtle)]')} />
          </button>
        )
      })}
    </div>
  )
}

export default RatingStars
