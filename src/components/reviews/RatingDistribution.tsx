interface RatingDistributionProps {
  distribution: Record<string, number>
  totalReviews: number
}

const RatingDistribution = ({ distribution, totalReviews }: RatingDistributionProps) => (
  <div className="space-y-2">
    {[5, 4, 3, 2, 1].map((rating) => {
      const votes = distribution[String(rating)] ?? 0
      const percentage = totalReviews > 0 ? Math.round((votes / totalReviews) * 100) : 0

      return (
        <div className="flex items-center gap-3" key={rating}>
          <span className="theme-muted w-8 text-sm">{rating}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-[color:var(--surface-muted)]">
            <div className="h-full rounded bg-[color:var(--primary)]" style={{ width: `${percentage}%` }} />
          </div>
          <span className="theme-subtle w-16 text-right text-xs">{percentage}%</span>
        </div>
      )
    })}
  </div>
)

export default RatingDistribution
